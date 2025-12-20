/**
 * Utilitaires pour le calcul des statistiques d'équipe
 * Gère l'énergie, l'intelligence et le charisme de l'équipe
 */
import { especeData, talentsData } from '../../data/sharedGameData.js'
import { evalExpr, normalizeKey } from './dsl.utils.js'
import { computeActiveBuffMultipliers } from './buffs.utils.js'

/**
 * Agrège tous les buffs de stats d'équipe depuis le DSL (type: 'stat_buff', target: 'team')
 * @param {Object} user - Document utilisateur
 * @returns {Object} { intelligence, energie, charisme }
 */
export function aggregateTeamStatBuffs(user) {
  const slots = user?.team?.slots || []
  const owned = user?.poulesPossedees || []
  const result = { intelligence: 0, energie: 0, charisme: 0 }

  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const talentName = especeData[id]?.talent
    if (!talentName) continue
    const calc = talentsData?.[talentName]?.calculation
    if (!calc || !Array.isArray(calc.effects)) continue

    const own = owned.find(p => p.especeId === id)
    const niveauTalent = Math.max(1, Number(own?.niveauTalent) || 1)
    const ctx = { niveau: niveauTalent }

    for (const eff of calc.effects) {
      if (!eff || eff.type !== 'stat_buff') continue
      if (eff.target && eff.target !== 'team') continue
      const stats = eff.stats || {}
      for (const key of ['intelligence', 'energie', 'charisme']) {
        const expr = stats?.[key]
        if (expr != null) {
          const delta = Number(evalExpr(expr, ctx)) || 0
          result[key] += delta
        }
      }
    }
  }

  return result
}

/**
 * Applique les effets de transfert de stats (comme le Barbare) aux stats finales
 * @param {Object} user - Document utilisateur
 * @param {Object} stats - Objet stats mutable { intelligence, energie, charisme }
 */
export function applyStatTransfers(user, stats) {
  const slots = user?.team?.slots || []
  
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const talentName = especeData[id]?.talent
    if (!talentName) continue
    const calc = talentsData?.[talentName]?.calculation
    if (!calc || !Array.isArray(calc.effects)) continue

    for (const eff of calc.effects) {
      if (!eff || eff.type !== 'stat_transfer') continue
      if (eff.operation === 'transfer_all') {
        const fromStat = eff.from_stat
        const toStat = eff.to_stat
        const amount = stats[fromStat] || 0
        stats[fromStat] = 0
        stats[toStat] = (stats[toStat] || 0) + amount
      }
    }
  }
}

/**
 * Calcule les buffs personnels (target: 'me') d'une poule équipée donnée
 * @param {Object} user - Document utilisateur
 * @param {string} especeId - ID de l'espèce
 * @returns {Object} { intelligence, energie, charisme }
 */
export function computeSelfStatBuff(user, especeId) {
  const result = { intelligence: 0, energie: 0, charisme: 0 }
  if (!especeId) return result

  try {
    const talentName = especeData[especeId]?.talent
    if (!talentName) return result
    const calc = talentsData?.[talentName]?.calculation
    if (!calc || !Array.isArray(calc.effects)) return result

    const owned = user?.poulesPossedees || []
    const own = owned.find(p => p.especeId === especeId)
    const niveauTalent = Math.max(1, Number(own?.niveauTalent) || 1)
    const ctx = { niveau: niveauTalent }

    for (const eff of calc.effects) {
      if (!eff || eff.type !== 'stat_buff') continue
      if ((eff.target || 'me') !== 'me') continue
      const stats = eff.stats || {}
      for (const key of ['intelligence', 'energie', 'charisme']) {
        if (stats[key] != null) {
          result[key] += Number(evalExpr(stats[key], ctx)) || 0
        }
      }
    }
  } catch (_) { /* no-op */ }

  return result
}

/**
 * Calcule l'énergie totale de l'équipe
 * @param {Object} user - Document utilisateur
 * @returns {number} Énergie totale
 */
export function computeTeamEnergy(user) {
  const slots = user?.team?.slots || []
  let totalBase = 0
  const members = []
  
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const e = especeData[id]
    const energy = Number(e?.stats?.energie) || 0
    const selfBuff = computeSelfStatBuff(user, id)
    totalBase += energy + (Number(selfBuff.energie) || 0)
    members.push(id)
  }

  const buffs = aggregateTeamStatBuffs(user)
  const extraPerMember = Number(buffs?.energie || 0)
  const extraTotal = extraPerMember * members.length
  const tempMult = computeActiveBuffMultipliers(user).teamStat.energie || 1
  
  let finalStats = {
    intelligence: 0,
    energie: (totalBase + extraTotal) * tempMult,
    charisme: 0
  }
  
  applyStatTransfers(user, finalStats)
  
  return finalStats.energie
}

/**
 * Calcule l'intelligence totale de l'équipe
 * @param {Object} user - Document utilisateur
 * @returns {number} Intelligence totale
 */
export function computeTeamIntelligence(user) {
  const slots = user?.team?.slots || []
  let totalBase = 0
  const members = []
  
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const e = especeData[id]
    const intelligence = Number(e?.stats?.intelligence) || 0
    const selfBuff = computeSelfStatBuff(user, id)
    totalBase += intelligence + (Number(selfBuff.intelligence) || 0)
    members.push(id)
  }

  const buffs = aggregateTeamStatBuffs(user)
  const extraPerMember = Number(buffs?.intelligence || 0)
  const extraTotal = extraPerMember * members.length
  const tempMult = computeActiveBuffMultipliers(user).teamStat.intelligence || 1
  
  let finalStats = {
    intelligence: (totalBase + extraTotal) * tempMult,
    energie: 0,
    charisme: 0
  }
  
  applyStatTransfers(user, finalStats)
  
  return finalStats.intelligence
}

/**
 * Calcule le charisme total de l'équipe
 * @param {Object} user - Document utilisateur
 * @returns {number} Charisme total
 */
export function computeTeamCharisme(user) {
  const slots = user?.team?.slots || []
  let totalBase = 0
  const members = []
  
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const e = especeData[id]
    const charisme = Number(e?.stats?.charisme) || 0
    const selfBuff = computeSelfStatBuff(user, id)
    totalBase += charisme + (Number(selfBuff.charisme) || 0)
    members.push(id)
  }

  const buffs = aggregateTeamStatBuffs(user)
  const extraPerMember = Number(buffs?.charisme || 0)
  const extraTotal = extraPerMember * members.length
  const tempMult = computeActiveBuffMultipliers(user).teamStat.charisme || 1
  
  let finalStats = {
    intelligence: 0,
    energie: 0,
    charisme: (totalBase + extraTotal) * tempMult
  }
  
  applyStatTransfers(user, finalStats)
  
  return finalStats.charisme
}
