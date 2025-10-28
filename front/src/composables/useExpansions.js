import { ref, computed } from 'vue'
import { useGameData } from './useGameData'
import { usePlayer } from './usePlayer'
import { apiGet, apiPost } from '@/utils/api.js'

const expansionLevels = ref({})
const loading = ref(false)

export function useExpansions() {
  const { expansions: expansionsData } = useGameData()
  const { refreshPlayerData, apocalypse } = usePlayer()

  const fetchExpansionLevels = async () => {
    try {
      loading.value = true
      const result = await apiGet('/api/expansions')
      if (result.success) {
        expansionLevels.value = result.expansions || {}
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des expansions:', error)
    } finally {
      loading.value = false
    }
  }

  const buyExpansion = async (expansionId) => {
    try {
      loading.value = true
      const result = await apiPost('/api/expansions/buy', { expansionId })
      if (result.success) {
        expansionLevels.value = result.expansions || {}
        await refreshPlayerData()
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Erreur lors de l\'achat d\'expansion:', error)
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const getExpansionLevel = (expansionId) => {
    return expansionLevels.value[expansionId] || 0
  }

  const getNextExpansionLevel = (expansionId) => {
    const currentLevel = getExpansionLevel(expansionId)
    return currentLevel + 1
  }

  const canUpgradeExpansion = (expansionId) => {
    const expansion = expansionsData.value.find(e => e.id === expansionId)
    if (!expansion) return false

    const nextLevel = getNextExpansionLevel(expansionId)
    return nextLevel <= expansion.costs.length
  }

  const getExpansionCost = (expansionId) => {
    const expansion = expansionsData.value.find(e => e.id === expansionId)
    if (!expansion) return null

    const nextLevel = getNextExpansionLevel(expansionId)
    const costIndex = nextLevel - 1

    if (costIndex < 0 || costIndex >= expansion.costs.length) return null

    const baseCost = expansion.costs[costIndex]
    
    // Mode Apocalypse : multiplier les prix par 2
    if (apocalypse.value) {
      return baseCost.map(cost => ({
        ...cost,
        count: Math.floor(cost.count * 2)
      }))
    }

    return baseCost
  }

  const getExpansionReward = (expansionId) => {
    const expansion = expansionsData.value.find(e => e.id === expansionId)
    if (!expansion) return null

    const nextLevel = getNextExpansionLevel(expansionId)
    const rewardIndex = nextLevel - 1

    if (rewardIndex < 0 || rewardIndex >= expansion.rewards.length) return null

    return expansion.rewards[rewardIndex]
  }

  const getAvailableExpansions = () => {
    return expansionsData.value.filter(expansion => canUpgradeExpansion(expansion.id))
  }

  const getExpansionsByCategory = (category) => {
    return expansionsData.value.filter(expansion => expansion.category === category)
  }

  const getAvailableExpansionsByCategory = (category) => {
    return getAvailableExpansions().filter(expansion => expansion.category === category)
  }

  return {
    expansionLevels: computed(() => expansionLevels.value),
    loading: computed(() => loading.value),
    fetchExpansionLevels,
    buyExpansion,
    getExpansionLevel,
    getNextExpansionLevel,
    canUpgradeExpansion,
    getExpansionCost,
    getExpansionReward,
    getAvailableExpansions,
    getExpansionsByCategory,
    getAvailableExpansionsByCategory
  }
}