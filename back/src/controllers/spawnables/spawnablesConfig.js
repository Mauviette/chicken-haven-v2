/**
 * Configuration des spawnables
 */

export const SPAWNABLE_LIFETIME = 15000
export const CLEANUP_INTERVAL = 5000

export const SPAWNABLE_TYPE_CONFIG = {
  white_egg: {
    spawnChance: 0.025,
    maxActivePerUser: 999,
    cooldownSeconds: 3
  },
  chocolate: {
    spawnChance: 0.025,
    maxActivePerUser: 999,
    cooldownSeconds: 3
  },
  pink_egg: {
    spawnChance: 0.025,
    maxActivePerUser: 999,
    cooldownSeconds: 3
  },
}

export const TALENT_SPAWN_CONFIG = {}

/**
 * Récupère la configuration pour un type de spawnable
 * @param {string} objectType - Type d'objet
 * @param {string} talentName - Nom du talent
 * @returns {Object} - Configuration du spawnable
 */
export function getSpawnableConfigForType(objectType, talentName) {
  const typeConfig = SPAWNABLE_TYPE_CONFIG[objectType] || SPAWNABLE_TYPE_CONFIG.white_egg
  const talentConfig = TALENT_SPAWN_CONFIG[talentName] || {}
  
  return {
    spawnChance: talentConfig.spawnChanceOverride ?? typeConfig.spawnChance ?? 0.03,
    maxActivePerUser: talentConfig.maxActiveOverride ?? typeConfig.maxActivePerUser ?? 999,
    cooldownSeconds: talentConfig.cooldownSecondsOverride ?? typeConfig.cooldownSeconds ?? 3
  }
}

/**
 * Récupère les statistiques de configuration des spawnables
 * @returns {Object}
 */
export function getSpawnableStats() {
  return {
    spawnableLifetime: SPAWNABLE_LIFETIME,
    cleanupInterval: CLEANUP_INTERVAL,
    typeConfigs: SPAWNABLE_TYPE_CONFIG,
    talentConfigs: TALENT_SPAWN_CONFIG,
    totalTypes: Object.keys(SPAWNABLE_TYPE_CONFIG).length,
    totalTalentOverrides: Object.keys(TALENT_SPAWN_CONFIG).length
  }
}

/**
 * Mapping des types de spawner vers les types d'objets
 */
export const SPAWNER_ID_TO_TYPE = {
  'white_egg': 'white_egg',
  'chocolate': 'chocolate',
  'pink_egg': 'pink_egg'
}
