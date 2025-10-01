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
    
    const totalSeconds = Math.floor(diffMs / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
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
      case 'income_multiplier':
        typeText = 'Revenu'
        break
      case 'production':
        typeText = 'Production'
        break
      case 'storage':
        typeText = 'Stockage'
        break
      default:
        typeText = type.replace('_', ' ')
    }
    
    return `${typeText} ${effectText}`
  }

  // Obtient l'icône d'un buff selon son type et son origine
  function getBuffIcon(buff) {
    // Icône spéciale pour les buffs de chocolat de la poule Gourmande
    if (buff.origin && buff.origin.includes('Gourmande')) {
      return '🍫'
    }
    
    const type = buff.buff_type || 'income'
    switch (type) {
      case 'income':
      case 'income_multiplier':
        return '💰'
      case 'production':
        return '⚡'
      case 'storage':
        return '📦'
      default:
        return '✨'
    }
  }

  // Obtient la couleur d'un buff selon son type et son origine
  function getBuffColor(buff) {
    // Couleur spéciale pour les buffs de chocolat de la poule Gourmande
    if (buff.origin && buff.origin.includes('Gourmande')) {
      return { bg: '#8B4513', border: '#654321' } // Brun chocolat
    }
    
    const type = buff.buff_type || 'income'
    switch (type) {
      case 'income':
      case 'income_multiplier':
        return { bg: '#ffd700', border: '#d4af37' }
      case 'production':
        return { bg: '#ff6b35', border: '#e55722' }
      case 'storage':
        return { bg: '#4ecdc4', border: '#3bb3aa' }
      default:
        return { bg: '#9b59b6', border: '#8e44ad' }
    }
  }

  return {
    buffs,
    activeBuffs,
    fetchBuffs,
    getTimeRemaining,
    formatBuffEffect,
    getBuffIcon,
    getBuffColor
  }
}