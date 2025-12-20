/**
 * Utilitaires pour les multiplicateurs de buffs temporaires actifs
 */

/**
 * Calcule les multiplicateurs des buffs temporaires actifs
 * @param {Object} user - Document utilisateur
 * @returns {Object} { income, storage, production, teamStat: { intelligence, energie, charisme } }
 */
export function computeActiveBuffMultipliers(user) {
  const buffs = user.buffs || []
  const now = Date.now()
  
  // Filtrer les buffs actifs
  const activeBuffs = buffs.filter(buff => 
    buff.lasts_until && new Date(buff.lasts_until).getTime() > now
  )
  
  const multipliers = {
    income: 1,
    storage: 1,
    production: 1,
    teamStat: { intelligence: 1, energie: 1, charisme: 1 }
  }
  
  // Appliquer les buffs multiplicatifs
  for (const buff of activeBuffs) {
    const operation = buff.buff?.operation || 'mult'
    const amount = parseFloat(buff.buff?.amount) || 1
    const type = buff.buff_type || 'income'
    
    if (operation === 'mult') {
      switch (type) {
        case 'income':
        case 'income_multiplier':
          multipliers.income *= amount
          break
        case 'storage':
          multipliers.storage *= amount
          break
        case 'production':
          multipliers.production *= amount
          break
        case 'team_stat_intelligence':
          multipliers.teamStat.intelligence *= amount
          break
        case 'team_stat_energie':
          multipliers.teamStat.energie *= amount
          break
        case 'team_stat_charisme':
          multipliers.teamStat.charisme *= amount
          break
      }
    }
  }
  
  return multipliers
}
