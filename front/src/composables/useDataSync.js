import { useGameData } from './useGameData.js'

export function useDataSync() {
  const gameDataComposable = useGameData()
  
  return {
    syncStatus: gameDataComposable.syncStatus,
    lastSyncTime: gameDataComposable.lastSyncTime,
    syncNow: gameDataComposable.syncNow,
    cleanup: gameDataComposable.stopPeriodicSync
  }
}

export function initializeDataSync() {
  const { initialize } = useGameData()
  return initialize()
}