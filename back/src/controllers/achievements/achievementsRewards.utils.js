/**
 * Utilitaires pour la gestion des récompenses de succès
 * Centralise l'application des récompenses et la logique de level-up
 */
import { levelRewards as LEVEL_REWARDS } from '../../data/sharedGameData.js'

/**
 * Applique une récompense de ressource simple à l'utilisateur
 * @param {Object} user - Document utilisateur
 * @param {string} type - Type de ressource
 * @param {number} quantity - Quantité à ajouter
 */
function addResource(user, type, quantity) {
  const qty = Number(quantity) || 0
  if (!qty) return
  
  user.resources[type] = (user.resources[type] || 0) + qty
}

/**
 * Applique les récompenses de level-up pour un niveau donné
 * @param {Object} user - Document utilisateur
 * @param {number} level - Niveau atteint
 * @returns {Array} Liste des récompenses appliquées
 */
function applyLevelRewards(user, level) {
  const appliedRewards = []
  const rewardsForLevel = Array.isArray(LEVEL_REWARDS?.[level]) ? LEVEL_REWARDS[level] : []
  
  for (const r of rewardsForLevel) {
    const qty = Number(r.count || r.quantite || 0)
    if (!qty) continue
    
    addResource(user, r.type, qty)
    appliedRewards.push({ type: r.type, quantite: qty, level })
  }
  
  return appliedRewards
}

/**
 * Gère le gain de myrtilles (XP) et le level-up en boucle
 * @param {Object} user - Document utilisateur
 * @param {number} blueberryAmount - Nombre de myrtilles gagnées
 * @returns {Array} Liste des récompenses de level-up appliquées
 */
export function processBlueberryReward(user, blueberryAmount) {
  // Initialiser l'expérience si nécessaire
  user.experience = user.experience || { level: 1, points: 0, required_points: 2 }
  
  const gained = Number(blueberryAmount || 0)
  user.experience.points = (Number(user.experience.points) || 0) + gained
  
  // Calcul du level-up en boucle si plusieurs niveaux sont franchis
  let lvl = Number(user.experience.level) || 1
  let pts = Number(user.experience.points) || 0
  const allLevelRewards = []
  
  while (pts >= lvl * 2) {
    pts -= lvl * 2
    lvl += 1
    
    const levelRewards = applyLevelRewards(user, lvl)
    allLevelRewards.push(...levelRewards)
  }
  
  user.experience.level = lvl
  user.experience.points = pts
  user.experience.required_points = lvl * 2
  
  return allLevelRewards
}

/**
 * Applique la récompense d'un succès à l'utilisateur
 * @param {Object} user - Document utilisateur
 * @param {Object} reward - Configuration de la récompense { type, quantite }
 * @returns {Object} { success: boolean, levelRewards?: Array }
 */
export function applyAchievementReward(user, reward) {
  const { type, quantite } = reward
  const result = { success: true }
  
  if (type === 'blueberry') {
    // Les myrtilles déclenchent la logique d'XP/level-up
    const levelRewards = processBlueberryReward(user, quantite)
    if (levelRewards.length > 0) {
      result.levelRewards = levelRewards
    }
  } else {
    // Ressource simple
    addResource(user, type, quantite)
  }
  
  return result
}

/**
 * Vérifie les nouveaux succès débloqués et les ajoute à la liste des complétés
 * @param {Object} user - Document utilisateur
 * @param {Object} achievementsConfig - Configuration des succès avec fonctions check
 * @returns {Array} Liste des nouveaux succès débloqués
 */
export function checkNewAchievements(user, achievementsConfig) {
  const newAchievements = []
  const completedIds = user.achievements.completed.map(a => a.achievementId)
  
  for (const [achievementId, config] of Object.entries(achievementsConfig)) {
    // Ignorer si déjà complété
    if (completedIds.includes(achievementId)) continue
    
    // Vérifier si les conditions sont remplies
    if (config.check(user.achievements.progress, user)) {
      user.achievements.completed.push({
        achievementId,
        completedAt: new Date(),
        rewardClaimed: false
      })
      newAchievements.push({ achievementId, reward: config.reward })
      console.log(`🎉 New achievement unlocked: ${achievementId}`)
    }
  }
  
  return newAchievements
}

/**
 * Marque un succès comme réclamé
 * @param {Object} completedAchievement - Entrée du succès complété
 */
export function markRewardClaimed(completedAchievement) {
  completedAchievement.rewardClaimed = true
}
