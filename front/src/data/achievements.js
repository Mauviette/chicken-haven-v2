// Données des succès
export const achievementsData = {
  'first_eggs': {
    id: 'first_eggs',
    nom: 'Premiers Œufs',
    description: 'Récoltez vos 10 premiers œufs',
    icon: '🥚',
    objectif: 10,
    type: 'eggs',
    reward: {
      type: 'eggs',
      quantite: 5
    },
    completed: true
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
    },
    completed: false
  },
  'egg_master': {
    id: 'egg_master',
    nom: 'Maître des Œufs',
    description: 'Récoltez 1000 œufs au total',
    icon: '👑',
    objectif: 1000,
    type: 'eggs',
    reward: {
      type: 'eggs',
      quantite: 100
    },
    completed: false
  },
  'egg_king': {
    id: 'egg_king',
    nom: 'Maître des Œufs',
    description: 'Récoltez 10000 œufs au total',
    icon: 'zizi',
    objectif: 10000,
    type: 'eggs',
    reward: {
      type: 'eggs',
      quantite: 1000
    },
    completed: false
  }
}

// Types de succès pour organiser l'affichage
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