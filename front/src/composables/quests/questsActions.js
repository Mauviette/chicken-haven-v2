/**
 * Actions API pour les quêtes
 */
import { apiPost } from '@/utils/api'
import { userQuests, notifiedQuests, fetchQuestsStatus as fetchStatus, resetQuestsState } from './questsState.js'

/**
 * Accepte une quête
 * @param {string} questId - ID de la quête
 * @param {string} token - Token d'authentification
 * @param {Function} checkProgress - Fonction de vérification du progrès
 * @returns {Promise<Object|false>}
 */
export async function acceptQuest(questId, token, checkProgress) {
  if (!token) return false

  try {
    const response = await apiPost(`/api/quests/accept/${questId}`, {})
    await fetchStatus(token)
    await checkProgress()
    return response
  } catch (error) {
    console.error('Erreur lors de l\'acceptation de la quête:', error)
    return false
  }
}

/**
 * Abandonne la quête active
 * @param {string} token - Token d'authentification
 * @returns {Promise<Object|false>}
 */
export async function abandonQuest(token) {
  if (!token || !userQuests.value?.activeQuest) return false

  try {
    const response = await apiPost('/api/quests/abandon', {})
    await fetchStatus(token)
    return response
  } catch (error) {
    console.error('Erreur lors de l\'abandon de la quête:', error)
    return false
  }
}

/**
 * Réclame la récompense d'une étape
 * @param {string} stepId - ID de l'étape
 * @param {string} token - Token d'authentification
 * @param {Function} refreshPlayerData - Fonction de rafraîchissement du joueur
 * @param {Function} onQuestCompleted - Callback quand une quête est terminée
 * @returns {Promise<Object|false>}
 */
export async function claimStepReward(stepId, token, refreshPlayerData, onQuestCompleted) {
  if (!token) return false

  try {
    const response = await apiPost(`/api/quests/claim-step/${stepId}`, {})

    try { await refreshPlayerData() } catch (_) {}
    await fetchStatus(token)

    if (response?.questCompleted && response?.completedQuest) {
      onQuestCompleted(response.completedQuest)
    }

    return response
  } catch (error) {
    console.error('Erreur lors de la réclamation de récompense d\'étape:', error)
    return false
  }
}

/**
 * Vérifie le progrès des quêtes
 * @param {string} token - Token d'authentification
 * @returns {Promise<Object|null>}
 */
export async function checkQuestProgress(token) {
  if (!token) return null

  try {
    const response = await apiPost('/api/quests/check-progress', {})
    await fetchStatus(token)
    return response
  } catch (error) {
    console.error('Erreur lors de la vérification du progrès des quêtes:', error)
    return null
  }
}

/**
 * Gère la notification de complétion de quête
 * @param {Object} quest - Quête complétée
 */
export function handleQuestCompleted(quest) {
  if (notifiedQuests.has(quest.id)) return
  notifiedQuests.add(quest.id)

  try {
    const message = `Quête complétée: ${quest.nom}`
    if (typeof window !== 'undefined' && window.$toast) {
      window.$toast(message, 'quest')
    }
  } catch (_) {}

  window.dispatchEvent(new CustomEvent('quest-completed', { detail: { quest } }))
}

/**
 * Configure la surveillance automatique des quêtes
 * @param {string} token - Token d'authentification
 * @param {Function} checkProgress - Fonction de vérification du progrès
 * @returns {Object} - { start, stop }
 */
export function createAutoCheck(token, checkProgress) {
  let updateInterval = null
  let handlers = {}

  function start() {
    if (updateInterval) return

    updateInterval = setInterval(async () => {
      await checkProgress()
    }, 30000)

    if (typeof window !== 'undefined') {
      handlers.onQuestAction = () => setTimeout(checkProgress, 500)
      handlers.onAuthLogin = async () => {
        resetQuestsState()
        try { await fetchStatus(token) } catch (_) {}
      }
      handlers.onAuthLogout = () => resetQuestsState()

      window.addEventListener('quest-action', handlers.onQuestAction)
      window.addEventListener('auth-login', handlers.onAuthLogin)
      window.addEventListener('auth-logout', handlers.onAuthLogout)
    }
  }

  function stop() {
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
    if (typeof window !== 'undefined') {
      if (handlers.onQuestAction) window.removeEventListener('quest-action', handlers.onQuestAction)
      if (handlers.onAuthLogin) window.removeEventListener('auth-login', handlers.onAuthLogin)
      if (handlers.onAuthLogout) window.removeEventListener('auth-logout', handlers.onAuthLogout)
      handlers = {}
    }
  }

  return { start, stop }
}
