// composables/chickenGifts/chickenGiftsActions.js
// Actions API pour les cadeaux de poules

import { apiCallJSON, apiPost } from '@/utils/api'
import {
  activeGifts,
  isLoading,
  lastCheck,
  giftsByChicken,
  getPreviousGifts,
  setPreviousGifts,
  updateGiftsByChicken,
  removeGift,
  CHECK_INTERVAL
} from './chickenGiftsState.js'
import { createChickenGiftAppearanceEffect, createChickenGiftRewardEffect } from './chickenGiftsEffects.js'

/**
 * Détecter et afficher les effets pour les nouveaux cadeaux
 */
function handleNewGifts(gifts) {
  const currentGiftIds = new Set(gifts.map(g => g.id))
  const previousGifts = getPreviousGifts()
  const newGiftIds = [...currentGiftIds].filter(id => !previousGifts.has(id))

  // Pour chaque nouveau cadeau, déclencher l'animation d'apparition
  newGiftIds.forEach(giftId => {
    const gift = gifts.find(g => g.id === giftId)
    if (gift) {
      const chickenElement = document.querySelector(`[data-espece-id="${gift.especeId}"]`) ||
                             document.querySelector('.parade-chicken')

      if (chickenElement) {
        const rect = chickenElement.getBoundingClientRect()
        const position = {
          x: rect.left + rect.width / 2,
          y: rect.top - 25
        }
        createChickenGiftAppearanceEffect(position)
      }
    }
  })

  // Mettre à jour la liste des cadeaux précédents
  setPreviousGifts(currentGiftIds)
}

/**
 * Vérifier les cadeaux disponibles auprès de l'API
 */
export async function checkAvailableGifts() {
  try {
    isLoading.value = true
    const response = await apiCallJSON('/api/chicken-gifts/check')

    if (response.gifts) {
      activeGifts.value = response.gifts
      lastCheck.value = Date.now()

      // Mettre à jour l'état par poule
      const newGiftsByChicken = {}
      response.gifts.forEach(gift => {
        newGiftsByChicken[gift.especeId] = gift
      })

      // Détecter et afficher les nouveaux cadeaux
      handleNewGifts(response.gifts)

      // Mettre à jour l'état
      updateGiftsByChicken(newGiftsByChicken)
    }
  } catch (error) {
    console.error('[ChickenGifts:FE] Erreur lors de la vérification des cadeaux:', error)
  } finally {
    isLoading.value = false
  }
}

/**
 * Collecter un cadeau
 */
export async function collectGift(especeId, position = null, refreshPlayerData) {
  try {
    const gift = giftsByChicken[especeId]
    if (!gift) {
      return
    }

    const giftId = gift.id
    const response = await apiPost('/api/chicken-gifts/collect', { giftId, especeId })

    if (response.success) {
      // Supprimer le cadeau de l'état local
      removeGift(especeId, giftId)

      // Afficher l'effet visuel de récompense
      if (response.reward) {
        createChickenGiftRewardEffect(response.reward, position)
      }

      // Rafraîchir les données du joueur
      try {
        await refreshPlayerData()
      } catch (error) {
        console.warn('[ChickenGifts:FE] Erreur lors du rafraîchissement des données joueur:', error)
      }

      return response
    }
  } catch (error) {
    console.error('[ChickenGifts:FE] Erreur lors de la collecte du cadeau:', error)
    if (window.$toast) {
      window.$toast('Erreur lors de la collecte du cadeau', 'error')
    }
    throw error
  }
}

/**
 * Vérifier si une poule a un cadeau actif
 */
export function hasActiveGift(especeId) {
  return !!giftsByChicken[especeId]
}

/**
 * Obtenir le cadeau actif d'une poule
 */
export function getActiveGift(especeId) {
  return giftsByChicken[especeId]
}

/**
 * Démarrer la vérification périodique
 */
export function startPeriodicCheck() {
  const check = async () => {
    if (Date.now() - lastCheck.value >= CHECK_INTERVAL) {
      await checkAvailableGifts()
    }
  }

  // Vérifier immédiatement
  check()

  // Puis vérifier périodiquement
  const intervalId = setInterval(() => {
    check()
  }, CHECK_INTERVAL)

  // Retourner une fonction pour arrêter
  return () => {
    clearInterval(intervalId)
  }
}

/**
 * Obtenir la configuration des cadeaux
 */
export async function getGiftConfig() {
  try {
    const response = await apiCallJSON('/api/chicken-gifts/config')
    return response.config
  } catch (error) {
    console.error('[ChickenGifts:FE] Erreur lors de la récupération de la config:', error)
    return null
  }
}
