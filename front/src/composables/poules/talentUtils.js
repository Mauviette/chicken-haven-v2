/**
 * Utilitaires pour le système de talents des poules
 */

/**
 * Récupère le niveau de talent d'une poule
 * @param {Object} poule - La poule
 * @returns {number} - Niveau du talent (0 si non possédée)
 */
export function getTalentLevel(poule) {
  if (!poule) return 0
  
  const missingOrZero = (poule.niveauTalent == null || poule.niveauTalent === 0)
  if (missingOrZero) {
    // 1) possédée: niveau 1 par défaut
    if (poule.owned) return 1
    // 2) ou bien déjà équipée dans l'équipe
    try {
      const slots = Array.isArray(window.__teamSlotsCached) ? window.__teamSlotsCached : []
      if (slots.some(s => s?.especeId === poule.especeId)) return 1
    } catch (_) {}
  }
  return poule.niveauTalent || 0
}

/**
 * Vérifie si le talent d'une poule est débloqué
 * @param {Object} poule - La poule
 * @returns {boolean} - true si le talent est débloqué
 */
export function isTalentUnlocked(poule) {
  return poule && poule.owned
}

/**
 * Convertit un niveau de talent en chiffre romain
 * @param {Object} poule - La poule (ou objet avec niveauTalent)
 * @returns {string} - Niveau en chiffres romains
 */
export function getTalentLevelRoman(poule) {
  const niveau = getTalentLevel(poule)
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']
  return romanNumerals[niveau - 1] || '???'
}

/**
 * Évalue les expressions mathématiques dans un template d'effet
 * @param {string} template - Template avec expressions {niveau*0.2}
 * @param {number} niveau - Niveau actuel du talent
 * @returns {string} - Template avec valeurs calculées
 */
export function evaluateEffectTemplate(template, niveau) {
  if (typeof template !== 'string') return template
  
  // Remplacer {niveau} par la valeur actuelle
  let result = template.replace(/\{niveau\}/g, niveau)
  
  // Évaluer les expressions mathématiques simples
  result = result.replace(/\{([^}]+)\}/g, (match, expr) => {
    try {
      const cleanExpr = expr.replace(/niveau/g, niveau)
      if (/^[\d+\-*/.() ]+$/.test(cleanExpr)) {
        const value = Function('"use strict"; return (' + cleanExpr + ')')()
        return Number.isInteger(value) ? value.toString() : value.toFixed(2)
      }
      return match
    } catch (e) {
      return match
    }
  })
  
  return result
}
