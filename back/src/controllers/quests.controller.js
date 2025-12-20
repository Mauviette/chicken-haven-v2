// controllers/quests.controller.js
// Controller principal pour les quêtes - version refactorisée
import User from '../models/User.js'
import { questsData, especeData } from '../data/sharedGameData.js'
import {
  computeChallengeValue,
  computeInitialValues,
  updateActiveStepProgress,
  resetQuestAchievementCounters,
  areAllStepsClaimed,
  cleanupInvalidQuest,
  loadEggHelpers
} from './quests/questProgress.utils.js'
import {
  applyReward,
  isStepCompleted,
  validatePreviousStepsClaimed
} from './quests/questRewards.utils.js'

// GET /api/quests/status - Récupère le statut des quêtes du joueur
export async function getQuestsStatus(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Initialiser les quêtes si nécessaire
    if (!user.quests || typeof user.quests !== 'object') {
      user.quests = {
        activeQuest: null,
        completedQuests: [],
        questProgress: {}
      }
      await user.save()
    }

    // Filtrer les quêtes disponibles selon le niveau du joueur
    const availableQuests = Object.values(questsData).filter(quest =>
      user.experience?.level >= quest.unlock_level
    ).map(quest => ({
      id: quest.id,
      nom: quest.nom,
      description: quest.description,
      icon: quest.icon,
      unlock_level: quest.unlock_level,
      steps: quest.steps.map(step => ({
        id: step.id,
        description: step.description,
        challenges: step.challenges,
        reward: step.reward.type === 'chicken' && !user.poulesPossedees?.some(p => p.especeId === step.reward.especeId)
          ? { ...step.reward, secret: true }
          : step.reward
      }))
    }))

    res.json({
      availableQuests,
      activeQuest: user.quests.activeQuest,
      completedQuests: user.quests.completedQuests || [],
      questProgress: user.quests.questProgress || {}
    })
  } catch (error) {
    console.error('Erreur getQuestsStatus:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/quests/accept/:questId - Accepter une quête
export async function acceptQuest(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { questId } = req.params
    const quest = questsData[questId]

    if (!quest) {
      return res.status(400).json({ error: 'Quête inexistante' })
    }

    // Vérifier le niveau requis
    if (user.experience?.level < quest.unlock_level) {
      return res.status(400).json({ error: 'Niveau insuffisant pour cette quête' })
    }

    // Vérifier qu'aucune quête n'est active
    if (user.quests?.activeQuest) {
      return res.status(400).json({ error: 'Une quête est déjà en cours' })
    }

    // Vérifier que la quête n'est pas déjà complétée
    if (user.quests?.completedQuests?.includes(questId)) {
      return res.status(400).json({ error: 'Quête déjà complétée' })
    }

    // Charger les helpers
    const eggHelpers = await loadEggHelpers()

    // Initialiser la structure de la quête
    user.quests = user.quests || {}
    user.quests.activeQuest = questId
    user.quests.questProgress = user.quests.questProgress || {}
    user.quests.initialValues = user.quests.initialValues || {}
    user.quests.questProgress[questId] = {}

    // Vérifier si la quête a été abandonnée précédemment et restaurer l'étape
    let startStepIndex = 0
    if (user.quests?.abandonedQuests?.[questId]) {
      startStepIndex = user.quests.abandonedQuests[questId].currentStepIndex || 0
    }

    // Calculer les valeurs initiales pour chaque étape
    const initialValuesPerStep = {}
    quest.steps.forEach((step, index) => {
      if (index >= startStepIndex) {
        initialValuesPerStep[step.id] = computeInitialValues(user, step, eggHelpers)
      }
    })

    user.quests.initialValues[questId] = initialValuesPerStep

    user.markModified('quests')
    await user.save()

    res.json({
      success: true,
      activeQuest: questId,
      questProgress: user.quests.questProgress[questId]
    })
  } catch (error) {
    console.error('Erreur acceptQuest:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/quests/abandon - Abandonner la quête active
export async function abandonQuest(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (!user.quests?.activeQuest) {
      return res.status(400).json({ error: 'Aucune quête active' })
    }

    const questId = user.quests.activeQuest
    const quest = questsData[questId]

    if (!quest) {
      cleanupInvalidQuest(user, questId)
      user.markModified('quests')
      await user.save()
      return res.json({ success: true, abandonedQuest: questId })
    }

    // Initialiser abandonedQuests si nécessaire
    if (!user.quests.abandonedQuests) {
      user.quests.abandonedQuests = {}
    }

    // Trouver l'étape actuelle (la première qui n'a pas eu sa récompense réclamée)
    let currentStepIndex = 0
    if (user.quests.questProgress?.[questId]) {
      for (let i = 0; i < quest.steps.length; i++) {
        const stepProgress = user.quests.questProgress[questId][quest.steps[i].id]
        if (!stepProgress?.rewardClaimed) {
          currentStepIndex = i
          break
        }
      }
    }

    // Sauvegarder seulement l'étape actuelle
    user.quests.abandonedQuests[questId] = {
      currentStepIndex: currentStepIndex,
      lastAbandoned: new Date()
    }

    // Remettre à zéro les compteurs d'achievements
    resetQuestAchievementCounters(user, quest)

    user.quests.activeQuest = null
    user.markModified('quests')
    user.markModified('achievements')
    await user.save()

    res.json({
      success: true,
      abandonedQuest: questId,
      currentStepIndex: currentStepIndex,
      progressSaved: true
    })
  } catch (error) {
    console.error('Erreur abandonQuest:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/quests/claim-step/:stepId - Réclamer la récompense d'une étape
export async function claimStepReward(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { stepId } = req.params

    if (!user.quests?.activeQuest) {
      return res.status(400).json({ error: 'Aucune quête active' })
    }

    const questId = user.quests.activeQuest
    const quest = questsData[questId]

    if (!quest) {
      return res.status(400).json({ error: 'Quête invalide' })
    }

    const stepIndex = quest.steps.findIndex(s => s.id === stepId)
    const step = quest.steps[stepIndex]
    
    if (!step) {
      return res.status(400).json({ error: 'Étape inexistante' })
    }

    // Vérifier que l'étape est complétée
    const stepProgress = user.quests.questProgress?.[questId]?.[stepId]
    if (!isStepCompleted(step, stepProgress)) {
      return res.status(400).json({ error: 'Étape non complétée' })
    }

    // Vérifier que la récompense n'a pas déjà été réclamée
    if (stepProgress?.rewardClaimed) {
      return res.status(400).json({ error: 'Récompense déjà réclamée' })
    }

    // Vérifier l'ordre des étapes
    const validation = validatePreviousStepsClaimed(quest, user.quests.questProgress?.[questId], stepIndex)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message })
    }

    // Appliquer la récompense
    const rewardResult = applyReward(user, step.reward)

    // Marquer la récompense comme réclamée
    user.quests.questProgress[questId][stepId].rewardClaimed = true

    // Charger les helpers pour la prochaine étape
    const eggHelpers = await loadEggHelpers()

    // Initialiser les valeurs pour l'étape suivante
    const nextStepIndex = stepIndex + 1
    if (nextStepIndex < quest.steps.length) {
      const nextStep = quest.steps[nextStepIndex]
      if (!user.quests.initialValues) user.quests.initialValues = {}
      if (!user.quests.initialValues[questId]) user.quests.initialValues[questId] = {}
      user.quests.initialValues[questId][nextStep.id] = computeInitialValues(user, nextStep, eggHelpers)
    }

    user.markModified('quests')
    user.markModified('resources')
    user.markModified('experience')
    user.markModified('poulesPossedees')
    await user.save()

    res.json({
      success: true,
      reward: step.reward,
      levelUp: rewardResult.levelUp,
      levelUpFrom: rewardResult.levelUpFrom,
      levelUpTo: rewardResult.levelUpTo,
      newChicken: rewardResult.newChicken
    })
  } catch (error) {
    console.error('Erreur claimStepReward:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/quests/check-progress - Vérifier et mettre à jour le progrès des quêtes
export async function checkQuestProgress(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (!user.quests?.activeQuest) {
      return res.json({ updated: false, message: 'Aucune quête active' })
    }

    const questId = user.quests.activeQuest
    const quest = questsData[questId]

    if (!quest) {
      cleanupInvalidQuest(user, questId)
      user.markModified('quests')
      await user.save()
      return res.json({ updated: false, message: 'Quête invalide nettoyée' })
    }

    // Charger les helpers
    const eggHelpers = await loadEggHelpers()

    const questProgress = user.quests.questProgress?.[questId] || {}
    const questInitialValues = user.quests.initialValues?.[questId] || {}

    // Mettre à jour la progression
    const { progressUpdated, questProgress: updatedProgress } = updateActiveStepProgress(
      user, quest, questProgress, questInitialValues, eggHelpers
    )

    // Vérifier si la quête est terminée
    let questCompleted = false
    if (areAllStepsClaimed(quest, updatedProgress)) {
      questCompleted = true
      resetQuestAchievementCounters(user, quest)
      
      user.quests.completedQuests = user.quests.completedQuests || []
      if (!user.quests.completedQuests.includes(questId)) {
        user.quests.completedQuests.push(questId)
      }
      user.quests.activeQuest = null

      // Nettoyer le progrès
      delete user.quests.questProgress[questId]
      delete user.quests.initialValues?.[questId]
    }

    if (progressUpdated || questCompleted) {
      user.quests.questProgress = user.quests.questProgress || {}
      user.quests.questProgress[questId] = updatedProgress
      user.markModified('quests')
      user.markModified('achievements')
      await user.save()
    }

    res.json({
      updated: progressUpdated || questCompleted,
      questProgress: questCompleted ? null : updatedProgress,
      questCompleted,
      completedQuest: questCompleted ? questId : null
    })
  } catch (error) {
    console.error('Erreur checkQuestProgress:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Utilitaire pour mettre à jour le progrès des quêtes depuis d'autres contrôleurs
async function updateQuestProgress(userId, progressType, value) {
  try {
    const user = await User.findById(userId)
    if (!user || !user.quests?.activeQuest) return

    const questId = user.quests.activeQuest
    const quest = questsData[questId]
    
    if (!quest) {
      cleanupInvalidQuest(user, questId)
      user.markModified('quests')
      await user.save()
      return
    }

    const eggHelpers = await loadEggHelpers()
    const questProgress = user.quests.questProgress?.[questId] || {}
    const questInitialValues = user.quests.initialValues?.[questId] || {}

    const { progressUpdated, questProgress: updatedProgress } = updateActiveStepProgress(
      user, quest, questProgress, questInitialValues, eggHelpers
    )

    let questCompleted = false
    if (areAllStepsClaimed(quest, updatedProgress)) {
      questCompleted = true
      resetQuestAchievementCounters(user, quest)
      
      user.quests.completedQuests = user.quests.completedQuests || []
      if (!user.quests.completedQuests.includes(questId)) {
        user.quests.completedQuests.push(questId)
      }
      user.quests.activeQuest = null
      delete user.quests.questProgress[questId]
      delete user.quests.initialValues?.[questId]
    }

    if (progressUpdated || questCompleted) {
      user.quests.questProgress = user.quests.questProgress || {}
      user.quests.questProgress[questId] = updatedProgress
      user.markModified('quests')
      user.markModified('achievements')
      await user.save()
    }
  } catch (error) {
    console.error('Erreur updateQuestProgress:', error)
  }
}

// Utilitaire pour mettre à jour automatiquement tous les progrès de quête
async function updateAllQuestProgress(userId) {
  // Cette fonction appelle simplement updateQuestProgress qui gère tout
  await updateQuestProgress(userId)
}

// Exporter les utilitaires
export {
  updateQuestProgress,
  updateAllQuestProgress
}
