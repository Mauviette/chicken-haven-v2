/**
 * Composable principal pour la gestion des quêtes
 * Agrège les sous-modules pour une API unifiée
 */
import { ref, computed } from 'vue'
import { useGameData } from '@/composables/useGameData'
import { useAuth } from '@/composables/useAuth'
import { usePlayer } from '@/composables/usePlayer'

// État partagé
import { 
  userQuests, 
  fetchQuestsStatus as fetchStatus, 
  createDefaultUserQuests 
} from './quests/questsState.js'

// Formatters
import { formatChallenge, formatReward, formatString } from './quests/questsFormatters.js'

// Helpers de progrès
import { 
  getStepProgress as getStepProgressBase, 
  canClaimStepReward as canClaimStepRewardBase, 
  getChallengeProgress as getChallengeProgressBase,
  isStepCompleted 
} from './quests/questsProgress.js'

// Actions API
import { 
  acceptQuest as acceptQuestBase, 
  abandonQuest as abandonQuestBase, 
  claimStepReward as claimStepRewardBase,
  checkQuestProgress as checkQuestProgressBase,
  handleQuestCompleted,
  createAutoCheck
} from './quests/questsActions.js'

export function useQuests() {
  const { token } = useAuth()
  const { refreshPlayerData } = usePlayer()
  const { quests: gameQuests, fetchGameData, items, especies } = useGameData()

  // Vérification de sécurité
  if (!userQuests || typeof userQuests.value === 'undefined') {
    console.error('userQuests not properly initialized')
    return createFallbackReturn()
  }

  // S'assurer que userQuests.value a toutes les propriétés nécessaires
  if (!userQuests.value || typeof userQuests.value !== 'object') {
    userQuests.value = createDefaultUserQuests()
  }

  // Computed properties
  const quests = computed(() => {
    try {
      const gameQuestsData = gameQuests.value || {}
      const userQuestsData = userQuests.value || {}
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1

      return Object.values(gameQuestsData).map(quest => {
        const isCompleted = userQuestsData.completedQuests?.includes(quest.id) && quest.unlock_level <= level || false
        const isActive = userQuestsData.activeQuest === quest.id
        const progress = userQuestsData.questProgress?.[quest.id] || {}
        const abandonedData = userQuestsData.abandonedQuests?.[quest.id]

        const steps = quest.steps?.map(step => {
          const stepProgress = progress[step.id] || {}
          return {
            ...step,
            completed: isStepCompleted(step, stepProgress),
            progress: stepProgress
          }
        }) || []

        return {
          ...quest,
          completed: isCompleted,
          active: isActive,
          abandoned: !!abandonedData,
          currentStepIndex: abandonedData?.currentStepIndex || 0,
          steps
        }
      })
    } catch (error) {
      console.error('Error in quests computed:', error)
      return []
    }
  })

  const activeQuest = computed(() => {
    try {
      return quests.value?.find(q => q.active) || null
    } catch (error) {
      return null
    }
  })

  const availableQuests = computed(() => {
    try {
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1
      return quests.value?.filter(q => !q.completed && !q.active && q.unlock_level <= level) || []
    } catch (error) {
      return []
    }
  })

  const completedQuests = computed(() => {
    try {
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1
      return quests.value?.filter(q => q.completed && q.unlock_level <= level) || []
    } catch (error) {
      return []
    }
  })

  const incompleteQuests = computed(() => {
    try {
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1
      return quests.value?.filter(q => !q.completed && q.unlock_level <= level).map(quest => ({
        ...quest,
        finalReward: quest.steps?.[quest.steps.length - 1]?.reward
      })) || []
    } catch (error) {
      return []
    }
  })

  const upcomingQuests = computed(() => {
    try {
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1
      return quests.value?.filter(q => !q.completed && q.unlock_level > level).map(quest => ({
        ...quest,
        finalReward: quest.steps?.[quest.steps.length - 1]?.reward
      })) || []
    } catch (error) {
      return []
    }
  })

  const completedCount = computed(() => {
    try {
      if (!userQuests?.value) return 0
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1
      const gameQuestsData = gameQuests.value || {}
      
      return userQuests.value.completedQuests?.filter(questId => {
        const quest = gameQuestsData[questId]
        return quest && quest.unlock_level <= level
      }).length ?? 0
    } catch (error) {
      return 0
    }
  })

  const totalCount = computed(() => (quests.value || []).length)

  const progressPercentage = computed(() => {
    const total = totalCount.value
    if (total === 0) return 0
    return Math.round((completedCount.value / total) * 100)
  })

  // Fonctions wrapper avec contexte
  async function fetchQuestsStatus() {
    return fetchStatus(token.value)
  }

  async function checkQuestProgress() {
    return checkQuestProgressBase(token.value)
  }

  async function acceptQuest(questId) {
    return acceptQuestBase(questId, token.value, checkQuestProgress)
  }

  async function abandonQuest() {
    return abandonQuestBase(token.value)
  }

  async function claimStepReward(stepId) {
    return claimStepRewardBase(stepId, token.value, refreshPlayerData, (questId) => {
      const quest = quests.value?.find(q => q.id === questId)
      if (quest) handleQuestCompleted(quest)
    })
  }

  function getStepProgress(step) {
    return getStepProgressBase(step, activeQuest.value, userQuests.value?.questProgress)
  }

  function canClaimStepReward(step) {
    return canClaimStepRewardBase(step, activeQuest.value, userQuests.value?.questProgress)
  }

  function getChallengeProgress(step, challengeType) {
    return getChallengeProgressBase(step, challengeType, activeQuest.value, userQuests.value?.questProgress)
  }

  function formatRewardLocal(reward) {
    return formatReward(reward, especies.value, items.value)
  }

  function formatChallengeLocal(challenge, currentValue) {
    return formatChallenge(challenge, currentValue)
  }

  // Auto-check
  const autoCheck = createAutoCheck(token.value, checkQuestProgress)

  return {
    // État
    userQuests,
    quests,
    activeQuest,
    availableQuests,
    completedQuests,
    incompleteQuests,
    upcomingQuests,
    completedCount,
    totalCount,
    progressPercentage,

    // Méthodes API
    fetchQuestsStatus,
    acceptQuest,
    abandonQuest,
    claimStepReward,
    checkQuestProgress,

    // Surveillance automatique
    startAutoCheck: autoCheck.start,
    stopAutoCheck: autoCheck.stop,

    // Helpers
    getStepProgress,
    canClaimStepReward,
    getChallengeProgress,
    formatChallenge: formatChallengeLocal,
    formatReward: formatRewardLocal,

    // Rechargement des données de jeu
    fetchGameData
  }
}

/**
 * Retourne un objet fallback en cas d'erreur d'initialisation
 */
function createFallbackReturn() {
  return {
    userQuests: ref(createDefaultUserQuests()),
    quests: ref([]),
    activeQuest: ref(null),
    availableQuests: ref([]),
    completedQuests: ref([]),
    incompleteQuests: ref([]),
    upcomingQuests: ref([]),
    completedCount: ref(0),
    totalCount: ref(0),
    progressPercentage: ref(0),
    fetchQuestsStatus: () => Promise.resolve(null),
    acceptQuest: () => Promise.resolve(false),
    abandonQuest: () => Promise.resolve(false),
    claimStepReward: () => Promise.resolve(false),
    checkQuestProgress: () => Promise.resolve(null),
    startAutoCheck: () => {},
    stopAutoCheck: () => {},
    getStepProgress: () => 0,
    canClaimStepReward: () => false,
    getChallengeProgress: () => 0,
    formatChallenge: () => '',
    formatReward: () => '',
    fetchGameData: () => Promise.resolve(null)
  }
}
