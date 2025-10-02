// composables/useToast.js
// Composable pour utiliser le système de toast depuis n'importe où

import { ref } from 'vue'

// Instance globale du ToastManager
const toastManagerInstance = ref(null)

export function useToast() {
  // Fonction pour enregistrer l'instance du ToastManager
  const setToastManager = (instance) => {
    toastManagerInstance.value = instance
  }

  // Fonction pour afficher un toast
  const showToast = (message, type = 'info', duration = 5000) => {
    if (toastManagerInstance.value?.showToast) {
      toastManagerInstance.value.showToast(message, type, duration)
    } else {
      console.warn('Toast manager not ready:', message)
    }
  }

  return {
    showToast,
    setToastManager
  }
}