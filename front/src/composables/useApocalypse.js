import { ref, computed, onMounted, provide, inject, getCurrentInstance } from 'vue'
import { apiGet } from '@/utils/api'

const APOCALYPSE_KEY = Symbol('apocalypse')

const apocalypseState = ref(false)
const isInitialized = ref(false)

export function useApocalypse() {
  // Computed pour l'état apocalypse
  const isApocalypseMode = computed(() => apocalypseState.value)

  // Fonction pour synchroniser l'état apocalypse depuis le serveur
  async function syncApocalypseState() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        apocalypseState.value = false
        isInitialized.value = true
        return
      }

      const me = await apiGet('/api/user/me')
      apocalypseState.value = Boolean(me?.apocalypse || false)
      isInitialized.value = true
    } catch (error) {
      console.warn('Erreur lors de la synchronisation de l\'état apocalypse:', error)
      apocalypseState.value = false
      isInitialized.value = true
    }
  }

  // Fonction pour réinitialiser l'état (déconnexion)
  function resetApocalypseState() {
    apocalypseState.value = false
    isInitialized.value = false
  }

  // Initialisation automatique seulement si pas déjà fourni
  const instance = getCurrentInstance()
  if (instance) {
    onMounted(() => {
      if (!isInitialized.value) {
        syncApocalypseState()
      }

      // Écouter les événements d'authentification
      const handleLogin = () => {
        // Re-synchroniser après connexion
        syncApocalypseState()
      }

      const handleLogout = () => {
        // Réinitialiser après déconnexion
        resetApocalypseState()
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('auth-login', handleLogin)
        window.addEventListener('auth-logout', handleLogout)
      }
    })
  }

  return {
    isApocalypseMode,
    syncApocalypseState,
    resetApocalypseState,
    isInitialized: computed(() => isInitialized.value)
  }
}

// Fonction pour fournir l'état apocalypse (à utiliser dans App.vue)
export function provideApocalypse() {
  const apocalypseComposable = useApocalypse()
  
  provide(APOCALYPSE_KEY, {
    isApocalypseMode: apocalypseComposable.isApocalypseMode,
    syncApocalypseState: apocalypseComposable.syncApocalypseState,
    resetApocalypseState: apocalypseComposable.resetApocalypseState
  })
  
  return apocalypseComposable
}

// Fonction pour injecter l'état apocalypse (à utiliser dans les composants enfants)
export function injectApocalypse() {
  const apocalypseData = inject(APOCALYPSE_KEY)
  if (!apocalypseData) {
    // Fallback si pas fourni (pour compatibilité)
    return useApocalypse()
  }
  return apocalypseData
}