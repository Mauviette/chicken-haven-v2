import { ref, computed, watch } from 'vue'
import { useGameData } from '@/composables/useGameData'
import { useAuth } from '@/composables/useAuth'
import { usePlayer } from '@/composables/usePlayer'
import { apiGet, apiPost } from '@/utils/api'

// Dédoublonnage des notifications d'unlock pendant la session
const notifiedQuests = new Set()

export function useQuests() {
  const { token } = useAuth()
  const { eggs, refreshPlayerData } = usePlayer()
  const { quests: gameQuests, fetchGameData, items, especies } = useGameData()

  // État local pour chaque instance du composable
  const userQuests = ref({
    activeQuest: null,
    completedQuests: [],
    questProgress: {},
    abandonedQuests: {},
    lastChecked: new Date()
  })

  // Vérification de sécurité pour s'assurer que userQuests est toujours défini
  if (!userQuests || typeof userQuests.value === 'undefined') {
    console.error('userQuests not properly initialized')
    // Retourner un objet avec des valeurs par défaut pour éviter les crashes
    return {
      userQuests: ref({
        activeQuest: null,
        completedQuests: [],
        questProgress: {},
        lastChecked: new Date()
      }),
      quests: ref([]),
      activeQuest: ref(null),
      availableQuests: ref([]),
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
      fetchGameData: () => Promise.resolve(null)
    }
  }

  // S'assurer que userQuests.value a toutes les propriétés nécessaires
  if (!userQuests.value || typeof userQuests.value !== 'object') {
    userQuests.value = {
      activeQuest: null,
      completedQuests: [],
      questProgress: {},
      abandonedQuests: {},
      lastChecked: new Date()
    }
  }

  // Interval local à chaque instance
  let updateInterval = null

  // Fonction utilitaire pour formater les récompenses
  function formatString(type, count) {
    const itemsData = items.value
    const itemData = itemsData?.[type]
    if (!itemData || typeof count !== 'number') return 'Valeur invalide'
    return `${count} ${count === 1 ? itemData.nom_singulier : itemData.nom}`
  }

  // Computed properties pour l'affichage
  const quests = computed(() => {
    try {
      const gameQuestsData = gameQuests.value || {}
      const userQuestsData = userQuests.value || {}
      return Object.values(gameQuestsData).map(quest => {
        const playerData = usePlayer()
        const level = playerData?.level?.value || 1
        const isCompleted = userQuestsData.completedQuests?.includes(quest.id) && quest.unlock_level <= level || false
        const isActive = userQuestsData.activeQuest === quest.id
        const progress = userQuestsData.questProgress?.[quest.id] || {}
        const abandonedData = userQuestsData.abandonedQuests?.[quest.id]

        // Calculer les étapes complétées
        const steps = quest.steps?.map(step => {
          const stepProgress = progress[step.id] || {}
          const isStepCompleted = step.challenges?.every(challenge => {
            const currentValue = stepProgress[challenge.type] || 0
            return currentValue >= challenge.objectif
          }) || false

          return {
            ...step,
            completed: isStepCompleted,
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
      console.error('Error in activeQuest:', error)
      return null
    }
  })

  const availableQuests = computed(() => {
    try {
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1
      return quests.value?.filter(q => !q.completed && !q.active && q.unlock_level <= level) || []
    } catch (error) {
      console.error('Error in availableQuests:', error)
      return []
    }
  })

  const completedQuests = computed(() => {
    try {
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1
      return quests.value?.filter(q => q.completed && q.unlock_level <= level) || []
    } catch (error) {
      console.error('Error in completedQuests:', error)
      return []
    }
  })

  const incompleteQuests = computed(() => {
    try {
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1
      return quests.value?.filter(q => !q.completed && q.unlock_level <= level).map(quest => {
        // Ajouter la récompense finale (dernière étape) pour les quêtes non accomplies
        const finalReward = quest.steps?.[quest.steps.length - 1]?.reward
        return {
          ...quest,
          finalReward
        }
      }) || []
    } catch (error) {
      console.error('Error in incompleteQuests:', error)
      return []
    }
  })

  const completedCount = computed(() => {
    try {
      if (!userQuests || !userQuests.value) return 0
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1
      const gameQuestsData = gameQuests.value || {}
      
      // Compter seulement les quêtes terminées qui sont accessibles au niveau du joueur
      return userQuests.value.completedQuests?.filter(questId => {
        const quest = gameQuestsData[questId]
        return quest && quest.unlock_level <= level
      }).length ?? 0
    } catch (error) {
      console.error('Error in completedCount:', error)
      return 0
    }
  })

  const totalCount = computed(() => {
    try {
      const playerData = usePlayer()
      const level = playerData?.level?.value || 1
      const allQuests = quests.value || []
      // Compter toutes les quêtes qui sont soit disponibles, soit déjà complétées
      return allQuests.filter(q => q.unlock_level <= level).length
    } catch (error) {
      console.error('Error in totalCount:', error)
      return 0
    }
  })

  const progressPercentage = computed(() => {
    try {
      const total = totalCount.value
      if (total === 0) return 0
      const completed = completedCount.value
      return Math.round((completed / total) * 100)
    } catch (error) {
      console.error('Error in progressPercentage:', error)
      return 0
    }
  })

  // Helpers pour calculer le progrès d'une étape
  function getStepProgress(step) {
    try {
      if (!activeQuest.value || !step || !userQuests.value || !userQuests.value.questProgress) return 0

      const questProgress = userQuests.value.questProgress?.[activeQuest.value.id] || {}
      const stepProgress = questProgress[step.id] || {}

      const totalChallenges = step.challenges?.length || 0
      if (totalChallenges === 0) return 0

      let completedChallenges = 0

      step.challenges.forEach(challenge => {
        const currentValue = stepProgress[challenge.type] || 0
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

  // Vérifier si une étape peut être réclamée (complétée + étapes précédentes réclamées)
  function canClaimStepReward(step) {
    try {
      if (!activeQuest.value || !step || !userQuests.value || !userQuests.value.questProgress) return false

      const questProgress = userQuests.value.questProgress?.[activeQuest.value.id] || {}
      const stepProgress = questProgress[step.id] || {}

      // Vérifier que l'étape est complétée
      const isCompleted = step.challenges?.every(challenge => {
        const currentValue = stepProgress[challenge.type] || 0
        return currentValue >= challenge.objectif
      }) || false

      if (!isCompleted) return false

      // Vérifier que la récompense n'a pas déjà été réclamée
      if (stepProgress.rewardClaimed) return false

      // Vérifier que toutes les étapes précédentes ont été réclamées
      const quest = activeQuest.value
      const stepIndex = quest.steps?.findIndex(s => s.id === step.id) ?? -1

      for (let i = 0; i < stepIndex; i++) {
        const prevStep = quest.steps[i]
        const prevStepProgress = questProgress[prevStep.id] || {}
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

  // Fonction pour obtenir la valeur actuelle d'un défi spécifique
  function getChallengeProgress(step, challengeType) {
    try {
      if (!activeQuest.value || !step || !userQuests.value || !userQuests.value.questProgress) return 0

      const questProgress = userQuests.value.questProgress?.[activeQuest.value.id] || {}
      const stepProgress = questProgress[step.id] || {}

      return stepProgress[challengeType] || 0
    } catch (error) {
      console.error('Error in getChallengeProgress:', error)
      return 0
    }
  }

  // Fonction pour formater l'affichage d'une récompense
  function formatReward(reward) {
    if (!reward) return 'Aucune récompense'

    if (reward.type === 'chicken') {
      // Pour les récompenses de poules, on affiche le nom de l'espèce
      const especeData = especies.value?.[reward.especeId]
      const chickenName = especeData?.nom || reward.especeId
      return `${reward.quantite}x ${chickenName}`
    }

    // Pour les autres types de récompenses, utiliser la fonction formatString existante
    return formatString(reward.type, reward.quantite)
  }

  // Fonction pour formater l'affichage d'un défi
  function formatChallenge(challenge, currentValue) {
    try {
      const objectif = challenge.objectif || 0
      const progress = Math.min(currentValue || 0, objectif)

      switch (challenge.type) {
        case 'eggs_collected':
          return `Récolter ${objectif} œufs (${progress}/${objectif})`
        case 'spawnables_clicked':
          return `Cliquer sur ${objectif} objets spawnés (${progress}/${objectif})`
        case 'boxes_opened':
          return `Ouvrir ${objectif} boîte${objectif > 1 ? 's' : ''} (${progress}/${objectif})`
        case 'chicken_abilities_used':
          return `Utiliser ${objectif} capacité${objectif > 1 ? 's' : ''} de poule${objectif > 1 ? 's' : ''} (${progress}/${objectif})`
        case 'chicken_gifts_collected':
          return `Collecter ${objectif} cadeau${objectif > 1 ? 'x' : ''} de poule${objectif > 1 ? 's' : ''} (${progress}/${objectif})`
        case 'mining_games_played':
          return `Jouer ${objectif} partie${objectif > 1 ? 's' : ''} de minage (${progress}/${objectif})`
        case 'mining_cells_broken':
          return `Briser ${objectif} case${objectif > 1 ? 's' : ''} en minage (${progress}/${objectif})`
        case 'max_eggs_in_click':
          return `Récolter ${objectif} œufs en un clic (${progress}/${objectif})`
        default:
          return `${challenge.type}: ${progress}/${objectif}`
      }
    } catch (error) {
      console.error('Error in formatChallenge:', error)
      return 'Défi inconnu'
    }
  }

  // API Methods
  async function fetchQuestsStatus() {
    if (!token.value) return

    try {
      const response = await apiGet('/api/quests/status')
      // Assigner toujours une valeur par défaut avec les données de l'API
      userQuests.value = {
        activeQuest: null,
        completedQuests: [],
        questProgress: {},
        abandonedQuests: {},
        ...response,
        lastChecked: new Date()
      }
      return response
    } catch (error) {
      console.error('Erreur lors de la récupération du statut des quêtes:', error)
      // Initialiser avec des valeurs par défaut en cas d'erreur
      userQuests.value = {
        activeQuest: null,
        completedQuests: [],
        questProgress: {},
        abandonedQuests: {},
        lastChecked: new Date()
      }
      return null
    }
  }

  async function acceptQuest(questId) {
    if (!token.value) return false

    try {
      const response = await apiPost(`/api/quests/accept/${questId}`, {})
      await fetchQuestsStatus() // Rafraîchir l'état
      await checkQuestProgress() // Mettre à jour les progrès immédiatement
      return response
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de la quête:', error)
      return false
    }
  }

  async function abandonQuest() {
    if (!token.value || !userQuests.value?.activeQuest) return false

    try {
      const response = await apiPost('/api/quests/abandon', {})
      await fetchQuestsStatus() // Rafraîchir l'état
      return response
    } catch (error) {
      console.error('Erreur lors de l\'abandon de la quête:', error)
      return false
    }
  }

  async function claimStepReward(stepId) {
    if (!token.value) return false

    try {
      const response = await apiPost(`/api/quests/claim-step/${stepId}`, {})

      // Rafraîchir les ressources du joueur (œufs, jetons, niveau)
      try { await refreshPlayerData() } catch (_) {}

      await fetchQuestsStatus() // Rafraîchir l'état des quêtes

      // Vérifier si la quête a été terminée
      if (response?.questCompleted && response?.completedQuest) {
        const completedQuest = quests.value?.find(q => q.id === response.completedQuest)
        if (completedQuest) {
          handleQuestCompleted(completedQuest)
        }
      }

      return response
    } catch (error) {
      console.error('Erreur lors de la réclamation de récompense d\'étape:', error)
      return false
    }
  }

  async function checkQuestProgress() {
    if (!token.value) return

    try {
      const response = await apiPost('/api/quests/check-progress', {})
      await fetchQuestsStatus() // Rafraîchir l'état après vérification
      return response
    } catch (error) {
      console.error('Erreur lors de la vérification du progrès des quêtes:', error)
      return null
    }
  }

  // Gestion des nouvelles quêtes complétées
  function handleQuestCompleted(quest) {
    // Éviter les doubles toasts pour la même quête dans la session
    if (notifiedQuests.has(quest.id)) return
    notifiedQuests.add(quest.id)

    // Afficher un toast global si disponible
    try {
      const message = `Quête complétée: ${quest.nom}`
      if (typeof window !== 'undefined' && window.$toast) {
        window.$toast(message, 'quest')
      }
    } catch (_) { /* noop */ }

    // Déclencher un événement personnalisé pour les notifications
    window.dispatchEvent(new CustomEvent('quest-completed', {
      detail: { quest }
    }))
  }

  // Surveillance automatique des changements
  function startAutoCheck() {
    if (updateInterval) return

    // Vérifier les quêtes toutes les 30 secondes
    updateInterval = setInterval(async () => {
      await checkQuestProgress()
    }, 30000)

    // Rafraîchir lors d'événements clés (achat poule, clic œuf, etc.)
    if (typeof window !== 'undefined') {
      const onQuestAction = () => setTimeout(checkQuestProgress, 500)
      const onAuthLogin = async () => {
        // Réinitialiser puis recharger les quêtes pour le nouveau compte
        try { notifiedQuests.clear() } catch (_) {}
        userQuests.value = {
          activeQuest: null,
          completedQuests: [],
          questProgress: {},
          abandonedQuests: {},
          lastChecked: new Date()
        }
        try {
          await fetchQuestsStatus()
        } catch (_) {}
      }
      const onAuthLogout = () => {
        // Nettoyer l'état local pour éviter un affichage d'un autre compte
        try { notifiedQuests.clear() } catch (_) {}
        userQuests.value = {
          activeQuest: null,
          completedQuests: [],
          questProgress: {},
          abandonedQuests: {},
          lastChecked: new Date()
        }
      }

      window.addEventListener('quest-action', onQuestAction)
      window.addEventListener('auth-login', onAuthLogin)
      window.addEventListener('auth-logout', onAuthLogout)

      // Stocker les handlers pour pouvoir les retirer si besoin
      startAutoCheck._onQuestAction = onQuestAction
      startAutoCheck._onAuthLogin = onAuthLogin
      startAutoCheck._onAuthLogout = onAuthLogout
    }
  }

  function stopAutoCheck() {
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
    if (typeof window !== 'undefined') {
      if (startAutoCheck._onQuestAction) {
        window.removeEventListener('quest-action', startAutoCheck._onQuestAction)
        startAutoCheck._onQuestAction = null
      }
      if (startAutoCheck._onAuthLogin) {
        window.removeEventListener('auth-login', startAutoCheck._onAuthLogin)
        startAutoCheck._onAuthLogin = null
      }
      if (startAutoCheck._onAuthLogout) {
        window.removeEventListener('auth-logout', startAutoCheck._onAuthLogout)
        startAutoCheck._onAuthLogout = null
      }
    }
  }

  return {
    // État
    userQuests,
    quests,
    activeQuest,
    availableQuests,
    completedQuests,
    incompleteQuests,
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
    startAutoCheck,
    stopAutoCheck,

    // Helpers
    getStepProgress,
    canClaimStepReward,
    getChallengeProgress,
    formatChallenge,
    formatReward,
    formatChallenge,

    // Rechargement des données de jeu
    fetchGameData
  }
}