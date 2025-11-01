// composables/useBuffs.js
import { ref, computed } from 'vue'
import { apiGet } from '@/utils/api'

const buffs = ref([])

// Nettoyage immédiat des buffs expirés du tableau principal (évite le clignotement)
function cleanExpiredBuffs() {
  const now = Date.now()
  buffs.value = buffs.value.filter(buff => {
    if (!buff.lasts_until) return false
    const expiresAt = new Date(buff.lasts_until).getTime()
    return expiresAt > (now + 100)
  })
}

// Ticker temporel réactif pour réévaluer les expirations sans attendre un fetch
const nowTs = ref(Date.now())
if (typeof window !== 'undefined') {
  // Éviter plusieurs timers si le composable est importé plusieurs fois
  if (!window.__buffsNowTicker) {
    window.__buffsNowTicker = setInterval(() => {
      nowTs.value = Date.now()
    }, 1000)
  }
}

export function useBuffs() {
  // Récupère les buffs actifs de l'utilisateur
  async function fetchBuffs() {
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

  // Met à jour les buffs depuis getEggStatus (qui inclut maintenant les buffs)
  function updateBuffsFromEggStatus(eggStatusData) {
    if (eggStatusData?.buffs) {
      //console.log('updateBuffsFromEggStatus: Updating buffs from egg status:', eggStatusData.buffs)
      buffs.value = eggStatusData.buffs
      cleanExpiredBuffs()
      //console.log('updateBuffsFromEggStatus: Buffs updated to:', buffs.value)
    }
  }

  // Filtre les buffs actifs (non expirés) - EXCLUT les buffs cachés pour l'affichage UI
  const activeBuffs = computed(() => {
    const now = nowTs.value
    // Ne pas appeler cleanExpiredBuffs ici pour éviter les boucles infinies
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
  // Formate l'effet court d'un buff pour affichage sous le badge
  function formatBuffShort(buff) {
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
    // Emoji selon le type
    let emoji = ''
    switch (type) {
      case 'income':
      case 'income_multiplier':
        emoji = '💰'; break
      case 'production':
        emoji = '⚙️'; break
      case 'storage':
      case 'storage_multiplier':
        emoji = '🧺'; break
      case 'team_stat_intelligence':
        emoji = '🧠'; break
      case 'team_stat_energie':
        emoji = '⚡'; break
      case 'team_stat_charisme':
        emoji = '✨'; break
      case 'time_stop':
        emoji = '⏰'; break
      default:
        emoji = getBuffIcon(buff)
    }
    return `${effectText} ${emoji}`
  }

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
        case 'time_stop':
          return 'Arrêt du temps'
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
        return '🧺'
      case 'income_storage_multiplier':
        return '🍫'
      case 'team_stat_intelligence':
        return '🧠'
      case 'team_stat_energie':
        return '⚡'
      case 'team_stat_charisme':
        return '✨'
      case 'time_stop':
        return '⏰'
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
      case 'time_stop':
        return { bg: '#9370db', border: '#663399' } // Violet pour le time_stop
      default:
        return { bg: '#9b59b6', border: '#8e44ad' }
    }
  }

  // Obtient la durée totale et restante d'un buff pour l'affichage
  function getBuffDuration(buff) {
    if (!buff.lasts_until) return { remaining: 'N/A', total: 'N/A', percentage: 0 }
    
    const now = new Date()
    const expiresAt = new Date(buff.lasts_until)
    const remainingMs = Math.max(0, expiresAt - now)
    
    // Si le buff est expiré ou sur le point d'expirer (moins de 100ms), retourner 0s
    if (remainingMs < 100) {
      return {
        remaining: '0s',
        total: 'N/A',
        percentage: 0
      }
    }
    
    // Estimation de la durée totale basée sur l'origine du buff
    let estimatedTotalMs = 5 * 60 * 1000 // 5 minutes par défaut
    
    if (buff.origin) {
      if (buff.origin.includes('Gourmande')) {
        estimatedTotalMs = 3 * 60 * 1000 // 3 minutes pour les buffs chocolat
      } else if (buff.origin.includes('Alchimiste')) {
        estimatedTotalMs = 10 * 60 * 1000 // 10 minutes pour les potions
      } else if (buff.origin.includes('talent')) {
        estimatedTotalMs = 30 * 60 * 1000 // 30 minutes pour les talents
      }
    }
    
    const formatTime = (ms) => {
      const totalSeconds = Math.floor(ms / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      
      if (minutes > 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
      } else {
        return `${seconds}s`
      }
    }
    
    // Utilise le temps restant pour estimer le pourcentage si c'est plus précis
    const percentage = Math.min(100, (remainingMs / estimatedTotalMs) * 100)
    
    return {
      remaining: formatTime(remainingMs),
      total: formatTime(estimatedTotalMs),
      percentage: percentage
    }
  }

  // Ajout : fonction utilitaire pour tooltip HTML d'un buff (pour BuffsBar.vue)
  function getBuffTooltipHtml(buff) {
    // Utilise formatBuffEffect pour le détail, getTimeRemaining pour la durée
    const effect = formatBuffEffect(buff)
    const time = getTimeRemaining(buff)
    const origin = buff.origin ? `<br><span style='color:#aaa;font-size:12px'>${buff.origin}</span>` : ''
    return `<b>${effect}</b><br><span style='color:#ffd700;font-size:13px'>${time}</span>${origin}`
  }

  return {
    buffs,
    nowTs,
    activeBuffs,
    allActiveBuffs,
    fetchBuffs,
    updateBuffsFromEggStatus,
    getTimeRemaining,
    getBuffDuration,
    formatBuffEffect,
    formatBuffShort,
    getBuffIcon,
    getBuffColor,
    getBuffTooltipHtml
  }
}