// composables/useSpawnables.js
// Composable pour gérer les objets cliquables qui apparaissent grâce aux talents

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuth } from './useAuth'
import { useGameData } from './useGameData'
import { usePlayer } from './usePlayer'
import { usePoules } from './usePoules'
import { useBuffs } from './useBuffs'
import { useToast } from './useToast'
import { apiGet, apiPost } from '@/utils/api'

// État global des objets spawned
const spawnedObjects = ref([])
let pollingInterval = null

export function useSpawnables() {
  const { isLoggedIn } = useAuth()
  const { talents, especies } = useGameData()
  const { team, fetchTeam, eggs, refreshPlayer } = usePlayer()
  const { poules } = usePoules()
  const { fetchBuffs } = useBuffs()
  const { showToast } = useToast()

  // Fonction pour vérifier les nouveaux spawnables depuis le serveur
  const checkForNewSpawnables = async () => {
    // Ne pas interroger l'API si non connecté
    if (!isLoggedIn()) return
    try {
      const response = await apiGet('/api/spawnables/check')
      const { spawnables } = response

      if (spawnables && spawnables.length > 0) {
        for (const spawnable of spawnables) {
          console.log(`🥚 Un spawnable est apparu: ${spawnable.talentName} (${spawnable.type})`)
          
          // Ajouter le spawnable à la liste avec position et rotation aléatoires
          const newSpawnable = {
            ...spawnable,
            x: Math.random() * 80 + 10, // 10% à 90% de la largeur
            y: Math.random() * 60 + 20, // 20% à 80% de la hauteur
            rotation: Math.random() * 360, // Rotation aléatoire de 0 à 360 degrés
            timestamp: Date.now(),
            lifetime: 15000 // 15 secondes comme côté backend
          }
          
          spawnedObjects.value.push(newSpawnable)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des spawnables:', error)
    }
  }

  // Fonction pour cliquer sur un objet spawnable
  const clickObject = async (spawnable) => {
    try {
      const response = await apiPost('/api/spawnables/click', {
        spawnerId: spawnable.spawnerId,
        objectId: spawnable.id,
        talentName: spawnable.talentName,
        especeId: spawnable.especeId
      })

      if (response.success) {
        // Retirer l'objet de la liste
        const index = spawnedObjects.value.findIndex(obj => obj.id === spawnable.id)
        if (index !== -1) {
          spawnedObjects.value.splice(index, 1)
        }

        console.log('🎯 Spawnable cliqué avec succès:', response.reward)
        
        // Mise à jour immédiate des œufs dans l'interface
        if (response.reward && response.reward.type === 'resource' && response.reward.resource === 'eggs') {
          eggs.value += response.reward.amount
        }
        
        // Si c'est un buff, rafraîchir la liste des buffs
        if (response.reward && response.reward.type === 'buff') {
          console.log('🍫 Buff appliqué, rafraîchissement de la liste des buffs')
          await fetchBuffs()
        }
        
        // Recharger les données du joueur pour mettre à jour les ressources (sécurité)
        await refreshPlayer()
        
        return response.reward
      }
    } catch (error) {
      console.error('Erreur lors du clic sur spawnable:', error)
      
      // Gestion spécifique des erreurs API
      if (error.message && error.message.includes('400')) {
        if (error.message.includes('expiré') || error.message.includes('collecté') || error.message.includes('existe pas')) {
          showToast('Cet objet a déjà disparu !', 'warning', 3000)
          // Retirer l'objet de la liste locale pour éviter les clics futurs
          const index = spawnedObjects.value.findIndex(obj => obj.id === spawnable.id)
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

  // Nettoyer les objets expirés
  const cleanupExpiredObjects = () => {
    const now = Date.now()
    const beforeCount = spawnedObjects.value.length
    spawnedObjects.value = spawnedObjects.value.filter(obj => {
      const age = now - obj.timestamp
      const isExpired = age >= obj.lifetime
      return !isExpired
    })
    const afterCount = spawnedObjects.value.length
    const cleaned = beforeCount - afterCount
    if (cleaned > 0) {
      console.log(`🧹 Nettoyé ${cleaned} spawnable(s) expiré(s)`)
    }
  }

  // Démarrer le polling
  const startPolling = () => {
    if (pollingInterval) return
    if (!isLoggedIn()) return

    // Vérification immédiate
    checkForNewSpawnables()
    
    // Polling toutes les 500ms pour une meilleure réactivité
    pollingInterval = setInterval(() => {
      checkForNewSpawnables()
      cleanupExpiredObjects()
    }, 500)
  }

  // Arrêter le polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  // Computed pour les objets actifs (filtrer les expirés en temps réel)
  const activeSpawnables = computed(() => {
    const now = Date.now()
    return spawnedObjects.value.filter(obj => {
      const age = now - obj.timestamp
      return age < obj.lifetime
    })
  })

  // Lifecycle
  onMounted(() => {
    // Démarrer si déjà connecté
    startPolling()
    // Écouter les changements d'auth pour démarrer/stopper dynamiquement
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