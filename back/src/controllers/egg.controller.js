/**
 * Contrôleur des œufs (egg)
 * Gère les endpoints HTTP pour le système de collecte d'œufs
 */
import User from '../models/User.js'
import { updateAchievementProgress } from './achievements.controller.js'
import { updateQuestProgress } from './quests.controller.js'
import { saveWithRetry } from '../utils/mongoUtils.js'

// Re-export des utilitaires pour compatibilité avec les autres contrôleurs
export { computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme } from './egg/teamStats.utils.js'
export { computeActiveBuffMultipliers } from './egg/buffs.utils.js'
export { runTalentIncome, runTalentStorage } from './egg/talents.utils.js'

// Imports internes
import { computeActiveBuffMultipliers } from './egg/buffs.utils.js'
import { runTalentIncome, runTalentStorage, runTalentWithConditions } from './egg/talents.utils.js'
import { especeData } from '../data/sharedGameData.js'

/**
 * GET /api/egg/status - Récupère le statut actuel de l'œuf cliquable
 */
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

    // Talents passifs
    const storageBonus = runTalentStorage(user)
    
    // Appliquer les buffs temporaires
    const buffMultipliers = computeActiveBuffMultipliers(user)
    
    const baseMaxIncome = maxIncome + storageBonus.storageBonus
    const effectiveMaxIncome = Math.max(0, baseMaxIncome * storageBonus.storageMultiplier * buffMultipliers.storage)
    
    const incomeBonus = runTalentIncome(user, effectiveMaxIncome)
    
    const effectiveIncome = Math.max(0, (baseIncome + incomeBonus.bonusPerSecond) * buffMultipliers.income)

    // Calculer les gains actuels basés sur le temps écoulé
    const timeDiffSeconds = Math.floor((now - lastClick) / 1000)
    let currentStocked = Math.min(timeDiffSeconds * effectiveIncome, effectiveMaxIncome)
    
    // Vérifier si un buff time_stop est actif
    const activeBuffs = user.buffs || []
    const timeStopBuff = activeBuffs.find(buff => 
      buff.buff_type === 'time_stop' && 
      new Date(buff.lasts_until) > now
    )
    
    // Pendant time_stop, utiliser la valeur figée stockée dans le buff
    if (timeStopBuff && timeStopBuff.buff?.frozen_current_stocked != null) {
      currentStocked = timeStopBuff.buff.frozen_current_stocked
    }

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
      miningTokens: user.resources?.mining_token || 0,
      preciousStones: user.resources?.precious_stone || 0,
      incomeBonus: { bonusPerSecond: incomeBonus.bonusPerSecond, breakdown: incomeBonus.breakdown },
      storageBonus: { storageBonus: storageBonus.storageBonus, storageMultiplier: storageBonus.storageMultiplier, breakdown: storageBonus.breakdown },
      buffMultipliers,
      buffs: user.buffs || [],
      cooldowns: user.cooldowns || {}
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/egg/click - Gère le clic sur l'œuf
 */
export async function clickEgg(req, res) {
  try {
    const user = await User.findById(req.userId) 
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const now = new Date()
    
    // Vérifier si c'est un batch de clics time_stop
    if (req.body.timeStopBatch) {
      return handleTimeStopBatch(req, res, user, now)
    }
    
    const lastClick = user.clickableEgg?.lastClick
    const baseIncome = user.clickableEgg?.income
    const maxIncome = user.clickableEgg?.maxIncome

    if (lastClick == null || baseIncome == null || maxIncome == null) {
      return res.status(404).json({ error: 'Données incomplètes' })
    }
    
    // Vérifier si un buff time_stop est actif
    const activeBuffs = user.buffs || []
    const timeStopBuff = activeBuffs.find(buff => 
      buff.buff_type === 'time_stop' && 
      new Date(buff.lasts_until) > now
    )

    if (timeStopBuff) {
      return handleTimeStopClick(req, res, user, now, timeStopBuff, baseIncome, maxIncome)
    }
    
    // Logique normale pour les clics sans time_stop
    return handleNormalClick(req, res, user, now, baseIncome, maxIncome, lastClick)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * Gère un batch de clics pendant le buff time_stop
 */
async function handleTimeStopBatch(req, res, user, now) {
  const { totalEggs, clickCount } = req.body.timeStopBatch
  
  const activeBuffs = user.buffs || []
  const timeStopBuff = activeBuffs.find(buff => 
    buff.buff_type === 'time_stop' && 
    new Date(buff.lasts_until) > now
  )
  
  if (!timeStopBuff) {
    return res.status(400).json({ error: 'Buff time_stop non actif' })
  }
  
  const currentEggs = user.resources?.eggs || 0
  user.resources = user.resources || {}
  user.resources.eggs = currentEggs + totalEggs
  
  timeStopBuff.buff.click_count = (timeStopBuff.buff.click_count || 0) + clickCount
  
  await saveWithRetry(user)
  
  await updateAchievementProgress(req.userId, 'increment', { totalEggsCollected: totalEggs })
  await updateQuestProgress(req.userId, 'eggs_collected', totalEggs)
  
  return res.json({
    message: 'Batch time_stop réussi',
    eggsGained: totalEggs,
    totalEggs: user.resources.eggs,
    timeStopBatch: true,
    clickCount: timeStopBuff.buff.click_count
  })
}

/**
 * Gère un clic pendant le buff time_stop
 */
async function handleTimeStopClick(req, res, user, now, timeStopBuff, baseIncome, maxIncome) {
  const clickMultiplierBase = timeStopBuff.buff?.click_multiplier_base || 0.25
  const clickPenaltyPerClick = timeStopBuff.buff?.click_penalty_per_click || 0.001
  const clickCount = timeStopBuff.buff?.click_count || 0
  
  const currentMultiplier = Math.max(0, clickMultiplierBase - (clickCount * clickPenaltyPerClick))
  
  const storageBonus = runTalentStorage(user)
  const buffMultipliers = computeActiveBuffMultipliers(user)
  const baseMaxIncome = maxIncome + storageBonus.storageBonus
  const effectiveMaxIncome = Math.max(0, baseMaxIncome * storageBonus.storageMultiplier * buffMultipliers.storage)
  
  const incomeBonus = runTalentIncome(user, effectiveMaxIncome)
  const baseEffectiveIncome = Math.max(0, (baseIncome + incomeBonus.bonusPerSecond))
  const effectiveIncomePerSecond = baseEffectiveIncome * buffMultipliers.income
  
  const eggsGained = Math.floor(effectiveIncomePerSecond * currentMultiplier)
  
  const currentEggs = user.resources?.eggs || 0
  user.resources = user.resources || {}
  user.resources.eggs = currentEggs + eggsGained
  
  timeStopBuff.buff.click_count = clickCount + 1
  
  await saveWithRetry(user)

  await updateAchievementProgress(req.userId, 'increment', { totalEggsCollected: eggsGained })
  await updateQuestProgress(req.userId, 'eggs_collected', eggsGained)

  return res.json({
    message: 'Clic time_stop réussi',
    eggsGained,
    totalEggs: user.resources.eggs,
    timeStopClick: true,
    clickMultiplier: currentMultiplier,
    clickCount: clickCount + 1
  })
}

/**
 * Gère un clic normal (sans time_stop)
 */
async function handleNormalClick(req, res, user, now, baseIncome, maxIncome, lastClick) {
  const timeDiffSeconds = Math.floor((now - lastClick) / 1000)
  
  const storageBonus = runTalentStorage(user)
  const buffMultipliers = computeActiveBuffMultipliers(user)
  
  const baseMaxIncome = maxIncome + storageBonus.storageBonus
  const baseEffectiveMaxIncome = Math.max(0, baseMaxIncome * storageBonus.storageMultiplier)
  
  const incomeBonus = runTalentIncome(user, baseEffectiveMaxIncome * buffMultipliers.storage)
  
  const baseEffectiveIncome = Math.max(0, (baseIncome + incomeBonus.bonusPerSecond))
  const displayedIncome = Math.max(0, baseEffectiveIncome * buffMultipliers.income)
  const displayedMaxIncome = Math.max(0, baseEffectiveMaxIncome * buffMultipliers.storage)
  
  const currentStocked = Math.min(timeDiffSeconds * baseEffectiveIncome, baseEffectiveMaxIncome)

  if (currentStocked < 1) {
    return res.status(400).json({ error: 'Pas assez de gains à collecter' })
  }

  const currentEggs = user.resources?.eggs || 0
  const eggsGained = Math.floor(currentStocked)
  user.resources = user.resources || {}

  // Mode Apocalypse : réduire les gains à 10%
  let finalEggsGained = eggsGained
  if (user.apocalypse) {
    finalEggsGained = Math.floor(eggsGained * 0.1)
  }

  // Talent Chanceuse
  const chanceuse = await processChanceuseTalent(user, finalEggsGained, displayedMaxIncome, currentEggs)

  user.clickableEgg = user.clickableEgg || {}
  user.clickableEgg.lastClick = now
  user.clickableEgg.income = baseIncome
  user.clickableEgg.maxIncome = maxIncome
  user.clickableEgg.currentStocked = 0

  await saveWithRetry(user)

  // Mettre à jour les succès et quêtes
  await updateAchievementProgress(req.userId, 'increment', { totalEggsCollected: finalEggsGained })
  
  const eggsThisClickForMax = finalEggsGained + (chanceuse?.proc ? (chanceuse?.bonusEggs || 0) : 0)
  await updateAchievementProgress(req.userId, 'max', { maxEggsInOneClick: eggsThisClickForMax })

  await updateQuestProgress(req.userId, 'eggs_collected', finalEggsGained)
  await updateQuestProgress(req.userId, 'max_eggs_in_click', eggsThisClickForMax)

  res.json({
    message: 'Œuf cliqué avec succès',
    eggsGained: Math.floor(currentStocked),
    totalEggs: user.resources.eggs,
    income: displayedIncome,
    maxIncome: displayedMaxIncome,
    currentStocked: 0,
    lastClick: now,
    incomeBonus: { bonusPerSecond: incomeBonus.bonusPerSecond, breakdown: incomeBonus.breakdown },
    buffMultipliers,
    chanceuse: {
      active: chanceuse.active,
      proc: chanceuse.proc,
      bonusEggs: chanceuse.bonusEggs,
      procChance: chanceuse.procChance,
      effects: chanceuse.effects || []
    }
  })
}

/**
 * Traite le talent Chanceuse lors d'un clic
 */
async function processChanceuseTalent(user, finalEggsGained, displayedMaxIncome, currentEggs) {
  const chanceuse = { active: false, proc: false, procChance: 0, bonusEggs: 0, effects: [] }

  try {
    const teamSlots = user.team?.slots || []
    try {
      const teamOverview = teamSlots.map(s => ({ 
        especeId: s?.especeId || null, 
        talent: s?.especeId ? (especeData[s.especeId]?.talent || null) : null 
      }))
      console.log('[Egg] Team slots =', JSON.stringify(teamOverview))
    } catch (_) {}

    if (finalEggsGained > 0) {
      chanceuse.active = true
      
      const outcome = runTalentWithConditions(user, 'Chanceuse', { 
        eggsGained: finalEggsGained, 
        stockageMax: displayedMaxIncome 
      })

      chanceuse.procChance = outcome.procChance
      
      try {
        const pS = Number(outcome.pSingle)
        const pc = Number(outcome.procChance)
        const rl = Number(outcome.roll)
        const pSStr = Number.isFinite(pS) ? (pS * 100).toFixed(2) : 'N/A'
        const pcStr = Number.isFinite(pc) ? (pc * 100).toFixed(2) : 'N/A'
        const rlStr = Number.isFinite(rl) ? rl.toFixed(4) : 'N/A'
        console.log(`[Chanceuse] eggsGained=${finalEggsGained}, pSingle(from config)=${pSStr}%, combined=${pcStr}%, roll=${rlStr}`)
      } catch (_) {}

      if (outcome.proc) {
        const bonusEggs = outcome.effects
          .filter(e => e.type === 'resource' && e.resource === 'eggs')
          .reduce((sum, e) => sum + (e.amount || 0), 0)
          
        user.resources.eggs = currentEggs + finalEggsGained + bonusEggs
        chanceuse.proc = true
        chanceuse.bonusEggs = bonusEggs
        chanceuse.effects = outcome.effects || []
        console.log(`[Chanceuse] PROC! Bonus eggs=${bonusEggs}`)
      } else {
        user.resources.eggs = currentEggs + finalEggsGained
      }
    } else {
      console.log('[Chanceuse] eggsGained=0, talent non évalué.')
      user.resources.eggs = currentEggs + finalEggsGained
    }
  } catch (e) {
    console.warn('[Chanceuse] Erreur lors de l\'évaluation du talent:', e)
    user.resources.eggs = currentEggs + finalEggsGained
  }

  return chanceuse
}
