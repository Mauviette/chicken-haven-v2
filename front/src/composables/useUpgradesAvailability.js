import { ref, computed, watch, onMounted } from 'vue'
import { usePlayer } from '@/composables/usePlayer'
import { useGameData } from '@/composables/useGameData'
import { apiGet } from '@/utils/api.js'

// Singleton state
const upgradeLevels = ref({}) // { [id]: level }
const initialized = ref(false)

export function useUpgradesAvailability() {
  const { stockTokens, productionTokens, wildTokens, canAfford } = usePlayer()
  const { upgrades: serverUpgrades } = useGameData()

  function getCurrentCostForLevel(costs, level) {
    if (!Array.isArray(costs) || costs.length === 0) return Infinity
    if (level >= costs.length) return costs[costs.length - 1]
    return costs[level]
  }

  const hasAvailableUpgrade = computed(() => {
    const list = serverUpgrades?.value || []
    if (!Array.isArray(list) || list.length === 0) return false
    
    // Ne pas calculer si les niveaux d'upgrades ne sont pas encore chargés
    if (!initialized.value || Object.keys(upgradeLevels.value).length === 0) {
      return false
    }
    
    // Vérifier que les tokens sont bien chargés (pas null/undefined)
    if (stockTokens.value === null || productionTokens.value === null || wildTokens.value === null) {
      return false
    }
    
    // Vérifier que les tokens sont bien chargés avant de calculer la disponibilité
    // Convertir null en 0 pour éviter les faux positifs
    const tokens = {
      stock_token: stockTokens.value ?? 0,
      production_token: productionTokens.value ?? 0,
      wild_token: wildTokens.value ?? 0
    }
    
    return list.some(u => {
      const currentLevel = Number(upgradeLevels.value?.[u.id] || 0)
      const isMaxed = (u.maxLevel !== null && typeof u.maxLevel === 'number' && currentLevel >= u.maxLevel)
      if (isMaxed) return false
      const cost = getCurrentCostForLevel(u.costs, currentLevel)
      const price = { type: u.priceType, count: Number(cost) || 0 }
      
      // Vérifier avec les tokens normalisés
      if (Number(price.count) <= 0) return false
      
      return canAfford(price)
    })
  })

  async function refreshUpgradeLevels() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const { upgrades } = await apiGet('/api/upgrades')
      if (upgrades && typeof upgrades === 'object') {
        upgradeLevels.value = Object.fromEntries(
          Object.entries(upgrades).map(([k, v]) => [Number(k), Number(v) || 0])
        )
      }
    } catch (e) {
      console.error('Erreur lors de la récupération des niveaux d\'upgrades:', e)
    }
  }

  function broadcast() {
    try {
      const available = !!hasAvailableUpgrade.value
      if (typeof window !== 'undefined') {
        window.__marketHasAvailableUpgrade = available
        window.dispatchEvent(new CustomEvent('market-available-upgrade-changed', { detail: { available } }))
      }
    } catch (_) {}
  }

  function initUpgradesAvailability() {
    if (initialized.value) {
      // Still broadcast current state so late listeners get it
      broadcast()
      return
    }
    initialized.value = true
    // Initial fetch
    refreshUpgradeLevels().then(broadcast)
  }

  // Re-broadcast on relevant changes
  watch([serverUpgrades, stockTokens, productionTokens, wildTokens, upgradeLevels], () => {
    broadcast()
  })
  
  // Rafraîchir les niveaux d'upgrades quand les tokens changent (achat/vente d'upgrades)
  watch([stockTokens, productionTokens, wildTokens], (newTokens, oldTokens) => {
    // Si les tokens ont changé, il se peut que des upgrades aient été achetés/vendus
    if (initialized.value && (newTokens[0] !== oldTokens[0] || newTokens[1] !== oldTokens[1] || newTokens[2] !== oldTokens[2])) {
      refreshUpgradeLevels()
    }
  })

  // Optional: also broadcast once mounted in any component using this composable
  onMounted(() => {
    broadcast()
  })

  return {
    hasAvailableUpgrade,
    initUpgradesAvailability,
    refreshUpgradeLevels
  }
}
