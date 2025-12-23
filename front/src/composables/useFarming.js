import { ref, computed } from 'vue'
import { apiGet, apiPost } from '@/utils/api'

// État réactif global
const farmLevel = ref(1)
const farmXp = ref(0)
const farmXpRequired = ref(15)
const potathune = ref(0)
const wateringCans = ref(0)
const inventoryLimit = ref(10)
const seeds = ref({ potato: 0, carrot: 0, corn: 0, tomato: 0, lettuce: 0, pumpkin: 0 })
const vegetables = ref({ potato: 0, carrot: 0, corn: 0, tomato: 0, lettuce: 0, pumpkin: 0 })
const unlockedSlots = ref([0])
const plantations = ref([])
const strangeRoots = ref(0)
const ancientUrns = ref(0)
const weather = ref(null)
const activeRequests = ref([])
const nextRequestAt = ref(null)
const nextInventoryUpgrade = ref(null)
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
      farmXp.value = data.xp || 0
      farmXpRequired.value = data.xpRequired || 15
      potathune.value = data.potathune || 0
      wateringCans.value = data.wateringCans || 0
      inventoryLimit.value = data.inventoryLimit || 10
      seeds.value = data.seeds || { potato: 0, carrot: 0, corn: 0, tomato: 0, lettuce: 0, pumpkin: 0 }
      vegetables.value = data.vegetables || { potato: 0, carrot: 0, corn: 0, tomato: 0, lettuce: 0, pumpkin: 0 }
      unlockedSlots.value = data.unlockedSlots || [0]
      plantations.value = data.plantations || []
      strangeRoots.value = data.strangeRoots || 0
      ancientUrns.value = data.ancientUrns || 0
      weather.value = data.weather || null
      activeRequests.value = data.activeRequests || []
      nextRequestAt.value = data.nextRequestAt ? new Date(data.nextRequestAt) : null
      nextInventoryUpgrade.value = data.nextInventoryUpgrade || null
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
      // Mettre à jour XP et niveau
      if (data.farmXp !== undefined) farmXp.value = data.farmXp
      if (data.farmLevel !== undefined) farmLevel.value = data.farmLevel
      if (data.farmXpRequired !== undefined) farmXpRequired.value = data.farmXpRequired
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
   * Ouvre le dialogue d'une demande
   */
  async function openRequest(requestId) {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/open-request', { requestId })
      // Mettre à jour la demande dans la liste locale
      const index = activeRequests.value.findIndex(r => r.id === requestId)
      if (index !== -1 && data.request) {
        activeRequests.value[index] = data.request
      }
      // Refetch l'état complet pour garantir que tout est à jour
      // Cela résout les problèmes de synchronisation des données
      await fetchState()
      return data
    } catch (err) {
      console.error('[useFarming] openRequest error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Complète une demande
   */
  async function completeRequest(requestId) {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/complete-request', { requestId })
      // Supprimer la demande de la liste locale
      activeRequests.value = activeRequests.value.filter(r => r.id !== requestId)
      // Mettre à jour les stats
      if (data.farming) {
        vegetables.value = data.farming.vegetables
        potathune.value = data.farming.potathune
        farmXp.value = data.farming.xp
        farmLevel.value = data.farming.level
        farmXpRequired.value = data.farming.xpRequired
      }
      return data
    } catch (err) {
      console.error('[useFarming] completeRequest error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Renvoie/ignore une demande
   */
  async function dismissRequest(requestId) {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/dismiss-request', { requestId })
      // Supprimer la demande de la liste locale
      activeRequests.value = activeRequests.value.filter(r => r.id !== requestId)
      // Mettre à jour le potathune après déduction (2 potathune)
      if (data.farming?.potathune !== undefined) {
        potathune.value = data.farming.potathune
      }
      return data
    } catch (err) {
      console.error('[useFarming] dismissRequest error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Améliore la limite d'inventaire
   */
  async function upgradeInventory() {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/upgrade-inventory', {})
      inventoryLimit.value = data.newLimit
      potathune.value = data.potathune
      nextInventoryUpgrade.value = data.nextUpgrade
      return data
    } catch (err) {
      console.error('[useFarming] upgradeInventory error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Jette des légumes pour libérer de l'espace
   */
  async function discardVegetables(vegetable, quantity) {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/discard-vegetables', { vegetable, quantity })
      vegetables.value = data.vegetables
      return data
    } catch (err) {
      console.error('[useFarming] discardVegetables error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Utilise un engrais sur une plantation pour réduire le temps de croissance de 3h
   */
  async function useWateringCan(slotIndex) {
    loading.value = true
    error.value = null
    try {
      const data = await apiPost('/api/farming/use-watering-can', { slotIndex })
      plantations.value = data.plantations
      wateringCans.value = data.wateringCans
      return data
    } catch (err) {
      console.error('[useFarming] useWateringCan error:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur'
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

  /**
   * Vérifie si le joueur peut compléter une demande
   */
  function canCompleteRequest(request) {
    if (!request || !request.requirements) return false
    // Vérifier que toutes les ressources sont disponibles
    for (const req of request.requirements) {
      const available = vegetables.value[req.vegetable] || 0
      if (available < req.quantity) return false
    }
    // Vérifier le temps minimum (si firstOpenedAt existe)
    if (request.firstOpenedAt && request.canCompleteAt) {
      if (new Date() < new Date(request.canCompleteAt)) return false
    }
    return true
  }

  /**
   * Vérifie si le joueur a des demandes non vues
   */
  function hasUnseenRequests() {
    return activeRequests.value.some(r => !r.seen)
  }

  // Computed pour le total de graines
  const totalSeeds = computed(() => {
    return (seeds.value.potato || 0) + (seeds.value.carrot || 0) + (seeds.value.corn || 0) + (seeds.value.tomato || 0) + (seeds.value.lettuce || 0) + (seeds.value.pumpkin || 0)
  })

  // Computed pour le total de légumes
  const totalVegetables = computed(() => {
    return (vegetables.value.potato || 0) + (vegetables.value.carrot || 0) + (vegetables.value.corn || 0) + (vegetables.value.tomato || 0) + (vegetables.value.lettuce || 0) + (vegetables.value.pumpkin || 0)
  })

  // Computed pour vérifier si l'inventaire est plein
  const isInventoryFull = computed(() => {
    return totalVegetables.value >= inventoryLimit.value
  })

  // Computed pour le nombre de demandes non vues
  const unseenRequestCount = computed(() => {
    return activeRequests.value.filter(r => !r.seen).length
  })

  return {
    // État
    farmLevel,
    farmXp,
    farmXpRequired,
    potathune,
    wateringCans,
    inventoryLimit,
    seeds,
    vegetables,
    unlockedSlots,
    plantations,
    strangeRoots,
    ancientUrns,
    weather,
    activeRequests,
    nextRequestAt,
    nextInventoryUpgrade,
    loading,
    error,
    
    // Computed
    totalSeeds,
    totalVegetables,
    isInventoryFull,
    unseenRequestCount,
    
    // Actions
    fetchState,
    fetchWeather,
    buySeeds,
    plantSeed,
    startHarvest,
    completeHarvest,
    unlockSlot,
    openRequest,
    completeRequest,
    dismissRequest,
    upgradeInventory,
    discardVegetables,
    useWateringCan,
    
    // Helpers
    getPlantation,
    isSlotUnlocked,
    isPlantReady,
    canCompleteRequest,
    hasUnseenRequests
  }
}
