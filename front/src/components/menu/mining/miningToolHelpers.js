/**
 * Helpers pour les outils du jeu de minage
 * Configuration des curseurs, patterns et tooltips
 */

import { MINING_CONFIG } from '@/data/mining'

// Import des curseurs d'outils
import cursor_hand from '@/assets/ui/cursor/hand_point.png'
import cursor_shovel from '@/assets/ui/cursor/tool_shovel.png'
import cursor_pickaxe from '@/assets/ui/cursor/tool_pickaxe.png'
import cursor_hammer from '@/assets/ui/cursor/tool_hammer.png'
import cursor_axe from '@/assets/ui/cursor/tool_axe.png'
import cursor_axe_single from '@/assets/ui/cursor/tool_axe_single.png'
import cursor_bomb from '@/assets/ui/cursor/tool_bomb.png'
import cursor_dynamite from '@/assets/ui/cursor/tool_dynamite.png'
import cursor_bow from '@/assets/ui/cursor/tool_bow.png'
import cursor_hoe from '@/assets/ui/cursor/tool_hoe.png'
import cursor_torch from '@/assets/ui/cursor/tool_torch.png'
import cursor_wrench from '@/assets/ui/cursor/tool_wrench.png'
import cursor_watering_can from '@/assets/ui/cursor/tool_watering_can.png'
import cursor_mark_question from '@/assets/ui/cursor/mark_question.png'

// Map des curseurs importés
export const cursorMap = {
  shovel: cursor_shovel,
  pickaxe: cursor_pickaxe,
  hammer: cursor_hammer,
  axe: cursor_axe,
  axe_single: cursor_axe_single,
  bomb: cursor_bomb,
  dynamite: cursor_dynamite,
  bow: cursor_bow,
  hoe: cursor_hoe,
  torch: cursor_torch,
  wrench: cursor_wrench,
  watering_can: cursor_watering_can,
  hand: cursor_hand,
}

// Exports des curseurs individuels pour utilisation directe
export { cursor_hand, cursor_mark_question }

/**
 * Construit la configuration des outils à partir des données partagées
 * @returns {Object} Configuration des outils
 */
export function buildToolConfig() {
  const cfg = {}
  const shared = MINING_CONFIG?.tools || {}

  Object.entries(shared).forEach(([key, v]) => {
    cfg[key] = {
      damage: v.damage,
      pattern: v.pattern,
      icon: v.icon || '🔧',
      name: v.name || key,
      description: v.desc || v.description || '',
      cursorPath: cursorMap[key] || cursor_hand,
      secondaryDamage: typeof v.secondary_damage === 'number' ? v.secondary_damage : 1,
      animation: v.animation || null,
    }
  })

  return cfg
}

// Configuration des outils (singleton)
let _toolConfig = null

/**
 * Obtient la configuration des outils (avec cache)
 * @returns {Object}
 */
export function getToolConfig() {
  if (!_toolConfig) {
    _toolConfig = buildToolConfig()
  }
  return _toolConfig
}

/**
 * Obtient l'icône d'un outil
 * @param {string} tool - Nom de l'outil
 * @returns {string} Emoji
 */
export function getToolIcon(tool) {
  return getToolConfig()[tool]?.icon || '🔧'
}

/**
 * Obtient le nom d'un outil
 * @param {string} tool - Nom de l'outil
 * @returns {string}
 */
export function getToolName(tool) {
  return getToolConfig()[tool]?.name || 'Outil'
}

/**
 * Génère le tooltip d'un outil
 * @param {string} tool - Nom de l'outil
 * @returns {string} HTML
 */
export function getToolTooltip(tool) {
  const config = getToolConfig()[tool]
  if (!config) return 'Outil inconnu'
  return `<div><strong>${config.name}</strong></div><div style="margin-top:4px;">${config.description}</div>`
}

/**
 * Obtient le style de curseur pour un outil
 * @param {string} tool - Nom de l'outil
 * @param {number} idx - Index dans la pile (0 = actuel)
 * @param {string} currentCursor - Curseur actuel calculé
 * @returns {Object} Style CSS
 */
export function getToolCursorStyle(tool, idx, currentCursor) {
  if (idx === 0) {
    return { cursor: currentCursor }
  }
  return { cursor: `url("${cursor_mark_question}") 0 0, help` }
}

/**
 * Obtient le style de curseur "point d'interrogation"
 * @returns {Object} Style CSS
 */
export function getMarkQuestionCursorStyle() {
  return { cursor: `url("${cursor_mark_question}") 0 0, help` }
}

/**
 * Calcule le curseur actuel basé sur l'outil
 * @param {boolean} gameActive - Si le jeu est actif
 * @param {number} currentToolIndex - Index de l'outil actuel
 * @param {Array} tools - Liste des outils
 * @returns {string} Style de curseur CSS
 */
export function computeCurrentCursor(gameActive, currentToolIndex, tools) {
  if (!gameActive || currentToolIndex >= tools.length) {
    return `url("${cursor_hand}") 0 0, pointer`
  }

  const tool = tools[currentToolIndex]
  const config = getToolConfig()[tool]

  if (config?.cursorPath) {
    return `url("${config.cursorPath}") 0 0, pointer`
  }

  return `url("${cursor_hand}") 0 0, pointer`
}

/**
 * Vérifie si une case sera affectée par un outil
 * @param {number} row - Ligne de la case à vérifier
 * @param {number} col - Colonne de la case à vérifier
 * @param {Object} hoveredCell - { row, col } de la case survolée
 * @param {string} tool - Nom de l'outil
 * @returns {boolean}
 */
export function willBeAffected(row, col, hoveredCell, tool) {
  if (!hoveredCell) return false

  const config = getToolConfig()[tool]
  if (!config) return false

  const { row: hRow, col: hCol } = hoveredCell

  if (config.pattern === 'single') {
    return row === hRow && col === hCol
  }

  if (config.pattern === 'cross') {
    if (row === hRow && col === hCol) return true
    if (row === hRow - 1 && col === hCol) return true
    if (row === hRow + 1 && col === hCol) return true
    if (row === hRow && col === hCol - 1) return true
    if (row === hRow && col === hCol + 1) return true
  }

  if (config.pattern === 'square') {
    return Math.abs(row - hRow) <= 1 && Math.abs(col - hCol) <= 1
  }

  return false
}

/**
 * Calcule les dégâts à une position donnée
 * @param {number} row - Ligne
 * @param {number} col - Colonne
 * @param {Object} hoveredCell - { row, col }
 * @param {string} tool - Nom de l'outil
 * @param {number} toolDamageAdd - Bonus de dégâts des artefacts
 * @returns {number}
 */
export function getDamageAt(row, col, hoveredCell, tool, toolDamageAdd = 0) {
  if (!hoveredCell) return 0

  const config = getToolConfig()[tool]
  if (!config) return 0

  const { row: hRow, col: hCol } = hoveredCell
  const sec = Number(config.secondaryDamage || 1)
  const centerDamage = Number(config.damage || 0) + Number(toolDamageAdd)

  if (config.pattern === 'single') {
    return row === hRow && col === hCol ? centerDamage : 0
  }

  if (config.pattern === 'cross') {
    if (row === hRow && col === hCol) return centerDamage
    if (willBeAffected(row, col, hoveredCell, tool)) return sec
    return 0
  }

  if (config.pattern === 'square') {
    if (row === hRow && col === hCol) return centerDamage
    if (Math.abs(row - hRow) <= 1 && Math.abs(col - hCol) <= 1) return sec
    return 0
  }

  return 0
}
