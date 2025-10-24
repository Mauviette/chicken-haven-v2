// controllers/spawnables.controller.js
// Contrôleur pour gérer les objets cliquables spawnés par les talents

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
// CONFIGURATION DES SPAWNABLES
// ============================================

const SPAWNABLE_LIFETIME = 15000
const CLEANUP_INTERVAL = 5000

const SPAWNABLE_TYPE_CONFIG = {
  white_egg: {
    spawnChance: 0.05,
    maxActivePerUser: 999,
    cooldownSeconds: 3
  },
  lucky_egg: {
    spawnChance: 0.05,
    maxActivePerUser: 999,
    cooldownSeconds: 3
  },
  chocolate: {
    spawnChance: 0.05,
    maxActivePerUser: 999,
    cooldownSeconds: 3
  },
  pink_egg: {
    spawnChance: 0.05,
    maxActivePerUser: 999,
    cooldownSeconds: 3
  },
}

const TALENT_SPAWN_CONFIG = {}

function getSpawnableConfigForType(objectType, talentName) {
  const typeConfig = SPAWNABLE_TYPE_CONFIG[objectType] || SPAWNABLE_TYPE_CONFIG.white_egg
  const talentConfig = TALENT_SPAWN_CONFIG[talentName] || {}
  
  return {
    spawnChance: talentConfig.spawnChanceOverride ?? typeConfig.spawnChance ?? 0.05,
    maxActivePerUser: talentConfig.maxActiveOverride ?? typeConfig.maxActivePerUser ?? 999,
    cooldownSeconds: talentConfig.cooldownSecondsOverride ?? typeConfig.cooldownSeconds ?? 3
  }
}

function getSpawnableStats() {
  return {
    spawnableLifetime: SPAWNABLE_LIFETIME,
    cleanupInterval: CLEANUP_INTERVAL,
    typeConfigs: SPAWNABLE_TYPE_CONFIG,
    talentConfigs: TALENT_SPAWN_CONFIG,
    totalTypes: Object.keys(SPAWNABLE_TYPE_CONFIG).length,
    totalTalentOverrides: Object.keys(TALENT_SPAWN_CONFIG).length
  }
}

function evalExpr(expr, ctx) {
  if (expr == null) return 0
  if (typeof expr === 'number') return expr
  if (typeof expr === 'string') return Number.isFinite(ctx[expr]) ? ctx[expr] : (ctx[expr] ?? 0)
  if (typeof expr === 'object') {
    if (Object.prototype.hasOwnProperty.call(expr, 'var')) {
      return ctx[expr.var] ?? 0
    }
    const op = expr.op
    const args = Array.isArray(expr.args) ? expr.args : []
    const vals = args.map(a => evalExpr(a, ctx))
    switch (op) {
      case 'add': return vals.reduce((a, b) => a + b, 0)
      case 'mul': return vals.reduce((a, b) => a * b, 1)
      case 'div': return vals[1] !== 0 ? vals[0] / vals[1] : 0
      case 'sub': return vals[0] - (vals[1] || 0)
      default: return 0
    }
  }
  return 0
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

// GET /api/spawnables/check - Vérifier les spawnables disponibles
export async function checkAvailableSpawnables(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const teamSlots = user.team?.slots || []
    const activeTeam = teamSlots.filter(slot => slot?.especeId).map(slot => slot.especeId)

    if (activeTeam.length === 0) {
      return res.json({ spawnables: [] })
    }

    const now = Date.now()
    
    const initialSpawnablesCount = user.activeSpawnables?.length || 0
    user.activeSpawnables = user.activeSpawnables?.filter(s => new Date(s.expiresAt) > new Date()) || []
    const cleanedSpawnables = initialSpawnablesCount - user.activeSpawnables.length
    
    const availableSpawnables = []

    for (const especeId of activeTeam) {
      const poule = user.poulesPossedees?.find(p => p.especeId === especeId)
      if (!poule) continue

      const niveau = Math.max(1, Number(poule.niveauTalent) || 1)

      const especeInfo = especeData[especeId]
      
      if (!especeInfo || !especeInfo.talent) continue

      const talentName = especeInfo.talent
      const talentData = talentsData[talentName]

      if (!talentData || !talentData.calculation?.effects) continue

      const spawnEffects = talentData.calculation.effects.filter(effect => 
        effect.type === 'spawn_clickable'
      )

      for (const spawnEffect of spawnEffects) {
        const spawnerIdToType = {
          'lucky_egg': 'white_egg',
          'chocolate': 'chocolate',
          'pink_egg': 'pink_egg'
        }
        const rawType = spawnEffect.spawner_id || spawnEffect.objectType || 'white_egg'
        const objectType = spawnerIdToType[rawType] || rawType
        const spawnerId = `${talentName}_${especeId}_${objectType}`
        
        const configType = spawnEffect.spawner_id || objectType
        const config = getSpawnableConfigForType(configType, talentName)
        
        const existingSpawnable = user.activeSpawnables.find(s => 
          s.talentName === talentName && 
          s.especeId === especeId && 
          s.spawnableId.includes(`_${objectType}`)
        )
        
        if (existingSpawnable) {
          continue
        }
        
        const cooldownKey = `${talentName}_${especeId}_${objectType}`
        const lastSpawn = user.lastSpawns?.get(cooldownKey) || new Date(0)

        const totalStorage = calculateTotalStorage(user)
        const ctx = {
          niveau,
          stockageMax: totalStorage,
          teamEnergy: computeTeamEnergy(user),
          teamIntelligence: computeTeamIntelligence(user),
          teamCharisme: computeTeamCharisme(user)
        }

        const spawnInterval = config.cooldownSeconds * 1000

        if (now - new Date(lastSpawn).getTime() >= spawnInterval) {
          const spawnChance = Math.random()
          
          if (spawnChance < config.spawnChance) {
            const uniqueSpawnableId = `${spawnerId}_${now}_${Math.random().toString(36).substr(2, 9)}`
            const expiresAt = new Date(now + SPAWNABLE_LIFETIME)
            
            const newSpawnable = {
              id: uniqueSpawnableId,
              spawnerId: uniqueSpawnableId,
              talentName: talentName,
              especeId: especeId,
              type: objectType,
              icon: spawnEffect.icon,
              style: spawnEffect.style || {},
              nivel: niveau
            }
            
            availableSpawnables.push(newSpawnable)

            user.activeSpawnables.push({
              spawnerId: uniqueSpawnableId,
              spawnableId: uniqueSpawnableId,
              talentName: talentName,
              especeId: especeId,
              createdAt: new Date(now),
              expiresAt: expiresAt
            })
            
            if (!user.lastSpawns) {
              user.lastSpawns = new Map()
            }
            user.lastSpawns.set(cooldownKey, new Date(now))
          }
        }
      }
    }

    // Sauvegarder les changements (spawnables expirés nettoyés + nouveaux spawnables)
    if (user.isModified()) {
      await saveWithRetry(user)
    }

    res.json({ spawnables: availableSpawnables })

  } catch (error) {
    console.error('Erreur checkAvailableSpawnables:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/spawnables/click - Gérer le clic sur un objet spawné
export async function clickSpawnableObject(req, res) {
  try {
    const { spawnerId, objectId, talentName, especeId } = req.body
    
    if (!spawnerId || !talentName || !especeId) {
      return res.status(400).json({ error: 'Données manquantes' })
    }

    const userId = req.userId.toString()

    // Utiliser findOneAndUpdate avec des conditions atomiques pour éviter la duplication
    const updateResult = await User.findOneAndUpdate(
      {
        _id: req.userId,
        'activeSpawnables.spawnerId': spawnerId,
        'activeSpawnables.expiresAt': { $gt: new Date() }
      },
      {
        $pull: { 
          activeSpawnables: { spawnerId: spawnerId }
        }
      },
      { 
        new: false, // Retourner le document avant modification
        lean: false
      }
    )

    // Si aucun document n'a été trouvé/modifié, c'est que le spawnable n'existe pas ou a déjà été cliqué
    if (!updateResult) {
      return res.status(400).json({ error: 'Ce spawnable n\'existe pas, a expiré ou a déjà été collecté' })
    }

    const user = updateResult

    // Vérifier que l'utilisateur a bien cette poule équipée
    const teamSlots = user.team?.slots || []
    const hasChickenInTeam = teamSlots.some(slot => slot?.especeId === especeId)
    
    if (!hasChickenInTeam) {
      // Remettre le spawnable en place si la vérification échoue
      await User.findByIdAndUpdate(req.userId, {
        $push: { 
          activeSpawnables: user.activeSpawnables.find(s => s.spawnerId === spawnerId)
        }
      })
      return res.status(400).json({ error: 'Cette poule n\'est pas équipée' })
    }

    // Récupérer les données du talent
    const talentData = talentsData[talentName]
    if (!talentData || !talentData.calculation) {
      // Remettre le spawnable en place si la vérification échoue
      await User.findByIdAndUpdate(req.userId, {
        $push: { 
          activeSpawnables: user.activeSpawnables.find(s => s.spawnerId === spawnerId)
        }
      })
      return res.status(400).json({ error: 'Talent introuvable' })
    }

    // Trouver l'effet spawn_clickable correspondant
    const effects = talentData.calculation.effects || []
    const spawnEffect = effects.find(effect => 
      effect.type === 'spawn_clickable'
    )

    if (!spawnEffect) {
      // Remettre le spawnable en place si la vérification échoue
      await User.findByIdAndUpdate(req.userId, {
        $push: { 
          activeSpawnables: user.activeSpawnables.find(s => s.spawnerId === spawnerId)
        }
      })
      return res.status(400).json({ error: 'Effet de spawn introuvable' })
    }

    // Récupérer le niveau de talent de la poule
    const poule = user.poulesPossedees?.find(p => p.especeId === especeId)
    if (!poule) {
      // Remettre le spawnable en place si la vérification échoue
      await User.findByIdAndUpdate(req.userId, {
        $push: { 
          activeSpawnables: user.activeSpawnables.find(s => s.spawnerId === spawnerId)
        }
      })
      return res.status(400).json({ error: 'Poule non possédée' })
    }

    // Calculer le stockage total comme dans egg controller
    const niveau = Math.max(1, Number(poule.niveauTalent) || 1)
    const totalStorage = calculateTotalStorage(user)
    
    // Calculer le contexte pour l'évaluation des expressions
    const ctx = {
      niveau,
      stockageMax: totalStorage, // Utiliser le stockage total correct
      teamEnergy: computeTeamEnergy(user),
      teamIntelligence: computeTeamIntelligence(user),
      teamCharisme: computeTeamCharisme(user)
    }

    // Traiter la récompense
    const reward = spawnEffect.reward
    let appliedReward = null

    if (reward.type === 'resource') {
      let amount = Math.floor(evalExpr(reward.amount, ctx))
      
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
        
        // Mettre à jour le progrès des succès pour les œufs blancs
        await updateAchievementProgress(req.userId, 'increment', {
          totalEggsCollected: finalAmount
        })
        
        // Mettre à jour le max œufs en un clic pour les spawnables
        await updateAchievementProgress(req.userId, 'max', {
          maxEggsInOneClick: finalAmount
        })
      }
    } else if (reward.type === 'buff') {
      const duration = evalExpr(reward.duration, ctx) || 15000
      
      // Gérer les nouveaux buffs avec income et storage séparés
      if (reward.buff_type === 'income_storage_multiplier') {
        const incomeMultiplier = evalExpr(reward.income_multiplier, ctx) || 1.25
        const storageMultiplier = evalExpr(reward.storage_multiplier, ctx) || 1.25
        
        // Créer deux buffs séparés
        const incomeBuffs = {
          origin: `Talent ${talentName}`,
          buff_type: 'income',
          lasts_until: new Date(Date.now() + duration),
          buff: {
            operation: 'mult',
            amount: String(incomeMultiplier)
          }
        }
        
        const storageBuff = {
          origin: `Talent ${talentName}`,
          buff_type: 'storage',
          lasts_until: new Date(Date.now() + duration),
          buff: {
            operation: 'mult',
            amount: String(storageMultiplier)
          }
        }
        
        // Ajouter les buffs de manière atomique
        await User.findByIdAndUpdate(req.userId, {
          $push: { 
            buffs: { $each: [incomeBuffs, storageBuff] }
          }
        })
        
        appliedReward = { 
          type: 'buff', 
          buff_type: reward.buff_type, 
          duration, 
          income_multiplier: incomeMultiplier,
          storage_multiplier: storageMultiplier
        }
      } else {
        // Ancien système avec un seul multiplicateur
        const multiplier = evalExpr(reward.multiplier, ctx) || 1.5
        
        // Créer le buff selon les données de sharedGameData
        const buff = {
          origin: `Talent ${talentName}`,
          buff_type: reward.buff_type || 'income',
          lasts_until: new Date(Date.now() + duration),
          buff: {
            operation: 'mult',
            amount: String(multiplier)
          }
        }
        
        // Ajouter le buff de manière atomique
        await User.findByIdAndUpdate(req.userId, {
          $push: { buffs: buff }
        })
        
        appliedReward = { 
          type: 'buff', 
          buff_type: reward.buff_type, 
          duration, 
          multiplier 
        }
      }
    }

    res.json({
      success: true,
      reward: appliedReward,
      objectId,
      spawnerId
    })

  } catch (error) {
    console.error('Erreur clickSpawnableObject:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/spawnables/config - Obtenir la configuration des spawnables
export async function getSpawnableConfig(req, res) {
  try {
    const stats = getSpawnableStats()
    res.json({
      success: true,
      config: stats,
      description: {
        spawnableLifetime: "Durée de vie des spawnables en millisecondes",
        cleanupInterval: "Intervalle de nettoyage des spawnables expirés",
        typeConfigs: "Configuration par type de spawnable (chance, cooldown, limites)",
        talentConfigs: "Surcharges de configuration par talent"
      }
    })
  } catch (error) {
    console.error('Erreur getSpawnableConfig:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}