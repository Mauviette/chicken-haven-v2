/**
 * Traitement des récompenses des spawnables
 */
import User from '../../models/User.js'
import { updateAchievementProgress } from '../achievements.controller.js'
import { evalExpr, computeActiveBuffMultipliers } from './spawnablesCalculations.js'

/**
 * Traite une récompense de type ressource
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} user - Utilisateur
 * @param {Object} reward - Récompense
 * @param {Object} ctx - Contexte d'évaluation
 * @returns {Promise<Object>} - Récompense appliquée
 */
export async function processResourceReward(userId, user, reward, ctx) {
  let amount = Math.floor(evalExpr(reward.amount, ctx))
  
  if (reward.resource === 'eggs') {
    const multipliers = computeActiveBuffMultipliers(user)
    let finalAmount = Math.floor(amount * multipliers.income)
    
    // Mode Apocalypse : réduire les gains à 10%
    if (user.apocalypse) {
      finalAmount = Math.floor(finalAmount * 0.1)
    }
    
    await User.findByIdAndUpdate(userId, {
      $inc: { 'resources.eggs': finalAmount }
    })
    
    // Mettre à jour les succès
    await updateAchievementProgress(userId, 'increment', {
      totalEggsCollected: finalAmount
    })
    await updateAchievementProgress(userId, 'max', {
      maxEggsInOneClick: finalAmount
    })
    
    return { type: 'resource', resource: 'eggs', amount: finalAmount }
  }
  
  return null
}

/**
 * Traite une récompense de type buff
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} reward - Récompense
 * @param {string} talentName - Nom du talent
 * @param {Object} ctx - Contexte d'évaluation
 * @returns {Promise<Object>} - Récompense appliquée
 */
export async function processBuffReward(userId, reward, talentName, ctx) {
  const duration = evalExpr(reward.duration, ctx) || 15000
  
  if (reward.buff_type === 'income_storage_multiplier') {
    return await processIncomeStorageBuff(userId, reward, talentName, duration, ctx)
  } else {
    return await processSingleBuff(userId, reward, talentName, duration, ctx)
  }
}

/**
 * Traite un buff income + storage combiné
 */
async function processIncomeStorageBuff(userId, reward, talentName, duration, ctx) {
  const incomeMultiplier = evalExpr(reward.income_multiplier, ctx) || 1.25
  const storageMultiplier = evalExpr(reward.storage_multiplier, ctx) || 1.25
  
  const incomeBuffs = {
    origin: `Talent ${talentName}`,
    buff_type: 'income',
    lasts_until: new Date(Date.now() + duration),
    buff: { operation: 'mult', amount: String(incomeMultiplier) }
  }
  
  const storageBuff = {
    origin: `Talent ${talentName}`,
    buff_type: 'storage',
    lasts_until: new Date(Date.now() + duration),
    buff: { operation: 'mult', amount: String(storageMultiplier) }
  }
  
  await User.findByIdAndUpdate(userId, {
    $push: { buffs: { $each: [incomeBuffs, storageBuff] } }
  })
  
  return { 
    type: 'buff', 
    buff_type: reward.buff_type, 
    duration, 
    income_multiplier: incomeMultiplier,
    storage_multiplier: storageMultiplier
  }
}

/**
 * Traite un buff simple
 */
async function processSingleBuff(userId, reward, talentName, duration, ctx) {
  const multiplier = evalExpr(reward.multiplier, ctx) || 1.5
  
  const buff = {
    origin: `Talent ${talentName}`,
    buff_type: reward.buff_type || 'income',
    lasts_until: new Date(Date.now() + duration),
    buff: { operation: 'mult', amount: String(multiplier) }
  }
  
  await User.findByIdAndUpdate(userId, {
    $push: { buffs: buff }
  })
  
  return { type: 'buff', buff_type: reward.buff_type, duration, multiplier }
}
