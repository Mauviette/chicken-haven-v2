/**
 * Helpers pour le formatage des récompenses dans QuestsMenu
 */

/**
 * Formate une récompense pour l'affichage
 * @param {Object} reward - Récompense à formater
 * @param {Object} itemsData - Données des items
 * @param {Object} especiesData - Données des espèces
 * @returns {string}
 */
export function formatQuestReward(reward, itemsData, especiesData) {
  if (!reward) return ''

  if (reward.type === 'chicken') {
    // Pour les récompenses secrètes, afficher un texte mystère
    if (reward.secret) {
      return 'Poule ???'
    }
    // Pour les récompenses de poules, on affiche le nom de l'espèce
    const espece = especiesData?.[reward.especeId]
    const chickenName = espece?.nom || reward.especeId
    return `${reward.quantite}x ${chickenName}`
  }

  const itemData = itemsData?.[reward.type]
  if (!itemData || typeof reward.quantite !== 'number') return 'Valeur invalide'
  return `${reward.quantite} ${reward.quantite === 1 ? itemData.nom_singulier : itemData.nom}`
}

/**
 * Obtient l'icône d'une récompense
 * @param {Object} reward - Récompense
 * @param {Object} itemsData - Données des items
 * @param {Function} getChickenImage - Fonction pour obtenir l'image d'une poule
 * @param {string} hiddenImage - Image cachée pour les récompenses secrètes
 * @returns {string}
 */
export function getQuestRewardIcon(reward, itemsData, getChickenImage, hiddenImage) {
  if (!reward) return '❓'

  if (reward.type === 'chicken') {
    if (reward.secret) {
      return hiddenImage
    }
    return getChickenImage(reward.especeId)
  }

  const itemData = itemsData?.[reward.type]
  return itemData ? itemData.icon : '❓'
}

/**
 * Obtient la description d'une récompense (pour tooltip)
 * @param {Object} reward - Récompense
 * @param {Object} itemsData - Données des items
 * @param {Object} especiesData - Données des espèces
 * @returns {string}
 */
export function getQuestRewardDescription(reward, itemsData, especiesData) {
  if (!reward) return 'Aucune récompense'

  if (reward.type === 'chicken') {
    if (reward.secret) {
      return `<strong>Poule ???</strong><br>Une poule mystérieuse que vous n'avez pas encore découverte.`
    }
    const espece = especiesData?.[reward.especeId]
    const chickenName = espece?.nom || reward.especeId
    const description = espece?.description || 'Une nouvelle poule à ajouter à votre équipe.'
    const formatted = formatQuestReward(reward, itemsData, especiesData)
    return `<strong>${formatted}</strong><br>${description}`
  }

  const itemData = itemsData?.[reward.type]
  if (!itemData) return 'Récompense inconnue'

  const formatted = formatQuestReward(reward, itemsData, especiesData)
  return `<strong>${formatted}</strong><br>${itemData.description}`
}

/**
 * Obtient la récompense finale d'une quête
 * @param {Object} quest - Quête
 * @param {Array} ownedPoules - Poules possédées par le joueur
 * @returns {Object|null}
 */
export function getQuestFinalReward(quest, ownedPoules) {
  if (!quest?.steps?.length) return null

  // Retourner la récompense de la dernière étape
  const finalReward = quest.steps[quest.steps.length - 1]?.reward || null

  // Appliquer la logique de récompense secrète
  if (finalReward?.type === 'chicken') {
    const isOwned = ownedPoules?.some((p) => p.especeId === finalReward.especeId && p.owned)
    if (!isOwned) {
      return { ...finalReward, secret: true }
    }
  }

  return finalReward
}

/**
 * Formate l'affichage d'un défi avec progression
 * @param {Object} challenge - Défi
 * @param {number} progress - Progression actuelle
 * @param {Function} formatChallengeFn - Fonction de formatage de base
 * @returns {string}
 */
export function formatChallengeWithProgress(challenge, progress, formatChallengeFn) {
  // formatChallengeFn inclut déjà la progression dans le format "(X/Y)"
  // On l'appelle directement sans ajouter de doublon
  return formatChallengeFn(challenge, progress || 0)
}

/**
 * Calcule l'étape actuelle d'une quête
 * @param {Object} activeQuest - Quête active
 * @param {Object} questProgress - Progression de la quête
 * @param {Function} getStepProgressFn - Fonction pour obtenir la progression d'une étape
 * @returns {Object|null}
 */
export function getCurrentQuestStep(activeQuest, questProgress, getStepProgressFn) {
  if (!activeQuest?.steps) return null

  for (let i = 0; i < activeQuest.steps.length; i++) {
    const step = activeQuest.steps[i]
    const stepProgress = questProgress?.[activeQuest.id]?.[step.id] || {}

    if (!stepProgress.rewardClaimed) {
      return {
        ...step,
        stepNumber: i + 1,
        totalSteps: activeQuest.steps.length,
        completed: getStepProgressFn(step) === 100,
      }
    }
  }

  return null
}
