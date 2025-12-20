// controllers/chickenGifts/chickenGiftsConfig.js
// Configuration des cadeaux de poules

export const GIFT_LIFETIME = 315360000000 // 10 ans en millisecondes (cadeaux permanents)
export const CLEANUP_INTERVAL = 5000 // ne change rien

// Configuration par niveau du joueur
export const GIFT_LEVEL_CONFIG = {
  1: {
    spawnChance: 0.24,
    rewards: [
      //50
      { type: 'eggs', weight: 30, amount: 10 },
      { type: 'eggs', weight: 15, amount: 25 },
      { type: 'eggs', weight: 5, amount: 50 },

      //25
      { type: 'stock_tokens', weight: 25, amount: 1 },

      //25
      { type: 'production_tokens', weight: 25, amount: 1 }
    ]
  },
  5: {
    spawnChance: 0.24,
    rewards: [
    //50
      { type: 'eggs', weight: 30, amount: 50 },
      { type: 'eggs', weight: 15, amount: 75 },
      { type: 'eggs', weight: 5, amount: 100 },

      //12
      { type: 'stock_tokens', weight: 12, amount: 1 },

      //12
      { type: 'production_tokens', weight: 12, amount: 1 },

      //25
      { type: 'mining_token', weight: 20, amount: 1 },
      { type: 'mining_token', weight: 4, amount: 2 },
      { type: 'mining_token', weight: 1, amount: 3 },
    ]
  },
  10: {
    spawnChance: 0.24,
    rewards: [
    //50
      { type: 'eggs', weight: 30, amount: 200 },
      { type: 'eggs', weight: 15, amount: 500 },
      { type: 'eggs', weight: 4, amount: 1000 },
      { type: 'eggs', weight: 1, amount: 10000 },
      { type: 'eggs', weight: 0.1, amount: 100000 },

      //12
      { type: 'stock_tokens', weight: 10, amount: 1 },
      { type: 'stock_tokens', weight: 2, amount: 2 },

      //12
      { type: 'production_tokens', weight: 10, amount: 1 },
      { type: 'production_tokens', weight: 2, amount: 2 },

      //25
      { type: 'mining_token', weight: 24, amount: 1 },
      { type: 'mining_token', weight: 5, amount: 2 },
      { type: 'mining_token', weight: 1, amount: 3 },
    ]
  }
}

export const TALENT_GIFT_CONFIG = {
  // Surcharges spécifiques par talent si nécessaire
}

/**
 * Obtenir la configuration des cadeaux pour un niveau donné
 */
export function getGiftConfigForLevel(level) {
  const levels = Object.keys(GIFT_LEVEL_CONFIG).map(Number).sort((a, b) => a - b)
  let configLevel = levels[0]

  for (const lvl of levels) {
    if (level >= lvl) {
      configLevel = lvl
    } else {
      break
    }
  }

  const baseConfig = GIFT_LEVEL_CONFIG[configLevel]

  return {
    spawnChance: baseConfig.spawnChance ?? 1,
    rewards: baseConfig.rewards ?? [{ type: 'eggs', weight: 100, amount: 5 }],
    maxActivePerChicken: 1,
    cooldownSeconds: 10
  }
}

/**
 * Obtenir les statistiques de configuration des cadeaux
 */
export function getGiftStats() {
  return {
    giftLifetime: GIFT_LIFETIME,
    cleanupInterval: CLEANUP_INTERVAL,
    levelConfigs: GIFT_LEVEL_CONFIG,
    talentConfigs: TALENT_GIFT_CONFIG,
    totalLevels: Object.keys(GIFT_LEVEL_CONFIG).length,
    totalTalentOverrides: Object.keys(TALENT_GIFT_CONFIG).length,
    permanentGifts: true
  }
}
