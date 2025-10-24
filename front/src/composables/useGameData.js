import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiGet } from '@/utils/api.js'
import { useAuth } from './useAuth'

const gameData = ref(null)
const dataVersion = ref(null)
const lastUpdated = ref(null)
const loading = ref(true)
const error = ref(null)
const syncStatus = ref('idle')
const lastSyncTime = ref(null)

let cachedData = null
let cacheTimestamp = null
let syncInterval = null
const CACHE_DURATION = 5 * 60 * 1000
const SYNC_INTERVAL = 30000

export function useGameData() {
  const { isLoggedIn } = useAuth()

  async function fetchGameData(forceRefresh = false) {
    try {
      const now = Date.now()
      if (!forceRefresh && cachedData && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
        gameData.value = cachedData
        loading.value = false
        return cachedData
      }

      loading.value = true
      syncStatus.value = 'syncing'
      error.value = null

      const result = await apiGet('/api/game-data')
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des données')
      }

      gameData.value = result.data
      dataVersion.value = result.data.version
      lastUpdated.value = result.data.lastUpdated
      syncStatus.value = 'success'
      lastSyncTime.value = new Date()

      try { 
        if (typeof window !== 'undefined') window.__gameDataCache = result.data 
      } catch (_) {}
      
      cachedData = result.data
      cacheTimestamp = now
      
      return result.data
    } catch (err) {
      console.error('Erreur lors de la synchronisation des données:', err)
      error.value = err.message
      syncStatus.value = 'error'
      
      if (cachedData) {
        gameData.value = cachedData
      }
      
      throw err
    } finally {
      loading.value = false
    }
  }

  async function checkDataVersion() {
    try {
      if (!isLoggedIn()) return false
      const result = await apiGet('/api/game-data/version')
      
      if (dataVersion.value && dataVersion.value !== result.version) {
        await fetchGameData(true)
        return true
      }
      
      return false
    } catch (err) {
      console.error('Erreur lors de la vérification de version:', err)
      return false
    }
  }

  function startPeriodicSync() {
    if (syncInterval) return
    
    syncInterval = setInterval(async () => {
      try {
        const wasUpdated = await checkDataVersion()
        if (wasUpdated) {
          lastSyncTime.value = new Date()
        }
      } catch (error) {
        console.error('Erreur lors de la vérification périodique:', error)
      }
    }, SYNC_INTERVAL)
  }

  function stopPeriodicSync() {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  }

  async function syncNow() {
    try {
      await fetchGameData(true)
      return true
    } catch (error) {
      throw error
    }
  }

  async function initialize() {
    try {
      await fetchGameData()
      startPeriodicSync()
      
      try {
        const { useAppLoading } = await import('./useAppLoading')
        const { setGameDataLoading } = useAppLoading()
        setGameDataLoading(false)
      } catch (_) {}
    } catch (err) {
      console.error('Erreur lors de l\'initialisation des données de jeu:', err)
      
      try {
        const { useAppLoading } = await import('./useAppLoading')
        const { setGameDataLoading } = useAppLoading()
        setGameDataLoading(false)
      } catch (_) {}
    }
  }

  const especies = computed(() => gameData.value?.especies || {})
  const talents = computed(() => gameData.value?.talents || {})
  const boxes = computed(() => gameData.value?.boxes || [])
  const upgrades = computed(() => gameData.value?.upgrades || [])
  const talentLevelUpgradeCost = computed(() => gameData.value?.talentLevelUpgradeCost || {})
  const levelUnlocks = computed(() => gameData.value?.levelUnlocks || {})
  const achievements = computed(() => gameData.value?.achievements || {})
  const items = computed(() => gameData.value?.items || {})
  const categories = computed(() => gameData.value?.categories || {})
  const groupes = computed(() => gameData.value?.groupes || [])
  const levelRewards = computed(() => gameData.value?.levelRewards || {})
  const artifacts = computed(() => gameData.value?.artifacts || {})

  // Fonctions utilitaires
  function getEspeceInfo(especeId) {
    return especies.value[especeId] || null
  }

  function getTalentInfo(talentName) {
    return talents.value[talentName] || { description: '???', effet: () => '', maxNiveau: 1 }
  }

  function getBoxInfo(boxId) {
    return boxes.value.find(box => box.id === boxId) || null
  }

  function getAchievementInfo(achievementId) {
    return achievements.value[achievementId] || null
  }

  function getItemInfo(itemId) {
    return items.value[itemId] || null
  }

  function formatPrice(price) {
    if (typeof price === 'number') {
      const itemData = items.value['eggs']
      return itemData ? `${price} ${price === 1 ? itemData.nom_singulier : itemData.nom}` : `${price} œufs`
    }
    
    if (typeof price === 'object' && price.type && price.count) {
      const itemData = items.value[price.type]
      if (itemData) {
        return `${price.count} ${price.count === 1 ? itemData.nom_singulier : itemData.nom}`
      }
    }
    
    return 'Prix invalide'
  }

  function getResourceIcon(resourceType) {
    const itemData = items.value[resourceType]
    return itemData ? itemData.icon : '❓'
  }

  function formatString(type, count) {
    const itemData = items.value[type]
    if (!itemData || typeof count !== 'number') return 'Valeur invalide'
    return `${count} ${count === 1 ? itemData.nom_singulier : itemData.nom}`
  }

  function getLevelRewardsBetween(from, to) {
    const rewards = {}
    for (let lvl = Math.max(1, from + 1); lvl <= to; lvl++) {
      const arr = levelRewards.value[lvl] || []
      for (const r of arr) {
        rewards[r.type] = (rewards[r.type] || 0) + (r.count || 0)
      }
    }
    return Object.entries(rewards).map(([type, count]) => ({
      type,
      count,
      icon: getResourceIcon(type),
      label: formatString(type, count)
    }))
  }

  function getUnlocksBetween(from, to) {
    const unlocked = []
    for (let lvl = Math.max(1, from + 1); lvl <= to; lvl++) {
      if (levelUnlocks.value[lvl]) unlocked.push(...levelUnlocks.value[lvl])
    }
    return unlocked
  }

  onMounted(initialize)
  onUnmounted(stopPeriodicSync)

  return {
    gameData,
    dataVersion,
    lastUpdated,
    loading,
    error,
    syncStatus,
    lastSyncTime,
    
    especies,
    talents,
    boxes,
    upgrades,
    talentLevelUpgradeCost,
    achievements,
    items,
    categories,
    groupes,
    levelUnlocks,
    levelRewards,
    artifacts,
    
    fetchGameData,
    checkDataVersion,
    syncNow,
    startPeriodicSync,
    stopPeriodicSync,
    initialize,
    
    getEspeceInfo,
    getTalentInfo,
    getBoxInfo,
    getAchievementInfo,
    getItemInfo,
    formatPrice,
    getResourceIcon,
    formatString,
    getLevelRewardsBetween,
    getUnlocksBetween
  }
}