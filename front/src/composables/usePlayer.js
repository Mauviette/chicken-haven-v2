import { ref } from 'vue'

const eggs = ref(0)
const stockTokens = ref(0)
const productionTokens = ref(0)

export function usePlayer() {
  async function refreshPlayer() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('http://localhost:3002/api/egg/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        eggs.value = data.totalEggs || 0
        stockTokens.value = data.stockTokens || 0
        productionTokens.value = data.productionTokens || 0
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données du joueur:', error)
    }
  }

  function addEggs(n) {
    eggs.value += n
  }

  function spendEggs(n) {
    if (eggs.value >= n) {
      eggs.value -= n
      return true
    }
    return false
  }

  function setEggs(n) {
    eggs.value = n
  }

  function addTokens(type, amount) {
    if (type === 'stock_token') {
      stockTokens.value += amount
    } else if (type === 'production_token') {
      productionTokens.value += amount
    }
  }

  function spendTokens(type, amount) {
    if (type === 'stock_token' && stockTokens.value >= amount) {
      stockTokens.value -= amount
      return true
    } else if (type === 'production_token' && productionTokens.value >= amount) {
      productionTokens.value -= amount
      return true
    }
    return false
  }

  function canAfford(price) {
    if (typeof price === 'number') {
      return eggs.value >= price
    }
    
    switch (price.type) {
      case 'eggs':
        return eggs.value >= price.count
      case 'stock_token':
        return stockTokens.value >= price.count
      case 'production_token':
        return productionTokens.value >= price.count
      default:
        return false
    }
  }

  function getLevel() {
    return 5
  }

  return {
    eggs,
    stockTokens,
    productionTokens,
    addEggs,
    spendEggs,
    setEggs,
    addTokens,
    spendTokens,
    canAfford,
    getLevel,
    refreshPlayer,
    refreshPlayerData: refreshPlayer // Alias pour compatibilité
  }
}
