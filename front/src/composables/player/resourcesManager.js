/**
 * Gestion des ressources du joueur (œufs, tokens, etc.)
 */
import {
  eggs,
  stockTokens,
  productionTokens,
  wildTokens,
  chestKeys,
  miningTokens,
  preciousStones,
  rottenTomatoes
} from './playerState.js'

/**
 * Ajoute des œufs
 * @param {number} n - Nombre d'œufs à ajouter
 */
export function addEggs(n) {
  eggs.value += n
}

/**
 * Dépense des œufs si le joueur en a assez
 * @param {number} n - Nombre d'œufs à dépenser
 * @returns {boolean} - true si la dépense a réussi
 */
export function spendEggs(n) {
  if (eggs.value >= n) {
    eggs.value -= n
    return true
  }
  return false
}

/**
 * Définit le nombre d'œufs
 * @param {number} n - Nouveau nombre d'œufs
 */
export function setEggs(n) {
  eggs.value = n
}

/**
 * Ajoute des tokens d'un type donné
 * @param {string} type - Type de token
 * @param {number} amount - Quantité à ajouter
 */
export function addTokens(type, amount) {
  const tokenRefs = {
    'stock_token': stockTokens,
    'production_token': productionTokens,
    'wild_token': wildTokens,
    'chest_key': chestKeys,
    'mining_token': miningTokens,
    'precious_stone': preciousStones,
    'rotten_tomato': rottenTomatoes
  }
  
  const ref = tokenRefs[type]
  if (ref) {
    ref.value += amount
  }
}

/**
 * Dépense des tokens d'un type donné
 * @param {string} type - Type de token
 * @param {number} amount - Quantité à dépenser
 * @returns {boolean} - true si la dépense a réussi
 */
export function spendTokens(type, amount) {
  const tokenRefs = {
    'stock_token': stockTokens,
    'production_token': productionTokens,
    'wild_token': wildTokens,
    'chest_key': chestKeys,
    'mining_token': miningTokens,
    'precious_stone': preciousStones,
    'rotten_tomato': rottenTomatoes
  }
  
  const ref = tokenRefs[type]
  if (ref && ref.value >= amount) {
    ref.value -= amount
    return true
  }
  return false
}

/**
 * Vérifie si le joueur peut se permettre un prix
 * @param {number|Object} price - Prix (nombre d'œufs ou objet {type, count})
 * @returns {boolean} - true si le joueur peut payer
 */
export function canAfford(price) {
  if (typeof price === 'number') {
    return eggs.value >= price
  }
  
  const resourceRefs = {
    'eggs': eggs,
    'stock_token': stockTokens,
    'production_token': productionTokens,
    'wild_token': wildTokens,
    'chest_key': chestKeys,
    'mining_token': miningTokens,
    'precious_stone': preciousStones,
    'rotten_tomato': rottenTomatoes
  }
  
  const ref = resourceRefs[price.type]
  return ref ? ref.value >= price.count : false
}
