import User from '../models/User.js'
import { updateAchievementProgress } from './achievements.controller.js'
import { especeData, talentsData } from '../data/sharedGameData.js'
import { saveWithRetry } from '../utils/mongoUtils.js'

// Évalue une expression DSL { op, args } ou { var } ou un nombre
function evalExpr(expr, ctx) {
  if (expr == null) return 0
  if (typeof expr === 'number') return expr
  if (typeof expr === 'string') {
    // autoriser un string simple à représenter une variable
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

// Normalise une chaîne pour comparaison insensible à la casse et aux accents
function normalizeKey(str) {
  return (str || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Calcule l'énergie totale de l'équipe (somme des stats energie des poules équipées)
export function computeTeamEnergy(user) {
  const slots = user?.team?.slots || []
  let totalBase = 0
  const members = []
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const e = especeData[id]
    const energy = Number(e?.stats?.energie) || 0
    // Buffs personnels (target: 'me') appliqués à ce membre
    const selfBuff = computeSelfStatBuff(user, id)
    totalBase += energy + (Number(selfBuff.energie) || 0)
    members.push(id)
  }

  // Appliquer tous les buffs de stats provenant du DSL (target: 'team')
  const buffs = aggregateTeamStatBuffs(user)
  const extraPerMember = Number(buffs?.energie || 0)
  const extraTotal = extraPerMember * members.length
  const tempMult = computeActiveBuffMultipliers(user).teamStat.energie || 1
  return (totalBase + extraTotal) * tempMult
}

// Calcule l'intelligence totale de l'équipe (somme des stats intelligence des poules équipées)
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

  // Appliquer tous les buffs de stats provenant du DSL (target: 'team')
  const buffs = aggregateTeamStatBuffs(user)
  const extraPerMember = Number(buffs?.intelligence || 0)
  const extraTotal = extraPerMember * members.length
  const tempMult = computeActiveBuffMultipliers(user).teamStat.intelligence || 1
  return (totalBase + extraTotal) * tempMult
}

// Calcule le charisme total de l'équipe (somme des stats charisme des poules équipées)
export function computeTeamCharisme(user) {
  const slots = user?.team?.slots || []
  let totalBase = 0
  const members = []
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const e = especeData[id]
    const charisme = Number(e?.stats?.charisme) || 0
    // Intégrer les buffs personnels (ex: Majestueuse: target 'me')
    const selfBuff = computeSelfStatBuff(user, id)
    totalBase += charisme + (Number(selfBuff.charisme) || 0)
    members.push(id)
  }

  // Appliquer tous les buffs de stats provenant du DSL (target: 'team')
  const buffs = aggregateTeamStatBuffs(user)
  const extraPerMember = Number(buffs?.charisme || 0)
  const extraTotal = extraPerMember * members.length
  const tempMult = computeActiveBuffMultipliers(user).teamStat.charisme || 1
  return (totalBase + extraTotal) * tempMult
}

// Renvoie les entrées de talents actifs correspondants au nom demandé sur l'équipe
function getActiveTalentEntries(user, targetTalentName) {
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

// Agrège tous les buffs de stats d'équipe depuis le DSL (type: 'stat_buff', target: 'team')
function aggregateTeamStatBuffs(user) {
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
      // Pour chaque stat supportée, évaluer l'expression si présente
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

// Calcule les buffs personnels (target: 'me') d'une poule équipée donnée
function computeSelfStatBuff(user, especeId) {
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

// Calcule les multiplicateurs des buffs temporaires actifs
function computeActiveBuffMultipliers(user) {
  const buffs = user.buffs || []
  const now = Date.now()
  
  // Filtrer les buffs actifs
  const activeBuffs = buffs.filter(buff => 
    buff.lasts_until && new Date(buff.lasts_until).getTime() > now
  )
  
  const multipliers = {
    income: 1,
    storage: 1,
    production: 1,
    teamStat: { intelligence: 1, energie: 1, charisme: 1 }
  }
  
  // Appliquer les buffs multiplicatifs
  for (const buff of activeBuffs) {
    const operation = buff.buff?.operation || 'mult'
    const amount = parseFloat(buff.buff?.amount) || 1
    const type = buff.buff_type || 'income'
    
    if (operation === 'mult') {
      // Mapper les types de buffs aux catégories
      switch (type) {
        case 'income':
        case 'income_multiplier':
          multipliers.income *= amount
          break
        case 'storage':
          multipliers.storage *= amount
          break
        case 'production':
          multipliers.production *= amount
          break
        case 'team_stat_intelligence':
          multipliers.teamStat.intelligence *= amount
          break
        case 'team_stat_energie':
          multipliers.teamStat.energie *= amount
          break
        case 'team_stat_charisme':
          multipliers.teamStat.charisme *= amount
          break
      }
    }
  }
  
  return multipliers
}

// Calcule les bonus d'income par seconde de tous les talents actifs
function runTalentIncome(user) {
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

    // Contexte pour l'évaluation DSL
    const ctx = { 
      niveau: niveauTalent, 
      teamEnergy, 
      teamIntelligence,
      teamCharisme
    }

    // Chercher tous les effets income_bonus_per_second sur eggs
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

// Évalue un talent avec conditions (comme Chanceuse) de manière générique
function runTalentWithConditions(user, talentName, context = {}) {
  const calc = talentsData?.[talentName]?.calculation
  // Valeurs par défaut sûres
  let defaultPSingle = 0.01
  let defaultRoll = Math.random()
  if (!calc) return { proc: false, effects: [], procChance: 0, pSingle: defaultPSingle, roll: defaultRoll }

  // Trouver les poules avec ce talent dans l'équipe
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

  // Pour l'instant, on prend le premier talent trouvé (on peut étendre plus tard)
  const talent = activeTalents[0]
  const ctx = { 
    niveau: talent.niveauTalent, 
    teamEnergy: computeTeamEnergy(user),
    teamIntelligence: computeTeamIntelligence(user),
    ...context 
  }

  // Évaluer les conditions
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

// Calcule les bonus de stockage de tous les talents actifs
export function runTalentStorage(user) {
  const slots = user?.team?.slots || []
  const owned = user?.poulesPossedees || []
  
  let totalBonus = 0
  let storageMultiplier = 1
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

    // Contexte pour l'évaluation DSL
    const ctx = { 
      niveau: niveauTalent, 
      teamEnergy, 
      teamIntelligence,
      teamCharisme
    }

    // Chercher effets relatifs au stockage
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

// GET /api/egg/status - Récupère le statut actuel de l'œuf cliquable
export async function getEggStatus(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Initialiser clickableEgg si nécessaire
    if (!user.clickableEgg) {
      user.clickableEgg = {
        lastClick: new Date(),
        income: 1,
        maxIncome: 30,
        currentStocked: 0
      }
      await saveWithRetry(user)
    }

    // Si lastClick n'est pas défini ou est une fonction, l'initialiser
    if (!user.clickableEgg.lastClick || typeof user.clickableEgg.lastClick === 'function') {
      user.clickableEgg.lastClick = new Date()
      await saveWithRetry(user)
    }

    const now = new Date()
    const lastClick = user.clickableEgg.lastClick
    const baseIncome = user.clickableEgg.income || 1
    const maxIncome = user.clickableEgg.maxIncome || 30
    
    /*console.log('DEBUG - getEggStatus:')
    console.log('  now:', now)
    console.log('  lastClick:', lastClick)
    console.log('  baseIncome:', baseIncome)
    console.log('  maxIncome:', maxIncome)*/

    // Talents passifs
    const incomeBonus = runTalentIncome(user)
  const storageBonus = runTalentStorage(user)
    
    // Appliquer les buffs temporaires
    const buffMultipliers = computeActiveBuffMultipliers(user)
    
    const effectiveIncome = Math.max(0, (baseIncome + incomeBonus.bonusPerSecond) * buffMultipliers.income)
  const effectiveMaxIncome = Math.max(0, (maxIncome + storageBonus.storageBonus) * storageBonus.storageMultiplier * buffMultipliers.storage)
    
    /*console.log(`  income talents: totalBonus=${incomeBonus.bonusPerSecond}`)
    console.log(`  storage talents: totalBonus=${storageBonus.storageBonus}`)
    console.log(`  effective: income=${effectiveIncome}, maxIncome=${effectiveMaxIncome}`)*/

    // Calculer les gains actuels basés sur le temps écoulé
  const timeDiffSeconds = Math.floor((now - lastClick) / 1000)
  const currentStocked = Math.min(timeDiffSeconds * effectiveIncome, effectiveMaxIncome)
    
    /*console.log('  timeDiffSeconds:', timeDiffSeconds)
    console.log('  currentStocked:', currentStocked)*/

    res.json({
      income: effectiveIncome,
      maxIncome: effectiveMaxIncome,
      currentStocked,
      lastClick,
      totalEggs: user.resources?.eggs || 0,
      stockTokens: user.resources?.stock_token || 0,
      productionTokens: user.resources?.production_token || 0,
      wildTokens: user.resources?.wild_token || 0,
      chestKeys: user.resources?.chest_key || 0,
      // Optionnel: debug serveur pour le front si besoin
      incomeBonus: { bonusPerSecond: incomeBonus.bonusPerSecond, breakdown: incomeBonus.breakdown },
  storageBonus: { storageBonus: storageBonus.storageBonus, storageMultiplier: storageBonus.storageMultiplier, breakdown: storageBonus.breakdown },
      cooldowns: user.cooldowns || {}
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/egg/click - Gère le clic sur l'œuf
export async function clickEgg(req, res) {
  try {
    const user = await User.findById(req.userId) 
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const now = new Date()
    const lastClick = user.clickableEgg?.lastClick
    const baseIncome = user.clickableEgg?.income
    const maxIncome = user.clickableEgg?.maxIncome

    if (lastClick == null || baseIncome == null || maxIncome == null) return res.status(404).json({ error: 'Données incomplètes' })
    
    // Calculer les gains actuels
  const timeDiffSeconds = Math.floor((now - lastClick) / 1000)
    // Talents passifs
    const incomeBonus = runTalentIncome(user)
  const storageBonus = runTalentStorage(user)
    
    // Appliquer les buffs temporaires
    const buffMultipliers = computeActiveBuffMultipliers(user)
    
    const effectiveIncome = Math.max(0, (baseIncome + incomeBonus.bonusPerSecond) * buffMultipliers.income)
  const effectiveMaxIncome = Math.max(0, (maxIncome + storageBonus.storageBonus) * storageBonus.storageMultiplier * buffMultipliers.storage)
  const currentStocked = Math.min(timeDiffSeconds * effectiveIncome, effectiveMaxIncome)

    // Log d'entrée côté serveur pour faciliter le debug
    try {
      console.log(`[Egg] clickEgg called for user=${user.username || user._id} at ${now.toISOString()}`)
      console.log(`       timeDiffSeconds=${timeDiffSeconds}, baseIncome=${baseIncome}, incomeBonus=${incomeBonus.bonusPerSecond}, storageBonus=${storageBonus.storageBonus}`)
      console.log(`       effectiveIncome=${effectiveIncome}, effectiveMaxIncome=${effectiveMaxIncome}, currentStocked=${currentStocked}`)
    } catch (_) { /* no-op */ }

    // Vérifier si l'œuf est cliquable (income >= 1)
    //if (income < 1) {
    //  return res.status(400).json({ error: 'Income insuffisant pour cliquer' })
    //}

    // Vérifier s'il y a des gains à collecter
    if (currentStocked < 1) {
      console.log('[Egg] clickEgg: Pas assez de gains à collecter (currentStocked < 1)')
      return res.status(400).json({ error: 'Pas assez de gains à collecter' })
    }

    // Mettre à jour les ressources et réinitialiser le timer
    const currentEggs = user.resources?.eggs || 0
    const eggsGained = Math.floor(currentStocked)
    user.resources = user.resources || {}

    // Talent Chanceuse: probabilité basée sur le nombre d'œufs collectés lors de ce clic
    let chanceuse = { active: false, proc: false, procChance: 0, bonusEggs: 0 }

    try {
  // Vérifier si une poule au talent "Chanceuse" est dans l'équipe
      const teamSlots = user.team?.slots || []
      // Log des slots et du talent détecté par slot
      try {
        const teamOverview = teamSlots.map(s => ({ especeId: s?.especeId || null, talent: s?.especeId ? (especeData[s.especeId]?.talent || null) : null }))
        console.log('[Egg] Team slots =', JSON.stringify(teamOverview))
      } catch (_) { /* no-op */ }

      if (eggsGained > 0) {
        chanceuse.active = true
        
        const outcome = runTalentWithConditions(user, 'Chanceuse', { 
          eggsGained, 
          stockageMax: effectiveMaxIncome 
        })

        chanceuse.procChance = outcome.procChance
        try {
          const pS = Number(outcome.pSingle)
          const pc = Number(outcome.procChance)
          const rl = Number(outcome.roll)
          const pSStr = Number.isFinite(pS) ? (pS * 100).toFixed(2) : 'N/A'
          const pcStr = Number.isFinite(pc) ? (pc * 100).toFixed(2) : 'N/A'
          const rlStr = Number.isFinite(rl) ? rl.toFixed(4) : 'N/A'
          console.log(`[Chanceuse] eggsGained=${eggsGained}, pSingle(from config)=${pSStr}%, combined=${pcStr}%, roll=${rlStr}`)
        } catch (_) { /* safe log */ }

        if (outcome.proc) {
          const bonusEggs = outcome.effects
            .filter(e => e.type === 'resource' && e.resource === 'eggs')
            .reduce((sum, e) => sum + (e.amount || 0), 0)
            
          user.resources.eggs = currentEggs + eggsGained + bonusEggs
          chanceuse.proc = true
          chanceuse.bonusEggs = bonusEggs
          chanceuse.effects = outcome.effects || []
          console.log(`[Chanceuse] PROC! Bonus eggs=${bonusEggs}`)
        } else {
          user.resources.eggs = currentEggs + eggsGained
        }
      } else {
        // Pas assez d'œufs pour déclencher le talent
        console.log('[Chanceuse] eggsGained=0, talent non évalué.')
        user.resources.eggs = currentEggs + eggsGained
      }
    } catch (e) {
      console.warn('[Chanceuse] Erreur lors de l\'évaluation du talent:', e)
      user.resources.eggs = currentEggs + eggsGained
    }

    user.clickableEgg = user.clickableEgg || {}
  user.clickableEgg.lastClick = now
  // Conserver le income de base stocké côté DB
  user.clickableEgg.income = baseIncome
    user.clickableEgg.maxIncome = maxIncome
    user.clickableEgg.currentStocked = 0

    await saveWithRetry(user)

    // Mettre à jour le progrès des succès
    await updateAchievementProgress(req.userId, 'increment', {
      totalEggsCollected: eggsGained
    })
    // Si le talent Chanceuse a proc, compter aussi ces œufs bonus dans la progression
    // (on ne double pas maxEggsInOneClick car il mesure un clic de base)
    // INFO: on pourrait avoir un compteur séparé pour les bonus si souhaité
    // chanceuse est scope interne ci-dessus; recalculer simplement le delta
    // Ici on se contente d'ajouter le bonus s'il a été accordé
    // Note: pour simplifier, on ne relit pas la valeur de réponse; on recompute min.
    // (aucun impact grave si le bonus est 0)
    // NB: garder les logs côté serveur comme demandé
    // Pas besoin d'attendre le résultat de cette promesse supplémentaire
    
    // Inclure le bonus de Chanceuse dans le compteur "max œufs en 1 clic"
    const eggsThisClickForMax = eggsGained + (chanceuse?.proc ? (chanceuse?.bonusEggs || 0) : 0)
    await updateAchievementProgress(req.userId, 'max', {
      maxEggsInOneClick: eggsThisClickForMax
    })

    res.json({
      message: 'Œuf cliqué avec succès',
      eggsGained: Math.floor(currentStocked),
      totalEggs: user.resources.eggs,
      income: effectiveIncome,
      maxIncome,
      currentStocked: 0,
      lastClick: now,
      incomeBonus: { bonusPerSecond: incomeBonus.bonusPerSecond, breakdown: incomeBonus.breakdown },
      // Infos talent Chanceuse pour le frontend (optionnel pour déclencher un effet visuel)
      chanceuse: {
        active: chanceuse.active,
        proc: chanceuse.proc,
        bonusEggs: chanceuse.bonusEggs,
        procChance: chanceuse.procChance,
        effects: chanceuse.effects || []
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}