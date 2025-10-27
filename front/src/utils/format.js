// utils/format.js
// Utilitaires de formatage pour l'affichage des nombres

/**
 * Formate un nombre pour un affichage plus lisible
 * @param {number} num - Le nombre à formater
 * @param {number} decimals - Nombre de décimales (défaut: 1 pour les petits nombres, 0 pour les grands)
 * @returns {string} Le nombre formaté
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '0'

  const absNum = Math.abs(num)

  // Pour les nombres très petits (< 1), afficher avec 2 décimales
  if (absNum < 1 && absNum > 0) {
    return num.toFixed(2)
  }

  // Pour les nombres entre 1 et 1000, afficher normalement avec 1 décimale si nécessaire
  if (absNum < 1000) {
    return absNum % 1 === 0 ? absNum.toString() : num.toFixed(1)
  }

  // Pour les grands nombres, utiliser les suffixes K, M, B, T
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi']
  let suffixIndex = 0
  let formattedNum = absNum

  while (formattedNum >= 1000 && suffixIndex < suffixes.length - 1) {
    formattedNum /= 1000
    suffixIndex++
  }

  // Arrondir intelligemment
  let decimals = 1
  if (formattedNum >= 100) {
    decimals = 0
  } else if (formattedNum >= 10) {
    decimals = 1
  } else {
    decimals = 2
  }

  const formatted = formattedNum.toFixed(decimals)

  // Retirer les zéros inutiles à la fin
  const result = formatted.replace(/\.?0+$/, '')

  return (num < 0 ? '-' : '') + result + suffixes[suffixIndex]
}

/**
 * Formate un nombre d'oeufs spécifiquement (avec logique spéciale pour le mode apocalypse)
 * @param {number} eggs - Nombre d'oeufs
 * @param {boolean} isApocalypse - Si on est en mode apocalypse
 * @returns {string} Le nombre formaté
 */
export function formatEggs(eggs, isApocalypse = false) {
  if (isApocalypse) {
    // En mode apocalypse, afficher la valeur réelle (multipliée par 10)
    return formatNumber(eggs * 10)
  }
  return formatNumber(eggs)
}

/**
 * Formate un revenu par seconde
 * @param {number} income - Revenu par seconde
 * @returns {string} Le revenu formaté
 */
export function formatIncome(income) {
  if (income === null || income === undefined || isNaN(income)) return '0'

  const absIncome = Math.abs(income)

  // Pour les revenus très petits, afficher avec plus de précision
  if (absIncome < 0.01) {
    return income.toFixed(3)
  } else if (absIncome < 0.1) {
    return income.toFixed(2)
  } else if (absIncome < 1) {
    return income.toFixed(1)
  }

  return formatNumber(income)
}