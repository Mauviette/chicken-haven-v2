import { ref, computed, watch } from 'vue'
import { useGameData } from '@/composables/useGameData'
import { useAuth } from '@/composables/useAuth'
import { usePlayer } from '@/composables/usePlayer'
import { formatString } from '@/data/items.js'

const userAchievements = ref({
  progress: {
    totalEggsCollected: 0,
    totalChickensOwned: 0,
    totalProductionCompleted: 0,
    totalBoxesOpened: 0,
    maxEggsInOneClick: 0,
    avatarChanged: 0,
    nameChanged: 0,
    maxTeamStat: 0,
    maxMegaClick: 0
  },
  completed: [],
  lastChecked: new Date()
})

let updateInterval = null
// Dédoublonnage des notifications d'unlock pendant la session
const notifiedAchievements = new Set()

export function useAchievements() {
  const { token } = useAuth()
  const { eggs, refreshPlayerData } = usePlayer()
  const { achievements: gameAchievements, fetchGameData } = useGameData()
  
  const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/achievements`

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
      case 'boxes_opened':
        return Math.min(userAchievements.value.progress.totalBoxesOpened, achievement.objectif)
      case 'talent_level':
        // Pour les succès de niveau de talent, le progrès est géré côté serveur
        // On retourne soit 0 (pas atteint) soit l'objectif (atteint)
        const completedEntry = userAchievements.value.completed.find(
          c => c.achievementId === achievement.id
        )
        return completedEntry ? achievement.objectif : 0
      case 'avatar_change':
        return Math.min(userAchievements.value.progress.avatarChanged, achievement.objectif)
      case 'name_change':
        return Math.min(userAchievements.value.progress.nameChanged, achievement.objectif)
      case 'team_stats':
        return Math.min(userAchievements.value.progress.maxTeamStat, achievement.objectif)
      case 'mega_click':
        return Math.min(userAchievements.value.progress.maxMegaClick, achievement.objectif)
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
          progress: {
            // Fusionner les données existantes avec les nouvelles pour éviter de perdre des champs
            ...userAchievements.value.progress,
            ...(data.progress || {})
          },
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
        if (data.achievements) {
          userAchievements.value = data.achievements
        } else {
          const completedAchievement = userAchievements.value.completed.find(
            a => a.achievementId === achievementId
          )
          if (completedAchievement) {
            completedAchievement.rewardClaimed = true
          }
        }

        // Rafraîchir les ressources du joueur (œufs, jetons, niveau)
        try { await refreshPlayerData() } catch (_) {}
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
      // Éviter les doubles toasts pour le même succès dans la session
      if (notifiedAchievements.has(achievement.achievementId)) return
      notifiedAchievements.add(achievement.achievementId)

      const achievementData = gameAchievements.value[achievement.achievementId]
      if (achievementData) {
        // Ici vous pouvez ajouter des notifications, animations, etc.
        console.log(`🎉 Nouveau succès débloqué: ${achievementData.nom}`)

        // Afficher un toast global si disponible
        try {
          const reward = achievementData.reward
          const rewardText = reward ? ` — Récompense: ${formatString(reward.type, reward.quantite)}` : ''
          const message = `Succès débloqué: ${achievementData.nom}`
          if (typeof window !== 'undefined' && window.$toast) {
            window.$toast(message, 'achievement')
          }
        } catch (_) { /* noop */ }
        
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

    // Rafraîchir lors d'événements clés (achat poule, clic œuf)
    if (typeof window !== 'undefined') {
      const onChickenBought = () => setTimeout(checkAchievements, 250)
      const onEggClicked = () => setTimeout(checkAchievements, 250)
      const onAvatarUpdated = () => setTimeout(checkAchievements, 250)
      const onNameChanged = () => setTimeout(checkAchievements, 250)
      const onChickenUpgraded = () => setTimeout(checkAchievements, 250)
      const onAuthLogin = async () => {
        // Réinitialiser puis recharger les succès pour le nouveau compte
        try { notifiedAchievements.clear() } catch (_) {}
        userAchievements.value = {
          progress: {
            totalEggsCollected: 0,
            totalChickensOwned: 0,
            totalProductionCompleted: 0,
            totalBoxesOpened: 0,
            maxEggsInOneClick: 0,
            avatarChanged: 0,
            nameChanged: 0,
            maxTeamStat: 0,
            maxMegaClick: 0
          },
          completed: [],
          lastChecked: new Date()
        }
        try {
          await fetchAchievements()
          await checkAchievements()
        } catch (_) {}
      }
      const onAuthLogout = () => {
        // Nettoyer l'état local pour éviter un affichage d'un autre compte
        try { notifiedAchievements.clear() } catch (_) {}
        userAchievements.value = {
          progress: {
            totalEggsCollected: 0,
            totalChickensOwned: 0,
            totalProductionCompleted: 0,
            totalBoxesOpened: 0,
            maxEggsInOneClick: 0,
            avatarChanged: 0,
            nameChanged: 0,
            maxTeamStat: 0,
            maxMegaClick: 0
          },
          completed: [],
          lastChecked: new Date()
        }
      }
      window.addEventListener('chicken-bought', onChickenBought)
      window.addEventListener('egg-clicked', onEggClicked)
      window.addEventListener('avatar-updated', onAvatarUpdated)
      window.addEventListener('name-changed', onNameChanged)
      window.addEventListener('chicken-upgraded', onChickenUpgraded)
      window.addEventListener('auth-login', onAuthLogin)
      window.addEventListener('auth-logout', onAuthLogout)
      // Stocker les handlers pour pouvoir les retirer si besoin
      startAutoCheck._onChickenBought = onChickenBought
      startAutoCheck._onEggClicked = onEggClicked
      startAutoCheck._onAvatarUpdated = onAvatarUpdated
      startAutoCheck._onNameChanged = onNameChanged
      startAutoCheck._onChickenUpgraded = onChickenUpgraded
      startAutoCheck._onAuthLogin = onAuthLogin
      startAutoCheck._onAuthLogout = onAuthLogout
    }
  }

  function stopAutoCheck() {
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
    if (typeof window !== 'undefined') {
      if (startAutoCheck._onChickenBought) {
        window.removeEventListener('chicken-bought', startAutoCheck._onChickenBought)
        startAutoCheck._onChickenBought = null
      }
      if (startAutoCheck._onEggClicked) {
        window.removeEventListener('egg-clicked', startAutoCheck._onEggClicked)
        startAutoCheck._onEggClicked = null
      }
      if (startAutoCheck._onAvatarUpdated) {
        window.removeEventListener('avatar-updated', startAutoCheck._onAvatarUpdated)
        startAutoCheck._onAvatarUpdated = null
      }
      if (startAutoCheck._onNameChanged) {
        window.removeEventListener('name-changed', startAutoCheck._onNameChanged)
        startAutoCheck._onNameChanged = null
      }
      if (startAutoCheck._onChickenUpgraded) {
        window.removeEventListener('chicken-upgraded', startAutoCheck._onChickenUpgraded)
        startAutoCheck._onChickenUpgraded = null
      }
      if (startAutoCheck._onAuthLogin) {
        window.removeEventListener('auth-login', startAutoCheck._onAuthLogin)
        startAutoCheck._onAuthLogin = null
      }
      if (startAutoCheck._onAuthLogout) {
        window.removeEventListener('auth-logout', startAutoCheck._onAuthLogout)
        startAutoCheck._onAuthLogout = null
      }
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
    getProgressWidth,

    // Rechargement des données de jeu
    fetchGameData
  }
}