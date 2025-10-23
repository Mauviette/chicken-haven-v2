// composables/useBoxes.js
import { ref } from 'vue'
import { apiGet, apiPost } from '@/utils/api'

export function useBoxes() {
  const loading = ref(false)
  const error = ref(null)

  // Récupérer les boîtes disponibles
  async function getAvailableBoxes() {
    loading.value = true
    error.value = null

    try {
      const boxes = await apiGet('/api/boxes')
      return boxes
    } catch (err) {
      error.value = err.message
      console.error('Erreur getAvailableBoxes:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Ouvrir une boîte
  async function openBox(boxId) {
    loading.value = true
    error.value = null

    try {
      const result = await apiPost(`/api/boxes/${boxId}/open`)
      return result
    } catch (err) {
      error.value = err.message
      console.error('Erreur openBox:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getAvailableBoxes,
    openBox
  }
}