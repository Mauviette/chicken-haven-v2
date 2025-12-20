/**
 * Contrôleur des succès (achievements)
 * Gère les endpoints HTTP pour le système de succès du jeu
 */
import User from '../models/User.js'
import { achievementsData } from '../data/sharedGameData.js'
import {
  ensureAchievementsInitialized,
  ensureAllProgressFields,
  syncProgressWithUserState,
  updateBestTeamStats,
  applyProgressUpdate
} from './achievements/achievementsProgress.utils.js'
import {
  applyAchievementReward,
  checkNewAchievements
} from './achievements/achievementsRewards.utils.js'

// Configuration des succès basée sur les données centralisées
const achievementsConfig = {}

// Transformer les données centralisées en configuration avec logique de vérification
Object.entries(achievementsData).forEach(([id, data]) => {
  achievementsConfig[id] = {
    id: data.id,
    type: data.type,
    objectif: data.objectif,
    reward: data.reward,
    check: (progress, user) => {
      switch (data.type) {
        case 'eggs':
          return progress.totalEggsCollected >= data.objectif
        case 'chickens':
          return progress.totalChickensOwned >= data.objectif
        case 'boxes':
        case 'boxes_opened':
          return progress.totalBoxesOpened >= data.objectif
        case 'production':
          return progress.totalProductionCompleted >= data.objectif
        case 'talent_level':
          const poules = user?.poulesPossedees || []
          return poules.some(poule => (poule.niveauTalent || 1) >= data.objectif)
        case 'avatar_change':
          return progress.avatarChanged >= data.objectif
        case 'name_change':
          return progress.nameChanged >= data.objectif
        case 'team_stats':
          return progress.maxTeamStat >= data.objectif
        case 'mega_click':
          return progress.maxMegaClick >= data.objectif
        case 'mining_artifacts':
          return (progress.miningArtifactsFound || 0) >= data.objectif
        case 'mining_cells':
          return (progress.miningCellsBroken || 0) >= data.objectif
        case 'mining_no_reward':
          return !!(progress.miningNoRewardGame)
        case 'mining_full_grid':
          return !!(progress.miningFullGridBroken)
        case 'mining_best_cells_in_game':
          return (progress.miningBestCellsInGame || 0) >= data.objectif
        case 'chickenGiftsCollected':
          return (progress.chickenGiftsCollected || 0) >= data.objectif
        case 'chickenAbilitiesUsed':
          return (progress.chickenAbilitiesUsed || 0) >= data.objectif
        default:
          return false
      }
    }
  }
})

/**
 * GET /api/achievements/status - Récupère le statut des succès de l'utilisateur
 */
export async function getAchievementsStatus(req, res) {
  try {
    let user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    user = await ensureAchievementsInitialized(user, req.userId)

    res.json({
      progress: user.achievements.progress,
      completed: user.achievements.completed,
      lastChecked: user.achievements.lastChecked
    })
  } catch (error) {
    console.error('Erreur getAchievementsStatus:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/achievements/check - Vérifie et met à jour les succès
 */
export async function checkAchievements(req, res) {
  try {
    let user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Initialiser et migrer les champs si nécessaire
    user = await ensureAchievementsInitialized(user, req.userId)
    ensureAllProgressFields(user.achievements.progress)
    syncProgressWithUserState(user)

    // Mettre à jour les stats d'équipe
    const { computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme } = await import('./egg.controller.js')
    updateBestTeamStats(user, computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme)

    // Vérifier les nouveaux succès
    const newAchievements = checkNewAchievements(user, achievementsConfig)

    // Persister
    user.achievements.lastChecked = new Date()
    user.markModified('achievements')
    await user.save()

    res.json({
      updated: true,
      achievements: user.achievements,
      newAchievements
    })
  } catch (error) {
    console.error('Erreur checkAchievements:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/achievements/claim/:id - Réclame la récompense d'un succès
 */
export async function claimReward(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { achievementId } = req.params
    const config = achievementsConfig[achievementId]
    
    if (!config) {
      return res.status(400).json({ error: 'Succès inexistant' })
    }

    // Trouver le succès complété
    const completedAchievement = user.achievements?.completed?.find(
      a => a.achievementId === achievementId
    )

    if (!completedAchievement) {
      return res.status(400).json({ error: 'Succès non complété' })
    }

    if (completedAchievement.rewardClaimed) {
      return res.status(409).json({ error: 'Récompense déjà réclamée' })
    }

    // Rafraîchir le progrès pour éviter les exploits
    syncProgressWithUserState(user)

    // Vérifier que les conditions sont toujours remplies
    if (!config.check(user.achievements.progress, user)) {
      return res.status(400).json({ error: 'Conditions du succès non remplies' })
    }

    // Appliquer la récompense
    const rewardResult = applyAchievementReward(user, config.reward)

    // Marquer comme réclamé et persister
    completedAchievement.rewardClaimed = true
    user.markModified('achievements')
    await user.save()

    const responseBody = {
      success: true,
      reward: config.reward,
      newResources: user.resources,
      achievements: user.achievements
    }
    
    if (rewardResult.levelRewards) {
      responseBody.levelRewards = rewardResult.levelRewards
    }

    res.json(responseBody)
  } catch (error) {
    console.error('Erreur claimReward:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * Utilitaire pour mettre à jour le progrès depuis d'autres contrôleurs
 * @param {string} userId - ID de l'utilisateur
 * @param {'increment'|'max'} progressType - Type de mise à jour
 * @param {Object} value - Paires clé/valeur à mettre à jour
 */
export async function updateAchievementProgress(userId, progressType, value) {
  try {
    let user = await User.findById(userId)
    if (!user) return

    // Initialiser et migrer si nécessaire
    user = await ensureAchievementsInitialized(user, userId)
    ensureAllProgressFields(user.achievements.progress)

    // Appliquer la mise à jour
    applyProgressUpdate(user, progressType, value)

    // Mettre à jour les stats d'équipe
    try {
      const { computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme } = await import('./egg.controller.js')
      updateBestTeamStats(user, computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme)
    } catch (e) {
      console.warn('Erreur lors de la mise à jour des bestTeam*:', e)
    }

    user.markModified('achievements')
    await user.save()
  } catch (error) {
    console.error('Erreur updateAchievementProgress:', error)
  }
}

/**
 * Fonction utilitaire pour déclencher une vérification complète des succès
 * @param {string} userId - ID de l'utilisateur
 * @returns {Array} Liste des nouveaux succès débloqués
 */
export async function triggerAchievementCheck(userId) {
  try {
    let user = await User.findById(userId)
    if (!user) return []

    // Initialiser et migrer si nécessaire
    user = await ensureAchievementsInitialized(user, userId)
    ensureAllProgressFields(user.achievements.progress)
    syncProgressWithUserState(user)

    // Mettre à jour les stats d'équipe
    const { computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme } = await import('./egg.controller.js')
    updateBestTeamStats(user, computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme)

    console.log(`🔍 Current achievement progress for user ${userId}:`, user.achievements.progress)

    // Vérifier les nouveaux succès
    const newAchievements = checkNewAchievements(user, achievementsConfig)

    if (newAchievements.length > 0) {
      user.achievements.lastChecked = new Date()
      user.markModified('achievements')
      await user.save()
    }

    return newAchievements
  } catch (error) {
    console.error('Erreur triggerAchievementCheck:', error)
    return []
  }
}
