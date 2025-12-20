// composables/useChickenGifts.js
// Composable pour la gestion des cadeaux de poules

import { usePlayer } from '@/composables/usePlayer'

// Import des modules utilitaires
import { initChickenGiftStyles } from './chickenGifts/chickenGiftsEffects.js'
import { getReadonlyState, giftsByChicken } from './chickenGifts/chickenGiftsState.js'
import {
  checkAvailableGifts,
  collectGift as collectGiftAction,
  hasActiveGift,
  getActiveGift,
  startPeriodicCheck,
  getGiftConfig
} from './chickenGifts/chickenGiftsActions.js'

// Initialiser les styles CSS au chargement du module
initChickenGiftStyles()

export function useChickenGifts() {
  const { refreshPlayerData } = usePlayer()

  // Wrapper pour collectGift qui injecte refreshPlayerData
  const collectGift = async (especeId, position = null) => {
    return collectGiftAction(especeId, position, refreshPlayerData)
  }

  // Obtenir l'état readonly
  const { activeGifts, giftsByChicken: giftsByChickenReadonly, isLoading } = getReadonlyState()

  return {
    // État (readonly)
    activeGifts,
    giftsByChicken: giftsByChickenReadonly,
    isLoading,

    // Actions
    checkAvailableGifts,
    collectGift,
    hasActiveGift,
    getActiveGift,
    startPeriodicCheck,
    getGiftConfig
  }
}
