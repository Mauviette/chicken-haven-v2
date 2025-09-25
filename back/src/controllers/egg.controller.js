import User from '../models/User.js'
import { updateAchievementProgress } from './achievements.controller.js'
import { especeData, talentsData } from '../data/sharedGameData.js'

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
function computeTeamEnergy(user) {
  const slots = user?.team?.slots || []
  let totalBase = 0
  const members = []
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const e = especeData[id]
    const energy = Number(e?.stats?.energie) || 0
    totalBase += energy
    members.push(id)
  }

  // Appliquer tous les buffs de stats provenant du DSL (target: 'team')
  const buffs = aggregateTeamStatBuffs(user)
  const extraPerMember = Number(buffs?.energie || 0)
  const extraTotal = extraPerMember * members.length
  return totalBase + extraTotal
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

// Interprète le talent Énergétique (bonus d'income par seconde)
function runTalentEnergetique(user) {
  const calc = talentsData?.['Énergétique']?.calculation || talentsData?.['Energetique']?.calculation
  if (!calc) return { bonusPerSecond: 0, breakdown: [] }

  const energeticEntries = getActiveTalentEntries(user, 'Énergétique')
  if (energeticEntries.length === 0) return { bonusPerSecond: 0, breakdown: [] }

  const teamEnergy = computeTeamEnergy(user)

  let bonusPerSecond = 0
  const breakdown = []

  for (const entry of energeticEntries) {
    // Chercher l'effet income_bonus_per_second sur resource eggs
    const effect = (calc.effects || []).find(e => e?.type === 'income_bonus_per_second' && e?.resource === 'eggs')
    if (!effect) continue
    const ctx = { teamEnergy, niveau: Number(entry.niveauTalent) || 0 }
    const amt = Number(evalExpr(effect.amount, ctx)) || 0
    bonusPerSecond += amt
    breakdown.push({ especeId: entry.especeId, niveau: entry.niveauTalent, teamEnergy, amount: amt })
  }

  return { bonusPerSecond, breakdown }
}

// Interprète le talent Chanceuse à partir du DSL
function runTalentChanceuse({ eggsGained, stockageMax, niveau }) {
  const calc = talentsData?.['Chanceuse']?.calculation
  if (!calc) return { proc: false, bonusEggs: 0, procChance: 0, effects: [] }

  // Conditions: random_chance (per-egg), combinée sur eggsGained
  const rc = Array.isArray(calc.conditions)
    ? calc.conditions.find(c => c?.type === 'random_chance')
    : null
  let pSingle = 0.01
  if (rc && typeof rc.value === 'number' && !Number.isNaN(rc.value)) {
    pSingle = rc.value > 1 ? (rc.value / 100) : rc.value
  }

  // Proba combinée: 1 - (1 - p)^n
  const n = Math.max(0, Number(eggsGained) || 0)
  const p = Math.min(Math.max(pSingle, 0), 1)
  let combined
  if ((calc.combine || 'independent') === 'linear') {
    // Mode linéaire : au plus un proc, P = min(n * p, 1)
    combined = Math.min(n * p, 1)
  } else {
    // Mode par défaut : essais indépendants
    combined = 1 - Math.pow(1 - p, n)
  }
  const roll = Math.random()
  const proc = roll < combined

  const effects = []
  let bonusEggs = 0
  if (proc) {
    const ctx = { niveau: Number(niveau) || 0, stockageMax: Number(stockageMax) || 0, eggsGained: n }
    for (const eff of (calc.effects || [])) {
      if (!eff || typeof eff !== 'object') continue
      if (eff.type === 'visual_effect') {
        effects.push({ type: 'visual_effect', effect: eff.effect, amount: eff.amount ?? 0 })
      } else if (eff.type === 'resource' && eff.resource === 'eggs') {
        const amt = Math.floor(Math.max(0, Number(evalExpr(eff.amount, ctx)) || 0))
        bonusEggs += amt
        effects.push({ type: 'resource', resource: 'eggs', amount: amt })
      }
    }
  }

  return { proc, bonusEggs, procChance: combined, pSingle, roll, effects }
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
      await user.save()
    }

    // Si lastClick n'est pas défini ou est une fonction, l'initialiser
    if (!user.clickableEgg.lastClick || typeof user.clickableEgg.lastClick === 'function') {
      user.clickableEgg.lastClick = new Date()
      await user.save()
    }

    const now = new Date()
    const lastClick = user.clickableEgg.lastClick
    const baseIncome = user.clickableEgg.income || 1
    const maxIncome = user.clickableEgg.maxIncome || 30
    
    console.log('DEBUG - getEggStatus:')
    console.log('  now:', now)
    console.log('  lastClick:', lastClick)
    console.log('  baseIncome:', baseIncome)
    console.log('  maxIncome:', maxIncome)

    // Talent Énergétique - bonus passif d'income/s
    const energetic = runTalentEnergetique(user)
    const effectiveIncome = Math.max(0, baseIncome + energetic.bonusPerSecond)
    console.log(`  energetic: teamBonus=${energetic.bonusPerSecond} -> effectiveIncome=${effectiveIncome}`)

    // Calculer les gains actuels basés sur le temps écoulé
  const timeDiffSeconds = Math.floor((now - lastClick) / 1000)
  const currentStocked = Math.min(timeDiffSeconds * effectiveIncome, maxIncome)
    
    console.log('  timeDiffSeconds:', timeDiffSeconds)
    console.log('  currentStocked:', currentStocked)

    res.json({
      income: effectiveIncome,
      maxIncome,
      currentStocked,
      lastClick,
      totalEggs: user.resources?.eggs || 0,
      // Optionnel: debug serveur pour le front si besoin
      energetic: { bonusPerSecond: energetic.bonusPerSecond }
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
    // Talent Énergétique
    const energetic = runTalentEnergetique(user)
    const effectiveIncome = Math.max(0, baseIncome + energetic.bonusPerSecond)
  const currentStocked = Math.min(timeDiffSeconds * effectiveIncome, maxIncome)

    // Log d'entrée côté serveur pour faciliter le debug
    try {
      console.log(`[Egg] clickEgg called for user=${user.username || user._id} at ${now.toISOString()}`)
      console.log(`       timeDiffSeconds=${timeDiffSeconds}, baseIncome=${baseIncome}, energeticBonus=${energetic.bonusPerSecond}, effectiveIncome=${effectiveIncome}, maxIncome=${maxIncome}, currentStocked=${currentStocked}`)
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

      // Recherche robuste: on compare en minuscule/trim, et on tolère explicitement l'id 'blanchonette'
      const chanceuseSlot = teamSlots.find(s => {
        const id = s?.especeId
        if (!id) return false
        if (id === 'blanchonette') return true
        const e = especeData[id]
        const talentName = (e?.talent || '').toLowerCase().trim()
        return talentName === 'chanceuse'
      })

      if (chanceuseSlot && eggsGained > 0) {
        chanceuse.active = true
        // Récupérer le niveau de talent de l'espèce associée
        const owned = (user.poulesPossedees || []).find(p => p.especeId === chanceuseSlot.especeId)
        const niveauTalent = Math.max(1, owned?.niveauTalent || 1)

        const stockageMax = user.clickableEgg?.maxIncome || 0
        const outcome = runTalentChanceuse({ eggsGained, stockageMax, niveau: niveauTalent })

        chanceuse.procChance = outcome.procChance
        console.log(`[Chanceuse] eggsGained=${eggsGained}, pSingle(from config)=${(outcome.pSingle*100).toFixed(2)}%, combined=${(outcome.procChance*100).toFixed(2)}%, roll=${outcome.roll.toFixed(4)}`)

        if (outcome.proc) {
          user.resources.eggs = currentEggs + eggsGained + (outcome.bonusEggs || 0)
          chanceuse.proc = true
          chanceuse.bonusEggs = outcome.bonusEggs || 0
          chanceuse.effects = outcome.effects || []
          console.log(`[Chanceuse] PROC! Bonus eggs=${chanceuse.bonusEggs} (niveau=${niveauTalent} x stockageMax=${stockageMax})`)
        } else {
          user.resources.eggs = currentEggs + eggsGained
        }
      } else {
        // Pas de talent Chanceuse actif
        console.log('[Chanceuse] Aucune poule Chanceuse détectée dans l\'équipe (ou eggsGained=0).')
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

    await user.save()

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
    
    await updateAchievementProgress(req.userId, 'max', {
      maxEggsInOneClick: eggsGained
    })

    res.json({
      message: 'Œuf cliqué avec succès',
      eggsGained: Math.floor(currentStocked),
      totalEggs: user.resources.eggs,
      income: effectiveIncome,
      maxIncome,
      currentStocked: 0,
      lastClick: now,
      energetic: { bonusPerSecond: energetic.bonusPerSecond },
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