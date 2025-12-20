// controllers/activeTalents.controller.js
// Implémentation des talents activables: Maligne, Joyeuse

import User from '../models/User.js'
import { talentsData, especeData } from '../data/sharedGameData.js'
import { computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme, runTalentStorage, runTalentIncome, computeActiveBuffMultipliers } from './egg.controller.js'
import { updateQuestProgress } from './quests.controller.js'

function nowMs() { return Date.now() }
function msToDate(ms) { return new Date(ms) }

// Évalue une expression DSL { op, args } ou { var }
function evalExpr(expr, ctx) {
  if (expr == null) return 0
  if (typeof expr === 'number') return expr
  if (typeof expr === 'string') return Number.isFinite(ctx[expr]) ? ctx[expr] : (ctx[expr] ?? 0)
  if (typeof expr === 'object') {
    if (Object.prototype.hasOwnProperty.call(expr, 'var')) {
      return Number.isFinite(ctx[expr.var]) ? ctx[expr.var] : (ctx[expr.var] ?? 0)
    }
    const op = expr.op
    const args = Array.isArray(expr.args) ? expr.args : []
    const vals = args.map(a => evalExpr(a, ctx))
    switch (op) {
      case 'add': return vals.reduce((a,b)=>a+b,0)
      case 'sub': return vals.slice(1).reduce((a,b)=>a-b, vals[0]||0)
      case 'mul': return vals.reduce((a,b)=>a*b,1)
      case 'div': return vals.slice(1).reduce((a,b)=> (b===0?a:a/b), vals[0]||0)
      case 'min': return Math.min(...vals)
      case 'max': return Math.max(...vals)
      default: return 0
    }
  }
  return 0
}

// Retourne le temps de recharge réduit par le talent Rapide de l'équipe (si défini dans le DSL)
function getCooldownWithRapide(user, baseMs) {
  try {
    const slots = user?.team?.slots || []
    const owned = user?.poulesPossedees || []
    let totalReductionPct = 0 // somme en %

    for (const s of slots) {
      const id = s?.especeId
      if (!id) continue
      const talentName = especeData[id]?.talent
      if (!talentName) continue
      if (talentName !== 'Rapide') continue
      const own = owned.find(p => p.especeId === id)
      const niveau = Math.max(1, Number(own?.niveauTalent) || 1)
      // Lire la spéc depuis talentsData.calculation si présente
      const calc = talentsData?.[talentName]?.calculation
      const eff = Array.isArray(calc?.effects) ? calc.effects.find(e => e.type === 'cooldown_reduction') : null
      let pct = 0
      if (eff && eff.percent != null) {
        pct = Number(evalExpr(eff.percent, { niveau })) || 0
      } else {
        pct = 0
      }
      totalReductionPct += pct
    }

    // Limiter la réduction totale via cap de la spec (ou 0 si absent)
    const capSpec = talentsData?.['Rapide']?.calculation?.effects?.find?.(e => e.type === 'cooldown_reduction')?.cap_percent
    const cap = Math.min(totalReductionPct, Number(capSpec ?? 0))
    const factor = Math.max(0, 1 - cap / 100)
    return Math.round(baseMs * factor)
  } catch (_) {
    return baseMs
  }
}

// POST /api/talent/activate
export async function activateTalent(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { talentName } = req.body || {}
    if (!talentName) return res.status(400).json({ error: 'talentName requis' })

    // Vérifier que l'utilisateur a ce talent dans l'équipe
    const slots = user?.team?.slots || []
    const owned = user?.poulesPossedees || []
    const hasTalent = slots.some(s => {
      const id = s?.especeId
      if (!id) return false
      return (especeData[id]?.talent === talentName)
    })
    if (!hasTalent) return res.status(400).json({ error: 'Talent non équipé' })

  const now = nowMs()
  user.cooldowns = user.cooldowns || {}
  const key = `talent_${talentName}`

    // Déterminer la durée de base et l'effet selon le talent
    if (talentName === 'Maligne') {
      // Lire les paramètres depuis la définition calculation
      const calc = talentsData?.[talentName]?.calculation
      const baseCooldown = Number(calc?.cooldown_ms || 60000)
      const cd = getCooldownWithRapide(user, baseCooldown)

      const slots2 = user.team?.slots || []
      const idMaligne = slots2.find(s => especeData[s?.especeId]?.talent === 'Maligne')?.especeId
      const own = owned.find(p => p.especeId === idMaligne)
      const niveau = Math.max(1, Number(own?.niveauTalent) || 1)
      const effect = Array.isArray(calc?.effects) ? calc.effects.find(e => e.type === 'apply_stat_multiplier') : null
      const duration = Number(effect?.duration || 20000)
      // Multiplier = intelligence: expression renvoyant 1 + niveau*0.5
      const multiplier = Number(evalExpr(effect?.stats?.intelligence, { niveau })) || 1

      const buffObj = {
        origin: 'Talent Maligne',
        buff_type: 'team_stat_intelligence',
        lasts_until: new Date(now + duration),
        buff: { operation: 'mult', amount: String(multiplier) }
      }

      const updated = await User.findOneAndUpdate(
        {
          _id: user._id,
          $or: [
            { [`cooldowns.${key}`]: { $exists: false } },
            { [`cooldowns.${key}`]: { $lte: new Date() } }
          ]
        },
        {
          $set: { [`cooldowns.${key}`]: msToDate(now + cd) },
          $push: { buffs: buffObj },
          $inc: { 'achievements.progress.chickenAbilitiesUsed': 1 }
        },
        { new: true }
      )

      if (!updated) {
        const fresh = await User.findById(user._id).lean()
        const until = fresh?.cooldowns?.[key] ? new Date(fresh.cooldowns[key]).getTime() : 0
        const rem = Math.max(0, until - now)
        return res.status(400).json({ error: 'En recharge', readyInMs: rem })
      }

      // Mettre à jour le progrès des quêtes
      await updateQuestProgress(req.userId, 'chicken_abilities_used', 1)

      return res.json({ success: true, talent: talentName, applied: { type: 'stat_multiplier', stat: 'intelligence', multiplier, duration }, cooldownMs: cd })
    }

  if (talentName === 'Joyeuse') {
      const calc = talentsData?.[talentName]?.calculation
      const baseCooldown = Number(calc?.cooldown_ms || 60000)
      const cd = getCooldownWithRapide(user, baseCooldown)

      const slots2 = user.team?.slots || []
      const idJoyeuse = slots2.find(s => especeData[s?.especeId]?.talent === 'Joyeuse')?.especeId
      const own = owned.find(p => p.especeId === idJoyeuse)
      const niveau = Math.max(1, Number(own?.niveauTalent) || 1)
      const effect = Array.isArray(calc?.effects) ? calc.effects.find(e => e.type === 'apply_buff' && (e.buff_type === 'income_multiplier' || e.buff_type === 'income')) : null
      const duration = Number(effect?.duration || 10000)
      const amount = Number(evalExpr(effect?.amount ?? 1, { niveau })) || 1

      const buffObj = {
        origin: 'Talent Joyeuse',
        buff_type: 'income',
        lasts_until: new Date(now + duration),
        buff: { operation: 'mult', amount: String(amount) }
      }

      const updated = await User.findOneAndUpdate(
        {
          _id: user._id,
          $or: [
            { [`cooldowns.${key}`]: { $exists: false } },
            { [`cooldowns.${key}`]: { $lte: new Date() } }
          ]
        },
        {
          $set: { [`cooldowns.${key}`]: msToDate(now + cd) },
          $push: { buffs: buffObj },
          $inc: { 'achievements.progress.chickenAbilitiesUsed': 1 }
        },
        { new: true }
      )

      if (!updated) {
        const fresh = await User.findById(user._id).lean()
        const until = fresh?.cooldowns?.[key] ? new Date(fresh.cooldowns[key]).getTime() : 0
        const rem = Math.max(0, until - now)
        return res.status(400).json({ error: 'En recharge', readyInMs: rem })
      }

      // Mettre à jour le progrès des quêtes
      await updateQuestProgress(req.userId, 'chicken_abilities_used', 1)

      return res.json({ success: true, talent: talentName, applied: { type: 'buff', income_multiplier: amount, duration }, cooldownMs: cd })
    }

    if (talentName === 'Rapide') {
      const calc = talentsData?.[talentName]?.calculation
      const baseCooldown = Number(calc?.cooldown_ms || 60000)
      const cd = getCooldownWithRapide(user, baseCooldown)

      const slots2 = user.team?.slots || []
      const idRapide = slots2.find(s => especeData[s?.especeId]?.talent === 'Rapide')?.especeId
      const own = owned.find(p => p.especeId === idRapide)
      const niveau = Math.max(1, Number(own?.niveauTalent) || 1)
      const effect = Array.isArray(calc?.effects) ? calc.effects.find(e => e.type === 'apply_buff' && (e.buff_type === 'storage' || e.buff_type === 'storage_multiplier')) : null
      const duration = Number(effect?.duration || 15000)
      const amount = Number(evalExpr(effect?.amount ?? 1, { niveau })) || 1

      const buffObj = {
        origin: 'Talent Rapide',
        buff_type: 'storage',
        lasts_until: new Date(now + duration),
        buff: { operation: 'mult', amount: String(amount) }
      }

      const updated = await User.findOneAndUpdate(
        {
          _id: user._id,
          $or: [
            { [`cooldowns.${key}`]: { $exists: false } },
            { [`cooldowns.${key}`]: { $lte: new Date() } }
          ]
        },
        {
          $set: { [`cooldowns.${key}`]: msToDate(now + cd) },
          $push: { buffs: buffObj },
          $inc: { 'achievements.progress.chickenAbilitiesUsed': 1 }
        },
        { new: true }
      )

      if (!updated) {
        const fresh = await User.findById(user._id).lean()
        const until = fresh?.cooldowns?.[key] ? new Date(fresh.cooldowns[key]).getTime() : 0
        const rem = Math.max(0, until - now)
        return res.status(400).json({ error: 'En recharge', readyInMs: rem })
      }

      // Mettre à jour le progrès des quêtes
      await updateQuestProgress(req.userId, 'chicken_abilities_used', 1)

      return res.json({ success: true, talent: talentName, applied: { type: 'buff', storage_multiplier: amount, duration }, cooldownMs: cd })
    }

    if (talentName === 'Le Monde') {
      //console.log('TimeStop backend - activating Le Monde talent')
      const calc = talentsData?.[talentName]?.calculation
      const baseCooldown = Number(calc?.cooldown_ms || 60000)
      const cd = getCooldownWithRapide(user, baseCooldown)

      const slots2 = user.team?.slots || []
      const idLeMonde = slots2.find(s => especeData[s?.especeId]?.talent === 'Le Monde')?.especeId
      const own = owned.find(p => p.especeId === idLeMonde)
      const niveau = Math.max(1, Number(own?.niveauTalent) || 1)
      const effect = Array.isArray(calc?.effects) ? calc.effects.find(e => e.type === 'time_stop_buff') : null
      const duration = Number(effect?.duration || 5000)
      const clickMultiplierBase = Number(evalExpr(effect?.click_multiplier_base, { niveau })) || 0.25
      const clickPenaltyPerClick = Number(effect?.click_penalty_per_click || 0.001)

      // Calculer effectiveIncome au moment de l'activation pour le figer pendant time_stop
      // Utiliser la même logique que getEggStatus
      const baseIncome = user.clickableEgg?.income || 1
      const maxIncome = user.clickableEgg?.maxIncome || 30
      
      //console.log('TimeStop backend - baseIncome:', baseIncome, 'maxIncome:', maxIncome)
      
      const storageBonus = runTalentStorage(user)
      const buffMultipliers = computeActiveBuffMultipliers(user) // Utiliser les buffs actifs (sans time_stop qui vient d'être activé)
      
      //console.log('TimeStop backend - storageBonus:', storageBonus)
      //console.log('TimeStop backend - buffMultipliers:', buffMultipliers)
      
      const baseMaxIncome = maxIncome + storageBonus.storageBonus
      const effectiveMaxIncome = Math.max(0, baseMaxIncome * storageBonus.storageMultiplier * buffMultipliers.storage)
      
      //console.log('TimeStop backend - baseMaxIncome:', baseMaxIncome, 'effectiveMaxIncome:', effectiveMaxIncome)
      
      const incomeBonus = runTalentIncome(user, effectiveMaxIncome)
      //console.log('TimeStop backend - incomeBonus:', incomeBonus)
      
      const frozenEffectiveIncome = Math.max(0, (baseIncome + incomeBonus.bonusPerSecond) * buffMultipliers.income)
      
      //console.log('TimeStop backend - final calculation: baseIncome + incomeBonus.bonusPerSecond =', baseIncome, '+', incomeBonus.bonusPerSecond, '=', baseIncome + incomeBonus.bonusPerSecond)
      //console.log('TimeStop backend - buffMultipliers.income:', buffMultipliers.income)
      //console.log('TimeStop backend - frozenEffectiveIncome:', frozenEffectiveIncome)

      const buffObj = {
        origin: 'Talent Le Monde',
        buff_type: 'time_stop',
        lasts_until: new Date(now + duration),
        hidden: true,
        buff: { 
          operation: 'time_stop', 
          click_multiplier_base: String(clickMultiplierBase),
          click_penalty_per_click: String(clickPenaltyPerClick),
          click_count: 0,
          frozenEffectiveIncome: String(frozenEffectiveIncome)
        }
      }

      //console.log('TimeStop backend - buffObj to be saved:', JSON.stringify(buffObj, null, 2))

      const updated = await User.findOneAndUpdate(
        {
          _id: user._id,
          $or: [
            { [`cooldowns.${key}`]: { $exists: false } },
            { [`cooldowns.${key}`]: { $lte: new Date() } }
          ]
        },
        {
          $set: { [`cooldowns.${key}`]: msToDate(now + cd) },
          $push: { buffs: buffObj },
          $inc: { 'achievements.progress.chickenAbilitiesUsed': 1 }
        },
        { new: true }
      )

      //console.log('TimeStop backend - update result:', updated ? 'success' : 'failed')
      if (updated) {
        //console.log('TimeStop backend - buff created:', buffObj)
      }

      if (!updated) {
        const fresh = await User.findById(user._id).lean()
        const until = fresh?.cooldowns?.[key] ? new Date(fresh.cooldowns[key]).getTime() : 0
        const rem = Math.max(0, until - now)
        return res.status(400).json({ error: 'En recharge', readyInMs: rem })
      }

      // Mettre à jour le progrès des quêtes
      await updateQuestProgress(req.userId, 'chicken_abilities_used', 1)

      return res.json({ success: true, talent: talentName, applied: { type: 'time_stop', duration, click_multiplier_base: clickMultiplierBase, click_penalty_per_click: clickPenaltyPerClick }, cooldownMs: cd })
    }

    return res.status(400).json({ error: 'Talent non activable ou non implémenté' })
  } catch (err) {
    console.error('activateTalent error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
