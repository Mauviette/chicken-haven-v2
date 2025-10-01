// composables/useSpawnables.js
// Composable pour gérer les objets cliquables qui apparaissent grâce aux talents

import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useGameData } from './useGameData'
import { usePlayer } from './usePlayer'
import { usePoules } from './usePoules'
import { useBuffs } from './useBuffs'
import { apiGet, apiPost } from '@/utils/api'

// État global des objets spawned
const spawnedObjects = ref([])
let pollingInterval = null

export function useSpawnables() {
  const { talents, especies } = useGameData()
  const { team, fetchTeam, eggs, refreshPlayer } = usePlayer()
  const { poules } = usePoules()
  const { fetchBuffs } = useBuffs()

  // Fonction pour vérifier les nouveaux spawnables depuis le serveur
  const checkForNewSpawnables = async () => {
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
            lifetime: 30000 // 30 secondes de durée de vie
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
    }
    return null
  }

  // Nettoyer les objets expirés
  const cleanupExpiredObjects = () => {
    const now = Date.now()
    spawnedObjects.value = spawnedObjects.value.filter(obj => {
      return (now - obj.timestamp) < obj.lifetime
    })
  }

  // Démarrer le polling
  const startPolling = () => {
    if (pollingInterval) return

    // Vérification immédiate
    checkForNewSpawnables()
    
    // Polling toutes les 3 secondes
    pollingInterval = setInterval(() => {
      checkForNewSpawnables()
      cleanupExpiredObjects()
    }, 3000)
  }

  // Arrêter le polling
  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  // Computed pour les objets actifs
  const activeSpawnables = computed(() => {
    return spawnedObjects.value
  })

  // Lifecycle
  onMounted(() => {
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    activeSpawnables,
    clickObject,
    startPolling,
    stopPolling
  }
}