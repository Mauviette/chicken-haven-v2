// composables/useBuffs.js
// Composable pour la gestion des buffs - version refactorisée

import { computed } from 'vue'

// Import des modules utilitaires
import { buffs, nowTs } from './buffs/buffsState.js'
import { fetchBuffs, updateBuffsFromEggStatus } from './buffs/buffsActions.js'
import {
  formatBuffEffect,
  formatBuffShort,
  getTimeRemaining,
  getBuffDuration,
  getBuffTooltipHtml
} from './buffs/buffsFormatters.js'
import { getBuffIcon, getBuffColor } from './buffs/buffsDisplay.js'

export function useBuffs() {
  // Filtre les buffs actifs (non expirés) - EXCLUT les buffs cachés pour l'affichage UI
  const activeBuffs = computed(() => {
    const now = nowTs.value
    return buffs.value.filter(buff => {
      if (!buff.lasts_until) return false
      const expiresAt = new Date(buff.lasts_until).getTime()
      return expiresAt > (now + 100) && !buff.hidden
    })
  })

  // Retourne TOUS les buffs actifs (non expirés) - INCLUT les buffs cachés pour la logique métier
  const allActiveBuffs = computed(() => {
    const now = nowTs.value
    return buffs.value.filter(buff => {
      if (!buff.lasts_until) return false
      const expiresAt = new Date(buff.lasts_until).getTime()
      return expiresAt > (now + 100)
    })
  })

  return {
    // État
    buffs,
    nowTs,
    activeBuffs,
    allActiveBuffs,

    // Actions
    fetchBuffs,
    updateBuffsFromEggStatus,

    // Formatters
    getTimeRemaining,
    getBuffDuration,
    formatBuffEffect,
    formatBuffShort,
    getBuffTooltipHtml,

    // Display
    getBuffIcon,
    getBuffColor
  }
}
