import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import { useAuth } from './useAuth'
import { apiGet, apiPost } from '@/utils/api'

const eggState = ref({
  income: 1,
  maxIncome: 30,
  currentStocked: 0,
  lastClick: new Date(),
  totalEggs: 0,
  isLoading: false,
  cooldowns: {}
})

let updateInterval = null
let serverSyncInterval = null
let onTeamUpdated = null
let onAuthLogin = null
let onAuthLogout = null
let onUpgradeBought = null
let onVisibilityChange = null

export function useEgg() {
  const { token } = useAuth()

  const API_BASE = `/api/egg`

  // État calculé pour l'affichage - utiliser serveur quand disponible
  const currentGains = computed(() => {
    // Si on a une valeur du serveur récente, l'utiliser
    if (eggState.value.currentStocked !== undefined) {
      return eggState.value.currentStocked
    }
    // Sinon calcul local en fallback
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
    return Math.min((Math.round(currentGains.value) / eggState.value.maxIncome) * 100, 100)
  })

  // Récupérer le statut de l'œuf depuis l'API
  const fetchEggStatus = async () => {
    if (!token.value) return

    try {
      const data = await apiGet(`${API_BASE}/status`)
      if (data) {
        eggState.value = {
          ...eggState.value,
          income: data.income,
          maxIncome: data.maxIncome,
          currentStocked: data.currentStocked,
          lastClick: new Date(data.lastClick),
          totalEggs: data.totalEggs,
          cooldowns: data.cooldowns || {}
        }
        // sync ok
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
      const data = await apiPost(`${API_BASE}/click`)
      if (data) {
        eggState.value = {
          ...eggState.value,
          income: data.income ?? eggState.value.income,
          maxIncome: data.maxIncome ?? eggState.value.maxIncome,
          currentStocked: data.currentStocked ?? 0,
          totalEggs: data.totalEggs,
          lastClick: new Date(data.lastClick)
        }
        // click ok

        // Afficher un message de succès si disponible
        if (window.$toast) {
          //window.$toast(`+${data.eggsGained} œufs collectés !`, 'success')
        }

        // Notifier le système de succès
        try { window.dispatchEvent(new CustomEvent('egg-clicked', { detail: { eggsGained: data.eggsGained } })) } catch (_) {}

        // Retourner la réponse complète (incl. chanceuse)
        return data
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

    // Fonction utilitaire pour planifier la sync serveur
    const scheduleServerSync = (ms) => {
      if (serverSyncInterval) clearInterval(serverSyncInterval)
      serverSyncInterval = setInterval(() => { fetchEggStatus() }, ms)
      eggState.value._serverSyncInterval = serverSyncInterval
    }
    // Première synchronisation immédiate
    fetchEggStatus().catch(() => {})
    // Intervalle adaptatif selon visibilité (1s visible, 5s caché)
    const initialMs = (typeof document !== 'undefined' && document.hidden) ? 5000 : 1000
    scheduleServerSync(initialMs)

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

    // Adapter la fréquence à la visibilité de l'onglet
    if (typeof document !== 'undefined' && !onVisibilityChange) {
      onVisibilityChange = () => {
        const ms = document.hidden ? 5000 : 1000
        if (serverSyncInterval) {
          clearInterval(serverSyncInterval)
          serverSyncInterval = null
        }
        serverSyncInterval = setInterval(() => { fetchEggStatus() }, ms)
        eggState.value._serverSyncInterval = serverSyncInterval
      }
      document.addEventListener('visibilitychange', onVisibilityChange)
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
    if (serverSyncInterval) {
      clearInterval(serverSyncInterval)
      serverSyncInterval = null
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
    if (typeof document !== 'undefined' && onVisibilityChange) {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      onVisibilityChange = null
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