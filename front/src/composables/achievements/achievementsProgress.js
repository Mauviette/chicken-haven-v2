// composables/achievements/achievementsProgress.js
// Calcul du progrès pour les succès

import { userAchievements } from './achievementsState.js'

/**
 * Obtenir le progrès actuel pour un succès donné
 */
export function getCurrentProgress(achievement, poules = []) {
  const progress = userAchievements.value.progress
  const completed = userAchievements.value.completed

  switch (achievement.type) {
    case 'eggs':
      return Math.min(progress.totalEggsCollected, achievement.objectif)

    case 'chickens':
      return Math.min(progress.totalChickensOwned, achievement.objectif)

    case 'production':
      return Math.min(progress.totalProductionCompleted, achievement.objectif)

    case 'boxes':
    case 'boxes_opened':
      return Math.min(progress.totalBoxesOpened, achievement.objectif)

    case 'talent_level':
      // Calculer le niveau maximum atteint par n'importe quelle poule
      const maxTalentLevel = poules.reduce((max, poule) => {
        return Math.max(max, poule.niveauTalent || 1)
      }, 1)
      return Math.min(maxTalentLevel, achievement.objectif)

    case 'avatar_change':
      return Math.min(progress.avatarChanged, achievement.objectif)

    case 'name_change':
      return Math.min(progress.nameChanged, achievement.objectif)

    case 'team_stats':
      return Math.min(progress.maxTeamStat, achievement.objectif)

    case 'mega_click':
      return Math.min(progress.maxMegaClick, achievement.objectif)

    case 'mining_artifacts':
      return Math.min(progress.miningArtifactsFound, achievement.objectif)

    case 'mining_cells':
      return Math.min(progress.miningCellsBroken, achievement.objectif)

    case 'mining_no_reward':
      const noRewardCompleted = completed.find(c => c.achievementId === achievement.id)
      return noRewardCompleted ? achievement.objectif : 0

    case 'mining_full_grid':
      const fullGridCompleted = completed.find(c => c.achievementId === achievement.id)
      return fullGridCompleted ? achievement.objectif : 0

    case 'mining_best_cells_in_game':
      return Math.min(progress.miningBestCellsInGame, achievement.objectif)

    case 'chickenGiftsCollected':
      return Math.min(progress.chickenGiftsCollected, achievement.objectif)

    case 'chickenAbilitiesUsed':
      return Math.min(progress.chickenAbilitiesUsed, achievement.objectif)

    default:
      return 0
  }
}

/**
 * Obtenir la largeur de la barre de progression
 */
export function getProgressWidth(achievement, poules = []) {
  const current = getCurrentProgress(achievement, poules)
  return Math.min((current / achievement.objectif) * 100, 100)
}

/**
 * Mettre à jour le progrès localement (type = valeur maximale)
 */
export function updateProgress(type, value) {
  if (userAchievements.value.progress.hasOwnProperty(type)) {
    userAchievements.value.progress[type] = Math.max(
      userAchievements.value.progress[type],
      value
    )
  }
}

/**
 * Incrémenter le progrès localement
 */
export function incrementProgress(type, amount = 1) {
  if (userAchievements.value.progress.hasOwnProperty(type)) {
    userAchievements.value.progress[type] += amount
  }
}
