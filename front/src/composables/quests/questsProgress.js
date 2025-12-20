/**
 * Helpers pour le calcul du progrès des quêtes
 */

/**
 * Calcule le progrès d'une étape en pourcentage
 * @param {Object} step - Étape
 * @param {Object} activeQuest - Quête active
 * @param {Object} questProgress - Progrès de la quête
 * @returns {number} - Pourcentage de complétion
 */
export function getStepProgress(step, activeQuest, questProgress) {
  try {
    if (!activeQuest || !step || !questProgress) return 0

    const progress = questProgress[activeQuest.id] || {}
    const stepProgress = progress[step.id] || {}

    const totalChallenges = step.challenges?.length || 0
    if (totalChallenges === 0) return 0

    let completedChallenges = 0

    step.challenges.forEach(challenge => {
      let progressKey = challenge.type
      if (challenge.type === 'chicken_rarity_found' && challenge.rarity) {
        progressKey = `chicken_rarity_found_${challenge.rarity}`
      }
      const currentValue = stepProgress[progressKey] || 0
      if (currentValue >= challenge.objectif) {
        completedChallenges++
      }
    })

    return Math.round((completedChallenges / totalChallenges) * 100)
  } catch (error) {
    console.error('Error in getStepProgress:', error)
    return 0
  }
}

/**
 * Vérifie si une étape peut être réclamée
 * @param {Object} step - Étape
 * @param {Object} activeQuest - Quête active
 * @param {Object} questProgress - Progrès de la quête
 * @returns {boolean}
 */
export function canClaimStepReward(step, activeQuest, questProgress) {
  try {
    if (!activeQuest || !step || !questProgress) return false

    const progress = questProgress[activeQuest.id] || {}
    const stepProgress = progress[step.id] || {}

    // Vérifier que l'étape est complétée
    const isCompleted = step.challenges?.every(challenge => {
      let progressKey = challenge.type
      if (challenge.type === 'chicken_rarity_found' && challenge.rarity) {
        progressKey = `chicken_rarity_found_${challenge.rarity}`
      }
      const currentValue = stepProgress[progressKey] || 0
      return currentValue >= challenge.objectif
    }) || false

    if (!isCompleted) return false

    // Vérifier que la récompense n'a pas déjà été réclamée
    if (stepProgress.rewardClaimed) return false

    // Vérifier que toutes les étapes précédentes ont été réclamées
    const stepIndex = activeQuest.steps?.findIndex(s => s.id === step.id) ?? -1

    for (let i = 0; i < stepIndex; i++) {
      const prevStep = activeQuest.steps[i]
      const prevStepProgress = progress[prevStep.id] || {}
      if (!prevStepProgress.rewardClaimed) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in canClaimStepReward:', error)
    return false
  }
}

/**
 * Obtient la valeur actuelle d'un défi spécifique
 * @param {Object} step - Étape
 * @param {string} challengeType - Type de défi
 * @param {Object} activeQuest - Quête active
 * @param {Object} questProgress - Progrès de la quête
 * @returns {number}
 */
export function getChallengeProgress(step, challengeType, activeQuest, questProgress) {
  try {
    if (!activeQuest || !step || !questProgress) return 0

    const progress = questProgress[activeQuest.id] || {}
    const stepProgress = progress[step.id] || {}

    let progressKey = challengeType
    if (challengeType === 'chicken_rarity_found') {
      const challenge = step.challenges?.find(c => c.type === challengeType)
      if (challenge && challenge.rarity) {
        progressKey = `chicken_rarity_found_${challenge.rarity}`
      }
    }

    return stepProgress[progressKey] || 0
  } catch (error) {
    console.error('Error in getChallengeProgress:', error)
    return 0
  }
}

/**
 * Vérifie si une étape est complétée
 * @param {Object} step - Étape
 * @param {Object} stepProgress - Progrès de l'étape
 * @returns {boolean}
 */
export function isStepCompleted(step, stepProgress) {
  return step.challenges?.every(challenge => {
    let progressKey = challenge.type
    if (challenge.type === 'chicken_rarity_found' && challenge.rarity) {
      progressKey = `chicken_rarity_found_${challenge.rarity}`
    }
    const currentValue = stepProgress[progressKey] || 0
    return currentValue >= challenge.objectif
  }) || false
}
