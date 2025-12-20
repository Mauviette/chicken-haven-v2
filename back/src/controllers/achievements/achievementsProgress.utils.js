/**
 * Utilitaires pour la gestion du progrès des succès
 * Centralise l'initialisation et la migration des données de progrès
 */
import User from '../../models/User.js'

/**
 * Structure de progrès par défaut pour les achievements
 */
export const DEFAULT_PROGRESS = {
  totalEggsCollected: 0,
  totalChickensOwned: 0,
  totalProductionCompleted: 0,
  totalBoxesOpened: 0,
  maxEggsInOneClick: 0,
  avatarChanged: 0,
  nameChanged: 0,
  bestTeamEnergy: 0,
  bestTeamIntelligence: 0,
  bestTeamCharisme: 0,
  maxTeamStat: 0,
  maxMegaClick: 0,
  miningGamesPlayed: 0,
  miningArtifactsFound: 0,
  miningCellsBroken: 0,
  miningNoRewardGame: false,
  miningFullGridBroken: false,
  miningBestCellsInGame: 0,
  chickenGiftsCollected: 0,
  chickenAbilitiesUsed: 0,
  spawnablesClicked: 0,
  rottenTomatoesReceived: 0
}

/**
 * Crée une nouvelle structure d'achievements vide
 * @param {Object} initialProgress - Valeurs initiales optionnelles pour le progrès
 * @returns {Object} Structure complète d'achievements
 */
export function createEmptyAchievements(initialProgress = {}) {
  return {
    progress: { ...DEFAULT_PROGRESS, ...initialProgress },
    completed: [],
    lastChecked: new Date()
  }
}

/**
 * Initialise les achievements d'un utilisateur si nécessaire
 * Utilise findByIdAndUpdate avec le Mixed schema pour éviter les problèmes Mongoose
 * @param {Object} user - Document utilisateur Mongoose
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} User avec achievements initialisés
 */
export async function ensureAchievementsInitialized(user, userId) {
  if (!user.achievements || Array.isArray(user.achievements) || !user.achievements.progress) {
    const achievementsObject = createEmptyAchievements({
      totalEggsCollected: Number(user.resources?.eggs) || 0,
      totalChickensOwned: Number(user.poulesPossedees?.length) || 0
    })
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { achievements: achievementsObject },
      { new: true, runValidators: false }
    )
    
    user.achievements = updatedUser.achievements
  }
  return user
}

/**
 * S'assure que tous les champs de progrès existent (migration pour anciens utilisateurs)
 * @param {Object} progress - Objet progress des achievements
 * @returns {Object} Progress avec tous les champs garantis
 */
export function ensureAllProgressFields(progress) {
  for (const [key, defaultValue] of Object.entries(DEFAULT_PROGRESS)) {
    if (!progress.hasOwnProperty(key)) {
      progress[key] = defaultValue
    }
  }
  
  // Cas spécial: synchroniser maxMegaClick avec maxEggsInOneClick si pas défini
  if (progress.maxMegaClick === 0 && progress.maxEggsInOneClick > 0) {
    progress.maxMegaClick = progress.maxEggsInOneClick
  }
  
  return progress
}

/**
 * Met à jour les stats de base du progrès depuis l'état actuel de l'utilisateur
 * @param {Object} user - Document utilisateur
 */
export function syncProgressWithUserState(user) {
  const currentEggs = Number(user.resources?.eggs) || 0
  const currentChickens = Number(user.poulesPossedees?.length) || 0
  const progress = user.achievements.progress
  
  progress.totalEggsCollected = Math.max(
    Number(progress.totalEggsCollected) || 0,
    currentEggs
  )
  
  progress.totalChickensOwned = Math.max(
    Number(progress.totalChickensOwned) || 0,
    currentChickens
  )
  
  // Synchroniser miningArtifactsFound avec l'inventaire actuel
  const currentUniqueArtifacts = user.artifacts?.length || 0
  progress.miningArtifactsFound = Math.max(
    Number(progress.miningArtifactsFound) || 0,
    currentUniqueArtifacts
  )
  
  // Synchroniser maxMegaClick
  progress.maxMegaClick = progress.maxEggsInOneClick || 0
}

/**
 * Met à jour les meilleures stats d'équipe depuis les fonctions de calcul
 * @param {Object} user - Document utilisateur
 * @param {Function} computeTeamEnergy - Fonction de calcul d'énergie
 * @param {Function} computeTeamIntelligence - Fonction de calcul d'intelligence
 * @param {Function} computeTeamCharisme - Fonction de calcul de charisme
 */
export function updateBestTeamStats(user, computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme) {
  const teamEnergy = computeTeamEnergy(user)
  const teamIntelligence = computeTeamIntelligence(user)
  const teamCharisme = computeTeamCharisme(user)
  
  const progress = user.achievements.progress
  
  progress.bestTeamEnergy = Math.max(
    Number(progress.bestTeamEnergy) || 0,
    Math.floor(teamEnergy)
  )
  progress.bestTeamIntelligence = Math.max(
    Number(progress.bestTeamIntelligence) || 0,
    Math.floor(teamIntelligence)
  )
  progress.bestTeamCharisme = Math.max(
    Number(progress.bestTeamCharisme) || 0,
    Math.floor(teamCharisme)
  )
  
  progress.maxTeamStat = Math.max(
    progress.bestTeamEnergy || 0,
    progress.bestTeamIntelligence || 0,
    progress.bestTeamCharisme || 0
  )
}

/**
 * Met à jour le progrès d'un utilisateur (increment ou max)
 * @param {Object} user - Document utilisateur
 * @param {'increment'|'max'} progressType - Type de mise à jour
 * @param {Object} value - Paires clé/valeur à mettre à jour
 */
export function applyProgressUpdate(user, progressType, value) {
  const progress = user.achievements.progress
  
  if (progressType === 'increment') {
    for (const [key, amount] of Object.entries(value)) {
      if (progress.hasOwnProperty(key)) {
        const currentValue = Number(progress[key]) || 0
        const incrementValue = Number(amount) || 0
        progress[key] = currentValue + incrementValue
        console.log(`🔍 Achievement progress updated: ${key} ${currentValue} -> ${progress[key]}`)
      }
    }
  } else if (progressType === 'max') {
    for (const [key, amount] of Object.entries(value)) {
      if (progress.hasOwnProperty(key)) {
        const currentValue = Number(progress[key]) || 0
        const newValue = Number(amount) || 0
        progress[key] = Math.max(currentValue, newValue)
        console.log(`🔍 Achievement progress updated (max): ${key} ${currentValue} -> ${progress[key]}`)
        
        // Synchroniser maxMegaClick avec maxEggsInOneClick
        if (key === 'maxEggsInOneClick') {
          progress.maxMegaClick = progress[key]
          console.log(`🔍 maxMegaClick synchronized: ${progress.maxMegaClick}`)
        }
      }
    }
  }
}
