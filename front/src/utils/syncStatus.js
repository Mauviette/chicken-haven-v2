// utils/syncStatus.js
// Utilitaire pour afficher le statut de synchronisation des données

export function showSyncNotification(message, type = 'info') {
  // Si window.$toast est disponible (défini dans App.vue)
  if (window.$toast) {
    window.$toast(message, type)
  }
}

export function logSyncEvent(event, details = {}) {
  const timestamp = new Date().toISOString()
}