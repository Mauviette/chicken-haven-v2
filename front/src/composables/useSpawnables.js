import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuth } from './useAuth'
import { useGameData } from './useGameData'
import { usePlayer } from './usePlayer'
import { usePoules } from './usePoules'
import { useBuffs } from './useBuffs'
import { useToast } from './useToast'
import { apiGet, apiPost } from '@/utils/api'

const spawnedObjects = ref([])
let pollingInterval = null
const POLLING_INTERVAL = 500
const SPAWNABLE_LIFETIME = 15000

export function useSpawnables() {
  const { isLoggedIn } = useAuth()
  const { talents, especies } = useGameData()
  const { team, fetchTeam, eggs, refreshPlayer } = usePlayer()
  const { poules } = usePoules()
  const { fetchBuffs } = useBuffs()
  const { showToast } = useToast()

  const checkForNewSpawnables = async () => {
    if (!isLoggedIn()) return
    
    try {
      const response = await apiGet('/api/spawnables/check')
      const { spawnables } = response

      if (spawnables && spawnables.length > 0) {
        for (const spawnable of spawnables) {
          const existingIndex = spawnedObjects.value.findIndex(obj => obj.spawnerId === spawnable.spawnerId)
          
          if (existingIndex === -1) {
            const newSpawnable = {
              ...spawnable,
              x: Math.random() * 80 + 10,
              y: Math.random() * 60 + 20,
              rotation: Math.random() * 360,
              timestamp: Date.now(),
              lifetime: SPAWNABLE_LIFETIME
            }
            
            spawnedObjects.value.push(newSpawnable)
          }
        }
      }
    } catch (error) {
      // Ignorer silencieusement les erreurs d'auth/autorisation
      if (!error.message.includes('Authentication required') && !error.message.includes('Access forbidden') && !error.message.includes('Non authentifié')) {
        console.error('Erreur lors de la vérification des spawnables:', error)
      }
    }
  }

  const clickObject = async (spawnable) => {
    try {
      const response = await apiPost('/api/spawnables/click', {
        spawnerId: spawnable.spawnerId,
        objectId: spawnable.id,
        talentName: spawnable.talentName,
        especeId: spawnable.especeId
      })

      if (response.success) {
        const index = spawnedObjects.value.findIndex(obj => obj.spawnerId === spawnable.spawnerId)
        if (index !== -1) {
          spawnedObjects.value.splice(index, 1)
        }
        
        if (response.reward && response.reward.type === 'resource' && response.reward.resource === 'eggs') {
          eggs.value += response.reward.amount
        }
        
        if (response.reward && response.reward.type === 'buff') {
          await fetchBuffs()
        }
        
        await refreshPlayer()
        
        return response.reward
      }
    } catch (error) {
      console.error('Erreur lors du clic sur spawnable:', error)
      
      if (error.message && error.message.includes('400')) {
        if (error.message.includes('expiré') || error.message.includes('collecté') || error.message.includes('existe pas')) {
          showToast('Cet objet a déjà disparu !', 'warning', 3000)
          const index = spawnedObjects.value.findIndex(obj => obj.spawnerId === spawnable.spawnerId)
          if (index !== -1) {
            spawnedObjects.value.splice(index, 1)
          }
        } else {
          showToast("Erreur lors de la récupération de l'objet", 'error')
        }
      } else {
        showToast("Une erreur inattendue s'est produite", 'error')
      }
    }
    return null
  }

  const cleanupExpiredObjects = () => {
    const now = Date.now()
    spawnedObjects.value = spawnedObjects.value.filter(obj => {
      const age = now - obj.timestamp
      return age < obj.lifetime
    })
  }

  const startPolling = () => {
    if (pollingInterval || !isLoggedIn()) return

    checkForNewSpawnables()
    
    pollingInterval = setInterval(() => {
      checkForNewSpawnables()
      cleanupExpiredObjects()
    }, POLLING_INTERVAL)
  }

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  const activeSpawnables = computed(() => {
    const now = Date.now()
    return spawnedObjects.value.filter(obj => {
      const age = now - obj.timestamp
      return age < obj.lifetime
    })
  })

  onMounted(() => {
    startPolling()
    try {
      window.addEventListener('auth-login', startPolling)
      window.addEventListener('auth-logout', stopPolling)
    } catch (_) {}
  })

  onUnmounted(() => {
    stopPolling()
    try {
      window.removeEventListener('auth-login', startPolling)
      window.removeEventListener('auth-logout', stopPolling)
    } catch (_) {}
  })

  return {
    activeSpawnables,
    clickObject,
    startPolling,
    stopPolling
  }
}