/**
 * Utilitaires pour le jeu de minage
 * Helpers de formatage, tooltips, et logique de récompenses
 */

import { MINING_CONFIG } from '@/data/mining'

/**
 * Normalise la détection du hint
 * @param {Object} cell - Cellule à vérifier
 * @returns {boolean}
 */
export function hasHint(cell) {
  if (!cell) return false
  const v = cell.hint
  if (v === true) return true
  if (v === 'true') return true
  if (v === 1) return true
  if (v === '1') return true
  return !!v
}

/**
 * Parse une récompense (string ou object) en type/amount
 * @param {string|Object} reward - Récompense à parser
 * @returns {{ type: string, amount: number|undefined }}
 */
export function parseReward(reward) {
  let type, amount
  if (typeof reward === 'string') {
    const parts = reward.split(':')
    type = parts[0]
    amount = parts[1] ? parseInt(parts[1]) : undefined
  } else if (typeof reward === 'object') {
    type = reward?.type
    amount = reward?.amount != null ? parseInt(String(reward.amount)) : undefined
  }
  return { type, amount }
}

// Icônes par défaut
const DEFAULT_ICONS = {
  eggs: '🥚',
  mining_token: '🪨',
  stock_token: '🧺',
  production_token: '⚙️',
  rotten_tomato: '🍅',
}

// Descriptions par défaut
const DEFAULT_DESCRIPTIONS = {
  eggs: 'Œufs - Ressource de base',
  mining_token: 'Jeton de minage - Pour creuser',
  stock_token: 'Jeton de stockage - Augmente la capacité',
  production_token: 'Jeton de production - Booste la production',
}

/**
 * Obtient l'icône pour un type de récompense
 * @param {string} type - Type de récompense
 * @returns {string} Emoji
 */
export function getRewardIcon(type) {
  const configIcon = MINING_CONFIG?.rewardTypes?.[type]?.icon
  return configIcon || DEFAULT_ICONS[type] || '❓'
}

/**
 * Formate une récompense pour affichage
 * @param {string|Object} reward - Récompense
 * @param {boolean} inCell - Si dans une cellule (format compact)
 * @returns {string}
 */
export function formatReward(reward, inCell = false) {
  if (!reward) return ''
  
  const { type, amount } = parseReward(reward)
  if (!type) return ''
  
  const icon = getRewardIcon(type)
  
  if (inCell && amount === 1) return icon
  if (amount === undefined || isNaN(amount)) return icon
  
  return `${icon} ${amount}`
}

/**
 * Formate une récompense groupée
 * @param {{ type: string, amount: number }} reward
 * @returns {string}
 */
export function formatGroupedReward(reward) {
  if (!reward?.type) return ''
  const icon = getRewardIcon(reward.type)
  return `${icon} ${reward.amount}`
}

/**
 * Groupe les récompenses par type
 * @param {Array} rewards - Liste de récompenses
 * @returns {Array<{ type: string, amount: number }>}
 */
export function groupRewards(rewards) {
  if (!rewards || !Array.isArray(rewards)) return []
  
  const grouped = {}
  rewards.forEach((reward) => {
    const { type, amount } = parseReward(reward)
    if (type) {
      const qty = amount || 1
      grouped[type] = (grouped[type] || 0) + qty
    }
  })
  
  return Object.entries(grouped).map(([type, amount]) => ({ type, amount }))
}

/**
 * Vérifie si une récompense est "large" (quantité = 1)
 * @param {string|Object} reward
 * @returns {boolean}
 */
export function isLargeReward(reward) {
  const { amount } = parseReward(reward)
  return amount === 1
}

/**
 * Vérifie si une récompense est rare
 * @param {string|Object} reward
 * @returns {boolean}
 */
export function isRareReward(reward) {
  const { type } = parseReward(reward)
  if (!type) return false
  
  try {
    const rewardPool = MINING_CONFIG?.rewardPool || []
    const rewardData = rewardPool.find((r) => r.type === type)
    return rewardData?.rare === true
  } catch {
    return false
  }
}

/**
 * Génère le tooltip pour une récompense individuelle
 * @param {string|Object} reward
 * @param {Function} getItemInfo - Fonction pour obtenir les infos d'un item
 * @returns {string} HTML
 */
export function getRewardTooltip(reward, getItemInfo) {
  if (!reward) return ''
  
  const { type, amount } = parseReward(reward)
  if (!type) return ''
  
  const icon = getRewardIcon(type)
  const desc = DEFAULT_DESCRIPTIONS[type] || 'Récompense inconnue'
  const qty = amount || 1
  
  return `
    <div style="text-align: center;">
      <div style="font-size: 18px; margin-bottom: 4px;">${icon}</div>
      <div style="font-weight: bold;">${qty} ${type.replace('_', ' ')}</div>
      <div style="font-size: 12px; opacity: 0.8;">${desc}</div>
    </div>
  `
}

/**
 * Génère le tooltip pour une récompense creusée
 * @param {string|Object} reward
 * @param {Function} getItemInfo - Fonction pour obtenir les infos d'un item
 * @returns {string} HTML
 */
export function getDugRewardTooltip(reward, getItemInfo) {
  if (!reward) return ''
  
  const { type, amount } = parseReward(reward)
  if (!type) return ''
  
  const itemData = getItemInfo?.(type)
  const desc = itemData?.description || 'Récompense inconnue'
  const qty = amount || 1
  const typeName = itemData?.nom || type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  
  return `
    <div style="text-align: center;">
      <div style="font-weight: bold;">${qty} ${typeName}</div>
      <div>${desc}</div>
    </div>
  `
}

/**
 * Génère le tooltip pour une récompense groupée
 * @param {{ type: string, amount: number }} reward
 * @param {Function} getItemInfo - Fonction pour obtenir les infos d'un item
 * @returns {string} HTML
 */
export function getGroupedRewardTooltip(reward, getItemInfo) {
  if (!reward?.type) return ''
  
  const itemData = getItemInfo?.(reward.type)
  const desc = itemData?.description || 'Récompense inconnue'
  const typeName = itemData?.nom || reward.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  
  return `
    <div style="text-align: center;">
      <div style="font-weight: bold;">${reward.amount} ${typeName}</div>
      <div>${desc}</div>
    </div>
  `
}

/**
 * Génère le tooltip pour le bouton continuer
 * @param {boolean} gameOver
 * @param {boolean} showResults
 * @param {Array} groupedRewards
 * @returns {string} HTML
 */
export function getContinueTooltip(gameOver, showResults, groupedRewards) {
  if (!gameOver || showResults) return ''
  
  if (!groupedRewards || groupedRewards.length === 0) {
    return '<div style="text-align: center;">Aucune récompense trouvée</div>'
  }
  
  const rewardLines = groupedRewards.map((reward) => formatGroupedReward(reward))
  
  return `
    <div style="text-align: center;">
      <div style="font-weight: bold; margin-bottom: 8px;">Récompenses obtenues :</div>
      <div>${rewardLines.join('<br>')}</div>
    </div>
  `
}
