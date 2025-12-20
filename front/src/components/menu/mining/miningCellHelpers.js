/**
 * Helpers pour les cellules du jeu de minage
 * Classes CSS et animations
 */

/**
 * Obtient les classes CSS pour une cellule
 * @param {Object} cell - Cellule { row, col, hp, ... }
 * @param {Object} options - Options de rendu
 * @param {Set} options.animatingCells - Cellules en animation de creusage
 * @param {Set} options.animatingExplosions - Cellules en animation d'explosion
 * @param {Object|null} options.hoveredCell - Cellule survolée { row, col }
 * @param {Function} options.willBeAffected - Fonction pour vérifier si la cellule sera affectée
 * @param {Function} options.getDamageAt - Fonction pour obtenir les dégâts à une position
 * @returns {Array<string>} Classes CSS
 */
export function getCellClasses(cell, options = {}) {
  const {
    animatingCells = new Set(),
    animatingExplosions = new Set(),
    hoveredCell = null,
    willBeAffected = () => false,
    getDamageAt = () => 0,
  } = options

  const classes = []
  const cellKey = `${cell.row}-${cell.col}`

  // État de la cellule
  if (cell.hp === 0) {
    classes.push('dug')
  } else if (cell.hp === 1) {
    classes.push('cracked-heavy')
  } else if (cell.hp === 2) {
    classes.push('cracked-light')
  } else {
    classes.push('intact')
  }

  // Animation de creusage classique
  if (animatingCells.has(cellKey)) {
    classes.push('digging')
  }

  // Animation explosion
  if (animatingExplosions.has(cellKey)) {
    classes.push('explosion')
  }

  // Preview de l'impact
  if (hoveredCell && willBeAffected(cell.row, cell.col)) {
    const damage = getDamageAt(cell.row, cell.col)

    // Si le coup va détruire complètement la case
    if (damage >= cell.hp && cell.hp > 0) {
      classes.push('preview-destroy')
    } else {
      classes.push('preview')
      if (damage >= 2) {
        classes.push('preview-strong')
      }
    }
  }

  return classes
}

/**
 * Obtient les classes CSS pour une cellule (version string)
 * @param {Object} cell
 * @param {Object} options
 * @returns {string}
 */
export function getCellClass(cell, options = {}) {
  return getCellClasses(cell, options).join(' ')
}

/**
 * Vérifie si une cellule a un hint visible
 * @param {Object} cell
 * @returns {boolean}
 */
export function hasVisibleHint(cell) {
  if (!cell) return false
  // hp > 0 signifie non creusée
  const notDug = cell.hp == null ? true : cell.hp > 0
  return hasHint(cell) && notDug
}

/**
 * Normalise la détection du hint
 * @param {Object} cell
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
 * Compte le nombre de cellules avec hint
 * @param {Array} cells - Liste des cellules
 * @returns {number}
 */
export function countHints(cells) {
  if (!Array.isArray(cells)) return 0
  return cells.filter((c) => hasHint(c) && (c.hp == null ? true : c.hp > 0)).length
}

/**
 * Crée une clé unique pour une cellule
 * @param {number} row
 * @param {number} col
 * @returns {string}
 */
export function cellKey(row, col) {
  return `${row}-${col}`
}

/**
 * Parse une clé de cellule
 * @param {string} key
 * @returns {{ row: number, col: number }}
 */
export function parseCellKey(key) {
  const [row, col] = key.split('-').map(Number)
  return { row, col }
}
