// composables/useBuffs.js
import { ref, computed } from 'vue'
import { apiGet } from '@/utils/api'

const buffs = ref([])

export function useBuffs() {
  // Récupère les buffs actifs de l'utilisateur
  async function fetchBuffs() {
    try {
      const response = await apiGet('/api/user/buffs')
      buffs.value = response?.buffs || []
      return buffs.value
    } catch (error) {
      console.error('Erreur lors de la récupération des buffs:', error)
      buffs.value = []
      return []
    }
  }

  // Filtre les buffs actifs (non expirés)
  const activeBuffs = computed(() => {
    const now = new Date()
    return buffs.value.filter(buff => {
      if (!buff.lasts_until) return false
      const expiresAt = new Date(buff.lasts_until)
      return expiresAt > now
    })
  })

  // Formate la durée restante d'un buff
  function getTimeRemaining(buff) {
    if (!buff.lasts_until) return 'Permanent'
    
    const now = new Date()
    const expiresAt = new Date(buff.lasts_until)
    const diffMs = expiresAt - now
    
    if (diffMs <= 0) return 'Expiré'
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // Formate l'effet d'un buff
  function formatBuffEffect(buff) {
    const operation = buff.buff?.operation || 'mult'
    const amount = buff.buff?.amount || '1'
    const type = buff.buff_type || 'income'
    
    let effectText = ''
    if (operation === 'mult') {
      const multiplier = parseFloat(amount)
      const percentage = Math.round((multiplier - 1) * 100)
      effectText = `+${percentage}%`
    } else if (operation === 'add') {
      effectText = `+${amount}`
    } else {
      effectText = `${operation} ${amount}`
    }
    
    let typeText = ''
    switch (type) {
      case 'income':
        typeText = 'Revenu'
        break
      case 'production':
        typeText = 'Production'
        break
      case 'storage':
        typeText = 'Stockage'
        break
      default:
        typeText = type
    }
    
    return `${typeText} ${effectText}`
  }

  // Obtient l'icône d'un buff selon son type
  function getBuffIcon(buff) {
    const type = buff.buff_type || 'income'
    switch (type) {
      case 'income':
        return '💰'
      case 'production':
        return '⚡'
      case 'storage':
        return '📦'
      default:
        return '✨'
    }
  }

  return {
    buffs,
    activeBuffs,
    fetchBuffs,
    getTimeRemaining,
    formatBuffEffect,
    getBuffIcon
  }
}