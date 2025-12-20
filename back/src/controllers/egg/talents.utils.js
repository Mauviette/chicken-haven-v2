/**
 * Utilitaires pour le calcul des effets de talents (income, storage, conditions)
 */
import { especeData, talentsData } from '../../data/sharedGameData.js'
import { evalExpr, normalizeKey } from './dsl.utils.js'
import { computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme } from './teamStats.utils.js'

/**
 * Renvoie les entrées de talents actifs correspondants au nom demandé sur l'équipe
 * @param {Object} user - Document utilisateur
 * @param {string} targetTalentName - Nom du talent recherché
 * @returns {Array} Liste des entrées { especeId, niveauTalent }
 */
export function getActiveTalentEntries(user, targetTalentName) {
  const normTarget = normalizeKey(targetTalentName)
  const slots = user?.team?.slots || []
  const owned = user?.poulesPossedees || []
  const entries = []
  
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const talentName = normalizeKey(especeData[id]?.talent)
    if (talentName === normTarget) {
      const own = owned.find(p => p.especeId === id)
      const niveauTalent = Math.max(1, Number(own?.niveauTalent) || 1)
      entries.push({ especeId: id, niveauTalent })
    }
  }
  return entries
}

/**
 * Calcule les bonus d'income par seconde de tous les talents actifs
 * @param {Object} user - Document utilisateur
 * @param {number} stockageMax - Stockage maximum actuel
 * @returns {Object} { bonusPerSecond, breakdown }
 */
export function runTalentIncome(user, stockageMax) {
  const slots = user?.team?.slots || []
  const owned = user?.poulesPossedees || []
  
  let totalBonus = 0
  const breakdown = []

  // Précalculer les stats d'équipe une seule fois
  const teamEnergy = computeTeamEnergy(user)
  const teamIntelligence = computeTeamIntelligence(user)
  const teamCharisme = computeTeamCharisme(user)

  for (const slot of slots) {
    const especeId = slot?.especeId
    if (!especeId) continue

    const talentName = especeData[especeId]?.talent
    if (!talentName) continue

    const calc = talentsData?.[talentName]?.calculation
    if (!calc || !Array.isArray(calc.effects)) continue

    const ownedPoule = owned.find(p => p.especeId === especeId)
    const niveauTalent = Math.max(1, Number(ownedPoule?.niveauTalent) || 1)

    const ctx = { 
      niveau: niveauTalent, 
      teamEnergy, 
      teamIntelligence,
      teamCharisme,
      stockageMax
    }

    for (const effect of calc.effects) {
      if (effect?.type === 'income_bonus_per_second' && effect?.resource === 'eggs') {
        const amount = Number(evalExpr(effect.amount, ctx)) || 0
        totalBonus += amount
        breakdown.push({ 
          especeId, 
          talentName, 
          niveau: niveauTalent, 
          amount,
          context: { teamEnergy, teamIntelligence }
        })
      }
    }
  }

  return { bonusPerSecond: totalBonus, breakdown }
}

/**
 * Calcule les bonus de stockage de tous les talents actifs
 * @param {Object} user - Document utilisateur
 * @returns {Object} { storageBonus, storageMultiplier, breakdown }
 */
export function runTalentStorage(user) {
  const slots = user?.team?.slots || []
  const owned = user?.poulesPossedees || []
  
  let totalBonus = 0
  let storageMultiplier = 1
  const breakdown = []

  const teamEnergy = computeTeamEnergy(user)
  const teamIntelligence = computeTeamIntelligence(user)
  const teamCharisme = computeTeamCharisme(user)

  for (const slot of slots) {
    const especeId = slot?.especeId
    if (!especeId) continue

    const talentName = especeData[especeId]?.talent
    if (!talentName) continue

    const calc = talentsData?.[talentName]?.calculation
    if (!calc || !Array.isArray(calc.effects)) continue

    const ownedPoule = owned.find(p => p.especeId === especeId)
    const niveauTalent = Math.max(1, Number(ownedPoule?.niveauTalent) || 1)

    const ctx = { 
      niveau: niveauTalent, 
      teamEnergy, 
      teamIntelligence,
      teamCharisme
    }

    for (const effect of calc.effects) {
      if (effect?.type === 'storage_bonus' && (effect?.resource === 'eggs' || effect?.resource == null)) {
        const amount = Number(evalExpr(effect.amount, ctx)) || 0
        totalBonus += amount
        breakdown.push({ 
          especeId, 
          talentName, 
          niveau: niveauTalent, 
          amount,
          kind: 'add',
          context: { teamEnergy, teamIntelligence, teamCharisme }
        })
      } else if (effect?.type === 'storage_multiplier') {
        const mult = Number(evalExpr(effect.amount, ctx)) || 1
        if (mult > 0) {
          storageMultiplier *= mult
          breakdown.push({
            especeId,
            talentName,
            niveau: niveauTalent,
            amount: mult,
            kind: 'mult'
          })
        }
      }
    }
  }

  return { storageBonus: totalBonus, storageMultiplier, breakdown }
}

/**
 * Évalue un talent avec conditions (comme Chanceuse) de manière générique
 * @param {Object} user - Document utilisateur
 * @param {string} talentName - Nom du talent
 * @param {Object} context - Contexte additionnel (eggsGained, stockageMax, etc.)
 * @returns {Object} { proc, effects, procChance, pSingle, roll }
 */
export function runTalentWithConditions(user, talentName, context = {}) {
  const calc = talentsData?.[talentName]?.calculation
  let defaultPSingle = 0.01
  let defaultRoll = Math.random()
  
  if (!calc) return { proc: false, effects: [], procChance: 0, pSingle: defaultPSingle, roll: defaultRoll }

  const slots = user?.team?.slots || []
  const owned = user?.poulesPossedees || []
  
  const activeTalents = []
  for (const slot of slots) {
    const especeId = slot?.especeId
    if (!especeId) continue
    
    const espece = especeData[especeId]
    if (normalizeKey(espece?.talent) === normalizeKey(talentName) || especeId === 'blanchonette') {
      const ownedPoule = owned.find(p => p.especeId === especeId)
      const niveauTalent = Math.max(1, Number(ownedPoule?.niveauTalent) || 1)
      activeTalents.push({ especeId, niveauTalent })
    }
  }

  if (activeTalents.length === 0) {
    return { proc: false, effects: [], procChance: 0, pSingle: defaultPSingle, roll: defaultRoll }
  }

  const talent = activeTalents[0]
  const ctx = { 
    niveau: talent.niveauTalent, 
    teamEnergy: computeTeamEnergy(user),
    teamIntelligence: computeTeamIntelligence(user),
    ...context 
  }

  let procChance = 0
  let pSingle = defaultPSingle
  const conditions = calc.conditions || []
  
  for (const condition of conditions) {
    if (condition?.type === 'random_chance') {
      pSingle = Number(condition.value)
      if (!Number.isFinite(pSingle)) pSingle = defaultPSingle
      if (pSingle > 1) pSingle = pSingle / 100
      
      const eggsGained = Number(context.eggsGained) || 0
      if ((calc.combine || 'independent') === 'linear') {
        procChance = Math.min(eggsGained * pSingle, 1)
      } else {
        procChance = 1 - Math.pow(1 - pSingle, eggsGained)
      }
      break
    }
  }

  const roll = defaultRoll
  const proc = roll < procChance

  const effects = []
  if (proc) {
    for (const effect of (calc.effects || [])) {
      if (effect?.type === 'visual_effect') {
        effects.push({ type: 'visual_effect', effect: effect.effect, amount: effect.amount ?? 0 })
      } else if (effect?.type === 'resource' && effect?.resource === 'eggs') {
        const amount = Math.floor(Math.max(0, Number(evalExpr(effect.amount, ctx)) || 0))
        effects.push({ type: 'resource', resource: 'eggs', amount })
      }
    }
  }

  return { proc, effects, procChance, pSingle, roll }
}
