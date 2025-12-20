/**
 * Contrôleur des spawnables (objets cliquables)
 * Gère les endpoints HTTP pour le système de spawnables
 */
import User from '../models/User.js'
import { talentsData, especeData } from '../data/sharedGameData.js'
import { computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme } from './egg.controller.js'
import { updateAchievementProgress } from './achievements.controller.js'
import { saveWithRetry } from '../utils/mongoUtils.js'

// Imports des utilitaires
import { 
  SPAWNABLE_LIFETIME, 
  getSpawnableConfigForType, 
  getSpawnableStats,
  SPAWNER_ID_TO_TYPE 
} from './spawnables/spawnablesConfig.js'
import { buildEvaluationContext } from './spawnables/spawnablesCalculations.js'
import { processResourceReward, processBuffReward } from './spawnables/spawnablesRewards.js'

/**
 * GET /api/spawnables/check - Vérifier les spawnables disponibles
 */
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
    
    // Nettoyer les spawnables expirés
    user.activeSpawnables = user.activeSpawnables?.filter(s => new Date(s.expiresAt) > new Date()) || []
    
    const availableSpawnables = []

    for (const especeId of activeTeam) {
      const newSpawnables = await processChickenSpawnables(user, especeId, now)
      availableSpawnables.push(...newSpawnables)
    }

    if (user.isModified()) {
      await saveWithRetry(user)
    }

    res.json({ spawnables: availableSpawnables })

  } catch (error) {
    console.error('Erreur checkAvailableSpawnables:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * Traite les spawnables pour une poule de l'équipe
 */
async function processChickenSpawnables(user, especeId, now) {
  const poule = user.poulesPossedees?.find(p => p.especeId === especeId)
  if (!poule) return []

  const niveau = Math.max(1, Number(poule.niveauTalent) || 1)
  const especeInfo = especeData[especeId]
  
  if (!especeInfo || !especeInfo.talent) return []

  const talentName = especeInfo.talent
  const talentData = talentsData[talentName]

  if (!talentData || !talentData.calculation?.effects) return []

  const spawnEffects = talentData.calculation.effects.filter(effect => 
    effect.type === 'spawn_clickable'
  )

  const teamStats = {
    energy: computeTeamEnergy(user),
    intelligence: computeTeamIntelligence(user),
    charisme: computeTeamCharisme(user)
  }
  const ctx = buildEvaluationContext(user, niveau, teamStats)

  const newSpawnables = []

  for (const spawnEffect of spawnEffects) {
    const spawnable = trySpawnObject(user, especeId, talentName, spawnEffect, ctx, now)
    if (spawnable) {
      newSpawnables.push(spawnable)
    }
  }

  return newSpawnables
}

/**
 * Tente de faire spawn un objet
 */
function trySpawnObject(user, especeId, talentName, spawnEffect, ctx, now) {
  const rawType = spawnEffect.spawner_id || spawnEffect.objectType || 'white_egg'
  const objectType = SPAWNER_ID_TO_TYPE[rawType] || rawType
  
  const config = getSpawnableConfigForType(spawnEffect.spawner_id || objectType, talentName)
  
  // Vérifier le nombre d'instances actives
  const existingCount = (user.activeSpawnables || []).filter(s => 
    s.talentName === talentName &&
    s.especeId === especeId &&
    (s.type === objectType || (s.spawnableId && s.spawnableId.includes(`_${objectType}`)))
  ).length

  if (existingCount >= (config.maxActivePerUser || 0)) {
    return null
  }
  
  // Vérifier le cooldown
  const cooldownKey = `${talentName}_${especeId}_${objectType}`
  const lastSpawnIso = (user.lastSpawns && user.lastSpawns[cooldownKey]) || null
  const lastSpawn = lastSpawnIso ? new Date(lastSpawnIso) : new Date(0)
  const spawnInterval = config.cooldownSeconds * 1000

  if (now - new Date(lastSpawn).getTime() < spawnInterval) {
    return null
  }

  // Tirer la chance de spawn
  if (Math.random() >= config.spawnChance) {
    return null
  }

  // Créer le spawnable
  const spawnerId = `${talentName}_${especeId}_${objectType}`
  const uniqueSpawnableId = `${spawnerId}_${now}_${Math.random().toString(36).substr(2, 9)}`
  const expiresAt = new Date(now + SPAWNABLE_LIFETIME)
  
  const newSpawnable = {
    id: uniqueSpawnableId,
    spawnerId: uniqueSpawnableId,
    talentName,
    especeId,
    type: objectType,
    icon: spawnEffect.icon,
    style: spawnEffect.style || {},
    nivel: ctx.niveau,
    timestamp: now,
    lifetime: SPAWNABLE_LIFETIME
  }

  user.activeSpawnables.push({
    spawnerId: uniqueSpawnableId,
    spawnableId: uniqueSpawnableId,
    talentName,
    especeId,
    createdAt: new Date(now),
    expiresAt
  })
  
  if (!user.lastSpawns || typeof user.lastSpawns !== 'object') {
    user.lastSpawns = {}
  }
  user.lastSpawns[cooldownKey] = new Date(now).toISOString()

  return newSpawnable
}

/**
 * POST /api/spawnables/click - Gérer le clic sur un objet spawné
 */
export async function clickSpawnableObject(req, res) {
  try {
    const { spawnerId, talentName, especeId } = req.body
    
    if (!spawnerId || !talentName || !especeId) {
      return res.status(400).json({ error: 'Données manquantes' })
    }

    // Retirer le spawnable de manière atomique
    const updateResult = await User.findOneAndUpdate(
      {
        _id: req.userId,
        'activeSpawnables.spawnerId': spawnerId,
        'activeSpawnables.expiresAt': { $gt: new Date() }
      },
      { $pull: { activeSpawnables: { spawnerId } } },
      { new: false, lean: false }
    )

    if (!updateResult) {
      return res.status(400).json({ error: 'Ce spawnable n\'existe pas, a expiré ou a déjà été collecté' })
    }

    const user = updateResult

    // Vérifications
    const teamSlots = user.team?.slots || []
    if (!teamSlots.some(slot => slot?.especeId === especeId)) {
      return res.status(400).json({ error: 'Cette poule n\'est pas équipée' })
    }

    const talentData = talentsData[talentName]
    if (!talentData?.calculation) {
      return res.status(400).json({ error: 'Talent introuvable' })
    }

    const spawnEffect = talentData.calculation.effects?.find(e => e.type === 'spawn_clickable')
    if (!spawnEffect) {
      return res.status(400).json({ error: 'Effet de spawn introuvable' })
    }

    const poule = user.poulesPossedees?.find(p => p.especeId === especeId)
    if (!poule) {
      return res.status(400).json({ error: 'Poule non possédée' })
    }

    // Calculer le contexte
    const niveau = Math.max(1, Number(poule.niveauTalent) || 1)
    const teamStats = {
      energy: computeTeamEnergy(user),
      intelligence: computeTeamIntelligence(user),
      charisme: computeTeamCharisme(user)
    }
    const ctx = buildEvaluationContext(user, niveau, teamStats)

    // Traiter la récompense
    let appliedReward = null
    const reward = spawnEffect.reward

    if (reward.type === 'resource') {
      appliedReward = await processResourceReward(req.userId, user, reward, ctx)
    } else if (reward.type === 'buff') {
      appliedReward = await processBuffReward(req.userId, reward, talentName, ctx)
    }

    // Incrémenter le compteur de spawnables cliqués
    await updateAchievementProgress(req.userId, 'increment', { spawnablesClicked: 1 })

    res.json({ success: true, reward: appliedReward })

  } catch (error) {
    console.error('Erreur clickSpawnableObject:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * GET /api/spawnables/config - Obtenir la configuration des spawnables
 */
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
