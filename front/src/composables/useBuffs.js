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

    // Mapping lisible des types, y compris les stats d'équipe
    const typeLabel = (() => {
      switch (type) {
        case 'income':
        case 'income_multiplier':
          return 'Revenu'
        case 'production':
          return 'Production'
        case 'storage':
        case 'storage_multiplier':
          return 'Stockage'
        case 'income_storage_multiplier':
          return 'Production & Stockage'
        case 'team_stat_intelligence':
          return "Intelligence d'équipe"
        case 'team_stat_energie':
          return "Énergie d'équipe"
        case 'team_stat_charisme':
          return "Charisme d'équipe"
        default:
          return type
            .split('_')
            .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
            .join(' ')
      }
    })()

    return `${typeLabel} ${effectText}`
  }

  // Obtient l'icône d'un buff selon son type et son origine
  function getBuffIcon(buff) {
    // Icône spéciale pour les buffs de chocolat de la poule Gourmande
    if (buff.origin && buff.origin.includes('Gourmande')) {
      return '🍫'
    }
    
    if (buff.origin && buff.origin.includes('Joyeuse')) {
      return '🎉'
    }
    
    const type = buff.buff_type || 'income'
    switch (type) {
      case 'income':
      case 'income_multiplier':
        return '💰'
      case 'production':
        return '⚡'
      case 'storage':
      case 'storage_multiplier':
        return '📦'
      case 'income_storage_multiplier':
        return '🍫'
      case 'team_stat_intelligence':
        return '🧠'
      case 'team_stat_energie':
        return '⚡'
      case 'team_stat_charisme':
        return '✨'
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
      // Production en jaune
      case 'income':
      case 'income_multiplier':
      case 'production':
        return { bg: '#ffd700', border: '#d4af37' }
      // Stockage en marron
      case 'storage':
      case 'storage_multiplier':
        return { bg: '#8B6B4A', border: '#6b4e34' }
      // Buffs de stats en beige/rosé
      case 'team_stat_intelligence':
      case 'team_stat_energie':
      case 'team_stat_charisme':
        return { bg: '#f2d7d9', border: '#d9a7aa' }
      case 'income_storage_multiplier':
        return { bg: '#c68c53', border: '#8a5a2b' }
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