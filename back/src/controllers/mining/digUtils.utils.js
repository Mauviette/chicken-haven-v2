/**
 * Utilitaires pour le système de dig (creusement) du minage
 */
import { miningData } from '../../data/sharedGameData.js'

const MINING_CONFIG = miningData

/**
 * Applique les dégâts en chaîne aux cases adjacentes
 * @param {Array} cells - Tableau des cellules de la grille
 * @param {number} row - Ligne de la case source
 * @param {number} col - Colonne de la case source
 * @param {number} chainDamage - Dégâts à appliquer
 * @param {Array} newRewards - Tableau des nouvelles récompenses à remplir
 * @param {Array} rewards - Tableau global des récompenses
 * @param {Set} processedCells - Ensemble des cellules déjà traitées
 * @returns {number} - Nombre de cases cassées par la réaction en chaîne
 */
export function applyChainDamage(cells, row, col, chainDamage, newRewards, rewards, processedCells = new Set()) {
  const cellKey = `${row}-${col}`
  
  // Éviter de retraiter la même case
  if (processedCells.has(cellKey)) return 0
  processedCells.add(cellKey)
  
  let chainBroken = 0
  
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1] // haut, bas, gauche, droite
  ]
  
  for (const [dr, dc] of directions) {
    const newRow = row + dr
    const newCol = col + dc
    
    // Vérifier que la case est dans les limites de la grille (5x5)
    if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5) {
      const adjacentCell = cells.find(c => c.row === newRow && c.col === newCol)
      
      if (adjacentCell && adjacentCell.hp > 0) {
        adjacentCell.hp = Math.max(0, adjacentCell.hp - chainDamage)
        
        // Si cette case adjacente est détruite par la réaction en chaîne
        if (adjacentCell.hp === 0) {
          chainBroken++
          
          if (adjacentCell.reward) {
            newRewards.push(adjacentCell.reward)
            rewards.push(adjacentCell.reward)
          }
          
          // Propagation récursive de la réaction en chaîne
          chainBroken += applyChainDamage(cells, newRow, newCol, chainDamage, newRewards, rewards, processedCells)
        }
      }
    }
  }
  
  return chainBroken
}

/**
 * Calcule les cases affectées par un outil selon son pattern
 * @param {Object} tool - Configuration de l'outil
 * @param {number} row - Ligne ciblée
 * @param {number} col - Colonne ciblée
 * @param {number} toolDamageAdd - Bonus de dégâts des artefacts
 * @returns {Array} - Liste des cases affectées avec leurs dégâts
 */
export function calculateAffectedCells(tool, row, col, toolDamageAdd = 0) {
  const affectedCells = []
  
  // secondary_damage correspond aux dégâts sur les cases autres que la case cliquée (fallback = 1)
  const secondaryDamage = (typeof tool.secondary_damage === 'number') ? tool.secondary_damage : 1
  const centerDamage = tool.damage + toolDamageAdd
  
  if (tool.pattern === 'single') {
    affectedCells.push({ row, col, damage: centerDamage })
  } else if (tool.pattern === 'cross') {
    affectedCells.push({ row, col, damage: centerDamage })
    affectedCells.push({ row: row - 1, col, damage: secondaryDamage })
    affectedCells.push({ row: row + 1, col, damage: secondaryDamage })
    affectedCells.push({ row, col: col - 1, damage: secondaryDamage })
    affectedCells.push({ row, col: col + 1, damage: secondaryDamage })
  } else if (tool.pattern === 'square') {
    // 3x3 centered on (row, col) : centre reçoit tool.damage (+artifact), voisins reçoivent secondaryDamage
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr
        const c = col + dc
        const isCenter = (dr === 0 && dc === 0)
        const base = isCenter ? centerDamage : secondaryDamage
        affectedCells.push({ row: r, col: c, damage: base })
      }
    }
  }
  
  return affectedCells
}

/**
 * Retourne la configuration d'un outil par son type
 * @param {string} toolType - Type de l'outil
 * @returns {Object|null} - Configuration de l'outil ou null
 */
export function getToolConfig(toolType) {
  return MINING_CONFIG.tools[toolType] || null
}

/**
 * Applique les récompenses collectées aux ressources de l'utilisateur
 * @param {Object} userResources - Objet des ressources de l'utilisateur (sera modifié)
 * @param {Array<string>} rewards - Liste des récompenses au format "type:amount"
 */
export function applyRewardsToResources(userResources, rewards) {
  const resourceTypes = [
    'eggs', 'mining_token', 'stock_token', 'production_token', 
    'chest_key', 'precious_stone', 'rotten_tomato'
  ]
  
  for (const reward of rewards) {
    const [type, amount] = (reward || '').split(':')
    const amt = parseInt(amount) || 0
    if (!type) continue
    
    if (resourceTypes.includes(type)) {
      userResources[type] = (userResources[type] || 0) + amt
    }
  }
}

/**
 * Compte les tomates pourries dans une liste de récompenses
 * @param {Array<string>} rewards - Liste des récompenses
 * @returns {number} - Nombre de tomates pourries
 */
export function countRottenTomatoes(rewards) {
  return (rewards || []).filter(reward => (reward || '').startsWith('rotten_tomato:')).length
}
