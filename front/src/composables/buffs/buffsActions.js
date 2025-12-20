// composables/buffs/buffsActions.js
// Actions API pour les buffs

import { apiGet } from '@/utils/api'
import { buffs, cleanExpiredBuffs } from './buffsState.js'

/**
 * Récupère les buffs actifs de l'utilisateur depuis l'API
 */
export async function fetchBuffs() {
  try {
    const response = await apiGet('/api/user/buffs')
    const newBuffs = response?.buffs || []

    // Ne pas écraser les buffs si nous avons déjà un buff time_stop avec frozenEffectiveIncome
    const hasTimeStopWithFrozenIncome = buffs.value.some(buff =>
      buff.buff_type === 'time_stop' && buff.buff?.frozenEffectiveIncome != null
    )

    if (hasTimeStopWithFrozenIncome) {
      // Mettre à jour seulement les buffs qui ne sont pas time_stop, ou fusionner
      const mergedBuffs = [...buffs.value]
      for (const newBuff of newBuffs) {
        const existingIndex = mergedBuffs.findIndex(b =>
          b.buff_type === newBuff.buff_type && b.origin === newBuff.origin
        )
        if (existingIndex === -1) {
          mergedBuffs.push(newBuff)
        } else if (newBuff.buff_type !== 'time_stop') {
          // Pour les buffs non time_stop, mettre à jour
          mergedBuffs[existingIndex] = newBuff
        }
        // Pour time_stop, garder l'existant
      }
      buffs.value = mergedBuffs
    } else {
      buffs.value = newBuffs
    }

    cleanExpiredBuffs()
    return buffs.value
  } catch (error) {
    console.error('Erreur lors de la récupération des buffs:', error)
    buffs.value = []
    return []
  }
}

/**
 * Met à jour les buffs depuis getEggStatus (qui inclut maintenant les buffs)
 */
export function updateBuffsFromEggStatus(eggStatusData) {
  if (eggStatusData?.buffs) {
    buffs.value = eggStatusData.buffs
    cleanExpiredBuffs()
  }
}
