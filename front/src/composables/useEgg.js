import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import { useAuth } from './useAuth'

const eggState = ref({
  income: 1,
  maxIncome: 30,
  lastClick: new Date(),
  totalEggs: 0,
  isLoading: false
})

let updateInterval = null
let onTeamUpdated = null
let onAuthLogin = null
let onAuthLogout = null
let onUpgradeBought = null

export function useEgg() {
  const { token } = useAuth()

  const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api/egg`

  // État calculé pour l'affichage - calcul temps réel côté frontend
  const currentGains = computed(() => {
    const now = new Date()
    const lastClick = new Date(eggState.value.lastClick)
    const timeDiff = Math.floor((now - lastClick) / 1000)
    const calculated = Math.min(timeDiff * eggState.value.income, eggState.value.maxIncome)
    return calculated
  })

  const isClickable = computed(() => {
    return eggState.value.income >= 1 && Math.floor(currentGains.value) >= 1
  })

  const progressPercentage = computed(() => {
    return Math.min((Math.floor(currentGains.value) / eggState.value.maxIncome) * 100, 100)
  })

  // Récupérer le statut de l'œuf depuis l'API
  const fetchEggStatus = async () => {
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
        eggState.value = {
          ...eggState.value,
          income: data.income,
          maxIncome: data.maxIncome,
          lastClick: new Date(data.lastClick),
          totalEggs: data.totalEggs
        }
        console.log('Egg status synced with server:', data)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de l\'œuf:', error)
      window.$toast("Erreur")
    }
  }

  // Cliquer sur l'œuf
  const clickEgg = async () => {
    if (!token.value || !isClickable.value || eggState.value.isLoading) return

    eggState.value.isLoading = true

    try {
      const response = await fetch(`${API_BASE}/click`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        eggState.value = {
          ...eggState.value,
          income: data.income ?? eggState.value.income,
          maxIncome: data.maxIncome ?? eggState.value.maxIncome,
          totalEggs: data.totalEggs,
          lastClick: new Date(data.lastClick)
        }
        console.log('Egg clicked successfully:', data)

        // Afficher un message de succès si disponible
        if (window.$toast) {
          //window.$toast(`+${data.eggsGained} œufs collectés !`, 'success')
        }

        // Notifier le système de succès
        try { window.dispatchEvent(new CustomEvent('egg-clicked', { detail: { eggsGained: data.eggsGained } })) } catch (_) {}

        // Retourner la réponse complète (incl. chanceuse)
        return data
      } else {
        const error = await response.json()
        if (window.$toast) {
          window.$toast(error.error || 'Erreur lors du clic', 'error')
        }
        return null
      }
    } catch (error) {
      console.error('Erreur lors du clic sur l\'œuf:', error)
      if (window.$toast) {
        window.$toast('Erreur de connexion', 'error')
      }
      return null
    } finally {
      eggState.value.isLoading = false
    }
  }

  // Démarrer les mises à jour automatiques
  const startUpdates = () => {
    if (updateInterval) return

    // Mise à jour de l'affichage chaque seconde pour le calcul temps réel
    updateInterval = setInterval(() => {
      // Force la réactivité en mettant à jour une référence
      eggState.value = { ...eggState.value }
    }, 1000)

    // Synchronisation avec le serveur toutes les 10 secondes
    const serverSyncInterval = setInterval(() => {
      fetchEggStatus()
    }, 10000)

    // Stocker l'interval de sync pour pouvoir l'arrêter
    if (!eggState.value._serverSyncInterval) {
      eggState.value._serverSyncInterval = serverSyncInterval
    }

    // Écouter les changements d'équipe pour rafraîchir l'income immédiatement
    if (typeof window !== 'undefined' && !onTeamUpdated) {
      onTeamUpdated = async () => {
        try { await fetchEggStatus() } catch (_) {}
      }
      window.addEventListener('team-updated', onTeamUpdated)
    }

    // Écouter les achats d'améliorations pour rafraîchir l'income/maxIncome
    if (typeof window !== 'undefined' && !onUpgradeBought) {
      onUpgradeBought = async () => {
        try { await fetchEggStatus() } catch (_) {}
      }
      window.addEventListener('upgrade-bought', onUpgradeBought)
    }

    // Réagir à la connexion/déconnexion
    if (typeof window !== 'undefined' && !onAuthLogin) {
      onAuthLogin = async () => { try { await fetchEggStatus() } catch (_) {} }
      window.addEventListener('auth-login', onAuthLogin)
    }
    if (typeof window !== 'undefined' && !onAuthLogout) {
      onAuthLogout = () => {
        eggState.value = {
          income: 1,
          maxIncome: 30,
          lastClick: new Date(),
          totalEggs: 0,
          isLoading: false
        }
      }
      window.addEventListener('auth-logout', onAuthLogout)
    }
  }

  // Arrêter les mises à jour automatiques
  const stopUpdates = () => {
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
    
    if (eggState.value._serverSyncInterval) {
      clearInterval(eggState.value._serverSyncInterval)
      eggState.value._serverSyncInterval = null
    }
    
    if (typeof window !== 'undefined' && onTeamUpdated) {
      window.removeEventListener('team-updated', onTeamUpdated)
      onTeamUpdated = null
    }
    if (typeof window !== 'undefined' && onUpgradeBought) {
      window.removeEventListener('upgrade-bought', onUpgradeBought)
      onUpgradeBought = null
    }
    if (typeof window !== 'undefined' && onAuthLogin) {
      window.removeEventListener('auth-login', onAuthLogin)
      onAuthLogin = null
    }
    if (typeof window !== 'undefined' && onAuthLogout) {
      window.removeEventListener('auth-logout', onAuthLogout)
      onAuthLogout = null
    }
  }

  return {
    // État
    eggState: readonly(eggState),
    
    // Propriétés calculées
    currentGains,
    isClickable,
    progressPercentage,
    
    // Méthodes
    fetchEggStatus,
    clickEgg,
    startUpdates,
    stopUpdates
  }
}