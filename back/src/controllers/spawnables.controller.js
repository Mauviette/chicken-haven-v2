// controllers/spawnables.controller.js
// Contrôleur pour gérer les objets cliquables spawnés par les talents

import User from '../models/User.js'
import { achievementsData, talentsData, especeData } from '../data/sharedGameData.js'

// Importer les fonctions de calcul du contrôleur des œufs
import { 
  computeTeamEnergy, 
  computeTeamIntelligence, 
  runTalentStorage 
} from './egg.controller.js'

// Stockage des derniers spawns par utilisateur pour éviter la triche
const userLastSpawns = new Map()

// Stockage des spawnables actifs par utilisateur (pour éviter l'exploit multi-onglets)
const userActiveSpawnables = new Map()

// Limite maximale de spawnables simultanés par utilisateur
const MAX_SPAWNABLES_PER_USER = 3

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

// Fonction pour calculer le stockage total comme dans egg controller
function calculateTotalStorage(user) {
  const baseMaxIncome = user.clickableEgg?.maxIncome || 100
  const storageBonus = runTalentStorage(user)
  const effectiveMaxIncome = Math.max(0, baseMaxIncome + storageBonus.storageBonus)
  
  return effectiveMaxIncome
}

// GET /api/spawnables/check - Vérifier les spawnables disponibles
export async function checkAvailableSpawnables(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const teamSlots = user.team?.slots || []
    const activeTeam = teamSlots.filter(slot => slot?.especeId).map(slot => slot.especeId)

    console.log(`🔍 Checking spawnables for user ${req.userId}`)
    console.log(`👥 Active team:`, activeTeam)

    if (activeTeam.length === 0) {
      console.log(`❌ No active team`)
      return res.json({ spawnables: [] })
    }

    const now = Date.now()
    const userId = req.userId.toString()
    
    // Nettoyer les spawnables expirés dans la base de données
    user.activeSpawnables = user.activeSpawnables?.filter(s => new Date(s.expiresAt) > new Date()) || []
    
    if (!userLastSpawns.has(userId)) {
      userLastSpawns.set(userId, new Map())
    }
    
    // Initialiser les spawnables actifs pour cet utilisateur
    if (!userActiveSpawnables.has(userId)) {
      userActiveSpawnables.set(userId, new Map())
    }
    
    const userSpawns = userLastSpawns.get(userId)
    const activeSpawnables = userActiveSpawnables.get(userId)
    const availableSpawnables = []

    // Synchroniser avec la base de données
    for (const dbSpawnable of user.activeSpawnables) {
      activeSpawnables.set(dbSpawnable.spawnerId, new Date(dbSpawnable.createdAt).getTime())
    }

    // Nettoyer les spawnables expirés (plus de 30 secondes)
    const expiredKeys = []
    for (const [key, timestamp] of activeSpawnables.entries()) {
      if (now - timestamp > 30000) {
        expiredKeys.push(key)
      }
    }
    expiredKeys.forEach(key => activeSpawnables.delete(key))

    // Vérifier si l'utilisateur a déjà atteint la limite de spawnables
    if (user.activeSpawnables.length >= MAX_SPAWNABLES_PER_USER) {
      console.log(`🚫 User ${userId} has reached max spawnables limit (${user.activeSpawnables.length}/${MAX_SPAWNABLES_PER_USER})`)
      return res.json({ spawnables: [] })
    }

    // Parcourir l'équipe active
    for (const especeId of activeTeam) {
      console.log(`🐔 Checking spawnable for espèce: ${especeId}`)
      
      const poule = user.poulesPossedees?.find(p => p.especeId === especeId)
      if (!poule) {
        console.log(`❌ Poule ${especeId} not found in poulesPossedees`)
        continue
      }

      const niveau = Math.max(1, Number(poule.niveauTalent) || 1)
      console.log(`📊 Poule ${especeId} niveau: ${niveau}`)

      // Trouver l'espèce et son talent dans les données partagées
      const especeInfo = especeData[especeId]
      
      if (!especeInfo || !especeInfo.talent) {
        console.log(`❌ No espèce info or talent for ${especeId}`)
        continue
      }

      const talentName = especeInfo.talent
      console.log(`🎯 Talent for ${especeId}: ${talentName}`)
      
      const talentData = talentsData[talentName]

      if (!talentData || !talentData.calculation?.effects) {
        console.log(`❌ No talent data or effects for ${talentName}`)
        continue
      }

      const spawnEffects = talentData.calculation.effects.filter(effect => 
        effect.type === 'spawn_clickable'
      )

      console.log(`🎪 Found ${spawnEffects.length} spawn effects for ${talentName}`)

      for (const spawnEffect of spawnEffects) {
        const spawnerId = `${talentName}_${especeId}`
        const lastSpawn = userSpawns.get(spawnerId) || 0

        // Calculer l'intervalle de spawn avec le stockage total
        const totalStorage = calculateTotalStorage(user)
        const ctx = {
          niveau,
          stockageMax: totalStorage, // Utiliser le stockage total
          teamEnergy: computeTeamEnergy(user),
          teamIntelligence: computeTeamIntelligence(user),
          teamCharisme: 10
        }

        const spawnInterval = evalExpr(spawnEffect.spawnRate, ctx) * 1000 // en ms

        if (now - lastSpawn >= spawnInterval) {
          // Vérifier s'il n'y a pas déjà un spawnable actif pour ce spawner
          const hasActiveSpawnable = user.activeSpawnables.some(s => s.spawnerId === spawnerId)
          if (hasActiveSpawnable) {
            console.log(`⏳ Spawnable ${spawnerId} already active, skipping`)
            continue
          }

          // 5% de chance d'apparition à chaque vérification (réduit pour éviter le spam)
          const spawnChance = Math.random()
          if (spawnChance < 0.05) {
            const spawnableId = `${spawnerId}_${now}`
            const expiresAt = new Date(now + 30000) // 30 secondes
            
            const newSpawnable = {
              id: spawnableId,
              spawnerId: spawnerId,
              talentName: talentName,
              especeId: especeId,
              type: spawnEffect.objectType || 'white_egg',
              icon: spawnEffect.icon,
              style: spawnEffect.style || {},
              nivel: niveau
            }
            
            availableSpawnables.push(newSpawnable)

            // Ajouter à la base de données
            user.activeSpawnables.push({
              spawnerId: spawnerId,
              spawnableId: spawnableId,
              talentName: talentName,
              especeId: especeId,
              createdAt: new Date(now),
              expiresAt: expiresAt
            })
            
            // Marquer ce spawnable comme actif en mémoire
            activeSpawnables.set(spawnerId, now)
            
            // Marquer ce spawnable comme spawné
            userSpawns.set(spawnerId, now)
            
            console.log(`🥚 Spawnable available: ${talentName} for ${especeId} (niveau ${niveau}) - Chance réussie!`)
          } else {
            console.log(`🎲 Spawnable chance échouée: ${talentName} for ${especeId} (${(spawnChance * 100).toFixed(1)}% > 5%)`)
          }
        }
      }
    }

    // Sauvegarder les changements (spawnables expirés nettoyés + nouveaux spawnables)
    if (user.isModified()) {
      await user.save()
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
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { spawnerId, objectId, talentName, especeId } = req.body
    
    if (!spawnerId || !talentName || !especeId) {
      return res.status(400).json({ error: 'Données manquantes' })
    }

    const userId = req.userId.toString()

    // Vérifier que le spawnable est bien actif pour cet utilisateur dans la base de données
    const activeSpawnableIndex = user.activeSpawnables.findIndex(s => s.spawnerId === spawnerId)
    if (activeSpawnableIndex === -1) {
      return res.status(400).json({ error: 'Ce spawnable n\'est pas actif ou a expiré' })
    }

    const activeSpawnable = user.activeSpawnables[activeSpawnableIndex]
    
    // Vérifier l'expiration
    if (new Date(activeSpawnable.expiresAt) < new Date()) {
      // Nettoyer le spawnable expiré
      user.activeSpawnables.splice(activeSpawnableIndex, 1)
      await user.save()
      return res.status(400).json({ error: 'Ce spawnable a expiré' })
    }

    // Vérifier que l'utilisateur a bien cette poule équipée
    const teamSlots = user.team?.slots || []
    const hasChickenInTeam = teamSlots.some(slot => slot?.especeId === especeId)
    
    if (!hasChickenInTeam) {
      return res.status(400).json({ error: 'Cette poule n\'est pas équipée' })
    }

    // Récupérer les données du talent
    const talentData = talentsData[talentName]
    if (!talentData || !talentData.calculation) {
      return res.status(400).json({ error: 'Talent introuvable' })
    }

    // Trouver l'effet spawn_clickable correspondant
    const effects = talentData.calculation.effects || []
    const spawnEffect = effects.find(effect => 
      effect.type === 'spawn_clickable' && 
      `${talentName}_${especeId}` === spawnerId
    )

    if (!spawnEffect) {
      return res.status(400).json({ error: 'Effet de spawn introuvable' })
    }

    // Récupérer le niveau de talent de la poule
    const poule = user.poulesPossedees?.find(p => p.especeId === especeId)
    if (!poule) {
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
      teamCharisme: 10
    }

    console.log(`💰 Calcul de récompense pour ${talentName}:`, {
      baseStorage: user.clickableEgg?.maxIncome || 100,
      totalStorage,
      niveau,
      storageBonus: runTalentStorage(user).storageBonus
    })

    // Traiter la récompense
    const reward = spawnEffect.reward
    let appliedReward = null

    if (reward.type === 'resource') {
      const amount = Math.floor(evalExpr(reward.amount, ctx))
      
      if (reward.resource === 'eggs') {
        user.resources.eggs = (user.resources.eggs || 0) + amount
        appliedReward = { type: 'resource', resource: 'eggs', amount }
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
        
        user.buffs = user.buffs || []
        user.buffs.push(incomeBuffs, storageBuff)
        
        appliedReward = { 
          type: 'buff', 
          buff_type: reward.buff_type, 
          duration, 
          income_multiplier: incomeMultiplier,
          storage_multiplier: storageMultiplier
        }
        
        console.log(`🍫 Buff income+storage appliqué: income x${incomeMultiplier}, storage x${storageMultiplier} pendant ${Math.round(duration/1000)}s`)
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
        
        user.buffs = user.buffs || []
        user.buffs.push(buff)
        
        appliedReward = { 
          type: 'buff', 
          buff_type: reward.buff_type, 
          duration, 
          multiplier 
        }
        
        console.log(`🍫 Buff appliqué: ${reward.buff_type} x${multiplier} pendant ${Math.round(duration/1000)}s`)
      }
    }

    await user.save()

    // Retirer le spawnable de la liste des actifs (base de données)
    user.activeSpawnables.splice(activeSpawnableIndex, 1)
    
    // Retirer aussi de la mémoire si présent
    if (userActiveSpawnables.has(userId)) {
      const activeSpawnables = userActiveSpawnables.get(userId)
      activeSpawnables.delete(spawnerId)
    }

    // Sauvegarder à nouveau pour retirer le spawnable
    await user.save()

    // Log pour debug
    console.log(`🎯 Spawnable clicked: ${talentName} by user ${req.userId}, reward:`, appliedReward)

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