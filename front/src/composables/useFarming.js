import { ref, computed } from 'vue'
import { apiGet, apiPost } from '@/utils/api'

// État réactif global
const farmLevel = ref(1)
const seeds = ref({ potato: 0, carrot: 0, corn: 0 })
const vegetables = ref({ potato: 0, carrot: 0, corn: 0 })
const unlockedSlots = ref([0])
const plantations = ref([])
const strangeRoots = ref(0)
const weather = ref(null)
const loading = ref(false)
const error = ref(null)

export function useFarming() {
  /**
   * Récupère l'état complet de la ferme depuis le serveur
   */
  async function fetchState() {
    loading.value = true
    error.value = null
    try {
      const data = await apiGet('/api/farming/state')
      farmLevel.value = data.level || 1
      seeds.value = data.seeds || { potato: 0, carrot: 0, corn: 0 }
      vegetables.value = data.vegetables || { potato: 0, carrot: 0, corn: 0 }
      unlockedSlots.value = data.unlockedSlots || [0]
      plantations.value = data.plantations || []
      strangeRoots.value = data.strangeRoots || 0
      weather.value = data.weather || null
      return data
    } catch (err) {
      console.error('[useFarming] fetchState error:', err)
      error.value = err.message || 'Erreur lors du chargement de la ferme'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère uniquement la météo (peut être appelé plus fréquemment)
   */
  async function fetchWeather() {
    try {
      const data = await apiGet('/api/farming/weather')
      weather.value = data
      return data
    } catch (err) {
      console.error('[useFarming] fetchWeather error:', err)
      throw err
    }
  }

  /**
   * Achète des graines avec des racines bizarres
   */
  async function buySeeds(vegetableType) {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/buy-seeds', { vegetableType })
      seeds.value = data.seeds
      strangeRoots.value = data.strangeRoots
      return data
    } catch (err) {
      console.error('[useFarming] buySeeds error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur lors de l\'achat'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Plante une graine sur une case
   */
  async function plantSeed(slotIndex, vegetableType) {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/plant', { slotIndex, vegetableType })
      seeds.value = data.seeds
      // Ajouter la nouvelle plantation à la liste
      if (data.plantation) {
        plantations.value.push(data.plantation)
      }
      return data
    } catch (err) {
      console.error('[useFarming] plantSeed error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur lors de la plantation'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Démarre la récolte d'une plante (renvoie les infos du mini-jeu)
   */
  async function startHarvest(slotIndex) {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/harvest', { slotIndex })
      return data
    } catch (err) {
      console.error('[useFarming] startHarvest error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur lors de la récolte'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Termine la récolte après le mini-jeu
   */
  async function completeHarvest(slotIndex, reward) {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/complete-harvest', { slotIndex, reward })
      vegetables.value = data.vegetables
      // Supprimer la plantation de la liste locale
      plantations.value = plantations.value.filter(p => p.slotIndex !== slotIndex)
      return data
    } catch (err) {
      console.error('[useFarming] completeHarvest error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur lors de la finalisation'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Débloque une nouvelle case
   */
  async function unlockSlot(slotIndex) {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/unlock-slot', { slotIndex })
      unlockedSlots.value = data.unlockedSlots
      return data
    } catch (err) {
      console.error('[useFarming] unlockSlot error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur lors du déblocage'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère la plantation sur une case donnée
   */
  function getPlantation(slotIndex) {
    return plantations.value.find(p => p.slotIndex === slotIndex) || null
  }

  /**
   * Vérifie si une case est débloquée
   */
  function isSlotUnlocked(slotIndex) {
    return unlockedSlots.value.includes(slotIndex)
  }

  /**
   * Vérifie si une case a une plante prête à récolter
   */
  function isPlantReady(slotIndex) {
    const plantation = getPlantation(slotIndex)
    if (!plantation) return false
    return new Date(plantation.readyAt) <= new Date()
  }

  // Computed pour le total de graines
  const totalSeeds = computed(() => {
    return (seeds.value.potato || 0) + (seeds.value.carrot || 0) + (seeds.value.corn || 0)
  })

  // Computed pour le total de légumes
  const totalVegetables = computed(() => {
    return (vegetables.value.potato || 0) + (vegetables.value.carrot || 0) + (vegetables.value.corn || 0)
  })

  return {
    // État
    farmLevel,
    seeds,
    vegetables,
    unlockedSlots,
    plantations,
    strangeRoots,
    weather,
    loading,
    error,
    
    // Computed
    totalSeeds,
    totalVegetables,
    
    // Actions
    fetchState,
    fetchWeather,
    buySeeds,
    plantSeed,
    startHarvest,
    completeHarvest,
    unlockSlot,
    
    // Helpers
    getPlantation,
    isSlotUnlocked,
    isPlantReady
  }
}
