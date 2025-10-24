// controllers/chickenGifts.controller.js
// Contrôleur pour gérer les cadeaux donnés par les poules de l'équipe

import User from '../models/User.js'
import { achievementsData, talentsData, especeData } from '../data/sharedGameData.js'

// Importer les fonctions de calcul du contrôleur des œufs
import {
  computeTeamEnergy,
  computeTeamIntelligence,
  computeTeamCharisme,
  runTalentStorage
} from './egg.controller.js'

// Importer la fonction de mise à jour des succès
import { updateAchievementProgress } from './achievements.controller.js'

// Importer l'utilitaire pour gérer les conflits de version
import { saveWithRetry } from '../utils/mongoUtils.js'

// ============================================
// CONFIGURATION DES CADEAUX DE POULES
// ============================================

const GIFT_LIFETIME = 315360000000 // 10 ans en millisecondes (cadeaux permanents)
const CLEANUP_INTERVAL = 5000 // ne change rien

// Configuration par niveau du joueur
const GIFT_LEVEL_CONFIG = {
  1: {
    spawnChance: 0.08,
    rewards: [
      //50
      { type: 'eggs', weight: 30, amount: 10 },
      { type: 'eggs', weight: 15, amount: 25 },
      { type: 'eggs', weight: 5, amount: 50 },

      //25
      { type: 'stock_tokens', weight: 25, amount: 1 },

      //25
      { type: 'production_tokens', weight: 25, amount: 1 }
    ]
  },
  5: {
    spawnChance: 0.08,
    rewards: [
    //50
      { type: 'eggs', weight: 30, amount: 50 },
      { type: 'eggs', weight: 15, amount: 75 },
      { type: 'eggs', weight: 5, amount: 100 },

      //12
      { type: 'stock_tokens', weight: 12, amount: 1 },

      //12
      { type: 'production_tokens', weight: 12, amount: 1 },

      //25
      { type: 'mining_token', weight: 21, amount: 1 },
      { type: 'mining_token', weight: 4, amount: 2 },
      { type: 'mining_token', weight: 1, amount: 3 }
    ]
  }
}

const TALENT_GIFT_CONFIG = {
  // Surcharges spécifiques par talent si nécessaire
}

function getGiftConfigForLevel(level) {
  // Trouver la configuration pour le niveau actuel
  const levels = Object.keys(GIFT_LEVEL_CONFIG).map(Number).sort((a, b) => a - b)
  let configLevel = levels[0] // niveau minimum par défaut

  for (const lvl of levels) {
    if (level >= lvl) {
      configLevel = lvl
    } else {
      break
    }
  }

  const baseConfig = GIFT_LEVEL_CONFIG[configLevel]

  return {
    spawnChance: baseConfig.spawnChance ?? 1,
    rewards: baseConfig.rewards ?? [{ type: 'eggs', weight: 100, amount: 5 }],
    maxActivePerChicken: 1, // 1 cadeau max par poule
    cooldownSeconds: 10 // 10 secondes entre cadeaux
  }
}

function getGiftStats() {
  return {
    giftLifetime: GIFT_LIFETIME,
    cleanupInterval: CLEANUP_INTERVAL,
    levelConfigs: GIFT_LEVEL_CONFIG,
    talentConfigs: TALENT_GIFT_CONFIG,
    totalLevels: Object.keys(GIFT_LEVEL_CONFIG).length,
    totalTalentOverrides: Object.keys(TALENT_GIFT_CONFIG).length,
    permanentGifts: true // Les cadeaux sont maintenant permanents
  }
}

function calculateTotalStorage(user) {
  const baseMaxIncome = user.clickableEgg?.maxIncome || 100
  const storageBonus = runTalentStorage(user)

  const buffMultipliers = computeActiveBuffMultipliers(user)

  const effectiveMaxIncome = Math.max(0, (baseMaxIncome + storageBonus.storageBonus) * storageBonus.storageMultiplier * buffMultipliers.storage)

  return effectiveMaxIncome
}

function computeActiveBuffMultipliers(user) {
  const buffs = user.buffs || []
  const now = Date.now()

  const activeBuffs = buffs.filter(buff =>
    buff.lasts_until && new Date(buff.lasts_until).getTime() > now
  )

  const multipliers = {
    income: 1,
    storage: 1,
    production: 1,
    teamStat: { intelligence: 1, energie: 1, charisme: 1 }
  }

  for (const buff of activeBuffs) {
    const operation = buff.buff?.operation || 'mult'
    const amount = parseFloat(buff.buff?.amount) || 1
    const type = buff.buff_type || 'income'

    if (operation === 'mult') {
      switch (type) {
        case 'income':
        case 'income_multiplier':
          multipliers.income *= amount
          break
        case 'storage':
        case 'storage_multiplier':
          multipliers.storage *= amount
          break
        case 'production':
        case 'production_multiplier':
          multipliers.production *= amount
          break
        case 'team_stat_intelligence':
          multipliers.teamStat.intelligence *= amount
          break
        case 'team_energie':
          multipliers.teamStat.energie *= amount
          break
        case 'team_charisme':
          multipliers.teamStat.charisme *= amount
          break
      }
    }
  }

  return multipliers
}

// Générer une récompense aléatoire basée sur le niveau
function generateRandomReward(level) {
  const config = getGiftConfigForLevel(level)
  const rewards = config.rewards

  // Calculer le poids total
  const totalWeight = rewards.reduce((sum, reward) => sum + reward.weight, 0)

  // Sélectionner une récompense basée sur les poids
  let random = Math.random() * totalWeight

  let selectedReward = null

  for (const reward of rewards) {
    random -= reward.weight
    if (random <= 0) {
      selectedReward = reward
      break
    }
  }

  // Fallback au cas où (ne devrait pas arriver)
  if (!selectedReward) {
    selectedReward = rewards[0]
  }

  // Utiliser le montant fixe
  const amount = selectedReward.amount

  return {
    type: 'resource',
    resource: selectedReward.type,
    amount: amount
  }
}

// GET /api/chicken-gifts/check - Vérifier les cadeaux disponibles
export async function checkAvailableChickenGifts(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const teamSlots = user.team?.slots || []
    const activeTeam = teamSlots.filter(slot => slot?.especeId).map(slot => slot.especeId)

    if (activeTeam.length === 0) {
      return res.json({ gifts: [] })
    }

    const now = Date.now()
    const userLevel = user.experience?.level || 1

    // Les cadeaux sont maintenant permanents - pas de nettoyage nécessaire
    const availableGifts = []

    for (const especeId of activeTeam) {
      const poule = user.poulesPossedees?.find(p => p.especeId === especeId)
      if (!poule) {
        continue
      }

      const config = getGiftConfigForLevel(userLevel)

      // Vérifier s'il y a déjà un cadeau actif pour cette poule
      const existingGift = user.activeChickenGifts.find(g =>
        g.especeId === especeId
      )

      if (existingGift) {
        // Ajouter le cadeau existant à la liste des disponibles
        availableGifts.push({
          id: existingGift.id,
          especeId: existingGift.especeId,
          expiresAt: existingGift.expiresAt
        })
        continue
      }

      // Vérifier le cooldown
      const cooldownKey = `chicken_gift_${especeId}`
      const lastGift = user.lastChickenGifts?.get(cooldownKey) || new Date(0)
      const cooldownMs = config.cooldownSeconds * 1000

      if (now - new Date(lastGift).getTime() >= cooldownMs) {
        // Chance de spawn d'un cadeau
        const spawnChance = Math.random()

        if (spawnChance < config.spawnChance) {
          const uniqueGiftId = `gift_${especeId}_${now}_${Math.random().toString(36).substr(2, 9)}`
          const expiresAt = new Date(now + GIFT_LIFETIME)

          const newGift = {
            id: uniqueGiftId,
            especeId: especeId,
            createdAt: new Date(now),
            expiresAt: expiresAt
          }

          availableGifts.push({
            id: uniqueGiftId,
            especeId: especeId,
            expiresAt: expiresAt
          })

          user.activeChickenGifts.push(newGift)

          if (!user.lastChickenGifts) {
            user.lastChickenGifts = new Map()
          }
          user.lastChickenGifts.set(cooldownKey, new Date(now))
        }
      }
    }

    // Sauvegarder les changements
    if (user.isModified()) {
      await saveWithRetry(user)
    }

    res.json({ gifts: availableGifts })

  } catch (error) {
    console.error('[ChickenGifts] Erreur checkAvailableChickenGifts:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/chicken-gifts/collect - Collecter un cadeau de poule
export async function collectChickenGift(req, res) {
  try {
    const { giftId, especeId } = req.body

    if (!giftId || !especeId) {
      return res.status(400).json({ error: 'Données manquantes' })
    }

    // D'abord, récupérer l'utilisateur pour voir ses cadeaux actifs
    const currentUser = await User.findById(req.userId)
    if (!currentUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    // Initialiser activeChickenGifts si nécessaire
    if (!currentUser.activeChickenGifts) {
      currentUser.activeChickenGifts = []
    }

    // Vérifier si le cadeau existe dans la liste
    const giftExists = currentUser.activeChickenGifts.find(g => g.id === giftId && g.especeId === especeId)

    // Utiliser findOneAndUpdate pour supprimer atomiquement le cadeau (cadeaux permanents)
    const searchCriteria = {
      _id: req.userId,
      'activeChickenGifts.id': giftId,
      'activeChickenGifts.especeId': especeId
      // Plus de vérification d'expiration puisque les cadeaux sont permanents
    }

    const updateResult = await User.findOneAndUpdate(
      searchCriteria,
      {
        $pull: {
          activeChickenGifts: { id: giftId }
        }
      },
      {
        new: false, // Retourner le document avant modification
        lean: false
      }
    )

    if (!updateResult) {
      return res.status(400).json({ error: 'Ce cadeau n\'existe pas, a expiré ou a déjà été collecté' })
    }

    const user = updateResult

    // Vérifier que l'utilisateur a bien cette poule équipée
    const teamSlots = user.team?.slots || []
    const hasChickenInTeam = teamSlots.some(slot => slot?.especeId === especeId)

    if (!hasChickenInTeam) {
      // Remettre le cadeau en place si la vérification échoue
      await User.findByIdAndUpdate(req.userId, {
        $push: {
          activeChickenGifts: { id: giftId, especeId: especeId, expiresAt: new Date(Date.now() + GIFT_LIFETIME) }
        }
      })
      return res.status(400).json({ error: 'Cette poule n\'est pas équipée' })
    }

    // Générer la récompense basée sur le niveau du joueur
    const userLevel = user.experience?.level || 1
    const reward = generateRandomReward(userLevel)

    let appliedReward = null

    if (reward.type === 'resource') {
      let amount = reward.amount

      if (reward.resource === 'eggs') {
        // Appliquer les multiplicateurs des buffs actifs pour les œufs
        const multipliers = computeActiveBuffMultipliers(user)
        let finalAmount = Math.floor(amount * multipliers.income)

        // Mode Apocalypse : réduire les gains à 10%
        if (user.apocalypse) {
          finalAmount = Math.floor(finalAmount * 0.1)
        }

        // Utiliser une opération atomique pour ajouter les œufs
        await User.findByIdAndUpdate(req.userId, {
          $inc: { 'resources.eggs': finalAmount }
        })

        appliedReward = { type: 'resource', resource: 'eggs', amount: finalAmount }

        // Mettre à jour le progrès des succès pour les œufs
        await updateAchievementProgress(req.userId, 'increment', {
          totalEggsCollected: finalAmount
        })

      } else if (reward.resource === 'stock_tokens') {
        await User.findByIdAndUpdate(req.userId, {
          $inc: { 'resources.stock_token': amount }
        })
        appliedReward = { type: 'resource', resource: 'stock_tokens', amount: amount }

      } else if (reward.resource === 'production_tokens') {
        await User.findByIdAndUpdate(req.userId, {
          $inc: { 'resources.production_token': amount }
        })
        appliedReward = { type: 'resource', resource: 'production_tokens', amount: amount }

      } else if (reward.resource === 'mining_token') {
        await User.findByIdAndUpdate(req.userId, {
          $inc: { 'resources.mining_token': amount }
        })
        appliedReward = { type: 'resource', resource: 'mining_token', amount: amount }
      }
    }

    // Incrémenter le compteur de cadeaux de poules collectés pour les succès
    await updateAchievementProgress(req.userId, 'increment', {
      chickenGiftsCollected: 1
    })

    // Log simple de la collecte
    console.log(`${user.username} (niv ${userLevel}) a récupéré ${appliedReward.amount} ${appliedReward.resource} via un cadeau de poule`)

    res.json({
      success: true,
      reward: appliedReward,
      giftId,
      especeId
    })

  } catch (error) {
    console.error('[ChickenGifts] Erreur collectChickenGift:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/chicken-gifts/config - Obtenir la configuration des cadeaux
export async function getChickenGiftConfig(req, res) {
  try {
    const stats = getGiftStats()
    res.json({
      success: true,
      config: stats,
      description: {
        giftLifetime: "Durée de vie des cadeaux en millisecondes (cadeaux permanents = 10 ans)",
        cleanupInterval: "Intervalle de nettoyage des cadeaux expirés (non utilisé pour cadeaux permanents)",
        levelConfigs: "Configuration par niveau de joueur (chance, récompenses)",
        talentConfigs: "Surcharges de configuration par talent",
        permanentGifts: "Les cadeaux sont permanents et n'expirent pas"
      }
    })
  } catch (error) {
    console.error('Erreur getChickenGiftConfig:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}