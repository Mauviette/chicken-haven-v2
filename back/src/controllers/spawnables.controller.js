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

// Durée de vie des spawnables en millisecondes
const SPAWNABLE_LIFETIME = 15000 // 15 secondes

// Intervalle de nettoyage des spawnables expirés (en millisecondes)
const CLEANUP_INTERVAL = 5000 // 5 secondes

// Configuration par type de spawnable
const SPAWNABLE_TYPE_CONFIG = {
  white_egg: {
    spawnChance: 0.05,
    maxActivePerUser: 999,
    cooldownSeconds: 3
  },
  chocolate: {
    spawnChance: 0.05,
    maxActivePerUser: 999,
    cooldownSeconds: 3
  }
}

// Configuration par talent (peut surcharger la config par type)
const TALENT_SPAWN_CONFIG = {
  // Exemple de configuration spécifique par talent
  // 'nom_du_talent': {
  //   spawnChanceOverride: 0.9,      // Surcharge: 90% de chance
  //   cooldownSecondsOverride: 5,    // Surcharge: cooldown de 5 secondes
  //   maxActiveOverride: 10          // Surcharge: max 10 actifs
  // }
}

// Fonction pour obtenir la configuration d'un spawnable
function getSpawnableConfigForType(objectType, talentName) {
  const typeConfig = SPAWNABLE_TYPE_CONFIG[objectType] || SPAWNABLE_TYPE_CONFIG.white_egg
  const talentConfig = TALENT_SPAWN_CONFIG[talentName] || {}
  
  return {
    spawnChance: talentConfig.spawnChanceOverride ?? typeConfig.spawnChance ?? 0.05,
    maxActivePerUser: talentConfig.maxActiveOverride ?? typeConfig.maxActivePerUser ?? 999,
    cooldownSeconds: talentConfig.cooldownSecondsOverride ?? typeConfig.cooldownSeconds ?? 3
  }
}

// Fonction utilitaire pour obtenir les statistiques de configuration
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

// Fonction pour évaluer les expressions du DSL (miroir du frontend)
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

// Fonction pour calculer le stockage total comme dans egg controller (avec buffs temporaires)
function calculateTotalStorage(user) {
  const baseMaxIncome = user.clickableEgg?.maxIncome || 100
  const storageBonus = runTalentStorage(user)
  
  // Appliquer les buffs temporaires comme dans egg.controller.js
  const buffMultipliers = computeActiveBuffMultipliers(user)
  
  const effectiveMaxIncome = Math.max(0, (baseMaxIncome + storageBonus.storageBonus) * storageBonus.storageMultiplier * buffMultipliers.storage)
  
  return effectiveMaxIncome
}

// Calcule les multiplicateurs des buffs temporaires actifs (copié de egg.controller.js)
function computeActiveBuffMultipliers(user) {
  const buffs = user.buffs || []
  const now = Date.now()
  
  // Filtrer les buffs actifs
  const activeBuffs = buffs.filter(buff => 
    buff.lasts_until && new Date(buff.lasts_until).getTime() > now
  )
  
  const multipliers = {
    income: 1,
    storage: 1,
    production: 1,
    teamStat: { intelligence: 1, energie: 1, charisme: 1 }
  }
  
  // Appliquer les buffs multiplicatifs
  for (const buff of activeBuffs) {
    const operation = buff.buff?.operation || 'mult'
    const amount = parseFloat(buff.buff?.amount) || 1
    const type = buff.buff_type || 'income'
    
    if (operation === 'mult') {
      // Mapper les types de buffs aux catégories
      switch (type) {
        case 'income':
        case 'income_multiplier':
          multipliers.income *= amount
          break
        case 'storage':
          multipliers.storage *= amount
          break
        case 'production':
          multipliers.production *= amount
          break
        case 'team_stat_intelligence':
          multipliers.teamStat.intelligence *= amount
          break
        case 'team_stat_energie':
          multipliers.teamStat.energie *= amount
          break
        case 'team_stat_charisme':
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
    
    // Nettoyer les spawnables expirés dans la base de données
    const initialSpawnablesCount = user.activeSpawnables?.length || 0
    user.activeSpawnables = user.activeSpawnables?.filter(s => new Date(s.expiresAt) > new Date()) || []
    const cleanedSpawnables = initialSpawnablesCount - user.activeSpawnables.length
    
    if (cleanedSpawnables > 0) {
      // Spawnables nettoyés
    }
    
    const availableSpawnables = []

    // Parcourir l'équipe active
    for (const especeId of activeTeam) {
      const poule = user.poulesPossedees?.find(p => p.especeId === especeId)
      if (!poule) {
        continue
      }

      const niveau = Math.max(1, Number(poule.niveauTalent) || 1)

      // Trouver l'espèce et son talent dans les données partagées
      const especeInfo = especeData[especeId]
      
      if (!especeInfo || !especeInfo.talent) {
        continue
      }

      const talentName = especeInfo.talent
      const talentData = talentsData[talentName]

      if (!talentData || !talentData.calculation?.effects) {
        continue
      }

      const spawnEffects = talentData.calculation.effects.filter(effect => 
        effect.type === 'spawn_clickable'
      )

      for (const spawnEffect of spawnEffects) {
        const objectType = spawnEffect.spawner_id || spawnEffect.objectType || 'white_egg'
        const spawnerId = `${talentName}_${especeId}_${objectType}`
        
        // Obtenir la configuration pour ce type de spawnable
        const config = getSpawnableConfigForType(objectType, talentName)
        
        // Vérifier le nombre total de spawnables actifs de ce type (toutes poules confondues)
        const activeSpawnablesOfType = user.activeSpawnables.filter(s => 
          s.spawnableId.includes(`_${objectType}_`)
        ).length
        
        if (activeSpawnablesOfType >= config.maxActivePerUser) {
          continue
        }
        
        // Utiliser la base de données pour le cooldown (anti-exploit multi-onglets)
        const cooldownKey = `${talentName}_${especeId}_${objectType}`
        const lastSpawn = user.lastSpawns?.get(cooldownKey) || new Date(0)

        // Calculer l'intervalle de spawn avec le stockage total et la configuration
        const totalStorage = calculateTotalStorage(user)
        const ctx = {
          niveau,
          stockageMax: totalStorage,
          teamEnergy: computeTeamEnergy(user),
          teamIntelligence: computeTeamIntelligence(user),
          teamCharisme: computeTeamCharisme(user)
        }

        // Utiliser le cooldown direct de la configuration (en millisecondes)
        const spawnInterval = config.cooldownSeconds * 1000

        if (now - new Date(lastSpawn).getTime() >= spawnInterval) {
          // Appliquer directement le pourcentage de chance configuré
          const spawnChance = Math.random()
          
          if (spawnChance < config.spawnChance) {
            const spawnableId = `${spawnerId}_${now}`
            const expiresAt = new Date(now + SPAWNABLE_LIFETIME)
            
            const newSpawnable = {
              id: spawnableId,
              spawnerId: spawnableId, // Utiliser un ID unique par spawnable
              talentName: talentName,
              especeId: especeId,
              type: objectType,
              icon: spawnEffect.icon,
              style: spawnEffect.style || {},
              nivel: niveau
            }
            
            availableSpawnables.push(newSpawnable)

            // Ajouter à la base de données avec le bon format d'ID
            user.activeSpawnables.push({
              spawnerId: spawnableId, // Utiliser un ID unique par spawnable
              spawnableId: `${talentName}_${especeId}_${objectType}_${now}`, // Format pour filtrage
              talentName: talentName,
              especeId: especeId,
              createdAt: new Date(now),
              expiresAt: expiresAt
            })
            
            // Mettre à jour le cooldown en base de données (anti-exploit)
            if (!user.lastSpawns) {
              user.lastSpawns = new Map()
            }
            user.lastSpawns.set(cooldownKey, new Date(now))
            
            console.log(`🥚 Spawnable available: ${talentName}/${objectType} for ${especeId} (niveau ${niveau}) - Chance: ${(config.spawnChance * 100).toFixed(1)}%`)
          } else {
            // Chance échouée
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
        const finalAmount = Math.floor(amount * multipliers.income)
        
        // Utiliser une opération atomique pour ajouter les œufs
        await User.findByIdAndUpdate(req.userId, {
          $inc: { 'resources.eggs': finalAmount }
        })
        
        appliedReward = { type: 'resource', resource: 'eggs', amount: finalAmount }
        
        // Mettre à jour le progrès des succès pour les œufs blancs
        await updateAchievementProgress(req.userId, 'increment', {
          totalEggsCollected: finalAmount
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