import { ref } from 'vue'
import { useSettings } from './useSettings'
import { usePlayer } from './usePlayer'
import { usePoules } from './usePoules'

const token = ref(localStorage.getItem('token'))

export function useAuth() {
  const isLoggedIn = () => !!token.value

  const login = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    useSettings().fetchSettings()
    // Rafraîchir les données clés à la connexion
    try {
      const { refreshPlayer, fetchTeam } = usePlayer()
      refreshPlayer()
      fetchTeam()
    } catch (_) {}
    try {
      const { fetchPoules } = usePoules()
      fetchPoules()
    } catch (_) {}
    // Événement global pour que d'autres composables réagissent
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-login'))
    }
  }

  const logout = () => {
    console.log('🚨 Logout initiated')
    
    // Nettoyer le token immédiatement
    token.value = null
    localStorage.removeItem('token')
    
    if (typeof window !== 'undefined') {
      // Émettre événement de déconnexion
      window.dispatchEvent(new CustomEvent('auth-logout'))
      
      // Nettoyer les données en cache
      try {
        delete window.__gameDataCache
        delete window.__marketHasAvailableUpgrade
      } catch (_) {}
    }
    
    console.log('✅ Logout completed')
  }


  return {
    token,
    isLoggedIn,
    login,
    logout
  }
}
