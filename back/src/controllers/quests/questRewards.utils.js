// quests/questRewards.utils.js
// Utilitaires pour gérer les récompenses des quêtes
import { especeData } from '../../data/sharedGameData.js'

/**
 * Applique une récompense à un utilisateur
 * @param {Object} user - L'utilisateur
 * @param {Object} reward - La récompense à appliquer
 * @returns {Object} { levelUp: boolean, levelUpFrom: number, levelUpTo: number, newChicken: Object|null }
 */
export function applyReward(user, reward) {
  const result = {
    levelUp: false,
    levelUpFrom: 0,
    levelUpTo: 0,
    newChicken: null
  }
  
  switch (reward.type) {
    case 'eggs':
      user.resources.eggs = (user.resources.eggs || 0) + reward.quantite
      break
      
    case 'stock_token':
      user.resources.stock_token = (user.resources.stock_token || 0) + reward.quantite
      break
      
    case 'production_token':
      user.resources.production_token = (user.resources.production_token || 0) + reward.quantite
      break
      
    case 'mining_token':
      user.resources.mining_token = (user.resources.mining_token || 0) + reward.quantite
      break
      
    case 'chest_key':
      user.resources.chest_key = (user.resources.chest_key || 0) + reward.quantite
      break
      
    case 'precious_stone':
      user.resources.precious_stone = (user.resources.precious_stone || 0) + reward.quantite
      break
      
    case 'blueberry':
      // Les myrtilles donnent de l'XP
      user.experience = user.experience || { level: 1, points: 0, required_points: 2 }
      user.experience.points = (user.experience.points || 0) + reward.quantite
      
      // Calcul du level-up
      const levelUpResult = processLevelUp(user)
      result.levelUp = levelUpResult.levelUp
      result.levelUpFrom = levelUpResult.levelUpFrom
      result.levelUpTo = levelUpResult.levelUpTo
      break
      
    case 'wild_token':
      user.resources.wild_token = (user.resources.wild_token || 0) + reward.quantite
      break
      
    case 'chicken':
      result.newChicken = addChickenReward(user, reward)
      break
  }
  
  return result
}

/**
 * Traite le level-up de l'utilisateur
 * @param {Object} user - L'utilisateur
 * @returns {Object} { levelUp: boolean, levelUpFrom: number, levelUpTo: number }
 */
function processLevelUp(user) {
  const result = {
    levelUp: false,
    levelUpFrom: 0,
    levelUpTo: 0
  }
  
  let lvl = user.experience.level || 1
  let pts = user.experience.points || 0
  let req = user.experience.required_points || 2
  
  const startLevel = lvl
  
  while (pts >= req) {
    pts -= req
    lvl += 1
    req = Math.floor(req * 1.5)
  }
  
  if (lvl > startLevel) {
    result.levelUp = true
    result.levelUpFrom = startLevel
    result.levelUpTo = lvl
  }
  
  user.experience.level = lvl
  user.experience.points = pts
  user.experience.required_points = req
  
  return result
}

/**
 * Ajoute une poule comme récompense
 * @param {Object} user - L'utilisateur
 * @param {Object} reward - La récompense chicken
 * @returns {Object|null} La poule ajoutée ou null
 */
function addChickenReward(user, reward) {
  const especeId = reward.especeId
  if (!especeId) return null
  
  const chickenData = especeData[especeId]
  if (!chickenData) return null
  
  // Vérifier si l'utilisateur a déjà cette poule
  user.poulesPossedees = user.poulesPossedees || []
  const existingPoule = user.poulesPossedees.find(p => p.especeId === especeId)
  
  if (existingPoule) {
    existingPoule.quantite = (existingPoule.quantite || 1) + 1
    return { especeId, isNew: false, quantite: existingPoule.quantite }
  } else {
    const newPoule = {
      especeId,
      quantite: 1,
      niveauTalent: 1,
      dateObtention: new Date()
    }
    user.poulesPossedees.push(newPoule)
    return { especeId, isNew: true, quantite: 1 }
  }
}

/**
 * Vérifie si une étape est complétée
 * @param {Object} step - L'étape
 * @param {Object} stepProgress - La progression de l'étape
 * @returns {boolean}
 */
export function isStepCompleted(step, stepProgress) {
  if (!stepProgress) return false
  
  return step.challenges.every(challenge => {
    let progressKey = challenge.type
    if (challenge.type === 'chicken_rarity_found' && challenge.rarity) {
      progressKey = `chicken_rarity_found_${challenge.rarity}`
    }
    const currentValue = stepProgress[progressKey] || 0
    return currentValue >= challenge.objectif
  })
}

/**
 * Vérifie que toutes les étapes précédentes ont été réclamées
 * @param {Object} quest - La quête
 * @param {Object} questProgress - La progression
 * @param {number} stepIndex - L'index de l'étape actuelle
 * @returns {Object} { valid: boolean, message: string }
 */
export function validatePreviousStepsClaimed(quest, questProgress, stepIndex) {
  for (let i = 0; i < stepIndex; i++) {
    const prevStep = quest.steps[i]
    const prevStepProgress = questProgress?.[prevStep.id]
    if (!prevStepProgress?.rewardClaimed) {
      return {
        valid: false,
        message: `Vous devez d'abord réclamer la récompense de l'étape ${i + 1} avant de pouvoir réclamer celle-ci.`
      }
    }
  }
  return { valid: true, message: '' }
}
