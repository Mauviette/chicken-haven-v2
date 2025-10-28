// utils/format.js
// Utilitaires de formatage pour l'affichage des nombres

/**
 * Formate un nombre pour un affichage plus lisible
 * @param {number} num - Le nombre à formater
 * @param {boolean} forceInteger - Si true, force l'affichage sans décimales même pour les grands nombres
 * @returns {string} Le nombre formaté
 */
export function formatNumber(num, forceInteger = false) {
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
  let decimals = forceInteger ? 0 : 1
  if (!forceInteger) {
    if (formattedNum >= 100) {
      decimals = 0
    } else if (formattedNum >= 10) {
      decimals = 1
    } else {
      decimals = 2
    }
  }

  // Formater avec le bon nombre de décimales
  let result
  if (decimals === 0) {
    result = Math.round(formattedNum).toString()
  } else {
    const formatted = formattedNum.toFixed(decimals)
    // Retirer les zéros inutiles à la fin
    result = formatted.replace(/\.?0+$/, '')
  }

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
    return formatNumber(eggs * 10, true)
  }
  return formatNumber(eggs, true)
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