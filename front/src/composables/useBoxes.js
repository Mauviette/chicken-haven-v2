// composables/useBoxes.js
import { ref } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export function useBoxes() {
  const loading = ref(false)
  const error = ref(null)

  // Récupérer les boîtes disponibles
  async function getAvailableBoxes() {
    loading.value = true
    error.value = null

    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Token manquant')

      const response = await fetch(`${API_BASE_URL}/api/boxes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la récupération des boîtes')
      }

      const boxes = await response.json()
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
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Token manquant')

      const response = await fetch(`${API_BASE_URL}/api/boxes/${boxId}/open`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de l\'ouverture de la boîte')
      }

      const result = await response.json()
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