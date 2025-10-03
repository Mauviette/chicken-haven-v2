// composables/useAppLoading.js
// Gère l'état de chargement global de l'application

import { ref, computed } from 'vue'

const isLoadingGameData = ref(true)
const isLoadingUserData = ref(true)
const isLoadingSettings = ref(true)

export function useAppLoading() {
  const isAppLoading = computed(() => 
    isLoadingGameData.value || isLoadingUserData.value || isLoadingSettings.value
  )

  function setGameDataLoading(loading) {
    isLoadingGameData.value = loading
  }

  function setUserDataLoading(loading) {
    isLoadingUserData.value = loading
  }

  function setSettingsLoading(loading) {
    isLoadingSettings.value = loading
  }

  return {
    isAppLoading,
    isLoadingGameData,
    isLoadingUserData,
    isLoadingSettings,
    setGameDataLoading,
    setUserDataLoading,
    setSettingsLoading
  }
}