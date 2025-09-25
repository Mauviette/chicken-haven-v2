// composables/useDataSync.js
// Hook pour synchroniser automatiquement les données au démarrage de l'application

import { ref, onMounted, onUnmounted } from 'vue'
import { useGameData } from './useGameData.js'

const syncStatus = ref('idle') // 'idle', 'syncing', 'success', 'error'
const lastSyncTime = ref(null)

export function useDataSync() {
  const { fetchGameData, checkDataVersion } = useGameData()
  let syncInterval = null

  // Synchronisation initiale
  async function initialSync() {
    syncStatus.value = 'syncing'
    try {
      await fetchGameData(true) // Force refresh
      syncStatus.value = 'success'
      lastSyncTime.value = new Date()
      console.log('✅ Synchronisation initiale terminée')
      
      // Démarrer la vérification périodique
      startPeriodicCheck()
    } catch (error) {
      syncStatus.value = 'error'
      console.error('❌ Erreur lors de la synchronisation initiale:', error)
    }
  }

  // Vérification périodique des mises à jour (toutes les 30 secondes)
  function startPeriodicCheck() {
    syncInterval = setInterval(async () => {
      try {
        const wasUpdated = await checkDataVersion()
        if (wasUpdated) {
          lastSyncTime.value = new Date()
          console.log('🔄 Données mises à jour automatiquement')
        }
      } catch (error) {
        console.error('Erreur lors de la vérification périodique:', error)
      }
    }, 30000) // 30 secondes
  }

  // Synchronisation manuelle
  async function syncNow() {
    syncStatus.value = 'syncing'
    try {
      await fetchGameData(true)
      syncStatus.value = 'success'
      lastSyncTime.value = new Date()
      return true
    } catch (error) {
      syncStatus.value = 'error'
      throw error
    }
  }

  // Nettoyage
  function cleanup() {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  }

  onMounted(initialSync)
  onUnmounted(cleanup)

  return {
    syncStatus,
    lastSyncTime,
    syncNow,
    cleanup
  }
}

// Fonction utilitaire pour initialiser la synchronisation globalement
export function initializeDataSync() {
  return useDataSync()
}