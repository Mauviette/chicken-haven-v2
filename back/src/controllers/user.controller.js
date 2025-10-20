import User from '../models/User.js'
import { updateAchievementProgress, triggerAchievementCheck } from './achievements.controller.js'
import { containsForbiddenWords } from '../utils/forbiddenWords.js'

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

// GET /api/user/buffs - Récupère les buffs actifs de l'utilisateur
export async function getBuffs(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Filtrer les buffs actifs (non expirés)
    const now = new Date()
    const activeBuffs = (user.buffs || []).filter(buff => {
      if (!buff.lasts_until) return true // Buff permanent
      return new Date(buff.lasts_until) > now
    })

    // Nettoyer les buffs expirés de la base de données
    const expiredBuffs = (user.buffs || []).filter(buff => {
      if (!buff.lasts_until) return false
      return new Date(buff.lasts_until) <= now
    })

    if (expiredBuffs.length > 0) {
      user.buffs = activeBuffs
      await user.save()
    }

    res.json({ buffs: activeBuffs })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
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
      // Vérifier que l'utilisateur a débloqué cette poule (présente dans poulesPossedees)
      const owned = Array.isArray(user.poulesPossedees) ? user.poulesPossedees.find(p => p.especeId === avatar) : null
      if (!owned) {
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
      console.log(`🎭 Avatar changed for user ${req.userId}: ${user.avatar}`)
      // Toujours incrémenter le compteur de changements d'avatar
      await updateAchievementProgress(req.userId, 'increment', {
        avatarChanged: 1
      })
      // Déclencher une vérification complète pour les nouveaux succès
      await triggerAchievementCheck(req.userId)
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

    const { experience, username, displayName, resources, upgrades } = user
    const profileId = await ensureProfileId(user)
    // Update lastSeen as user is active now
    try { user.lastSeen = new Date(); await user.save() } catch (_) {}
    res.json({
      username,
      displayName: displayName || username,
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
        chest_key: resources?.chest_key ?? 0,
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
    const chickenFound = poules.length // Nombre de poules débloquées = nombre de poules dans poulesPossedees

    // Enrichir les slots d'équipe avec le niveau de talent courant si connu
    const levelByEspece = new Map()
    for (const p of poules) {
      if (p?.especeId) levelByEspece.set(p.especeId, Number(p.niveauTalent || 0) || 1) // Si pas de niveau, défaut à 1 car poule débloquée
    }
    const rawTeam = user.team || { maxSlots: 0, slots: [] }
    const enrichedSlots = Array.isArray(rawTeam.slots)
      ? rawTeam.slots.map(s => {
          if (!s || !s.especeId) return { especeId: null }
          const lvl = levelByEspece.get(s.especeId)
          return { especeId: s.especeId, niveauTalent: (typeof lvl === 'number' ? lvl : 0) }
        })
      : []

    // Calculer le nombre de succès obtenus
    const achievementsCompleted = (user.achievements?.completed || []).length

    res.json({
      username: user.username,
      displayName: user.displayName || user.username,
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
        chickenFound,
        achievementsCompleted
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// PATCH /api/user/me/displayName - Mettre à jour le nom d'affichage
export async function updateDisplayName(req, res) {
  try {
    const { displayName } = req.body
    
    if (!displayName || typeof displayName !== 'string') {
      return res.status(400).json({ error: 'Nom d\'affichage requis' })
    }
    
    const trimmed = displayName.trim()
    
    if (trimmed.length < 2) {
      return res.status(400).json({ error: 'Minimum 2 caractères' })
    }
    
    if (trimmed.length > 30) {
      return res.status(400).json({ error: 'Maximum 30 caractères' })
    }
    
    // Vérifier les caractères autorisés (mêmes que l'inscription)
    if (!/^[a-zA-Z0-9À-ÿ\s_-]+$/.test(trimmed)) {
      return res.status(400).json({ error: 'Caractères alphanumériques uniquement' })
    }
    
    // Vérifier les mots interdits (depuis fichier forbidden-words.txt)
    if (containsForbiddenWords(trimmed)) {
      return res.status(400).json({ error: 'Nom d\'affichage non autorisé' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })
    
    user.displayName = trimmed
    await user.save()
    
    res.json({ success: true, displayName: user.displayName })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// ========================
// ARTEFACTS
// ========================

// GET /api/user/artifacts - Récupère la liste des artefacts possédés par l'utilisateur
export async function getArtifacts(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const artifacts = user.artifacts || []
    res.json({ artifacts })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/user/artifact-slots - Récupère les emplacements d'artefacts
export async function getArtifactSlots(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const artifactSlots = user.artifactSlots || { slotsCount: 2, equipped: [] }
    res.json(artifactSlots)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// PUT /api/user/artifact/equip/:artifactId - Équipe un artefact
export async function equipArtifact(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { artifactId } = req.params
    if (!artifactId) {
      return res.status(400).json({ error: 'artifactId requis' })
    }

    // Vérifier que l'utilisateur possède cet artefact
    const hasArtifact = (user.artifacts || []).some(a => a.artifactId === artifactId)
    if (!hasArtifact) {
      return res.status(400).json({ error: 'Artefact non possédé' })
    }

    // Vérifier qu'il n'est pas déjà équipé
    const equipped = user.artifactSlots?.equipped || []
    if (equipped.includes(artifactId)) {
      return res.status(400).json({ error: 'Artefact déjà équipé' })
    }

    // Vérifier qu'il y a de la place
    const slotsCount = user.artifactSlots?.slotsCount || 2
    const usedSlots = equipped.filter(id => id !== null && id !== '').length
    if (usedSlots >= slotsCount) {
      return res.status(400).json({ error: 'Tous les emplacements sont occupés' })
    }

    // Équiper l'artefact
    if (!user.artifactSlots) {
      user.artifactSlots = { slotsCount: 2, equipped: [] }
    }
    
    // Trouver un emplacement vide
    let placed = false
    for (let i = 0; i < slotsCount; i++) {
      if (!user.artifactSlots.equipped[i]) {
        user.artifactSlots.equipped[i] = artifactId
        placed = true
        break
      }
    }

    if (!placed) {
      // Ajouter à la fin
      user.artifactSlots.equipped.push(artifactId)
    }

    await user.save()
    res.json({ success: true, artifactSlots: user.artifactSlots })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// PUT /api/user/artifact/unequip/:artifactId - Déséquipe un artefact
export async function unequipArtifact(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { artifactId } = req.params
    if (!artifactId) {
      return res.status(400).json({ error: 'artifactId requis' })
    }

    if (!user.artifactSlots) {
      return res.status(400).json({ error: 'Aucun artefact équipé' })
    }

    // Retirer l'artefact de la liste
    const equipped = user.artifactSlots.equipped || []
    const index = equipped.indexOf(artifactId)
    if (index === -1) {
      return res.status(400).json({ error: 'Artefact non équipé' })
    }

    user.artifactSlots.equipped.splice(index, 1)
    await user.save()

    res.json({ success: true, artifactSlots: user.artifactSlots })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
