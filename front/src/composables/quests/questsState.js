/**
 * État partagé des quêtes (singleton)
 */
import { ref } from 'vue'
import { apiGet } from '@/utils/api'

// Dédoublonnage des notifications d'unlock pendant la session
export const notifiedQuests = new Set()

// État local pour chaque instance du composable
export const userQuests = ref({
  activeQuest: null,
  completedQuests: [],
  questProgress: {},
  abandonedQuests: {},
  lastChecked: new Date()
})

/**
 * Réinitialise l'état des quêtes
 */
export function resetQuestsState() {
  notifiedQuests.clear()
  userQuests.value = {
    activeQuest: null,
    completedQuests: [],
    questProgress: {},
    abandonedQuests: {},
    lastChecked: new Date()
  }
}

/**
 * Récupère le statut des quêtes depuis le serveur
 * @param {string} token - Token d'authentification
 * @returns {Promise<Object|null>}
 */
export async function fetchQuestsStatus(token) {
  if (!token) return null

  try {
    const response = await apiGet('/api/quests/status')
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

/**
 * Crée un objet userQuests par défaut pour les cas d'erreur
 * @returns {Object}
 */
export function createDefaultUserQuests() {
  return {
    activeQuest: null,
    completedQuests: [],
    questProgress: {},
    abandonedQuests: {},
    lastChecked: new Date()
  }
}
