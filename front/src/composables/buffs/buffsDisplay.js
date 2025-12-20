// composables/buffs/buffsDisplay.js
// Fonctions d'affichage pour les buffs (icônes, couleurs)

/**
 * Obtient l'icône d'un buff selon son type et son origine
 */
export function getBuffIcon(buff) {
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

/**
 * Obtient la couleur d'un buff selon son type et son origine
 */
export function getBuffColor(buff) {
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
