// composables/useGameData.js
// Composable pour gérer les données de jeu synchronisées avec le backend

import { ref, computed, onMounted } from 'vue'
import { apiGet } from '@/utils/api.js'
import { useAuth } from './useAuth'

// État global des données de jeu
const gameData = ref(null)
const dataVersion = ref(null)
const lastUpdated = ref(null)
const loading = ref(true)
const error = ref(null)

// Cache pour éviter les appels répétés
let cachedData = null
let cacheTimestamp = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useGameData() {
  const { isLoggedIn } = useAuth()
  // Fonction pour récupérer les données depuis le backend
  async function fetchGameData(forceRefresh = false) {
    try {
      // Vérifier le cache
      const now = Date.now()
      if (!forceRefresh && cachedData && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
        gameData.value = cachedData
        loading.value = false
        return cachedData
      }

      loading.value = true
      error.value = null

      const result = await apiGet('/api/game-data')
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des données')
      }

  // Mettre à jour les données
      gameData.value = result.data
      dataVersion.value = result.data.version
      lastUpdated.value = result.data.lastUpdated
  try { if (typeof window !== 'undefined') window.__gameDataCache = result.data } catch (_) {}
      
      // Mettre à jour le cache
      cachedData = result.data
      cacheTimestamp = now

      //console.log(`✅ Données de jeu synchronisées - Version: ${result.data.version}`)
      
      return result.data
    } catch (err) {
      console.error('❌ Erreur lors de la synchronisation des données:', err)
      error.value = err.message
      
      // En cas d'erreur, utiliser les données en cache si disponibles
      if (cachedData) {
        gameData.value = cachedData
        //console.log('📦 Utilisation des données en cache')
      }
      
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fonction pour vérifier si les données locales sont à jour
  async function checkDataVersion() {
    try {
      if (!isLoggedIn()) return false
      const result = await apiGet('/api/game-data/version')
      
      if (dataVersion.value && dataVersion.value !== result.version) {
        console.log('🔄 Nouvelle version des données détectée, synchronisation...')
        await fetchGameData(true)
        return true // Données mises à jour
      }
      
      return false // Pas de mise à jour nécessaire
    } catch (err) {
      console.error('Erreur lors de la vérification de version:', err)
      return false
    }
  }

  // Fonctions utilitaires pour accéder aux données spécifiques
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

  // Formate une quantité d'item selon singulier/pluriel
  function formatString(type, count) {
    const itemData = items.value[type]
    if (!itemData || typeof count !== 'number') return 'Valeur invalide'
    return `${count} ${count === 1 ? itemData.nom_singulier : itemData.nom}`
  }

  // Récompenses de level-up: lecture depuis la source centralisée (sans génération auto)
  function getLevelRewardsBetween(from, to) {
    const rewards = {}
    for (let lvl = Math.max(1, from + 1); lvl <= to; lvl++) {
      const arr = levelRewards.value[lvl] || []
      for (const r of arr) {
        rewards[r.type] = (rewards[r.type] || 0) + (r.count || 0)
      }
    }
    // Normaliser vers un tableau avec icône/libellé
    return Object.entries(rewards).map(([type, count]) => ({
      type,
      count,
      icon: getResourceIcon(type),
      label: formatString(type, count)
    }))
  }

  // Déverrouillages entre deux niveaux (exclut le niveau "from")
  function getUnlocksBetween(from, to) {
    const unlocked = []
    for (let lvl = Math.max(1, from + 1); lvl <= to; lvl++) {
      if (levelUnlocks.value[lvl]) unlocked.push(...levelUnlocks.value[lvl])
    }
    return unlocked
  }

  // Initialiser les données au montage
  onMounted(async () => {
    try {
      await fetchGameData()
      // Marquer les données de jeu comme chargées
      try {
        const { useAppLoading } = await import('./useAppLoading')
        const { setGameDataLoading } = useAppLoading()
        setGameDataLoading(false)
      } catch (_) {}
    } catch (err) {
      console.error('Erreur lors de l\'initialisation des données de jeu:', err)
      // Marquer comme chargées même en cas d'erreur pour ne pas bloquer l'UI
      try {
        const { useAppLoading } = await import('./useAppLoading')
        const { setGameDataLoading } = useAppLoading()
        setGameDataLoading(false)
      } catch (_) {}
    }
  })

  return {
    // État
    gameData,
    dataVersion,
    lastUpdated,
    loading,
    error,
    
    // Données spécifiques
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
    
    // Actions
    fetchGameData,
    checkDataVersion,
    
    // Utilitaires
    getEspeceInfo,
    getTalentInfo,
    getBoxInfo,
    getAchievementInfo,
    getItemInfo,
    formatPrice,
    getResourceIcon
    ,
    formatString,
    getLevelRewardsBetween
    ,
    getUnlocksBetween
  }
}

// Fonction utilitaire pour initialiser les données globalement
export async function initializeGameData() {
  const { fetchGameData } = useGameData()
  return await fetchGameData()
}