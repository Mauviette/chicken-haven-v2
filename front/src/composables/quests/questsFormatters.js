/**
 * Fonctions de formatage pour les quêtes
 */

/**
 * Formate une chaîne de ressource
 * @param {string} type - Type de ressource
 * @param {number} count - Quantité
 * @param {Object} itemsData - Données des items
 * @returns {string}
 */
export function formatString(type, count, itemsData) {
  const itemData = itemsData?.[type]
  if (!itemData || typeof count !== 'number') return 'Valeur invalide'
  return `${count} ${count === 1 ? itemData.nom_singulier : itemData.nom}`
}

/**
 * Formate l'affichage d'une récompense
 * @param {Object} reward - Récompense
 * @param {Object} especies - Données des espèces
 * @param {Object} items - Données des items
 * @returns {string}
 */
export function formatReward(reward, especies, items) {
  if (!reward) return 'Aucune récompense'

  if (reward.type === 'chicken') {
    const especeData = especies?.[reward.especeId]
    const chickenName = especeData?.nom || reward.especeId
    return `${reward.quantite}x ${chickenName}`
  }

  return formatString(reward.type, reward.quantite, items)
}

/**
 * Formate l'affichage d'un défi
 * @param {Object} challenge - Défi
 * @param {number} currentValue - Valeur actuelle
 * @returns {string}
 */
export function formatChallenge(challenge, currentValue) {
  try {
    const objectif = challenge.objectif || 0
    const progress = Math.min(currentValue || 0, objectif)

    const formatters = {
      'eggs_collected': () => `Récolter ${objectif} œufs (${progress}/${objectif})`,
      'spawnables_clicked': () => `Cliquer sur ${objectif} objets spawnés (${progress}/${objectif})`,
      'boxes_opened': () => `Ouvrir ${objectif} boîte${objectif > 1 ? 's' : ''} (${progress}/${objectif})`,
      'chicken_abilities_used': () => `Utiliser ${objectif} capacité${objectif > 1 ? 's' : ''} de poule${objectif > 1 ? 's' : ''} (${progress}/${objectif})`,
      'chicken_gifts_collected': () => `Collecter ${objectif} cadeau${objectif > 1 ? 'x' : ''} de poule${objectif > 1 ? 's' : ''} (${progress}/${objectif})`,
      'mining_games_played': () => `Jouer ${objectif} partie${objectif > 1 ? 's' : ''} de minage (${progress}/${objectif})`,
      'mining_cells_broken': () => `Briser ${objectif} case${objectif > 1 ? 's' : ''} en minage (${progress}/${objectif})`,
      'max_eggs_in_click': () => `Récolter ${objectif} œufs en un clic (${progress}/${objectif})`,
      'chicken_rarity_found': () => {
        const rarityLabels = { 'commune': 'commune', 'rare': 'rare', 'epique': 'épique', 'legendaire': 'légendaire' }
        const rarityLabel = rarityLabels[challenge.rarity] || challenge.rarity
        return `Trouver ${objectif} poule${objectif > 1 ? 's' : ''} ${rarityLabel}${objectif > 1 ? 's' : ''} (${progress}/${objectif})`
      },
      'team_stat_req': () => {
        const statLabels = { 'charisme': 'charisme', 'energie': 'énergie', 'intelligence': 'intelligence' }
        const reqLabels = { 'above': 'supérieur à', 'below': 'inférieur à', 'equals': 'égal à' }
        return `Avoir un ${statLabels[challenge.stat] || challenge.stat} d'équipe ${reqLabels[challenge.req] || challenge.req} ${challenge.num}`
      },
      'production_req': () => {
        const reqLabels = { 'above': 'supérieure à', 'below': 'inférieure à', 'equals': 'égale à' }
        return `Avoir une production ${reqLabels[challenge.req] || challenge.req} ${challenge.num} œufs/seconde`
      }
    }

    const formatter = formatters[challenge.type]
    return formatter ? formatter() : `${challenge.type}: ${progress}/${objectif}`
  } catch (error) {
    console.error('Error in formatChallenge:', error)
    return 'Défi inconnu'
  }
}
