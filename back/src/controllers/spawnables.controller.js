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
    
    if (!userLastSpawns.has(userId)) {
      userLastSpawns.set(userId, new Map())
    }
    
    const userSpawns = userLastSpawns.get(userId)
    const availableSpawnables = []

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
          // 25% de chance d'apparition à chaque vérification
          const spawnChance = Math.random()
          if (spawnChance < 0.1) {
            const spawnableId = `${spawnerId}_${now}`
            
            availableSpawnables.push({
              id: spawnableId,
              spawnerId: spawnerId,
              talentName: talentName,
              especeId: especeId,
              type: spawnEffect.objectType || 'white_egg',
              icon: spawnEffect.icon,
              style: spawnEffect.style || {},
              nivel: niveau
            })

            // Marquer ce spawnable comme spawné
            userSpawns.set(spawnerId, now)
            
            console.log(`🥚 Spawnable available: ${talentName} for ${especeId} (niveau ${niveau}) - Chance réussie!`)
          } else {
            console.log(`🎲 Spawnable chance échouée: ${talentName} for ${especeId} (${(spawnChance * 100).toFixed(1)}% > 25%)`)
          }
        }
      }
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
      // TODO: Implémenter les buffs pour les chocolats
      const duration = reward.duration || 15000
      const multiplier = evalExpr(reward.multiplier, ctx)
      
      // Ajouter le buff
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
    }

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