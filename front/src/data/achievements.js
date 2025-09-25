// DEPRECATED - Utilisez useGameData() pour les données synchronisées
// Ce fichier est conservé pour compatibilité

import { useGameData } from '../composables/useGameData.js'

// Données locales (DEPRECATED)
export const achievementsDataLocal = {
  'first_eggs': {
    id: 'first_eggs',
    nom: 'Premiers Œufs',
    description: 'Récoltez vos 15 premiers œufs',
    icon: '🥚',
    objectif: 15,
    type: 'eggs',
    reward: {
      type: 'blueberry',
      quantite: 1
    }
  },
  'egg_collector': {
    id: 'egg_collector',
    nom: 'Collectionneur d\'Œufs',
    description: 'Récoltez 100 œufs au total',
    icon: '🎯',
    objectif: 100,
    type: 'eggs',
    reward: {
      type: 'eggs',
      quantite: 25
    }
  }
}

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
export const achievementCategories = {
  'eggs': {
    nom: 'Œufs',
    icon: '🥚',
    color: '#FFD700'
  },
  'chickens': {
    nom: 'Poules',
    icon: '🐔',
    color: '#FF6B35'
  },
  'production': {
    nom: 'Production',
    icon: '⚒️',
    color: '#4ECDC4'
  }
}