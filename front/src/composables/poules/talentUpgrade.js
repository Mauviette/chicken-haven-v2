/**
 * Gestion des améliorations de talents
 */
import { apiPost } from '@/utils/api.js'
import { rawPoules } from './poulesState.js'
import { isTalentUnlocked, getTalentLevelRoman } from './talentUtils.js'

/**
 * Calcule le coût de la prochaine amélioration de talent
 * @param {Object} poule - La poule
 * @param {Object} especies - Données des espèces
 * @param {Object} talents - Données des talents
 * @param {Object} talentLevelUpgradeCost - Table des coûts
 * @returns {Object|null} - { egg_cost, chicken_cost } ou { maxed: true } ou null
 */
export function getTalentNextCost(poule, especies, talents, talentLevelUpgradeCost) {
  try {
    const tName = especies?.[poule.especeId]?.talent || null
    const rarete = especies?.[poule.especeId]?.rarete || 'commune'
    const table = talentLevelUpgradeCost || null
    
    if (!table || !table[rarete]) return null
    
    const current = Number(poule.niveauTalent || 1)
    const next = current + 1
    const limit = Number(table[rarete].limit || 0)
    
    if (limit && next > limit) return { maxed: true }
    
    const egg_cost = table[rarete].egg_cost?.[current - 1]
    const chicken_cost = table[rarete].chicken_cost?.[current - 1]
    
    if (egg_cost == null || chicken_cost == null) return null
    
    return { egg_cost: Number(egg_cost), chicken_cost: Number(chicken_cost) }
  } catch (_) { 
    return null 
  }
}

/**
 * Vérifie si un talent peut être amélioré
 * @param {Object} poule - La poule
 * @param {Object} especies - Données des espèces
 * @param {Object} talents - Données des talents
 * @param {Object} talentLevelUpgradeCost - Table des coûts
 * @returns {boolean}
 */
export function canUpgradeTalent(poule, especies, talents, talentLevelUpgradeCost) {
  if (!isTalentUnlocked(poule)) return false
  const cost = getTalentNextCost(poule, especies, talents, talentLevelUpgradeCost)
  if (!cost || cost.maxed) return false
  return true
}

/**
 * Améliore le talent d'une poule
 * @param {Object} poule - La poule à améliorer
 * @param {Function} refreshPlayer - Fonction pour rafraîchir les données du joueur
 * @param {Function} getNom - Fonction pour obtenir le nom d'une poule
 * @param {Object} especies - Données des espèces
 * @param {Object} talents - Données des talents
 * @param {Object} talentLevelUpgradeCost - Table des coûts
 * @returns {boolean} - true si l'amélioration a réussi
 */
export async function upgradeTalent(poule, refreshPlayer, getNom, especies, talents, talentLevelUpgradeCost) {
  try {
    if (!canUpgradeTalent(poule, especies, talents, talentLevelUpgradeCost)) return false
    
    const data = await apiPost('/api/talent/upgrade', { especeId: poule.especeId })
    if (!data?.success) {
      window.$toast?.(data?.error || 'Amélioration impossible', 'error')
      return false
    }
    
    // Appliquer retour serveur
    const idx = rawPoules.value.findIndex(p => p.especeId === poule.especeId)
    if (idx !== -1) {
      rawPoules.value[idx] = { ...rawPoules.value[idx], ...data.poule }
    }
    
    await refreshPlayer()
    
    // Déclencher les événements globaux
    window.dispatchEvent(new CustomEvent('refresh-achievements'))
    window.dispatchEvent(new CustomEvent('chicken-upgraded', { detail: { especeId: poule.especeId } }))
    window.dispatchEvent(new CustomEvent('quest-action'))
    
    // Toast avec nom de la poule et niveau
    const pouleName = getNom(poule.especeId)
    const newLevel = data.poule?.niveauTalent || (poule.niveauTalent + 1)
    window.$toast?.(`${pouleName} améliorée au niveau ${getTalentLevelRoman({ niveauTalent: newLevel })} !`, 'upgrade')
    
    return true
  } catch (e) {
    console.error('upgradeTalent client error:', e)
    window.$toast?.('Erreur réseau', 'error')
    return false
  }
}
