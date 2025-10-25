import { ref } from 'vue'
import { useSettings } from './useSettings'
import { usePlayer } from './usePlayer'
import { usePoules } from './usePoules'
import { apiGet, apiPatch } from '@/utils/api'

const token = ref(localStorage.getItem('token'))

export function useAuth() {
  const isLoggedIn = () => !!token.value

  const login = async (newToken) => {
    if (!newToken) {
      console.error('Tentative de login avec token invalide:', newToken)
      return
    }
    token.value = newToken
    localStorage.setItem('token', newToken)
    useSettings().fetchSettings()
    // Rafraîchir les données clés à la connexion
    try {
      const { refreshPlayer, fetchTeam } = usePlayer()
      await refreshPlayer()
      fetchTeam()
    } catch (_) {}
    try {
      const { fetchPoules } = usePoules()
      fetchPoules()
    } catch (_) {}

    // Vérifier les mises à jour après le chargement des données utilisateur
    try {
      await checkForUpdates()
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error)
    }

    // Événement global pour que d'autres composables réagissent
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-login'))
    }
  }

  const logout = () => {
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
  }


  const checkForUpdates = async () => {
    try {
      // Récupérer les informations utilisateur actuelles
      const userData = await apiGet('/api/user/me')
      if (!userData) return

      // Importer la version actuelle du jeu
      const { CURRENT_GAME_VERSION } = await import('@/data/sharedGameData.js')

      const currentVersion = userData.lastSeenVersion || '1.0.0'
      const latestVersion = CURRENT_GAME_VERSION

      // Si la version actuelle est plus récente, mettre à jour et afficher le popup
      if (isVersionNewer(latestVersion, currentVersion)) {
        // Mettre à jour la version vue par l'utilisateur
        await apiPatch('/api/user/me', { lastSeenVersion: latestVersion })

        // Récupérer les détails de la dernière annonce
        const announcements = await apiGet('/api/announcements')
        const latestAnnouncement = announcements.find(ann => ann.version === latestVersion)

        if (latestAnnouncement) {
          // Émettre un événement pour afficher le popup de mise à jour
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('show-update-popup', {
              detail: latestAnnouncement
            }))
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error)
    }
  }

  const isVersionNewer = (newVersion, oldVersion) => {
    const newParts = newVersion.split('.').map(Number)
    const oldParts = oldVersion.split('.').map(Number)

    for (let i = 0; i < Math.max(newParts.length, oldParts.length); i++) {
      const newPart = newParts[i] || 0
      const oldPart = oldParts[i] || 0

      if (newPart > oldPart) return true
      if (newPart < oldPart) return false
    }

    return false
  }

  return {
    token,
    isLoggedIn,
    login,
    logout,
    checkForUpdates
  }
}
