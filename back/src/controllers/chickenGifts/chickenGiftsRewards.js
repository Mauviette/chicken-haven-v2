// controllers/chickenGifts/chickenGiftsRewards.js
// Traitement des récompenses pour les cadeaux de poules

import User from '../../models/User.js'
import { updateAchievementProgress } from '../achievements.controller.js'
import { computeActiveBuffMultipliers } from './chickenGiftsCalculations.js'

/**
 * Appliquer la récompense d'œufs
 */
async function applyEggsReward(userId, amount, user) {
  const multipliers = computeActiveBuffMultipliers(user)
  let finalAmount = Math.floor(amount * multipliers.income)

  // Mode Apocalypse : réduire les gains à 10%
  if (user.apocalypse) {
    finalAmount = Math.floor(finalAmount * 0.1)
  }

  await User.findByIdAndUpdate(userId, {
    $inc: { 'resources.eggs': finalAmount }
  })

  // Mettre à jour le progrès des succès
  await updateAchievementProgress(userId, 'increment', {
    totalEggsCollected: finalAmount
  })

  return { type: 'resource', resource: 'eggs', amount: finalAmount }
}

/**
 * Appliquer la récompense de tokens de stock
 */
async function applyStockTokensReward(userId, amount) {
  await User.findByIdAndUpdate(userId, {
    $inc: { 'resources.stock_token': amount }
  })
  return { type: 'resource', resource: 'stock_tokens', amount }
}

/**
 * Appliquer la récompense de tokens de production
 */
async function applyProductionTokensReward(userId, amount) {
  await User.findByIdAndUpdate(userId, {
    $inc: { 'resources.production_token': amount }
  })
  return { type: 'resource', resource: 'production_tokens', amount }
}

/**
 * Appliquer la récompense de tokens de minage
 */
async function applyMiningTokenReward(userId, amount) {
  await User.findByIdAndUpdate(userId, {
    $inc: { 'resources.mining_token': amount }
  })
  return { type: 'resource', resource: 'mining_token', amount }
}

/**
 * Appliquer la récompense de tomate pourrie
 */
async function applyRottenTomatoReward(userId, amount) {
  await User.findByIdAndUpdate(userId, {
    $inc: { 'resources.rotten_tomato': amount }
  })

  // Incrémenter le compteur pour les succès
  await updateAchievementProgress(userId, 'increment', {
    rottenTomatoesReceived: amount
  })

  return { type: 'resource', resource: 'rotten_tomato', amount }
}

/**
 * Appliquer une récompense de ressource
 */
export async function applyResourceReward(userId, reward, user) {
  const amount = reward.amount

  switch (reward.resource) {
    case 'eggs':
      return applyEggsReward(userId, amount, user)

    case 'stock_tokens':
      return applyStockTokensReward(userId, amount)

    case 'production_tokens':
      return applyProductionTokensReward(userId, amount)

    case 'mining_token':
      return applyMiningTokenReward(userId, amount)

    case 'rotten_tomato':
      return applyRottenTomatoReward(userId, amount)

    default:
      return null
  }
}

/**
 * Générer une récompense avec prise en compte du mode Apocalypse
 */
export function maybeApocalypseReward(user, originalReward) {
  // Mode Apocalypse : 75% de chance de remplacer par une tomate pourrie
  if (user.apocalypse && Math.random() < 0.75) {
    return {
      type: 'resource',
      resource: 'rotten_tomato',
      amount: 1
    }
  }
  return originalReward
}
