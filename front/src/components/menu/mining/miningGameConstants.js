// Importation des curseurs
import pickaxeCursor from '/src/assets/ui/cursor/pickaxe.png'
import pickaxeIronCursor from '/src/assets/ui/cursor/pickaxe-iron.png'
import pickaxeGoldCursor from '/src/assets/ui/cursor/pickaxe-gold.png'
import pickaxeDiamondCursor from '/src/assets/ui/cursor/pickaxe-diamond.png'
import pickaxeNetheriteCursor from '/src/assets/ui/cursor/pickaxe-netherite.png'
import pickaxeAuroraCursor from '/src/assets/ui/cursor/pickaxe-aurora.png'
import pickaxeObsidianCursor from '/src/assets/ui/cursor/pickaxe-obsidian.png'
import bombCursor from '/src/assets/ui/cursor/bomb.png'
import brushCursor from '/src/assets/ui/cursor/brush.png'
import dynamiteCursor from '/src/assets/ui/cursor/dynamite.png'
import scannerCursor from '/src/assets/ui/cursor/scanner.png'
import drillCursor from '/src/assets/ui/cursor/drill.png'
import xrayCursor from '/src/assets/ui/cursor/xray.png'
import laserCursor from '/src/assets/ui/cursor/laser.png'

// Map des curseurs par type d'outil
export const cursorMap = {
  pickaxe: pickaxeCursor,
  'pickaxe-iron': pickaxeIronCursor,
  'pickaxe-gold': pickaxeGoldCursor,
  'pickaxe-diamond': pickaxeDiamondCursor,
  'pickaxe-netherite': pickaxeNetheriteCursor,
  'pickaxe-aurora': pickaxeAuroraCursor,
  'pickaxe-obsidian': pickaxeObsidianCursor,
  bomb: bombCursor,
  brush: brushCursor,
  dynamite: dynamiteCursor,
  scanner: scannerCursor,
  drill: drillCursor,
  xray: xrayCursor,
  laser: laserCursor,
}

// Configuration des outils
export const TOOL_CONFIG = {
  pickaxe: { icon: '⛏️', name: 'Pioche (Bois)' },
  'pickaxe-iron': { icon: '⛏️', name: 'Pioche (Fer)' },
  'pickaxe-gold': { icon: '⛏️', name: 'Pioche (Or)' },
  'pickaxe-diamond': { icon: '⛏️', name: 'Pioche (Diamant)' },
  'pickaxe-netherite': { icon: '⛏️', name: 'Pioche (Netherite)' },
  'pickaxe-aurora': { icon: '⛏️', name: 'Pioche (Aurora)' },
  'pickaxe-obsidian': { icon: '⛏️', name: 'Pioche (Obsidian)' },
  bomb: { icon: '💣', name: 'Bombe' },
  brush: { icon: '🖌️', name: 'Pinceau' },
  dynamite: { icon: '🧨', name: 'Dynamite' },
  scanner: { icon: '📡', name: 'Scanner' },
  drill: { icon: '🔧', name: 'Foreuse' },
  xray: { icon: '🔬', name: 'X-Ray' },
  laser: { icon: '💥', name: 'Laser' },
}

// Configuration par défaut pour les outils inconnus
export const DEFAULT_TOOL = { icon: '🔨', name: 'Outil' }

/**
 * Obtenir l'icône d'un outil
 * @param {string} toolType - Type de l'outil
 * @returns {string} Emoji de l'icône
 */
export function getToolIcon(toolType) {
  return TOOL_CONFIG[toolType]?.icon || DEFAULT_TOOL.icon
}

/**
 * Obtenir le nom d'un outil
 * @param {string} toolType - Type de l'outil
 * @returns {string} Nom de l'outil
 */
export function getToolName(toolType) {
  return TOOL_CONFIG[toolType]?.name || DEFAULT_TOOL.name
}

/**
 * Obtenir le curseur pour un outil
 * @param {string} toolType - Type de l'outil
 * @returns {string} URL du curseur CSS
 */
export function getToolCursor(toolType) {
  const cursor = cursorMap[toolType]
  if (cursor) {
    return `url('${cursor}') 0 24, pointer`
  }
  return 'pointer'
}
