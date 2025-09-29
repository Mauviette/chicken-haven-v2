import User from '../models/User.js'
import { updateAchievementProgress, triggerAchievementCheck } from './achievements.controller.js'

function makeProfileId() {
  // 3 bytes random -> 6 hex uppercase
  return [...crypto.randomBytes(3)].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
}

import crypto from 'crypto'

async function ensureProfileId(user) {
  if (user.profileId) return user.profileId
  // Try a few times to avoid collisions
  for (let i = 0; i < 5; i++) {
    const pid = makeProfileId()
    const exists = await User.findOne({ profileId: pid }).lean()
    if (!exists) {
      user.profileId = pid
      await user.save()
      return pid
    }
  }
  // Fallback deterministic from ObjectId (last 6 hex upper)
  const fallback = String(user._id).slice(-6).toUpperCase()
  user.profileId = fallback
  await user.save()
  return fallback
}

// PATCH /api/user/me/avatar - Met à jour l'avatar de l'utilisateur connecté
export async function updateAvatar(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { avatar } = req.body || {}
    // avatar est un especeId ou la valeur spéciale 'hidden' (avatar vide)
    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({ error: 'Paramètre avatar invalide' })
    }

    if (avatar !== 'hidden') {
      // Vérifier que l'utilisateur a débloqué cette poule
      const owned = Array.isArray(user.poulesPossedees) ? user.poulesPossedees.find(p => p.especeId === avatar) : null
      if (!owned || (owned.quantite || 0) <= 0) {
        return res.status(400).json({ error: 'Avatar non disponible: poule non débloquée' })
      }
      user.avatar = avatar
    } else {
      // 'hidden' = avatar vide (utilisera l’icône par défaut côté front)
      user.avatar = ''
    }

    await user.save()

    // Mettre à jour les succès pour le changement d'avatar
    try {
      // Vérifier si c'est le premier changement d'avatar
      const isFirstAvatarChange = !user.achievements?.progress?.avatarChanged || user.achievements.progress.avatarChanged === 0
      
      if (isFirstAvatarChange) {
        await updateAchievementProgress(req.userId, 'increment', {
          avatarChanged: 1
        })
        // Déclencher une vérification complète pour les nouveaux succès
        await triggerAchievementCheck(req.userId)
      }
    } catch (achievementError) {
      console.warn('Erreur mise à jour succès avatar:', achievementError)
    }

    res.json({ success: true, avatar: user.avatar })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/user/me - Récupère les informations essentielles de l'utilisateur (XP / niveau)
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { experience, username, resources, upgrades } = user
    const profileId = await ensureProfileId(user)
    // Update lastSeen as user is active now
    try { user.lastSeen = new Date(); await user.save() } catch (_) {}
    res.json({
      username,
      profileId,
      avatar: user.avatar || '',
      lastSeen: user.lastSeen,
      experience: {
        level: experience?.level ?? 1,
        points: experience?.points ?? 0,
        required_points: experience?.required_points ?? 2,
      },
      resources: {
        eggs: resources?.eggs ?? 0,
        stock_token: resources?.stock_token ?? 0,
        production_token: resources?.production_token ?? 0,
        wild_token: resources?.wild_token ?? 0,
      },
      upgrades: upgrades || {}
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/user/profile/:profileId - Public profile by 6-hex ID
export async function getPublicProfile(req, res) {
  try {
    const { profileId } = req.params
    if (!profileId || !/^[0-9A-F]{6}$/.test(profileId)) {
      return res.status(400).json({ error: 'profileId invalide' })
    }
    const user = await User.findOne({ profileId }).lean()
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Compute derived stats
    const progress = user.achievements?.progress || {}
    const poules = Array.isArray(user.poulesPossedees) ? user.poulesPossedees : []
    const chickenFound = poules.filter(p => (p?.quantite || 0) > 0).length

    // Enrichir les slots d'équipe avec le niveau de talent courant si connu
    const levelByEspece = new Map()
    for (const p of poules) {
      if (p?.especeId) levelByEspece.set(p.especeId, Number(p.niveauTalent || 0) || (p.quantite > 0 ? 1 : 0))
    }
    const rawTeam = user.team || { maxSlots: 0, slots: [] }
    const enrichedSlots = Array.isArray(rawTeam.slots)
      ? rawTeam.slots.map(s => {
          if (!s || !s.especeId) return { especeId: null }
          const lvl = levelByEspece.get(s.especeId)
          return { especeId: s.especeId, niveauTalent: (typeof lvl === 'number' ? lvl : 0) }
        })
      : []

    res.json({
      username: user.username,
      profileId: user.profileId,
      avatar: user.avatar || '',
      createdAt: user.createdAt,
      lastSeen: user.lastSeen,
      experience: user.experience || { level: 1, points: 0, required_points: 2 },
      team: { maxSlots: rawTeam.maxSlots || 0, slots: enrichedSlots },
      stats: {
        totalEggsCollected: progress.totalEggsCollected || 0,
        totalChickensOwned: progress.totalChickensOwned || 0,
        totalProductionCompleted: progress.totalProductionCompleted || 0,
        totalBoxesOpened: progress.totalBoxesOpened || 0,
        maxEggsInOneClick: progress.maxEggsInOneClick || 0,
        chickenFound
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
