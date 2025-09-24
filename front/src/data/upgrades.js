// Données des améliorations
export const upgradesData = [
  {
    id: 1,
    name: 'Améliorer le stockage',
    description: 'Augmente la capacité de stockage des œufs',
    icon: '🏠',
    priceType: 'stock_token',
    costs: [1, 1, 1, 2, 2, 3, 4, 5],
    rewards: [10, 10, 15, 15, 20, 25, 30, 40],
    effectTemplate: '+{reward} œufs de stockage maximum',
    currentLevel: 0,
    maxLevel: null // null = illimité après le dernier coût défini
  },
  {
    id: 2,
    name: 'Production Premium',
    description: 'Améliore la productivité des œufs par seconde',
    icon: '🌾',
    priceType: 'production_token',
    costs: [1, 1, 2, 2, 3, 4, 5, 8],
    rewards: [1, 1, 2, 2, 3, 4, 5, 8],
    effectTemplate: '+{reward} œuf(s) produit(s) par seconde',
    currentLevel: 0,
    maxLevel: null
  }
]

// Fonction pour obtenir le coût actuel d'une amélioration
export function getCurrentCost(upgrade) {
  const level = upgrade.currentLevel
  const costs = upgrade.costs
  
  if (level >= costs.length) {
    // Utiliser le dernier coût défini pour tous les niveaux suivants
    return costs[costs.length - 1]
  }
  
  return costs[level]
}

// Fonction pour obtenir la récompense actuelle d'une amélioration
export function getCurrentReward(upgrade) {
  const level = upgrade.currentLevel
  const rewards = upgrade.rewards
  
  if (level >= rewards.length) {
    // Utiliser la dernière récompense définie pour tous les niveaux suivants
    return rewards[rewards.length - 1]
  }
  
  return rewards[level]
}

// Fonction pour obtenir le prix formé d'une amélioration
export function getUpgradePrice(upgrade) {
  return {
    type: upgrade.priceType,
    count: getCurrentCost(upgrade)
  }
}

// Fonction pour obtenir l'effet formaté d'une amélioration
export function getUpgradeEffect(upgrade) {
  const reward = getCurrentReward(upgrade)
  return upgrade.effectTemplate.replace('{reward}', reward)
}

// Fonction pour vérifier si une amélioration peut être achetée
export function canUpgrade(upgrade) {
  if (upgrade.maxLevel !== null && upgrade.currentLevel >= upgrade.maxLevel) {
    return false
  }
  return true
}

// Fonction pour upgrader une amélioration (augmente le niveau)
export function upgradeLevel(upgrade) {
  if (canUpgrade(upgrade)) {
    upgrade.currentLevel++
    return true
  }
  return false
}

// Fonction pour obtenir le niveau d'affichage d'une amélioration
export function getUpgradeDisplayLevel(upgrade) {
  if (upgrade.maxLevel !== null && upgrade.currentLevel >= upgrade.maxLevel) {
    return 'MAX'
  }
  return `Niveau ${upgrade.currentLevel + 1}`
}

// Fonction pour obtenir toutes les améliorations avec leurs données calculées
export function getUpgradesWithCalculatedData() {
  return upgradesData.map(upgrade => ({
    ...upgrade,
    price: getUpgradePrice(upgrade),
    effect: getUpgradeEffect(upgrade),
    canBuy: canUpgrade(upgrade),
    displayLevel: getUpgradeDisplayLevel(upgrade),
    nextCost: canUpgrade(upgrade) ? getCurrentCost(upgrade) : null,
    nextReward: canUpgrade(upgrade) ? getCurrentReward(upgrade) : null
  }))
}
