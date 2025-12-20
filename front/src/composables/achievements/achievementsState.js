// composables/achievements/achievementsState.js
// État partagé pour les succès

import { ref } from 'vue'

// Structure initiale du progrès
export const INITIAL_PROGRESS = {
  totalEggsCollected: 0,
  totalChickensOwned: 0,
  totalProductionCompleted: 0,
  totalBoxesOpened: 0,
  maxEggsInOneClick: 0,
  avatarChanged: 0,
  nameChanged: 0,
  maxTeamStat: 0,
  maxMegaClick: 0,
  miningGamesPlayed: 0,
  miningArtifactsFound: 0,
  miningCellsBroken: 0,
  miningNoRewardGame: false,
  miningFullGridBroken: false,
  miningBestCellsInGame: 0,
  chickenGiftsCollected: 0,
  chickenAbilitiesUsed: 0
}

// État partagé des succès utilisateur
export const userAchievements = ref({
  progress: { ...INITIAL_PROGRESS },
  completed: [],
  lastChecked: new Date()
})

// Intervalle de mise à jour automatique
export let updateInterval = null
export function setUpdateInterval(interval) {
  updateInterval = interval
}

// Dédoublonnage des notifications d'unlock pendant la session
export const notifiedAchievements = new Set()

/**
 * Réinitialiser l'état des succès (pour changement de compte)
 */
export function resetAchievementsState() {
  notifiedAchievements.clear()
  userAchievements.value = {
    progress: { ...INITIAL_PROGRESS },
    completed: [],
    lastChecked: new Date()
  }
}
