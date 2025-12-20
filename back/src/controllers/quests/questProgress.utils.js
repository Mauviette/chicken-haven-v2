// quests/questProgress.utils.js
// Utilitaires pour calculer la progression des quêtes
import User from '../../models/User.js'
import { questsData, especeData } from '../../data/sharedGameData.js'

/**
 * Calcule la valeur actuelle d'un challenge pour un utilisateur
 * @param {Object} user - L'utilisateur
 * @param {Object} challenge - Le challenge à évaluer
 * @param {Object} eggHelpers - Fonctions importées depuis egg.controller.js
 * @returns {number} La valeur actuelle du challenge
 */
export function computeChallengeValue(user, challenge, eggHelpers = {}) {
  const { computeTeamCharisme, computeTeamEnergy, computeTeamIntelligence, runTalentIncome, computeActiveBuffMultipliers, runTalentStorage } = eggHelpers
  
  switch (challenge.type) {
    case 'eggs_collected':
      return (user.achievements?.progress?.totalEggsCollected != null)
        ? user.achievements.progress.totalEggsCollected
        : (user.resources?.eggs || 0)
    
    case 'chickens_owned':
      return (user.poulesPossedees || []).reduce((sum, p) => sum + (p.quantite || 0), 0)
    
    case 'boxes_opened':
      return user.achievements?.progress?.totalBoxesOpened || 0
    
    case 'talent_level_reached':
      return Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
    
    case 'mining_games_played':
      return user.achievements?.progress?.miningGamesPlayed || 0
    
    case 'mining_cells_broken':
      return user.achievements?.progress?.miningCellsBroken || 0
    
    case 'mining_artifacts_found':
      return user.achievements?.progress?.miningArtifactsFound || 0
    
    case 'max_eggs_in_click':
      return user.achievements?.progress?.maxEggsInOneClick || 0
    
    case 'spawnables_clicked':
      return user.achievements?.progress?.spawnablesClicked || 0
    
    case 'chicken_abilities_used':
      return user.achievements?.progress?.chickenAbilitiesUsed || 0
    
    case 'chicken_gifts_collected':
      return user.achievements?.progress?.chickenGiftsCollected || 0
    
    case 'chicken_rarity_found': {
      const targetRarity = challenge.rarity
      return (user.poulesPossedees || [])
        .filter(p => {
          const chickenData = especeData[p.especeId]
          return chickenData && chickenData.rarete === targetRarity
        })
        .reduce((s, p) => s + (p.quantite || 0), 0)
    }
    
    case 'team_stat_req': {
      // Déterminer quelle stat vérifier selon challenge.stat
      const statType = challenge.stat || 'charisme'
      let statValue = 0
      
      if (statType === 'energie' && computeTeamEnergy) {
        statValue = computeTeamEnergy(user)
      } else if (statType === 'intelligence' && computeTeamIntelligence) {
        statValue = computeTeamIntelligence(user)
      } else if (statType === 'charisme' && computeTeamCharisme) {
        statValue = computeTeamCharisme(user)
      } else {
        return 0 // Fonction non disponible
      }
      
      const { req, num } = challenge
      let conditionMet = false
      if (req === 'below') conditionMet = statValue < num
      else if (req === 'above') conditionMet = statValue > num
      else if (req === 'equals') conditionMet = statValue === num
      return conditionMet ? 1 : 0
    }
    
    case 'production_req': {
      if (!runTalentStorage || !computeActiveBuffMultipliers || !runTalentIncome) return 0
      const storageBonus = runTalentStorage(user)
      const buffMultipliers = computeActiveBuffMultipliers(user)
      const baseMaxIncome = Number(user.clickableEgg?.maxIncome || 0) + Number(storageBonus.storageBonus || 0)
      const effectiveMaxIncome = Math.max(0, baseMaxIncome * (storageBonus.storageMultiplier || 1) * (buffMultipliers.storage || 1))
      const incomeResult = runTalentIncome(user, effectiveMaxIncome)
      const baseIncome = Number(user.clickableEgg?.income || 0)
      const effectiveProduction = (baseIncome + Number(incomeResult.bonusPerSecond || 0)) * (buffMultipliers.income || 1)
      const { req: prodReq, num: prodNum } = challenge
      let prodConditionMet = false
      if (prodReq === 'below') prodConditionMet = effectiveProduction < prodNum
      else if (prodReq === 'above') prodConditionMet = effectiveProduction > prodNum
      else if (prodReq === 'equals') prodConditionMet = effectiveProduction === prodNum
      return prodConditionMet ? 1 : 0
    }
    
    default:
      return 0
  }
}

/**
 * Calcule les valeurs initiales pour une étape de quête
 * @param {Object} user - L'utilisateur
 * @param {Object} step - L'étape de la quête
 * @param {Object} eggHelpers - Fonctions importées depuis egg.controller.js
 * @returns {Object} Les valeurs initiales par type de challenge
 */
export function computeInitialValues(user, step, eggHelpers = {}) {
  const initialValues = {}
  
  step.challenges.forEach(challenge => {
    if (challenge.type === 'chicken_rarity_found' && challenge.rarity) {
      const rarityKey = `chicken_rarity_found_${challenge.rarity}`
      initialValues[rarityKey] = computeChallengeValue(user, challenge, eggHelpers)
    } else {
      initialValues[challenge.type] = computeChallengeValue(user, challenge, eggHelpers)
    }
  })
  
  return initialValues
}

/**
 * Met à jour la progression d'une étape active
 * @param {Object} user - L'utilisateur
 * @param {Object} quest - La quête
 * @param {Object} questProgress - La progression actuelle
 * @param {Object} questInitialValues - Les valeurs initiales
 * @param {Object} eggHelpers - Fonctions importées depuis egg.controller.js
 * @returns {Object} { progressUpdated: boolean, questProgress: Object }
 */
export function updateActiveStepProgress(user, quest, questProgress, questInitialValues, eggHelpers = {}) {
  let progressUpdated = false
  
  // Trouver l'étape active (première étape non rewardClaimed)
  const activeStep = quest.steps.find(s => {
    const sp = questProgress[s.id] || {}
    return sp.rewardClaimed !== true
  })
  
  if (!activeStep) {
    return { progressUpdated, questProgress }
  }
  
  const stepProgress = questProgress[activeStep.id] || {}
  const initialValues = questInitialValues[activeStep.id] || {}
  
  activeStep.challenges.forEach(challenge => {
    const isConditionChallenge = ['team_stat_req', 'production_req'].includes(challenge.type)
    const currentTotalValue = computeChallengeValue(user, challenge, eggHelpers)
    
    if (challenge.type === 'chicken_rarity_found') {
      const rarityKey = `chicken_rarity_found_${challenge.rarity}`
      const initVal = initialValues[rarityKey] || 0
      const computed = Math.max(0, currentTotalValue - initVal)
      const prev = stepProgress[rarityKey] || 0
      const newVal = Math.max(prev, computed)
      if (newVal !== prev) {
        stepProgress[rarityKey] = newVal
        progressUpdated = true
      }
    } else {
      const key = challenge.type
      const computed = isConditionChallenge ? currentTotalValue : Math.max(0, currentTotalValue - (initialValues[key] || 0))
      const prev = stepProgress[key] || 0
      const newVal = Math.max(prev, computed)
      if (newVal !== prev) {
        stepProgress[key] = newVal
        progressUpdated = true
      }
    }
  })
  
  questProgress[activeStep.id] = stepProgress
  return { progressUpdated, questProgress }
}

/**
 * Remet à zéro les compteurs d'achievements utilisés dans une quête
 * @param {Object} user - L'utilisateur
 * @param {Object} quest - La quête
 */
export function resetQuestAchievementCounters(user, quest) {
  const countersToReset = [
    'boxes_opened',
    'mining_games_played',
    'mining_cells_broken',
    'mining_artifacts_found',
    'max_eggs_in_click',
    'spawnables_clicked',
    'chicken_abilities_used',
    'chicken_gifts_collected'
  ]
  
  const counterMapping = {
    'boxes_opened': 'totalBoxesOpened',
    'mining_games_played': 'miningGamesPlayed',
    'mining_cells_broken': 'miningCellsBroken',
    'mining_artifacts_found': 'miningArtifactsFound',
    'max_eggs_in_click': 'maxEggsInOneClick',
    'spawnables_clicked': 'spawnablesClicked',
    'chicken_abilities_used': 'chickenAbilitiesUsed',
    'chicken_gifts_collected': 'chickenGiftsCollected'
  }
  
  quest.steps.forEach(step => {
    step.challenges.forEach(challenge => {
      if (countersToReset.includes(challenge.type) && user.achievements?.progress) {
        const progressKey = counterMapping[challenge.type]
        if (progressKey) {
          user.achievements.progress[progressKey] = 0
        }
      }
    })
  })
}

/**
 * Vérifie si toutes les étapes d'une quête ont été réclamées
 * @param {Object} quest - La quête
 * @param {Object} questProgress - La progression
 * @returns {boolean}
 */
export function areAllStepsClaimed(quest, questProgress) {
  return quest.steps.every(step => {
    const stepProgress = questProgress[step.id]
    return stepProgress?.rewardClaimed === true
  })
}

/**
 * Nettoie une quête invalide
 * @param {Object} user - L'utilisateur
 * @param {string} questId - L'ID de la quête
 */
export function cleanupInvalidQuest(user, questId) {
  console.log(`Quête invalide détectée: ${questId}. Nettoyage automatique.`)
  user.quests.activeQuest = null
  if (user.quests.questProgress && user.quests.questProgress[questId]) {
    delete user.quests.questProgress[questId]
  }
  if (user.quests.initialValues && user.quests.initialValues[questId]) {
    delete user.quests.initialValues[questId]
  }
}

/**
 * Charge les fonctions helpers depuis egg.controller.js
 * @returns {Promise<Object>}
 */
export async function loadEggHelpers() {
  const { computeTeamCharisme, computeTeamEnergy, computeTeamIntelligence, runTalentIncome, computeActiveBuffMultipliers, runTalentStorage } = await import('../egg.controller.js')
  return { computeTeamCharisme, computeTeamEnergy, computeTeamIntelligence, runTalentIncome, computeActiveBuffMultipliers, runTalentStorage }
}
