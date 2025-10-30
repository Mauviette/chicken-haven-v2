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
      // Déclencher la vérification automatique des quêtes après ouverture de boîte
      window.dispatchEvent(new CustomEvent('quest-action'))
      return result
    } catch (err) {
      error.value = err.message
      console.error('Erreur openBox:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Ouvrir plusieurs boîtes à la fois
  async function openBoxMultiple(boxId, count) {
    loading.value = true
    error.value = null

    try {
      const result = await apiPost(`/api/boxes/${boxId}/open-multiple`, { count })
      // Déclencher la vérification automatique des quêtes après ouverture de boîtes
      window.dispatchEvent(new CustomEvent('quest-action'))
      return result
    } catch (err) {
      error.value = err.message
      console.error('Erreur openBoxMultiple:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getAvailableBoxes,
    openBox,
    openBoxMultiple
  }
}