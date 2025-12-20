// controllers/chickenGifts.controller.js
// Contrôleur pour gérer les cadeaux donnés par les poules de l'équipe

import User from '../models/User.js'
import { saveWithRetry } from '../utils/mongoUtils.js'
import { updateAchievementProgress } from './achievements.controller.js'

// Import des modules utilitaires
import {
  GIFT_LIFETIME,
  getGiftConfigForLevel,
  getGiftStats
} from './chickenGifts/chickenGiftsConfig.js'
import { generateRandomReward } from './chickenGifts/chickenGiftsCalculations.js'
import { applyResourceReward, maybeApocalypseReward } from './chickenGifts/chickenGiftsRewards.js'

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

    // Initialisation des structures
    if (!user.activeChickenGifts) user.activeChickenGifts = []
    if (!user.lastChickenGifts || typeof user.lastChickenGifts !== 'object') user.lastChickenGifts = {}

    const { availableGifts, freeChickens } = categorizeChickens(user, activeTeam)

    // Si aucune poule libre, pas de génération possible
    if (freeChickens.length === 0) {
      return res.json({ gifts: availableGifts })
    }

    // Tenter de générer un nouveau cadeau
    const newGift = trySpawnGift(user, freeChickens, userLevel, now)
    if (newGift) {
      availableGifts.push({
        id: newGift.id,
        especeId: newGift.especeId,
        expiresAt: newGift.expiresAt
      })
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

/**
 * Catégoriser les poules (avec cadeau actif vs libres)
 */
function categorizeChickens(user, activeTeam) {
  const availableGifts = []
  const freeChickens = []
  const busyChickens = new Set()

  for (const especeId of activeTeam) {
    const poule = user.poulesPossedees?.find(p => p.especeId === especeId)
    if (!poule) continue

    const existingGift = user.activeChickenGifts.find(g => g.especeId === especeId)

    if (existingGift) {
      availableGifts.push({
        id: existingGift.id,
        especeId: existingGift.especeId,
        expiresAt: existingGift.expiresAt
      })
      busyChickens.add(especeId)
    } else {
      freeChickens.push(especeId)
    }
  }

  return { availableGifts, freeChickens, busyChickens }
}

/**
 * Tenter de générer un cadeau pour une poule libre
 */
function trySpawnGift(user, freeChickens, userLevel, now) {
  const config = getGiftConfigForLevel(userLevel)
  const shouldSpawnGift = Math.random() < config.spawnChance

  if (!shouldSpawnGift) return null

  // Choisir une poule libre aléatoirement
  const randomIndex = Math.floor(Math.random() * freeChickens.length)
  const selectedChicken = freeChickens[randomIndex]

  // Vérifier le cooldown
  const cooldownKey = `chicken_gift_${selectedChicken}`
  const lastGift = user.lastChickenGifts?.[cooldownKey]
    ? new Date(user.lastChickenGifts[cooldownKey])
    : new Date(0)
  const cooldownMs = config.cooldownSeconds * 1000

  if (now - lastGift.getTime() < cooldownMs) {
    return null
  }

  // Générer le cadeau
  const uniqueGiftId = `gift_${selectedChicken}_${now}_${Math.random().toString(36).substr(2, 9)}`
  const expiresAt = new Date(now + GIFT_LIFETIME)

  const newGift = {
    id: uniqueGiftId,
    especeId: selectedChicken,
    createdAt: new Date(now),
    expiresAt: expiresAt
  }

  user.activeChickenGifts.push(newGift)
  user.lastChickenGifts[cooldownKey] = new Date(now).toISOString()

  return newGift
}

// POST /api/chicken-gifts/collect - Collecter un cadeau de poule
export async function collectChickenGift(req, res) {
  try {
    const { giftId, especeId } = req.body

    if (!giftId || !especeId) {
      return res.status(400).json({ error: 'Données manquantes' })
    }

    // Supprimer atomiquement le cadeau
    const searchCriteria = {
      _id: req.userId,
      'activeChickenGifts.id': giftId,
      'activeChickenGifts.especeId': especeId
    }

    const user = await User.findOneAndUpdate(
      searchCriteria,
      { $pull: { activeChickenGifts: { id: giftId } } },
      { new: false, lean: false }
    )

    if (!user) {
      return res.status(400).json({ error: 'Ce cadeau n\'existe pas, a expiré ou a déjà été collecté' })
    }

    // Vérifier que la poule est équipée
    const teamSlots = user.team?.slots || []
    const hasChickenInTeam = teamSlots.some(slot => slot?.especeId === especeId)

    if (!hasChickenInTeam) {
      // Remettre le cadeau en place
      await User.findByIdAndUpdate(req.userId, {
        $push: {
          activeChickenGifts: { id: giftId, especeId, expiresAt: new Date(Date.now() + GIFT_LIFETIME) }
        }
      })
      return res.status(400).json({ error: 'Cette poule n\'est pas équipée' })
    }

    // Générer et appliquer la récompense
    const userLevel = user.experience?.level || 1
    const baseReward = generateRandomReward(userLevel)
    const reward = maybeApocalypseReward(user, baseReward)

    let appliedReward = null
    if (reward.type === 'resource') {
      appliedReward = await applyResourceReward(req.userId, reward, user)
    }

    // Incrémenter le compteur de cadeaux collectés
    await updateAchievementProgress(req.userId, 'increment', {
      chickenGiftsCollected: 1
    })

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
