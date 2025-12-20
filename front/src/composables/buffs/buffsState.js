// composables/buffs/buffsState.js
// État partagé pour les buffs

import { ref } from 'vue'

// État des buffs
export const buffs = ref([])

// Ticker temporel réactif pour réévaluer les expirations sans attendre un fetch
export const nowTs = ref(Date.now())

// Initialiser le ticker (une seule fois)
if (typeof window !== 'undefined') {
  if (!window.__buffsNowTicker) {
    window.__buffsNowTicker = setInterval(() => {
      nowTs.value = Date.now()
    }, 1000)
  }
}

/**
 * Nettoyage immédiat des buffs expirés du tableau principal
 */
export function cleanExpiredBuffs() {
  const now = Date.now()
  buffs.value = buffs.value.filter(buff => {
    if (!buff.lasts_until) return false
    const expiresAt = new Date(buff.lasts_until).getTime()
    return expiresAt > (now + 100)
  })
}
