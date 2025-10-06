// controllers/social.controller.js
// Contrôleur pour gérer les fonctionnalités sociales et leaderboards

import User from '../models/User.js'

// GET /api/social/leaderboards - Récupère tous les leaderboards
export async function getLeaderboards(req, res) {
  try {
    // Récupérer les utilisateurs avec leurs stats
    const users = await User.find({}, {
      username: 1,
      displayName: 1,
      profileId: 1,
      avatar: 1,
      'achievements.progress.totalEggsCollected': 1,
      'achievements.progress.maxEggsInOneClick': 1,
      'achievements.progress.totalChickensOwned': 1,
      poulesPossedees: 1,
      lastSeen: 1,
      createdAt: 1
    }).lean()

    // Fonction pour calculer les poules découvertes
    const getChickensFound = (poulesPossedees) => {
      if (!Array.isArray(poulesPossedees)) return 0
      // Compter les poules débloquées (présentes dans poulesPossedees)
      return poulesPossedees.length
    }    // Préparer les données pour chaque leaderboard
    const userData = users.map(user => {
      const progress = user.achievements?.progress || {}
      const chickensFound = getChickensFound(user.poulesPossedees)
      
      return {
        username: user.username || 'Joueur Anonyme',
        displayName: user.displayName || user.username || 'Joueur Anonyme',
        profileId: user.profileId || '',
        avatar: user.avatar || '',
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
        stats: {
          totalEggsCollected: Math.floor(progress.totalEggsCollected || 0),
          maxEggsInOneClick: Math.floor(progress.maxEggsInOneClick || 0),
          chickensFound: chickensFound
        }
      }
    }).filter(user => 
      // Filtrer seulement les utilisateurs avec au moins une statistique > 0
      user.stats.totalEggsCollected > 0 || 
      user.stats.maxEggsInOneClick > 0 || 
      user.stats.chickensFound > 0
    )

    // Créer les 3 leaderboards
    const eggsTotalLeaderboard = [...userData]
      .sort((a, b) => b.stats.totalEggsCollected - a.stats.totalEggsCollected)
      .slice(0, 50) // Top 50
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        displayName: user.displayName,
        profileId: user.profileId,
        avatar: user.avatar,
        value: user.stats.totalEggsCollected,
        lastSeen: user.lastSeen
      }))

    const eggsMaxLeaderboard = [...userData]
      .sort((a, b) => b.stats.maxEggsInOneClick - a.stats.maxEggsInOneClick)
      .slice(0, 50) // Top 50
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        displayName: user.displayName,
        profileId: user.profileId,
        avatar: user.avatar,
        value: user.stats.maxEggsInOneClick,
        lastSeen: user.lastSeen
      }))

    const chickensLeaderboard = [...userData]
      .sort((a, b) => b.stats.chickensFound - a.stats.chickensFound)
      .slice(0, 50) // Top 50
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        displayName: user.displayName,
        profileId: user.profileId,
        avatar: user.avatar,
        value: user.stats.chickensFound,
        lastSeen: user.lastSeen
      }))

    // Trouver la position de l'utilisateur connecté dans chaque leaderboard
    const currentUserId = req.userId?.toString()
    let userRankings = null

    if (currentUserId) {
      const currentUser = users.find(u => u._id.toString() === currentUserId)
      if (currentUser) {
        const currentUserData = {
          stats: {
            totalEggsCollected: Math.floor(currentUser.achievements?.progress?.totalEggsCollected || 0),
            maxEggsInOneClick: Math.floor(currentUser.achievements?.progress?.maxEggsInOneClick || 0),
            chickensFound: getChickensFound(currentUser.poulesPossedees)
          }
        }

        // Calculer le rang de l'utilisateur dans chaque leaderboard
        const totalEggsRank = userData
          .sort((a, b) => b.stats.totalEggsCollected - a.stats.totalEggsCollected)
          .findIndex(u => u.username === (currentUser.username || 'Joueur Anonyme')) + 1

        const maxEggsRank = userData
          .sort((a, b) => b.stats.maxEggsInOneClick - a.stats.maxEggsInOneClick)
          .findIndex(u => u.username === (currentUser.username || 'Joueur Anonyme')) + 1

        const chickensRank = userData
          .sort((a, b) => b.stats.chickensFound - a.stats.chickensFound)
          .findIndex(u => u.username === (currentUser.username || 'Joueur Anonyme')) + 1

        userRankings = {
          totalEggs: {
            rank: totalEggsRank || null,
            value: currentUserData.stats.totalEggsCollected,
            total: userData.length
          },
          maxEggs: {
            rank: maxEggsRank || null,
            value: currentUserData.stats.maxEggsInOneClick,
            total: userData.length
          },
          chickens: {
            rank: chickensRank || null,
            value: currentUserData.stats.chickensFound,
            total: userData.length
          }
        }
      }
    }

    res.json({
      success: true,
      leaderboards: {
        totalEggs: eggsTotalLeaderboard,
        maxEggs: eggsMaxLeaderboard,
        chickens: chickensLeaderboard
      },
      userRankings,
      meta: {
        totalPlayers: userData.length,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erreur getLeaderboards:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/social/player/:profileId - Récupère le profil détaillé d'un joueur (utilisé depuis les leaderboards)
export async function getPlayerProfile(req, res) {
  try {
    const { profileId } = req.params
    
    if (!profileId || !/^[0-9A-F]{6}$/.test(profileId)) {
      return res.status(400).json({ error: 'profileId invalide' })
    }

    const user = await User.findOne({ profileId }).lean()
    if (!user) {
      return res.status(404).json({ error: 'Joueur introuvable' })
    }

    // Calculer les statistiques détaillées
    const progress = user.achievements?.progress || {}
    const poules = Array.isArray(user.poulesPossedees) ? user.poulesPossedees : []
    const chickensFound = poules.filter(p => (p?.quantite || 0) > 0).length

    // Enrichir les slots d'équipe avec le niveau de talent
    const levelByEspece = new Map()
    for (const p of poules) {
      if (p?.especeId) {
        levelByEspece.set(p.especeId, Number(p.niveauTalent || 0) || 1) // Si pas de niveau, défaut à 1 car poule débloquée
      }
    }

    const rawTeam = user.team || { maxSlots: 0, slots: [] }
    const enrichedSlots = Array.isArray(rawTeam.slots)
      ? rawTeam.slots.map(s => {
          if (!s || !s.especeId) return { especeId: null }
          const lvl = levelByEspece.get(s.especeId)
          return { 
            especeId: s.especeId, 
            niveauTalent: (typeof lvl === 'number' ? lvl : 0) 
          }
        })
      : []

    res.json({
      success: true,
      player: {
        username: user.username || 'Joueur Anonyme',
        profileId: user.profileId,
        avatar: user.avatar || '',
        createdAt: user.createdAt,
        lastSeen: user.lastSeen,
        experience: user.experience || { level: 1, points: 0, required_points: 2 },
        team: { 
          maxSlots: rawTeam.maxSlots || 0, 
          slots: enrichedSlots 
        },
        stats: {
          totalEggsCollected: Math.floor(progress.totalEggsCollected || 0),
          maxEggsInOneClick: Math.floor(progress.maxEggsInOneClick || 0),
          totalChickensOwned: Math.floor(progress.totalChickensOwned || 0),
          totalProductionCompleted: Math.floor(progress.totalProductionCompleted || 0),
          totalBoxesOpened: Math.floor(progress.totalBoxesOpened || 0),
          chickensFound
        }
      }
    })

  } catch (error) {
    console.error('Erreur getPlayerProfile:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}