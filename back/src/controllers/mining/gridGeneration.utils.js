/**
 * Utilitaires de génération de grille et d'outils pour le minage
 */
import { miningData } from '../../data/sharedGameData.js'

const MINING_CONFIG = miningData

/**
 * Génère une récompense aléatoire basée sur le pool pondéré
 * @param {number} rewardAmountPercent - Bonus de quantité en pourcentage
 * @param {boolean} isApocalypse - Mode apocalypse actif
 * @returns {string|null} - Récompense au format "type:amount"
 */
export function generateReward(rewardAmountPercent = 0, isApocalypse = false, rewardPool = null) {
  // En mode apocalypse, 25% de chance d'obtenir une tomate pourrie
  if (isApocalypse && Math.random() < 0.25) {
    return 'rotten_tomato:1'
  }
  
  const pool = Array.isArray(rewardPool) && rewardPool.length > 0 ? rewardPool : MINING_CONFIG.rewardPool
  const total = pool.reduce((sum, r) => sum + (r.weight || 0), 0)
  let rand = Math.random() * total
  
  for (const reward of pool) {
    rand -= (reward.weight || 0)
    if (rand <= 0) {
      // Appliquer multiplicateur de quantité si demandé
      const base = reward.amount || 0
      const finalAmount = Math.max(1, Math.round(base * (1 + rewardAmountPercent / 100)))
      return `${reward.type}:${finalAmount}`
    }
  }
  return null
}

/**
 * Génère une nouvelle grille de jeu
 * @param {number} size - Taille de la grille (côté du carré)
 * @param {number} rewardChance - Probabilité de récompense par case
 * @param {number} rewardAmountPercent - Bonus de quantité de récompense
 * @param {boolean} isApocalypse - Mode apocalypse actif
 * @param {Object} fragileGrid - Configuration de fragilité { chance, damage }
 * @returns {Array} - Tableau des cellules de la grille
 */
export function generateGrid(size, rewardChance = 0.4, rewardAmountPercent = 0, isApocalypse = false, fragileGrid = { chance: 0, damage: 0 }, defaultHP = null, rewardPool = null) {
  const cells = []
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // HP: priorité au paramètre defaultHP sinon fallback à la config globale
      let hp = defaultHP !== null ? Number(defaultHP) : MINING_CONFIG.defaultHP
      
      // Appliquer l'effet fragile_grid : réduire les HP initiaux
      if (fragileGrid.chance > 0 && Math.random() < fragileGrid.chance) {
        hp = Math.max(1, hp - fragileGrid.damage) // Ne pas descendre en dessous de 1
      }
      
      cells.push({
        row,
        col,
        hp,
        reward: Math.random() < rewardChance ? generateReward(rewardAmountPercent, isApocalypse, rewardPool) : null,
        hint: false // <- explicit default so front-side normalization / debug shows presence
      })
    }
  }
  
  return cells
}

/**
 * Génère une liste d'outils aléatoires via tirage pondéré
 * @param {number} toolDamageAdd - Bonus de dégâts (non utilisé ici, appliqué lors du dig)
 * @returns {Array<string>} - Liste des types d'outils
 */
export function generateTools(toolDamageAdd = 0) {
  const totalWeight = MINING_CONFIG.toolPool.reduce((s, t) => s + t.weight, 0)
  const picks = []

  for (let i = 0; i < (MINING_CONFIG.toolsCount || 6); i++) {
    let rand = Math.random() * totalWeight
    for (const entry of MINING_CONFIG.toolPool) {
      rand -= entry.weight
      if (rand <= 0) {
        picks.push(entry.type)
        break
      }
    }
  }

  return picks.sort(() => Math.random() - 0.5)
}

/**
 * Applique les modificateurs d'artefacts à la liste d'outils
 * @param {Array<string>} baseTools - Liste de base des outils
 * @param {Object} mods - Modificateurs calculés
 * @returns {Array<string>} - Liste d'outils modifiée
 */
export function applyToolModifiers(baseTools, mods) {
  let appliedTools = [...baseTools]

  // 1) Duplication : when_tool_add_another (ex: hole-ace : duplicate shovels)
  if (mods.duplicates && mods.duplicates.length > 0) {
    for (const dup of mods.duplicates) {
      const tmp = []
      for (const t of appliedTools) {
        tmp.push(t)
        if (t === dup.detect) tmp.push(dup.add)
      }
      appliedTools = tmp
    }
  }

  // 2) Ajouter des outils supplémentaires (increase_tool_count)
  if (mods.extraToolCount && mods.extraToolCount > 0) {
    const totalWeight = MINING_CONFIG.toolPool.reduce((s, t) => s + t.weight, 0)
    for (let i = 0; i < mods.extraToolCount; i++) {
      let rand = Math.random() * totalWeight
      for (const entry of MINING_CONFIG.toolPool) {
        rand -= entry.weight
        if (rand <= 0) {
          appliedTools.push(entry.type)
          break
        }
      }
    }
  }

  // 3) Forcer dernier outil = dynamite si demandé
  if (mods.lastDynamite) {
    if (appliedTools.length === 0) {
      appliedTools.push('dynamite')
    } else {
      appliedTools[appliedTools.length - 1] = 'dynamite'
    }
  }

  // 4) Appliquer les remplacements d'outils (tool_change)
  if (mods.toolChanges && mods.toolChanges.length > 0) {
    const mapping = new Map()
    for (const tc of mods.toolChanges) mapping.set(tc.origin, tc.dest)
    for (let i = 0; i < appliedTools.length; i++) {
      if (mapping.has(appliedTools[i])) appliedTools[i] = mapping.get(appliedTools[i])
    }
  }

  return appliedTools
}

/**
 * Retourne la configuration de minage
 * @returns {Object} - Configuration du minage
 */
export function getMiningConfig() {
  return MINING_CONFIG
}
