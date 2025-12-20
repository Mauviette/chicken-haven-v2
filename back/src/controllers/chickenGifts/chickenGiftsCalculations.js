// controllers/chickenGifts/chickenGiftsCalculations.js
// Fonctions de calcul pour les cadeaux de poules

import { runTalentStorage } from '../egg.controller.js'
import { getGiftConfigForLevel } from './chickenGiftsConfig.js'

/**
 * Calculer les multiplicateurs des buffs actifs
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
 * Calculer le stockage total avec buffs
 */
export function calculateTotalStorage(user) {
  const baseMaxIncome = user.clickableEgg?.maxIncome || 100
  const storageBonus = runTalentStorage(user)

  const buffMultipliers = computeActiveBuffMultipliers(user)

  const effectiveMaxIncome = Math.max(
    0,
    (baseMaxIncome + storageBonus.storageBonus) * storageBonus.storageMultiplier * buffMultipliers.storage
  )

  return effectiveMaxIncome
}

/**
 * Générer une récompense aléatoire basée sur le niveau
 */
export function generateRandomReward(level) {
  const config = getGiftConfigForLevel(level)
  const rewards = config.rewards

  // Calculer le poids total
  const totalWeight = rewards.reduce((sum, reward) => sum + reward.weight, 0)

  // Sélectionner une récompense basée sur les poids
  let random = Math.random() * totalWeight
  let selectedReward = null

  for (const reward of rewards) {
    random -= reward.weight
    if (random <= 0) {
      selectedReward = reward
      break
    }
  }

  // Fallback au cas où
  if (!selectedReward) {
    selectedReward = rewards[0]
  }

  return {
    type: 'resource',
    resource: selectedReward.type,
    amount: selectedReward.amount
  }
}
