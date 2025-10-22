import User from '../models/User.js'
import { achievementsData, levelRewards as LEVEL_REWARDS } from '../data/sharedGameData.js'
import * as sharedGameData from '../data/sharedGameData.js'

// Configuration des succès basée sur les données centralisées
const achievementsConfig = {}

// Transformer les données centralisées en configuration avec logique de vérification
Object.entries(achievementsData).forEach(([id, data]) => {
  achievementsConfig[id] = {
    id: data.id,
    type: data.type,
    objectif: data.objectif,
    reward: data.reward,
    check: (progress, user) => {
      switch (data.type) {
        case 'eggs':
          return progress.totalEggsCollected >= data.objectif
        case 'chickens':
          return progress.totalChickensOwned >= data.objectif
        case 'boxes':
          return progress.totalBoxesOpened >= data.objectif
        case 'boxes_opened':
          return progress.totalBoxesOpened >= data.objectif
        case 'production':
          return progress.totalProductionCompleted >= data.objectif
        case 'talent_level':
          // Vérifier si une poule a atteint le niveau requis
          const poules = user?.poulesPossedees || []
          return poules.some(poule => (poule.niveauTalent || 1) >= data.objectif)
        case 'avatar_change':
          return progress.avatarChanged >= data.objectif
        case 'name_change':
          return progress.nameChanged >= data.objectif
        case 'team_stats':
          return progress.maxTeamStat >= data.objectif
        case 'mega_click':
          return progress.maxMegaClick >= data.objectif
        case 'mining_artifacts':
          return (progress.miningArtifactsFound || 0) >= data.objectif
        case 'mining_cells':
          return (progress.miningCellsBroken || 0) >= data.objectif
        case 'mining_no_reward':
          return !!(progress.miningNoRewardGame)
        case 'mining_full_grid':
          return !!(progress.miningFullGridBroken)
        case 'mining_best_cells_in_game':
          return (progress.miningBestCellsInGame || 0) >= data.objectif
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
          maxEggsInOneClick: 0,
          avatarChanged: 0,
          nameChanged: 0,
          // NOUVEAU : champs "best" persistés pour les 3 stats d'équipe (meilleures valeurs historiques)
          bestTeamEnergy: 0,
          bestTeamIntelligence: 0,
          bestTeamCharisme: 0,
          // Max global utilisé par les succès 'team_stats'
          maxTeamStat: 0,
          maxMegaClick: 0,
          miningGamesPlayed: 0,
          miningArtifactsFound: 0,
          miningCellsBroken: 0,
          miningNoRewardGame: false,
          miningFullGridBroken: false,
          miningBestCellsInGame: 0
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
          miningBestCellsInGame: 0
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

    // S'assurer que tous les nouveaux champs existent (pour utilisateurs existants)
    if (!user.achievements.progress.hasOwnProperty('bestTeamEnergy')) {
      user.achievements.progress.bestTeamEnergy = 0
    }
    if (!user.achievements.progress.hasOwnProperty('bestTeamIntelligence')) {
      user.achievements.progress.bestTeamIntelligence = 0
    }
    if (!user.achievements.progress.hasOwnProperty('bestTeamCharisme')) {
      user.achievements.progress.bestTeamCharisme = 0
    }
    if (!user.achievements.progress.hasOwnProperty('maxTeamStat')) {
      user.achievements.progress.maxTeamStat = 0
    }
    if (!user.achievements.progress.hasOwnProperty('maxMegaClick')) {
      user.achievements.progress.maxMegaClick = user.achievements.progress.maxEggsInOneClick || 0
    }
    if (!user.achievements.progress.hasOwnProperty('nameChanged')) {
      user.achievements.progress.nameChanged = 0
    }
    if (!user.achievements.progress.hasOwnProperty('miningGamesPlayed')) {
      user.achievements.progress.miningGamesPlayed = 0
    }
    if (!user.achievements.progress.hasOwnProperty('miningArtifactsFound')) {
      user.achievements.progress.miningArtifactsFound = 0
    }
    if (!user.achievements.progress.hasOwnProperty('miningCellsBroken')) {
      user.achievements.progress.miningCellsBroken = 0
    }
    if (!user.achievements.progress.hasOwnProperty('miningNoRewardGame')) {
      user.achievements.progress.miningNoRewardGame = false
    }
    if (!user.achievements.progress.hasOwnProperty('miningFullGridBroken')) {
      user.achievements.progress.miningFullGridBroken = false
    }
    if (!user.achievements.progress.hasOwnProperty('miningBestCellsInGame')) {
      user.achievements.progress.miningBestCellsInGame = 0
    }

    // Calculer et mettre à jour les stats d'équipe avec les fonctions dédiées
    // Importer les fonctions depuis egg.controller.js
    const { computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme } = await import('./egg.controller.js');

    const teamEnergy = computeTeamEnergy(user);
    const teamIntelligence = computeTeamIntelligence(user);
    const teamCharisme = computeTeamCharisme(user);

    // Mettre à jour les meilleurs historiques (persistés)
    user.achievements.progress.bestTeamEnergy = Math.max(Number(user.achievements.progress.bestTeamEnergy) || 0, Math.floor(teamEnergy));
    user.achievements.progress.bestTeamIntelligence = Math.max(Number(user.achievements.progress.bestTeamIntelligence) || 0, Math.floor(teamIntelligence));
    user.achievements.progress.bestTeamCharisme = Math.max(Number(user.achievements.progress.bestTeamCharisme) || 0, Math.floor(teamCharisme));

    // Mettre à jour le max global utilisé par les succès
    user.achievements.progress.maxTeamStat = Math.max(
      user.achievements.progress.bestTeamEnergy || 0,
      user.achievements.progress.bestTeamIntelligence || 0,
      user.achievements.progress.bestTeamCharisme || 0
    );

    user.achievements.progress.maxMegaClick = user.achievements.progress.maxEggsInOneClick || 0

    // Synchroniser miningArtifactsFound avec l'inventaire actuel du joueur
    const currentUniqueArtifacts = user.artifacts?.length || 0
    user.achievements.progress.miningArtifactsFound = Math.max(
      Number(user.achievements.progress.miningArtifactsFound) || 0,
      currentUniqueArtifacts
    )

    // Vérifier chaque succès
    const newAchievements = []
    const completedIds = user.achievements.completed.map(a => a.achievementId)

    for (const [achievementId, config] of Object.entries(achievementsConfig)) {
      // Ignorer si déjà complété
      if (completedIds.includes(achievementId)) continue

      // Vérifier si les conditions sont remplies (passer user pour talent_level)
      if (config.check(user.achievements.progress, user)) {
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


// POST /api/achievements/claim/:id - Réclame la récompense d'un succès
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
      return res.status(409).json({ error: 'Récompense déjà réclamée' })
    }

    // Rafraîchir un minimum le progrès avec l'état courant pour éviter des exploits
    try {
      const currentEggs = Number(user.resources?.eggs) || 0
      const currentChickens = Number(user.poulesPossedees?.length) || 0
      const prog = user.achievements.progress || {}
      prog.totalEggsCollected = Math.max(Number(prog.totalEggsCollected) || 0, currentEggs)
      prog.totalChickensOwned = Math.max(Number(prog.totalChickensOwned) || 0, currentChickens)
      user.achievements.progress = prog
    } catch (_) {}

    // Vérifier que les conditions sont toujours remplies au moment de la réclamation
    if (!config.check(user.achievements.progress, user)) {
      return res.status(400).json({ error: 'Conditions du succès non remplies' })
    }

    // Appliquer la récompense
    const reward = config.reward
    if (reward.type === 'eggs') {
      user.resources.eggs = (user.resources.eggs || 0) + reward.quantite
    } else if (reward.type === 'stock_token') {
      user.resources.stock_token = (user.resources.stock_token || 0) + reward.quantite
    } else if (reward.type === 'production_token') {
      user.resources.production_token = (user.resources.production_token || 0) + reward.quantite
    } else if (reward.type === 'chest_key') {
      user.resources.chest_key = (user.resources.chest_key || 0) + reward.quantite
    } else if (reward.type === 'blueberry') {
      // Les myrtilles donnent de l'XP et déclenchent le level up selon la règle: myrtilles nécessaires = level * 2
      user.experience = user.experience || { level: 1, points: 0, required_points: 2 }
      const gained = Number(reward.quantite || 0)
      user.experience.points = (Number(user.experience.points) || 0) + gained

      // Calcul du level-up en boucle si plusieurs niveaux sont franchis
      let lvl = Number(user.experience.level) || 1
      let pts = Number(user.experience.points) || 0
      // Collecter les récompenses de level-up (depuis la source centralisée)
      const appliedLevelRewards = []
      while (pts >= lvl * 2) {
        pts -= lvl * 2
        lvl += 1
        // Appliquer les récompenses configurées pour ce niveau
        const rewardsForLevel = Array.isArray(LEVEL_REWARDS?.[lvl]) ? LEVEL_REWARDS[lvl] : []
        for (const r of rewardsForLevel) {
          const qty = Number(r.count || r.quantite || 0)
          if (!qty) continue
          // Gérer explicitement tous les types de ressources courants,
          // y compris mining_token qui était manquant.
          if (r.type === 'eggs') {
            user.resources.eggs = (user.resources.eggs || 0) + qty
          } else if (r.type === 'stock_token') {
            user.resources.stock_token = (user.resources.stock_token || 0) + qty
          } else if (r.type === 'production_token') {
            user.resources.production_token = (user.resources.production_token || 0) + qty
          } else if (r.type === 'wild_token') {
            user.resources.wild_token = (user.resources.wild_token || 0) + qty
          } else if (r.type === 'mining_token') {
            user.resources.mining_token = (user.resources.mining_token || 0) + qty
          } else if (r.type === 'chest_key') {
            user.resources.chest_key = (user.resources.chest_key || 0) + qty
          } else {
            // fallback generic: try to set by key if exists
            user.resources[r.type] = (user.resources[r.type] || 0) + qty
          }
          appliedLevelRewards.push({ type: r.type, quantite: qty, level: lvl })
        }
      }
      user.experience.level = lvl
      user.experience.points = pts
      user.experience.required_points = lvl * 2
      // Attacher temporairement au retour
      if (appliedLevelRewards.length) {
        try { req._levelRewards = appliedLevelRewards } catch (_) {}
      }
    }

    // Marquer comme réclamé et persister (Mixed schema)
    completedAchievement.rewardClaimed = true
    try { user.markModified && user.markModified('achievements') } catch (_) {}
    await user.save()

    const responseBody = {
      success: true,
      reward,
      newResources: user.resources,
      achievements: user.achievements
    }
    if (req._levelRewards && Array.isArray(req._levelRewards)) {
      responseBody.levelRewards = req._levelRewards
    }

    res.json(responseBody)
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

    // Initialisation si nécessaire (identique à ci-dessus)
    if (!user.achievements || Array.isArray(user.achievements) || !user.achievements.progress) {
      const achievementsObject = {
        progress: {
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
          miningBestCellsInGame: 0
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

    // S'assurer que tous les champs requis existent (pour les utilisateurs existants)
    if (!user.achievements.progress.hasOwnProperty('bestTeamEnergy')) {
      user.achievements.progress.bestTeamEnergy = 0
    }
    if (!user.achievements.progress.hasOwnProperty('bestTeamIntelligence')) {
      user.achievements.progress.bestTeamIntelligence = 0
    }
    if (!user.achievements.progress.hasOwnProperty('bestTeamCharisme')) {
      user.achievements.progress.bestTeamCharisme = 0
    }
    if (!user.achievements.progress.hasOwnProperty('maxTeamStat')) {
      user.achievements.progress.maxTeamStat = 0
    }
    if (!user.achievements.progress.hasOwnProperty('maxMegaClick')) {
      user.achievements.progress.maxMegaClick = user.achievements.progress.maxEggsInOneClick || 0
    }
    if (!user.achievements.progress.hasOwnProperty('nameChanged')) {
      user.achievements.progress.nameChanged = 0
    }
    if (!user.achievements.progress.hasOwnProperty('miningGamesPlayed')) {
      user.achievements.progress.miningGamesPlayed = 0
    }
    if (!user.achievements.progress.hasOwnProperty('miningArtifactsFound')) {
      user.achievements.progress.miningArtifactsFound = 0
    }
    if (!user.achievements.progress.hasOwnProperty('miningCellsBroken')) {
      user.achievements.progress.miningCellsBroken = 0
    }
    if (!user.achievements.progress.hasOwnProperty('miningNoRewardGame')) {
      user.achievements.progress.miningNoRewardGame = false
    }
    if (!user.achievements.progress.hasOwnProperty('miningFullGridBroken')) {
      user.achievements.progress.miningFullGridBroken = false
    }
    if (!user.achievements.progress.hasOwnProperty('miningBestCellsInGame')) {
      user.achievements.progress.miningBestCellsInGame = 0
    }

    // Mettre à jour le progrès selon le type (inchangé)
    if (progressType === 'increment') {
      // Pour les incréments (ex: +1 boîte ouverte)
      for (const [key, amount] of Object.entries(value)) {
        if (user.achievements.progress.hasOwnProperty(key)) {
          const currentValue = Number(user.achievements.progress[key]) || 0
          const incrementValue = Number(amount) || 0
          user.achievements.progress[key] = currentValue + incrementValue
          console.log(`🔍 Achievement progress updated: ${key} ${currentValue} -> ${user.achievements.progress[key]}`)
        }
      }
    } else if (progressType === 'max') {
      // Pour les valeurs maximales (ex: max œufs collectés)
      for (const [key, amount] of Object.entries(value)) {
        if (user.achievements.progress.hasOwnProperty(key)) {
          const currentValue = Number(user.achievements.progress[key]) || 0
          const newValue = Number(amount) || 0
          user.achievements.progress[key] = Math.max(currentValue, newValue)
          console.log(`🔍 Achievement progress updated (max): ${key} ${currentValue} -> ${user.achievements.progress[key]}`)
          
          // Synchroniser maxMegaClick avec maxEggsInOneClick
          if (key === 'maxEggsInOneClick') {
            user.achievements.progress.maxMegaClick = user.achievements.progress[key]
            console.log(`🔍 maxMegaClick synchronized: ${user.achievements.progress.maxMegaClick}`)
          }
        }
      }
    }

    // --- NOUVEAU : recalculer et mettre à jour les bestTeam* en se basant sur l'état courant de l'équipe
    try {
      const { computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme } = await import('./egg.controller.js')
      const teamEnergy = computeTeamEnergy(user)
      const teamIntelligence = computeTeamIntelligence(user)
      const teamCharisme = computeTeamCharisme(user)

      user.achievements.progress.bestTeamEnergy = Math.max(Number(user.achievements.progress.bestTeamEnergy) || 0, Math.floor(teamEnergy))
      user.achievements.progress.bestTeamIntelligence = Math.max(Number(user.achievements.progress.bestTeamIntelligence) || 0, Math.floor(teamIntelligence))
      user.achievements.progress.bestTeamCharisme = Math.max(Number(user.achievements.progress.bestTeamCharisme) || 0, Math.floor(teamCharisme))

      user.achievements.progress.maxTeamStat = Math.max(
        user.achievements.progress.bestTeamEnergy || 0,
        user.achievements.progress.bestTeamIntelligence || 0,
        user.achievements.progress.bestTeamCharisme || 0
      )
    } catch (e) {
      console.warn('Erreur lors de la mise à jour des bestTeam*:', e)
    }

    try { user.markModified && user.markModified('achievements') } catch (_) {}
    await user.save()
  } catch (error) {
    console.error('Erreur updateAchievementProgress:', error)
  }
}

// Fonction utilitaire pour déclencher une vérification complète des succès
export async function triggerAchievementCheck(userId) {
  try {
    const user = await User.findById(userId)
    if (!user) return

    // Initialiser les succès si nécessaire
    if (!user.achievements || Array.isArray(user.achievements) || !user.achievements.progress) {
      const achievementsObject = {
        progress: {
          totalEggsCollected: Number(user.resources?.eggs) || 0,
          totalChickensOwned: Number(user.poulesPossedees?.length) || 0,
          totalProductionCompleted: 0,
          totalBoxesOpened: 0,
          maxEggsInOneClick: 0,
          avatarChanged: 0,
          nameChanged: 0,
          // NOUVEAU : champs "best" persistés pour les 3 stats d'équipe (meilleures valeurs historiques)
          bestTeamEnergy: 0,
          bestTeamIntelligence: 0,
          bestTeamCharisme: 0,
          // Max global utilisé par les succès 'team_stats'
          maxTeamStat: 0,
          maxMegaClick: 0,
          miningGamesPlayed: 0,
          miningArtifactsFound: 0,
          miningCellsBroken: 0,
          miningNoRewardGame: false,
          miningFullGridBroken: false,
          miningBestCellsInGame: 0
        },
        completed: [],
        lastChecked: new Date()
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { achievements: achievementsObject },
        { new: true, runValidators: false }
      )
      
      user.achievements = updatedUser.achievements
    }

    // Calculer et mettre à jour les stats d'équipe
    const { computeTeamEnergy, computeTeamIntelligence, computeTeamCharisme } = await import('./egg.controller.js');
    const teamEnergy = computeTeamEnergy(user);
    const teamIntelligence = computeTeamIntelligence(user);
    const teamCharisme = computeTeamCharisme(user);

    // Mettre à jour les meilleurs historiques (persistés)
    user.achievements.progress.bestTeamEnergy = Math.max(Number(user.achievements.progress.bestTeamEnergy) || 0, Math.floor(teamEnergy));
    user.achievements.progress.bestTeamIntelligence = Math.max(Number(user.achievements.progress.bestTeamIntelligence) || 0, Math.floor(teamIntelligence));
    user.achievements.progress.bestTeamCharisme = Math.max(Number(user.achievements.progress.bestTeamCharisme) || 0, Math.floor(teamCharisme));

    // Mettre à jour le max global utilisé par les succès
    user.achievements.progress.maxTeamStat = Math.max(
      user.achievements.progress.bestTeamEnergy || 0,
      user.achievements.progress.bestTeamIntelligence || 0,
      user.achievements.progress.bestTeamCharisme || 0
    )
    user.achievements.progress.maxMegaClick = user.achievements.progress.maxEggsInOneClick || 0

    // Synchroniser miningArtifactsFound avec l'inventaire actuel du joueur
    const currentUniqueArtifacts = user.artifacts?.length || 0
    user.achievements.progress.miningArtifactsFound = Math.max(
      Number(user.achievements.progress.miningArtifactsFound) || 0,
      currentUniqueArtifacts
    )

    console.log(`🔍 Current achievement progress for user ${userId}:`, user.achievements.progress)

    // Vérifier chaque succès
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

    if (newAchievements.length > 0) {
      user.achievements.lastChecked = new Date()
      user.markModified('achievements')
      await user.save()
      return newAchievements
    }

    return []
  } catch (error) {
    console.error('Erreur triggerAchievementCheck:', error)
    return []
  }
}