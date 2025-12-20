/**
 * État partagé des poules (singleton)
 */
import { ref } from 'vue'
import { apiGet } from '@/utils/api.js'

// Singleton d'état partagé entre tous les appels à usePoules()
export const rawPoules = ref([])
export const loading = ref(true)

/**
 * Charge les poules depuis le serveur
 */
export async function fetchPoulesSingleton() {
  try {
    // Ne pas appeler l'API si l'utilisateur n'est pas connecté
    const token = localStorage.getItem('token')
    if (!token) {
      rawPoules.value = []
      return
    }
    const data = await apiGet('/api/poules')
    rawPoules.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Erreur chargement poules:', err)
  } finally {
    loading.value = false
  }
}

/**
 * Réinitialise les poules (appelé à la déconnexion)
 */
export function clearPoules() {
  rawPoules.value = []
  loading.value = false
}
