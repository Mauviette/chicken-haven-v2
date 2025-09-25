import User from '../models/User.js'
import { achievementsData } from '../data/sharedGameData.js'

// Configuration des succès basée sur les données centralisées
const achievementsConfig = {}

// Transformer les données centralisées en configuration avec logique de vérification
Object.entries(achievementsData).forEach(([id, data]) => {
  achievementsConfig[id] = {
    id: data.id,
    type: data.type,
    objectif: data.objectif,
    reward: data.reward,
    check: (progress) => {
      switch (data.type) {
        case 'eggs':
          return progress.totalEggsCollected >= data.objectif
        case 'chickens':
          return progress.totalChickensOwned >= data.objectif
        case 'boxes':
          return progress.totalBoxesOpened >= data.objectif
        case 'production':
          return progress.totalProductionCompleted >= data.objectif
        default:
          return false
      }
    }
  }
})

// GET /api/achievements/status - Récupère le statut des succès de l'utilisateur
export async function getAchievementsStatus(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Initialiser les succès si nécessaire - forcer la structure correcte avec Mixed schema
    if (!user.achievements || Array.isArray(user.achievements) || !user.achievements.progress) {
      const achievementsObject = {
        progress: {
          totalEggsCollected: Number(user.resources?.eggs) || 0,
          totalChickensOwned: Number(user.poulesPossedees?.length) || 0,
          totalProductionCompleted: 0,
          totalBoxesOpened: 0,
          maxEggsInOneClick: 0
        },
        completed: [],
        lastChecked: new Date()
      }
      
      // Utiliser findByIdAndUpdate avec Mixed schema
      const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        { achievements: achievementsObject },
        { new: true, runValidators: false }
      )
      
      user.achievements = updatedUser.achievements
    }

    res.json({
      progress: user.achievements.progress,
      completed: user.achievements.completed,
      lastChecked: user.achievements.lastChecked
    })
  } catch (error) {
    console.error('Erreur getAchievementsStatus:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/achievements/check - Vérifie et met à jour les succès
export async function checkAchievements(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Initialiser si nécessaire - forcer la structure correcte avec Mixed schema
    if (!user.achievements || Array.isArray(user.achievements) || !user.achievements.progress) {
      const achievementsObject = {
        progress: {
          totalEggsCollected: 0,
          totalChickensOwned: 0,
          totalProductionCompleted: 0,
          totalBoxesOpened: 0,
          maxEggsInOneClick: 0
        },
        completed: [],
        lastChecked: new Date()
      }
      
      // Utiliser findByIdAndUpdate avec Mixed schema
      const updatedUser = await User.findByIdAndUpdate(
        req.userId,
        { achievements: achievementsObject },
        { new: true, runValidators: false }
      )
      
      user.achievements = updatedUser.achievements
    }

    // Mettre à jour le progrès basé sur les données actuelles de l'utilisateur
    const currentEggs = Number(user.resources?.eggs) || 0
    const currentChickens = Number(user.poulesPossedees?.length) || 0
    const currentEggsProgress = Number(user.achievements.progress.totalEggsCollected) || 0
    const currentChickensProgress = Number(user.achievements.progress.totalChickensOwned) || 0
    
    user.achievements.progress.totalEggsCollected = Math.max(
      currentEggsProgress,
      currentEggs
    )
    
    user.achievements.progress.totalChickensOwned = Math.max(
      currentChickensProgress,
      currentChickens
    )

    // Vérifier chaque succès
    const newAchievements = []
    const completedIds = user.achievements.completed.map(a => a.achievementId)

    for (const [achievementId, config] of Object.entries(achievementsConfig)) {
      // Ignorer si déjà complété
      if (completedIds.includes(achievementId)) continue

      // Vérifier si les conditions sont remplies
      if (config.check(user.achievements.progress)) {
        user.achievements.completed.push({
          achievementId,
          completedAt: new Date(),
          rewardClaimed: false
        })
        newAchievements.push({ achievementId, reward: config.reward })
      }
    }

    // Mettre à jour la date de dernière vérification
    user.achievements.lastChecked = new Date()
    user.markModified('achievements')
    await user.save()

    res.json({
      updated: true,
      achievements: user.achievements,
      newAchievements
    })
  } catch (error) {
    console.error('Erreur checkAchievements:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/achievements/claim/:achievementId - Réclamer la récompense d'un succès
export async function claimReward(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { achievementId } = req.params
    const config = achievementsConfig[achievementId]
    
    if (!config) {
      return res.status(400).json({ error: 'Succès inexistant' })
    }

    // Trouver le succès complété
    const completedAchievement = user.achievements?.completed?.find(
      a => a.achievementId === achievementId
    )

    if (!completedAchievement) {
      return res.status(400).json({ error: 'Succès non complété' })
    }

    if (completedAchievement.rewardClaimed) {
      return res.status(400).json({ error: 'Récompense déjà réclamée' })
    }

    // Appliquer la récompense
    const reward = config.reward
    if (reward.type === 'eggs') {
      user.resources.eggs = (user.resources.eggs || 0) + reward.quantite
    } else if (reward.type === 'stock_token') {
      user.resources.stock_token = (user.resources.stock_token || 0) + reward.quantite
    } else if (reward.type === 'production_token') {
      user.resources.production_token = (user.resources.production_token || 0) + reward.quantite
    }

    // Marquer comme réclamé
    completedAchievement.rewardClaimed = true
    await user.save()

    res.json({
      success: true,
      reward,
      newResources: user.resources
    })
  } catch (error) {
    console.error('Erreur claimReward:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Utilitaire pour mettre à jour le progrès depuis d'autres contrôleurs
export async function updateAchievementProgress(userId, progressType, value) {
  try {
    const user = await User.findById(userId)
    if (!user) return

    if (!user.achievements || Array.isArray(user.achievements) || !user.achievements.progress) {
      const achievementsObject = {
        progress: {
          totalEggsCollected: 0,
          totalChickensOwned: 0,
          totalProductionCompleted: 0,
          totalBoxesOpened: 0,
          maxEggsInOneClick: 0
        },
        completed: [],
        lastChecked: new Date()
      }
      
      // Utiliser findByIdAndUpdate avec Mixed schema
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { achievements: achievementsObject },
        { new: true, runValidators: false }
      )
      
      user.achievements = updatedUser.achievements
    }

    // Mettre à jour le progrès
    if (progressType === 'increment') {
      // Pour les incréments (ex: +1 boîte ouverte)
      for (const [key, amount] of Object.entries(value)) {
        if (user.achievements.progress.hasOwnProperty(key)) {
          const currentValue = Number(user.achievements.progress[key]) || 0
          const incrementValue = Number(amount) || 0
          user.achievements.progress[key] = currentValue + incrementValue
        }
      }
    } else if (progressType === 'max') {
      // Pour les valeurs maximales (ex: max œufs collectés)
      for (const [key, amount] of Object.entries(value)) {
        if (user.achievements.progress.hasOwnProperty(key)) {
          const currentValue = Number(user.achievements.progress[key]) || 0
          const newValue = Number(amount) || 0
          user.achievements.progress[key] = Math.max(currentValue, newValue)
        }
      }
    }

    await user.save()
  } catch (error) {
    console.error('Erreur updateAchievementProgress:', error)
  }
}