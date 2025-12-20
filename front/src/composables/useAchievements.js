// composables/useAchievements.js
// Composable pour la gestion des succès

import { computed } from 'vue'
import { useGameData } from '@/composables/useGameData'
import { useAuth } from '@/composables/useAuth'
import { usePlayer } from '@/composables/usePlayer'
import { usePoules } from '@/composables/usePoules'

// Import des modules utilitaires
import { userAchievements } from './achievements/achievementsState.js'
import {
  getCurrentProgress as getProgressForAchievement,
  getProgressWidth as getWidthForAchievement,
  updateProgress,
  incrementProgress
} from './achievements/achievementsProgress.js'
import {
  fetchAchievements as fetchAchievementsApi,
  checkAchievements as checkAchievementsApi,
  claimReward as claimRewardApi,
  handleNewAchievements
} from './achievements/achievementsActions.js'
import { startAutoCheck as startAutoCheckFn, stopAutoCheck } from './achievements/achievementsAutoCheck.js'

export function useAchievements() {
  const { token } = useAuth()
  const { eggs, refreshPlayerData } = usePlayer()
  const { poules } = usePoules()
  const { achievements: gameAchievements, fetchGameData, items } = useGameData()

  // Fonction utilitaire pour formater les récompenses
  function formatString(type, count) {
    const itemsData = items.value
    const itemData = itemsData?.[type]
    if (!itemData || typeof count !== 'number') return 'Valeur invalide'
    return `${count} ${count === 1 ? itemData.nom_singulier : itemData.nom}`
  }

  // Computed properties pour l'affichage
  const achievements = computed(() => {
    return Object.values(gameAchievements.value || {}).map(achievement => {
      const completedEntry = userAchievements.value.completed.find(
        c => c.achievementId === achievement.id
      )
      const isCompleted = !!completedEntry
      const isRewardClaimed = completedEntry?.rewardClaimed === true

      return {
        ...achievement,
        completed: isCompleted,
        rewardClaimed: isRewardClaimed,
        currentProgress: getCurrentProgress(achievement),
        progressWidth: getProgressWidth(achievement)
      }
    })
  })

  const completedCount = computed(() => {
    return userAchievements.value.completed.length
  })

  const totalCount = computed(() => {
    return Object.keys(gameAchievements.value || {}).length
  })

  const progressPercentage = computed(() => {
    if (totalCount.value === 0) return 0
    return Math.round((completedCount.value / totalCount.value) * 100)
  })

  // Wrappers pour les helpers de progrès
  function getCurrentProgress(achievement) {
    return getProgressForAchievement(achievement, poules.value)
  }

  function getProgressWidth(achievement) {
    return getWidthForAchievement(achievement, poules.value)
  }

  // Wrappers pour les API calls
  async function fetchAchievements() {
    return fetchAchievementsApi(token.value)
  }

  async function checkAchievements() {
    return checkAchievementsApi(token.value, (newAchievements) => {
      handleNewAchievements(newAchievements, gameAchievements.value, formatString)
    })
  }

  async function claimReward(achievementId) {
    return claimRewardApi(token.value, achievementId, refreshPlayerData)
  }

  // Wrapper pour l'auto-check
  function startAutoCheck() {
    startAutoCheckFn(
      token.value,
      eggs,
      (newAchievements) => handleNewAchievements(newAchievements, gameAchievements.value, formatString),
      fetchAchievements,
      checkAchievements
    )
  }

  return {
    // État
    userAchievements,
    achievements,
    completedCount,
    totalCount,
    progressPercentage,

    // Méthodes API
    fetchAchievements,
    checkAchievements,
    claimReward,

    // Méthodes de mise à jour locale
    updateProgress,
    incrementProgress,

    // Surveillance automatique
    startAutoCheck,
    stopAutoCheck,

    // Helpers
    getCurrentProgress,
    getProgressWidth,

    // Rechargement des données de jeu
    fetchGameData
  }
}
