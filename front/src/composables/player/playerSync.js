/**
 * Synchronisation des données joueur avec le serveur
 */
import { apiGet } from '@/utils/api.js'
import {
  eggs,
  stockTokens,
  productionTokens,
  wildTokens,
  chestKeys,
  miningTokens,
  preciousStones,
  rottenTomatoes,
  level,
  xp,
  xpRequired,
  player,
  cooldowns,
  clearPlayerData,
  updateResources
} from './playerState.js'

/**
 * Rafraîchit toutes les données du joueur depuis le serveur
 */
export async function refreshPlayer() {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      clearPlayerData()
      return
    }

    // Récupérer le statut des œufs
    const data = await apiGet('/api/egg/status')
    if (data) {
      eggs.value = data.totalEggs || 0
      stockTokens.value = data.stockTokens || 0
      productionTokens.value = data.productionTokens || 0
      wildTokens.value = data.wildTokens || 0
      chestKeys.value = data.chestKeys || 0
      miningTokens.value = data.miningTokens || 0
    }

    // Récupérer les infos utilisateur complètes
    try {
      const u = await apiGet('/api/user/me')
      if (u) {
        // Stocker les informations de base de l'utilisateur
        player.value = {
          profileId: u?.profileId || u?.id || null,
          username: u?.username || null,
          avatar: u?.avatar || null,
          lastSeen: u?.lastSeen || null,
          apocalypse: u?.apocalypse || false,
          email: u?.email || null
        }
        
        // Récupérer les cooldowns
        cooldowns.value = u?.cooldowns || {}
        
        const prevLevel = level.value || 1
        const currentProfileId = u?.profileId || u?.id || null
        const lastProfileId = (typeof window !== 'undefined') ? window.__lastProfileId : undefined
        const newLevel = u?.experience?.level ?? 1
        
        // N'émettre le level-up que si c'est le même utilisateur et niveau supérieur
        const shouldEmitLevelUp = lastProfileId && 
                                 currentProfileId && 
                                 lastProfileId === currentProfileId && 
                                 typeof prevLevel === 'number' && 
                                 newLevel > prevLevel
        
        level.value = newLevel
        xp.value = u?.experience?.points ?? 0
        xpRequired.value = u?.experience?.required_points ?? 2
        
        // Synchroniser les ressources
        if (u?.resources) {
          updateResources(u.resources)
        }
        
        // Émettre l'événement level-up si nécessaire
        try {
          if (typeof window !== 'undefined') {
            if (shouldEmitLevelUp) {
              window.dispatchEvent(new CustomEvent('level-up', { detail: { from: prevLevel, to: newLevel } }))
            }
            window.__lastProfileId = currentProfileId || null
          }
        } catch (_) {}
      }
    } catch (_) {}
  } catch (error) {
    console.error('Erreur lors de la récupération des données du joueur:', error)
  }
}

/**
 * Configure les écouteurs d'événements globaux
 * @returns {Function} - Fonction de nettoyage
 */
export function setupEventListeners() {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleLogout = () => {
    clearPlayerData()
  }
  
  const handleMiningGameOver = (event) => {
    const resources = event.detail?.resources
    if (resources) {
      updateResources(resources)
    }
  }
  
  window.addEventListener('auth-logout', handleLogout)
  window.addEventListener('mining-game-over', handleMiningGameOver)
  
  return () => {
    window.removeEventListener('auth-logout', handleLogout)
    window.removeEventListener('mining-game-over', handleMiningGameOver)
  }
}
