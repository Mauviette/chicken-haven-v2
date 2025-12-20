// composables/chickenGifts/chickenGiftsState.js
// État partagé pour les cadeaux de poules

import { ref, reactive, readonly } from 'vue'

export const CHECK_INTERVAL = 10000 // Vérifier toutes les 10 secondes

// État des cadeaux actifs
export const activeGifts = ref([])
export const isLoading = ref(false)
export const lastCheck = ref(0)

// État réactif pour les cadeaux par poule
export const giftsByChicken = reactive({})

// Garder une trace des cadeaux précédents pour détecter les nouveaux
let previousGifts = new Set()

/**
 * Obtenir les IDs des cadeaux précédents
 */
export function getPreviousGifts() {
  return previousGifts
}

/**
 * Mettre à jour les cadeaux précédents
 */
export function setPreviousGifts(giftIds) {
  previousGifts = giftIds
}

/**
 * Mettre à jour l'état des cadeaux par poule
 */
export function updateGiftsByChicken(newGiftsByChicken) {
  // Nettoyer l'ancien état
  Object.keys(giftsByChicken).forEach(especeId => {
    if (!newGiftsByChicken[especeId]) {
      delete giftsByChicken[especeId]
    }
  })

  // Mettre à jour avec le nouvel état
  Object.assign(giftsByChicken, newGiftsByChicken)
}

/**
 * Supprimer un cadeau de l'état local
 */
export function removeGift(especeId, giftId) {
  delete giftsByChicken[especeId]
  activeGifts.value = activeGifts.value.filter(g => g.id !== giftId)
}

/**
 * Obtenir les exports readonly pour le composable
 */
export function getReadonlyState() {
  return {
    activeGifts: readonly(activeGifts),
    giftsByChicken: readonly(giftsByChicken),
    isLoading: readonly(isLoading)
  }
}
