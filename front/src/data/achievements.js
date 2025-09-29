// DEPRECATED - Utilisez useGameData() pour les données synchronisées
// Ce fichier est conservé pour compatibilité

import { useGameData } from '../composables/useGameData.js'

// Données locales (DEPRECATED)
export const achievementsDataLocal = {}

// Fonction pour obtenir les données synchronisées
export function getAchievementsData() {
  const { achievements } = useGameData()
  return achievements.value
}

export function getAchievementCategories() {
  const { categories } = useGameData()
  return categories.value
}

// Export pour compatibilité (DEPRECATED)
export const achievementsData = achievementsDataLocal
export const achievementCategories = {}