// composables/buffs/buffsFormatters.js
// Fonctions de formatage pour les buffs

/**
 * Mapping des types de buff vers leurs labels lisibles
 */
function getTypeLabel(type) {
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
}

/**
 * Formate le texte d'effet d'un buff
 */
function formatEffectText(operation, amount) {
  if (operation === 'mult') {
    const multiplier = parseFloat(amount)
    const percentage = Math.round((multiplier - 1) * 100)
    return `+${percentage}%`
  } else if (operation === 'add') {
    return `+${amount}`
  } else {
    return `${operation} ${amount}`
  }
}

/**
 * Formate l'effet d'un buff pour affichage complet
 */
export function formatBuffEffect(buff) {
  const operation = buff.buff?.operation || 'mult'
  const amount = buff.buff?.amount || '1'
  const type = buff.buff_type || 'income'

  const effectText = formatEffectText(operation, amount)
  const typeLabel = getTypeLabel(type)

  return `${typeLabel} ${effectText}`
}

/**
 * Formate l'effet court d'un buff pour affichage sous le badge
 */
export function formatBuffShort(buff) {
  const operation = buff.buff?.operation || 'mult'
  const amount = buff.buff?.amount || '1'
  const type = buff.buff_type || 'income'

  const effectText = formatEffectText(operation, amount)

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
      emoji = '✨'
  }
  return `${effectText} ${emoji}`
}

/**
 * Formate la durée restante d'un buff
 */
export function getTimeRemaining(buff) {
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

/**
 * Obtient la durée totale et restante d'un buff pour l'affichage
 */
export function getBuffDuration(buff) {
  if (!buff.lasts_until) return { remaining: 'N/A', total: 'N/A', percentage: 0 }

  const now = new Date()
  const expiresAt = new Date(buff.lasts_until)
  const remainingMs = Math.max(0, expiresAt - now)

  if (remainingMs < 100) {
    return { remaining: '0s', total: 'N/A', percentage: 0 }
  }

  // Estimation de la durée totale basée sur l'origine du buff
  let estimatedTotalMs = 5 * 60 * 1000 // 5 minutes par défaut

  if (buff.origin) {
    if (buff.origin.includes('Gourmande')) {
      estimatedTotalMs = 3 * 60 * 1000
    } else if (buff.origin.includes('Alchimiste')) {
      estimatedTotalMs = 10 * 60 * 1000
    } else if (buff.origin.includes('talent')) {
      estimatedTotalMs = 30 * 60 * 1000
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

  const percentage = Math.min(100, (remainingMs / estimatedTotalMs) * 100)

  return {
    remaining: formatTime(remainingMs),
    total: formatTime(estimatedTotalMs),
    percentage: percentage
  }
}

/**
 * Génère le HTML pour le tooltip d'un buff
 */
export function getBuffTooltipHtml(buff) {
  const effect = formatBuffEffect(buff)
  const time = getTimeRemaining(buff)
  const origin = buff.origin ? `<br><span style='color:#aaa;font-size:12px'>${buff.origin}</span>` : ''
  return `<b>${effect}</b><br><span style='color:#ffd700;font-size:13px'>${time}</span>${origin}`
}
