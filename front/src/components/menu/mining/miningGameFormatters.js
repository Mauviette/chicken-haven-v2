import { formatNumber } from '@/utils/formatting'

// Map des emojis de récompenses (ceux qui doivent être plus grands)
const LARGE_EMOJI_REWARDS = ['🥚', '🐣', '🪺', '💎', '👑', '⭐', '💰', '🎁', '🏆', '🌟', '🔮', '🎪']

/**
 * Vérifie si une récompense doit avoir un emoji large
 * @param {string} content - Contenu de la récompense
 * @returns {boolean}
 */
export function isLargeEmoji(content) {
  return LARGE_EMOJI_REWARDS.some((emoji) => content?.includes(emoji))
}

/**
 * Formater une récompense pour affichage
 * @param {object} reward - Objet récompense
 * @returns {string} Texte formaté
 */
export function formatRewardDisplay(reward) {
  if (!reward) return '❓'

  const type = reward.type || reward.reward_type
  const amount = reward.amount ?? reward.value ?? 1

  switch (type) {
    case 'currency':
      return `💰 ${formatNumber(amount)}`
    case 'diamond':
    case 'diamonds':
      return `💎 ${formatNumber(amount)}`
    case 'egg':
      return '🥚'
    case 'chicken':
      return '🐔'
    case 'golden_egg':
      return '🥚✨'
    case 'premium_currency':
      return `💎 ${formatNumber(amount)}`
    case 'experience':
    case 'xp':
      return `⭐ ${formatNumber(amount)}`
    case 'token':
    case 'tokens':
      return `🪙 ${formatNumber(amount)}`
    case 'artifact':
      return '🔮'
    case 'chest':
      return '📦'
    case 'nothing':
      return '❌'
    default:
      return reward.emoji || `❓ ${type}`
  }
}

/**
 * Formater une liste de récompenses pour le récapitulatif
 * @param {Array} rewards - Liste des récompenses
 * @returns {Array} Liste formatée avec texte et emoji
 */
export function formatRewardsList(rewards) {
  if (!rewards || !Array.isArray(rewards)) return []

  // Grouper par type
  const grouped = {}

  rewards.forEach((r) => {
    const type = r.type || r.reward_type
    if (!grouped[type]) {
      grouped[type] = { type, total: 0, items: [] }
    }
    grouped[type].total += r.amount ?? r.value ?? 1
    grouped[type].items.push(r)
  })

  return Object.values(grouped).map((g) => ({
    type: g.type,
    text: formatRewardTypeText(g.type, g.total),
    emoji: getRewardEmoji(g.type),
    total: g.total,
  }))
}

/**
 * Obtenir l'emoji pour un type de récompense
 * @param {string} type - Type de récompense
 * @returns {string} Emoji
 */
export function getRewardEmoji(type) {
  const emojiMap = {
    currency: '💰',
    diamond: '💎',
    diamonds: '💎',
    egg: '🥚',
    chicken: '🐔',
    golden_egg: '🥚✨',
    premium_currency: '💎',
    experience: '⭐',
    xp: '⭐',
    token: '🪙',
    tokens: '🪙',
    artifact: '🔮',
    chest: '📦',
    nothing: '❌',
  }
  return emojiMap[type] || '❓'
}

/**
 * Formater le texte d'un type de récompense
 * @param {string} type - Type de récompense
 * @param {number} amount - Quantité
 * @returns {string} Texte formaté
 */
function formatRewardTypeText(type, amount) {
  const textMap = {
    currency: `${formatNumber(amount)} pièces`,
    diamond: `${formatNumber(amount)} diamant${amount > 1 ? 's' : ''}`,
    diamonds: `${formatNumber(amount)} diamant${amount > 1 ? 's' : ''}`,
    egg: `${amount} œuf${amount > 1 ? 's' : ''}`,
    chicken: `${amount} poulet${amount > 1 ? 's' : ''}`,
    golden_egg: `${amount} œuf${amount > 1 ? 's' : ''} doré${amount > 1 ? 's' : ''}`,
    premium_currency: `${formatNumber(amount)} gemme${amount > 1 ? 's' : ''}`,
    experience: `${formatNumber(amount)} XP`,
    xp: `${formatNumber(amount)} XP`,
    token: `${formatNumber(amount)} jeton${amount > 1 ? 's' : ''}`,
    tokens: `${formatNumber(amount)} jeton${amount > 1 ? 's' : ''}`,
    artifact: `${amount} artefact${amount > 1 ? 's' : ''}`,
    chest: `${amount} coffre${amount > 1 ? 's' : ''}`,
  }
  return textMap[type] || `${amount}x ${type}`
}

/**
 * Obtenir le tooltip pour une cellule
 * @param {object} cell - Cellule du jeu
 * @param {object} options - Options supplémentaires
 * @returns {string} HTML du tooltip
 */
export function getCellTooltip(cell, options = {}) {
  if (!cell) return ''

  const { showReward = false, revealed = false } = options

  let tooltip = ''

  // État de la cellule
  const stateMap = {
    intact: 'Intacte',
    'cracked-light': 'Fissurée',
    'cracked-heavy': 'Très fissurée',
    dug: 'Creusée',
  }

  if (cell.state && cell.state !== 'dug') {
    tooltip += `<b>${stateMap[cell.state] || cell.state}</b>`
  }

  // Récompense (si révélée ou creusée)
  if ((showReward || revealed || cell.state === 'dug') && cell.reward) {
    if (tooltip) tooltip += '<br>'
    tooltip += `Récompense: ${formatRewardDisplay(cell.reward)}`
  }

  return tooltip
}

/**
 * Obtenir le tooltip pour un outil
 * @param {object} tool - Outil
 * @returns {string} HTML du tooltip
 */
export function getToolTooltip(tool) {
  if (!tool) return ''

  let tooltip = `<b>${tool.name || 'Outil'}</b>`

  if (tool.description) {
    tooltip += `<br>${tool.description}`
  }

  if (tool.uses !== undefined) {
    tooltip += `<br>Utilisations: ${tool.uses}`
  }

  if (tool.power !== undefined) {
    tooltip += `<br>Puissance: ${tool.power}`
  }

  return tooltip
}

/**
 * Obtenir le tooltip pour un artefact
 * @param {object} artifact - Artefact actif
 * @returns {string} HTML du tooltip
 */
export function getArtifactTooltip(artifact) {
  if (!artifact) return ''

  let tooltip = `<b>${artifact.name || artifact.id}</b>`

  if (artifact.description) {
    tooltip += `<br>${artifact.description}`
  }

  // Effets spécifiques
  if (artifact.effect) {
    tooltip += `<br><i>${artifact.effect}</i>`
  }

  return tooltip
}
