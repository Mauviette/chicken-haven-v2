/**
 * Utilitaires de calcul pour les spawnables
 */
import { runTalentStorage } from '../egg.controller.js'

/**
 * Évalue une expression DSL
 * @param {*} expr - Expression à évaluer
 * @param {Object} ctx - Contexte de variables
 * @returns {number}
 */
export function evalExpr(expr, ctx) {
  if (expr == null) return 0
  if (typeof expr === 'number') return expr
  if (typeof expr === 'string') return Number.isFinite(ctx[expr]) ? ctx[expr] : (ctx[expr] ?? 0)
  if (typeof expr === 'object') {
    if (Object.prototype.hasOwnProperty.call(expr, 'var')) {
      return ctx[expr.var] ?? 0
    }
    const op = expr.op
    const args = Array.isArray(expr.args) ? expr.args : []
    const vals = args.map(a => evalExpr(a, ctx))
    switch (op) {
      case 'add': return vals.reduce((a, b) => a + b, 0)
      case 'mul': return vals.reduce((a, b) => a * b, 1)
      case 'div': return vals[1] !== 0 ? vals[0] / vals[1] : 0
      case 'sub': return vals[0] - (vals[1] || 0)
      default: return 0
    }
  }
  return 0
}

/**
 * Calcule les multiplicateurs des buffs actifs
 * @param {Object} user - Utilisateur
 * @returns {Object} - Multiplicateurs
 */
export function computeActiveBuffMultipliers(user) {
  const buffs = user.buffs || []
  const now = Date.now()
  
  const activeBuffs = buffs.filter(buff => 
    buff.lasts_until && new Date(buff.lasts_until).getTime() > now
  )
  
  const multipliers = {
    income: 1,
    storage: 1,
    production: 1,
    teamStat: { intelligence: 1, energie: 1, charisme: 1 }
  }
  
  for (const buff of activeBuffs) {
    const operation = buff.buff?.operation || 'mult'
    const amount = parseFloat(buff.buff?.amount) || 1
    const type = buff.buff_type || 'income'
    
    if (operation === 'mult') {
      switch (type) {
        case 'income':
        case 'income_multiplier':
          multipliers.income *= amount
          break
        case 'storage':
        case 'storage_multiplier':
          multipliers.storage *= amount
          break
        case 'production':
        case 'production_multiplier':
          multipliers.production *= amount
          break
        case 'team_stat_intelligence':
          multipliers.teamStat.intelligence *= amount
          break
        case 'team_energie':
          multipliers.teamStat.energie *= amount
          break
        case 'team_charisme':
          multipliers.teamStat.charisme *= amount
          break
      }
    }
  }
  
  return multipliers
}

/**
 * Calcule le stockage total de l'utilisateur
 * @param {Object} user - Utilisateur
 * @returns {number}
 */
export function calculateTotalStorage(user) {
  const baseMaxIncome = user.clickableEgg?.maxIncome || 100
  const storageBonus = runTalentStorage(user)
  const buffMultipliers = computeActiveBuffMultipliers(user)
  
  return Math.max(0, (baseMaxIncome + storageBonus.storageBonus) * storageBonus.storageMultiplier * buffMultipliers.storage)
}

/**
 * Construit le contexte d'évaluation pour les expressions
 * @param {Object} user - Utilisateur
 * @param {number} niveau - Niveau du talent
 * @param {Object} teamStats - Stats d'équipe { energy, intelligence, charisme }
 * @returns {Object}
 */
export function buildEvaluationContext(user, niveau, teamStats) {
  const totalStorage = calculateTotalStorage(user)
  
  return {
    niveau,
    stockageMax: totalStorage,
    teamEnergy: teamStats.energy,
    teamIntelligence: teamStats.intelligence,
    teamCharisme: teamStats.charisme
  }
}
