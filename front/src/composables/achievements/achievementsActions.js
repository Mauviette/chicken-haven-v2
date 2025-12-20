// composables/achievements/achievementsActions.js
// Actions API pour les succès

import { apiGet, apiPost } from '@/utils/api'
import { userAchievements, notifiedAchievements } from './achievementsState.js'

/**
 * Récupérer les succès depuis l'API
 */
export async function fetchAchievements(token) {
  if (!token) return

  try {
    const data = await apiGet('/api/achievements/status')
    userAchievements.value = {
      progress: {
        ...userAchievements.value.progress,
        ...(data.progress || {})
      },
      completed: data.completed || [],
      lastChecked: new Date(data.lastChecked || Date.now())
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des succès:', error)
  }
}

/**
 * Vérifier les succès et déclencher les notifications
 */
export async function checkAchievements(token, handleNewAchievementsCallback) {
  if (!token) return []

  try {
    const data = await apiPost('/api/achievements/check')

    // Mettre à jour les données utilisateur
    if (data.updated) {
      userAchievements.value = data.achievements
    }

    // Gérer les nouveaux succès débloqués
    if (data.newAchievements && data.newAchievements.length > 0) {
      handleNewAchievementsCallback(data.newAchievements)
    }

    return data.newAchievements || []
  } catch (error) {
    console.error('Erreur lors de la vérification des succès:', error)
  }

  return []
}

/**
 * Réclamer la récompense d'un succès
 */
export async function claimReward(token, achievementId, refreshPlayerData) {
  if (!token) return false

  try {
    const data = await apiPost(`/api/achievements/claim/${achievementId}`)

    // Marquer la récompense comme réclamée
    if (data.achievements) {
      userAchievements.value = data.achievements
    } else {
      const completedAchievement = userAchievements.value.completed.find(
        a => a.achievementId === achievementId
      )
      if (completedAchievement) {
        completedAchievement.rewardClaimed = true
      }
    }

    // Rafraîchir les ressources du joueur
    try { await refreshPlayerData() } catch (_) {}
    return data.reward
  } catch (error) {
    console.error('Erreur lors de la réclamation de récompense:', error)
  }

  return false
}

/**
 * Gérer les nouveaux succès débloqués (notifications)
 */
export function handleNewAchievements(newAchievements, gameAchievements, formatString) {
  newAchievements.forEach(achievement => {
    // Éviter les doubles toasts pour le même succès dans la session
    if (notifiedAchievements.has(achievement.achievementId)) return
    notifiedAchievements.add(achievement.achievementId)

    const achievementData = gameAchievements[achievement.achievementId]
    if (achievementData) {
      // Afficher un toast global si disponible
      try {
        const reward = achievementData.reward
        const rewardText = reward ? ` — Récompense: ${formatString(reward.type, reward.quantite)}` : ''
        const message = `Succès débloqué: ${achievementData.nom}`
        if (typeof window !== 'undefined' && window.$toast) {
          window.$toast(message, 'achievement')
        }
      } catch (_) { /* noop */ }

      // Déclencher un événement personnalisé pour les notifications
      window.dispatchEvent(new CustomEvent('achievement-unlocked', {
        detail: {
          achievement: achievementData,
          reward: achievementData.reward
        }
      }))
    }
  })
}
