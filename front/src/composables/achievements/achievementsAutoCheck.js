// composables/achievements/achievementsAutoCheck.js
// Gestion de la surveillance automatique des succès

import { watch } from 'vue'
import {
  updateInterval,
  setUpdateInterval,
  resetAchievementsState
} from './achievementsState.js'
import { fetchAchievements, checkAchievements } from './achievementsActions.js'

// Stockage des handlers d'événements
const eventHandlers = {}

/**
 * Démarrer la surveillance automatique des succès
 */
export function startAutoCheck(token, eggs, handleNewAchievementsCallback, fetchAchievementsFn, checkAchievementsFn) {
  if (updateInterval) return

  // Vérifier les succès toutes les 30 secondes
  const interval = setInterval(async () => {
    await checkAchievementsFn()
  }, 30000)
  setUpdateInterval(interval)

  // Vérifier aussi quand les œufs changent significativement
  watch(eggs, (newValue, oldValue) => {
    if (newValue > oldValue + 10) {
      setTimeout(checkAchievementsFn, 1000)
    }
  })

  // Rafraîchir lors d'événements clés
  if (typeof window !== 'undefined') {
    const createDelayedHandler = (delay = 250) => () => setTimeout(checkAchievementsFn, delay)

    eventHandlers.onChickenBought = createDelayedHandler()
    eventHandlers.onEggClicked = createDelayedHandler()
    eventHandlers.onAvatarUpdated = createDelayedHandler()
    eventHandlers.onNameChanged = createDelayedHandler()
    eventHandlers.onChickenUpgraded = createDelayedHandler()
    eventHandlers.onMiningAction = createDelayedHandler(500)
    eventHandlers.onChestOpened = createDelayedHandler()

    eventHandlers.onAuthLogin = async () => {
      resetAchievementsState()
      try {
        await fetchAchievementsFn()
        await checkAchievementsFn()
      } catch (_) {}
    }

    eventHandlers.onAuthLogout = () => {
      resetAchievementsState()
    }

    // Enregistrer les listeners
    window.addEventListener('chicken-bought', eventHandlers.onChickenBought)
    window.addEventListener('egg-clicked', eventHandlers.onEggClicked)
    window.addEventListener('avatar-updated', eventHandlers.onAvatarUpdated)
    window.addEventListener('name-changed', eventHandlers.onNameChanged)
    window.addEventListener('chicken-upgraded', eventHandlers.onChickenUpgraded)
    window.addEventListener('mining-action', eventHandlers.onMiningAction)
    window.addEventListener('chest-opened', eventHandlers.onChestOpened)
    window.addEventListener('auth-login', eventHandlers.onAuthLogin)
    window.addEventListener('auth-logout', eventHandlers.onAuthLogout)
  }
}

/**
 * Arrêter la surveillance automatique
 */
export function stopAutoCheck() {
  if (updateInterval) {
    clearInterval(updateInterval)
    setUpdateInterval(null)
  }

  if (typeof window !== 'undefined') {
    const eventMap = {
      'chicken-bought': 'onChickenBought',
      'egg-clicked': 'onEggClicked',
      'avatar-updated': 'onAvatarUpdated',
      'name-changed': 'onNameChanged',
      'chicken-upgraded': 'onChickenUpgraded',
      'mining-action': 'onMiningAction',
      'chest-opened': 'onChestOpened',
      'auth-login': 'onAuthLogin',
      'auth-logout': 'onAuthLogout'
    }

    for (const [event, handlerKey] of Object.entries(eventMap)) {
      if (eventHandlers[handlerKey]) {
        window.removeEventListener(event, eventHandlers[handlerKey])
        eventHandlers[handlerKey] = null
      }
    }
  }
}
