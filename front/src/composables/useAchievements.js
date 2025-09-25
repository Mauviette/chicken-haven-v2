import { ref, computed, watch } from 'vue'
import { useGameData } from '@/composables/useGameData'
import { useAuth } from '@/composables/useAuth'
import { usePlayer } from '@/composables/usePlayer'

const userAchievements = ref({
  progress: {
    totalEggsCollected: 0,
    totalChickensOwned: 0,
    totalProductionCompleted: 0,
    totalBoxesOpened: 0,
    maxEggsInOneClick: 0
  },
  completed: [],
  lastChecked: new Date()
})

let updateInterval = null

export function useAchievements() {
  const { token } = useAuth()
  const { eggs } = usePlayer()
  const { achievements: gameAchievements } = useGameData()
  
  const API_BASE = 'http://localhost:3002/api/achievements'

  // Computed properties pour l'affichage
  const achievements = computed(() => {
    return Object.values(gameAchievements.value || {}).map(achievement => {
      const isCompleted = userAchievements.value.completed.some(
        c => c.achievementId === achievement.id
      )
      
      return {
        ...achievement,
        completed: isCompleted,
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

  // Helpers pour calculer le progrès
  function getCurrentProgress(achievement) {
    switch (achievement.type) {
      case 'eggs':
        return Math.min(userAchievements.value.progress.totalEggsCollected, achievement.objectif)
      case 'chickens':
        return Math.min(userAchievements.value.progress.totalChickensOwned, achievement.objectif)
      case 'production':
        return Math.min(userAchievements.value.progress.totalProductionCompleted, achievement.objectif)
      case 'boxes':
        return Math.min(userAchievements.value.progress.totalBoxesOpened, achievement.objectif)
      default:
        return 0
    }
  }

  function getProgressWidth(achievement) {
    const current = getCurrentProgress(achievement)
    return Math.min((current / achievement.objectif) * 100, 100)
  }

  // API calls
  async function fetchAchievements() {
    if (!token.value) return

    try {
      const response = await fetch(`${API_BASE}/status`, {
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        userAchievements.value = {
          progress: data.progress || userAchievements.value.progress,
          completed: data.completed || [],
          lastChecked: new Date(data.lastChecked || Date.now())
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des succès:', error)
    }
  }

  async function checkAchievements() {
    if (!token.value) return

    try {
      const response = await fetch(`${API_BASE}/check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Mettre à jour les données utilisateur
        if (data.updated) {
          userAchievements.value = data.achievements
        }

        // Gérer les nouveaux succès débloqués
        if (data.newAchievements && data.newAchievements.length > 0) {
          handleNewAchievements(data.newAchievements)
        }

        return data.newAchievements || []
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des succès:', error)
    }
    
    return []
  }

  async function claimReward(achievementId) {
    if (!token.value) return false

    try {
      const response = await fetch(`${API_BASE}/claim/${achievementId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // Marquer la récompense comme réclamée
        const completedAchievement = userAchievements.value.completed.find(
          a => a.achievementId === achievementId
        )
        if (completedAchievement) {
          completedAchievement.rewardClaimed = true
        }

        return data.reward
      }
    } catch (error) {
      console.error('Erreur lors de la réclamation de récompense:', error)
    }
    
    return false
  }

  // Gestion des nouveaux succès
  function handleNewAchievements(newAchievements) {
    newAchievements.forEach(achievement => {
      const achievementData = gameAchievements.value[achievement.achievementId]
      if (achievementData) {
        // Ici vous pouvez ajouter des notifications, animations, etc.
        console.log(`🎉 Nouveau succès débloqué: ${achievementData.nom}`)
        
        // Déclencher un événement personnalisé pour les notifications
        window.dispatchEvent(new CustomEvent('achievement-unlocked', {
          detail: {
            achievement: achievementData,
            reward: achievementData.reward
          }
        }))
      }
    })
  }

  // Méthodes pour mettre à jour le progrès localement (optimisation UI)
  function updateProgress(type, value) {
    if (userAchievements.value.progress.hasOwnProperty(type)) {
      userAchievements.value.progress[type] = Math.max(
        userAchievements.value.progress[type], 
        value
      )
    }
  }

  function incrementProgress(type, amount = 1) {
    if (userAchievements.value.progress.hasOwnProperty(type)) {
      userAchievements.value.progress[type] += amount
    }
  }

  // Surveillance automatique des changements
  function startAutoCheck() {
    if (updateInterval) return

    // Vérifier les succès toutes les 30 secondes
    updateInterval = setInterval(async () => {
      await checkAchievements()
    }, 30000)

    // Vérifier aussi quand les œufs changent significativement
    watch(eggs, (newValue, oldValue) => {
      if (newValue > oldValue + 10) { // Si gain significatif d'œufs
        setTimeout(checkAchievements, 1000) // Petite attente pour éviter spam
      }
    })
  }

  function stopAutoCheck() {
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
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
    getProgressWidth
  }
}