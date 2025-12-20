/**
 * Utilitaires DSL pour l'évaluation des expressions de talents
 * Centralise l'évaluation des expressions mathématiques et la normalisation
 */

/**
 * Évalue une expression DSL { op, args } ou { var } ou un nombre
 * @param {Object|number|string} expr - Expression à évaluer
 * @param {Object} ctx - Contexte avec les variables disponibles
 * @returns {number} Valeur numérique résultante
 */
export function evalExpr(expr, ctx) {
  if (expr == null) return 0
  if (typeof expr === 'number') return expr
  if (typeof expr === 'string') {
    // Autoriser un string simple à représenter une variable
    return Number.isFinite(ctx[expr]) ? ctx[expr] : (ctx[expr] ?? 0)
  }
  if (typeof expr === 'object') {
    if (Object.prototype.hasOwnProperty.call(expr, 'var')) {
      const v = expr.var
      return Number.isFinite(ctx[v]) ? ctx[v] : (ctx[v] ?? 0)
    }
    const op = expr.op
    const args = Array.isArray(expr.args) ? expr.args : []
    const vals = args.map(a => evalExpr(a, ctx))
    switch (op) {
      case 'add': return vals.reduce((a, b) => a + b, 0)
      case 'sub': return vals.slice(1).reduce((a, b) => a - b, vals[0] || 0)
      case 'mul': return vals.reduce((a, b) => a * b, 1)
      case 'div': return vals.slice(1).reduce((a, b) => (b === 0 ? a : a / b), vals[0] || 0)
      case 'min': return Math.min(...vals)
      case 'max': return Math.max(...vals)
      default: return 0
    }
  }
  return 0
}

/**
 * Normalise une chaîne pour comparaison insensible à la casse et aux accents
 * @param {string} str - Chaîne à normaliser
 * @returns {string} Chaîne normalisée
 */
export function normalizeKey(str) {
  return (str || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
