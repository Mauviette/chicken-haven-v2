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
      apocalypse: user.apocalypse || false,
      email: user.email || null,
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
        mining_token: resources?.mining_token ?? 0,
        precious_stone: resources?.precious_stone ?? 0,
      },
      cooldowns: user.cooldowns || {},
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
      apocalypse: user.apocalypse || false,
      dev: user.dev || false,
      experience: user.experience || { level: 1, points: 0, required_points: 2 },
      team: { maxSlots: rawTeam.maxSlots || 0, slots: enrichedSlots },
      resources: {
        eggs: user.resources?.eggs ?? 0,
      },
      stats: {
        totalEggsCollected: progress.totalEggsCollected || 0,
        totalChickensOwned: progress.totalChickensOwned || 0,
        totalProductionCompleted: progress.totalProductionCompleted || 0,
        totalBoxesOpened: progress.totalBoxesOpened || 0,
        maxEggsInOneClick: progress.maxEggsInOneClick || 0,
        chickenFound,
        achievementsCompleted
      },
      achievements: {
        progress: progress
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
    if (!/^[a-zA-Z0-9À-ÿ\s_.,:;!?()[\]{}+\-*\/@#$%^&'"`~|\\]+$/.test(trimmed)) {
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

    // Mettre à jour les succès pour le changement de nom
    try {
      console.log(`👤 Display name changed for user ${req.userId}: ${user.displayName}`)
      await updateAchievementProgress(req.userId, 'increment', {
        nameChanged: 1
      })
      await triggerAchievementCheck(req.userId)
    } catch (achievementError) {
      console.warn('Erreur mise à jour succès nom:', achievementError)
    }
    
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

    // Vérifier le niveau pour accéder aux artefacts
    const playerLevel = user.experience?.level || 1
    if (playerLevel < 5) {
      return res.status(403).json({ error: 'Vous devez atteindre le niveau 5 pour accéder aux artefacts' })
    }

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

    // Vérifier le niveau pour accéder aux artefacts
    const playerLevel = user.experience?.level || 1
    if (playerLevel < 5) {
      return res.status(403).json({ error: 'Vous devez atteindre le niveau 5 pour accéder aux artefacts' })
    }

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

    // Vérifier le niveau pour accéder aux artefacts
    const playerLevel = user.experience?.level || 1
    if (playerLevel < 5) {
      return res.status(403).json({ error: 'Vous devez atteindre le niveau 5 pour accéder aux artefacts' })
    }

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

    // Vérifier le niveau pour accéder aux artefacts
    const playerLevel = user.experience?.level || 1
    if (playerLevel < 5) {
      return res.status(403).json({ error: 'Vous devez atteindre le niveau 5 pour accéder aux artefacts' })
    }

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

// POST /api/user/initiate-delete-account - Initie la suppression de compte avec confirmation email
export async function initiateDeleteAccount(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })
    }

    // Vérifier si l'utilisateur a un email
    if (!user.email) {
      return res.status(400).json({ success: false, error: 'Un email est requis pour cette action' })
    }

    // Importer les dépendances nécessaires
    const PendingRegistration = (await import('../models/PendingRegistration.js')).default
    const { sendVerificationEmail, generateVerificationCode } = await import('../utils/emailService.js')

    // Vérifier s'il y a déjà une demande de suppression en attente pour cet utilisateur
    const existingPending = await PendingRegistration.findOne({ userId: req.userId, isDeleteRequest: true })
    if (existingPending) {
      await PendingRegistration.findByIdAndDelete(existingPending._id)
    }

    // Générer un code de vérification
    const verificationCode = generateVerificationCode()

    // Créer une demande de suppression en attente
    const pendingDelete = new PendingRegistration({
      username: user.username,
      displayName: user.displayName,
      password: user.password,
      email: user.email,
      verificationCode,
      userId: req.userId,
      isDeleteRequest: true, // Marquer comme demande de suppression
      apocalypse: user.apocalypse
    })

    await pendingDelete.save()

    // Envoyer l'email de confirmation de suppression
    const emailSent = await sendVerificationEmail(
      user.email, 
      verificationCode, 
      user.username,
      'delete-account' // Type spécial pour la suppression
    )

    if (!emailSent) {
      // Supprimer la demande en attente si l'email n'a pas pu être envoyé
      await PendingRegistration.findByIdAndDelete(pendingDelete._id)
      return res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi de l\'email de confirmation' })
    }

    res.json({
      success: true,
      message: 'Un code de confirmation a été envoyé à votre adresse email',
      requiresVerification: true
    })
  } catch (err) {
    console.error('Initiate delete account error:', err)
    res.status(500).json({ success: false, error: 'Erreur serveur lors de l\'initiation de la suppression' })
  }
}

// POST /api/user/confirm-delete-account - Confirme la suppression de compte avec le code email
export async function confirmDeleteAccount(req, res) {
  try {
    const { verificationCode } = req.body

    if (!verificationCode) {
      return res.status(400).json({ success: false, error: 'Code de vérification requis' })
    }

    // Importer les dépendances nécessaires
    const PendingRegistration = (await import('../models/PendingRegistration.js')).default

    // Trouver la demande de suppression en attente
    const pendingDelete = await PendingRegistration.findOne({
      userId: req.userId,
      verificationCode: verificationCode,
      isDeleteRequest: true
    })

    if (!pendingDelete) {
      return res.status(400).json({ success: false, error: 'Code de vérification invalide ou expiré' })
    }

    // Supprimer complètement le compte
    await User.findByIdAndDelete(req.userId)

    // Supprimer la demande en attente
    await PendingRegistration.findByIdAndDelete(pendingDelete._id)

    console.log(`🗑️ Compte supprimé avec confirmation email: ${pendingDelete.username} (${req.userId})`)

    res.json({ success: true, message: 'Compte supprimé avec succès' })
  } catch (err) {
    console.error('Confirm delete account error:', err)
    res.status(500).json({ success: false, error: 'Erreur serveur lors de la confirmation de suppression' })
  }
}

// POST /api/user/initiate-password-change - Initie le changement de mot de passe avec confirmation email
export async function initiatePasswordChange(req, res) {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' })
    }

    // Validation du nouveau mot de passe
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    // Vérifier si l'utilisateur a un email
    if (!user.email) {
      return res.status(400).json({ error: 'Un email est requis pour cette action' })
    }

    // Vérifier le mot de passe actuel
    const bcrypt = (await import('bcrypt')).default
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' })
    }

    // Vérifier que le nouveau mot de passe est différent
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'actuel' })
    }

    // Importer les dépendances nécessaires
    const PendingRegistration = (await import('../models/PendingRegistration.js')).default
    const { sendVerificationEmail, generateVerificationCode } = await import('../utils/emailService.js')

    // Vérifier s'il y a déjà une demande de changement de mot de passe en attente pour cet utilisateur
    const existingPending = await PendingRegistration.findOne({ userId: req.userId, isPasswordChange: true })
    if (existingPending) {
      await PendingRegistration.findByIdAndDelete(existingPending._id)
    }

    // Générer un code de vérification
    const verificationCode = generateVerificationCode()

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Créer une demande de changement de mot de passe en attente
    const pendingPasswordChange = new PendingRegistration({
      username: user.username,
      displayName: user.displayName,
      password: user.password, // Garder l'ancien mot de passe
      email: user.email,
      verificationCode,
      userId: req.userId,
      isPasswordChange: true,
      newPassword: hashedNewPassword, // Stocker le nouveau mot de passe hashé
      apocalypse: user.apocalypse
    })

    await pendingPasswordChange.save()

    // Envoyer l'email de confirmation de changement de mot de passe
    const emailSent = await sendVerificationEmail(
      user.email, 
      verificationCode, 
      user.username,
      'password-change' // Type spécial pour le changement de mot de passe
    )

    if (!emailSent) {
      // Supprimer la demande en attente si l'email n'a pas pu être envoyé
      await PendingRegistration.findByIdAndDelete(pendingPasswordChange._id)
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de confirmation' })
    }

    res.json({
      success: true,
      message: 'Un code de confirmation a été envoyé à votre adresse email'
    })
  } catch (err) {
    console.error('Initiate password change error:', err)
    res.status(500).json({ error: 'Erreur serveur lors de l\'initiation du changement de mot de passe' })
  }
}

// POST /api/user/confirm-password-change - Confirme le changement de mot de passe avec le code email
export async function confirmPasswordChange(req, res) {
  try {
    const { verificationCode } = req.body

    if (!verificationCode) {
      return res.status(400).json({ error: 'Code de vérification requis' })
    }

    // Importer les dépendances nécessaires
    const PendingRegistration = (await import('../models/PendingRegistration.js')).default

    // Trouver la demande de changement de mot de passe en attente
    const pendingPasswordChange = await PendingRegistration.findOne({
      userId: req.userId,
      verificationCode: verificationCode,
      isPasswordChange: true
    })

    if (!pendingPasswordChange) {
      return res.status(400).json({ error: 'Code de vérification invalide ou expiré' })
    }

    // Mettre à jour le mot de passe de l'utilisateur
    const user = await User.findById(req.userId)
    if (!user) {
      await PendingRegistration.findByIdAndDelete(pendingPasswordChange._id)
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    user.password = pendingPasswordChange.newPassword
    await user.save()

    // Supprimer la demande en attente
    await PendingRegistration.findByIdAndDelete(pendingPasswordChange._id)

    console.log(`🔑 Mot de passe changé pour ${user.username}: (${req.userId})`)

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    })
  } catch (err) {
    console.error('Confirm password change error:', err)
    res.status(500).json({ error: 'Erreur serveur lors de la confirmation du changement de mot de passe' })
  }
}

// DELETE /api/user/delete-account - Supprime définitivement le compte utilisateur
export async function deleteAccount(req, res) {
  try {
    const { password } = req.body

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: 'Mot de passe requis' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })
    }

    // Vérifier le mot de passe
    const bcrypt = (await import('bcrypt')).default
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, error: 'Mot de passe incorrect' })
    }

    // Supprimer complètement le compte
    await User.findByIdAndDelete(req.userId)

    console.log(`🗑️ Compte supprimé: ${user.username} (${req.userId})`)

    res.json({ success: true, message: 'Compte supprimé avec succès' })
  } catch (err) {
    console.error('Erreur suppression compte:', err)
    res.status(500).json({ success: false, error: 'Erreur serveur lors de la suppression du compte' })
  }
}

// POST /api/user/add-email - Ajouter/modifier l'email d'un utilisateur existant
export async function addEmail(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }

    const trimmedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Adresse email invalide' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    // Vérifier le mot de passe
    const bcrypt = (await import('bcrypt')).default
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Mot de passe incorrect' })
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const existingEmail = await User.findOne({ email: trimmedEmail, _id: { $ne: req.userId } })
    if (existingEmail) {
      return res.status(400).json({ error: 'Cette adresse email est déjà utilisée' })
    }

    // Importer les dépendances nécessaires
    const PendingRegistration = (await import('../models/PendingRegistration.js')).default
    const { sendVerificationEmail, generateVerificationCode } = await import('../utils/emailService.js')

    // Vérifier s'il y a déjà une inscription en attente pour cet email
    const existingPending = await PendingRegistration.findOne({ email: trimmedEmail })
    if (existingPending) {
      await PendingRegistration.findByIdAndDelete(existingPending._id)
    }

    // Générer un code de vérification
    const verificationCode = generateVerificationCode()

    // Créer une demande de changement d'email en attente
    const pendingEmailChange = new PendingRegistration({
      username: user.username, // Utiliser le username existant
      displayName: user.displayName,
      password: user.password, // Garder le même mot de passe hashé
      email: trimmedEmail,
      verificationCode,
      userId: req.userId, // Ajouter l'ID de l'utilisateur pour différencier
      apocalypse: user.apocalypse
    })

    await pendingEmailChange.save()

    // Envoyer l'email de vérification
    const emailSent = await sendVerificationEmail(trimmedEmail, verificationCode, user.username)

    if (!emailSent) {
      // Supprimer la demande en attente si l'email n'a pas pu être envoyé
      await PendingRegistration.findByIdAndDelete(pendingEmailChange._id)
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de vérification' })
    }

    res.json({
      message: 'Un code de vérification a été envoyé à votre adresse email',
      requiresVerification: true,
      email: trimmedEmail
    })
  } catch (err) {
    console.error('Add email error:', err)
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout de l\'email' })
  }
}

// POST /api/user/verify-email-change - Vérifier le code pour changer l'email
export async function verifyEmailChange(req, res) {
  try {
    const { email, verificationCode } = req.body

    if (!email || !verificationCode) {
      return res.status(400).json({ error: 'Email et code de vérification requis' })
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Importer les dépendances nécessaires
    const PendingRegistration = (await import('../models/PendingRegistration.js')).default

    // Trouver la demande de changement d'email en attente
    const pendingEmailChange = await PendingRegistration.findOne({
      email: trimmedEmail,
      verificationCode: verificationCode,
      userId: req.userId // S'assurer que c'est pour cet utilisateur
    })

    if (!pendingEmailChange) {
      return res.status(400).json({ error: 'Code de vérification invalide ou expiré' })
    }

    // Mettre à jour l'email de l'utilisateur
    const user = await User.findById(req.userId)
    if (!user) {
      await PendingRegistration.findByIdAndDelete(pendingEmailChange._id)
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    user.email = trimmedEmail
    await user.save()

    // Supprimer la demande en attente
    await PendingRegistration.findByIdAndDelete(pendingEmailChange._id)

    console.log(`📧 Email ajouté/modifié pour ${user.username}: ${user.email}`)

    res.json({
      success: true,
      message: 'Email ajouté avec succès',
      email: user.email
    })
  } catch (err) {
    console.error('Email change verification error:', err)
    res.status(500).json({ error: 'Erreur serveur lors de la vérification du changement d\'email' })
  }
}

// POST /api/auth/forgot-password - Initie la réinitialisation de mot de passe
export async function initiatePasswordReset(req, res) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Adresse email requise' })
    }

    const trimmedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Adresse email invalide' })
    }

    // Vérifier si un utilisateur avec cet email existe
    const user = await User.findOne({ email: trimmedEmail })
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
      return res.json({ success: true, message: 'Si cette adresse email est associée à un compte, un code de réinitialisation a été envoyé' })
    }

    // Importer les dépendances nécessaires
    const PendingRegistration = (await import('../models/PendingRegistration.js')).default
    const { sendVerificationEmail, generateVerificationCode } = await import('../utils/emailService.js')

    // Vérifier s'il y a déjà une demande de réinitialisation en attente pour cet email
    const existingPending = await PendingRegistration.findOne({ email: trimmedEmail, isPasswordReset: true })
    if (existingPending) {
      await PendingRegistration.findByIdAndDelete(existingPending._id)
    }

    // Générer un code de vérification
    const verificationCode = generateVerificationCode()

    // Créer une demande de réinitialisation en attente
    const pendingReset = new PendingRegistration({
      username: user.username,
      displayName: user.displayName,
      password: user.password,
      email: trimmedEmail,
      verificationCode,
      userId: user._id,
      isPasswordReset: true,
      apocalypse: user.apocalypse
    })

    await pendingReset.save()

    // Envoyer l'email de réinitialisation
    const emailSent = await sendVerificationEmail(
      trimmedEmail,
      verificationCode,
      user.username,
      'password-reset'
    )

    if (!emailSent) {
      // Supprimer la demande en attente si l'email n'a pas pu être envoyé
      await PendingRegistration.findByIdAndDelete(pendingReset._id)
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de réinitialisation' })
    }

    res.json({
      success: true,
      message: 'Si cette adresse email est associée à un compte, un code de réinitialisation a été envoyé'
    })
  } catch (err) {
    console.error('Initiate password reset error:', err)
    res.status(500).json({ error: 'Erreur serveur lors de l\'initiation de la réinitialisation' })
  }
}

// POST /api/auth/reset-password - Confirme la réinitialisation de mot de passe avec le code
export async function confirmPasswordReset(req, res) {
  try {
    const { email, verificationCode, newPassword } = req.body

    if (!email || !verificationCode || !newPassword) {
      return res.status(400).json({ error: 'Email, code de vérification et nouveau mot de passe requis' })
    }

    // Validation du nouveau mot de passe
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Importer les dépendances nécessaires
    const PendingRegistration = (await import('../models/PendingRegistration.js')).default

    // Trouver la demande de réinitialisation en attente
    const pendingReset = await PendingRegistration.findOne({
      email: trimmedEmail,
      verificationCode: verificationCode,
      isPasswordReset: true
    })

    if (!pendingReset) {
      return res.status(400).json({ error: 'Code de vérification invalide ou expiré' })
    }

    // Mettre à jour le mot de passe de l'utilisateur
    const user = await User.findById(pendingReset.userId)
    if (!user) {
      await PendingRegistration.findByIdAndDelete(pendingReset._id)
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    // Hasher le nouveau mot de passe
    const bcrypt = (await import('bcrypt')).default
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedNewPassword
    await user.save()

    // Supprimer la demande en attente
    await PendingRegistration.findByIdAndDelete(pendingReset._id)

    console.log(`🔑 Mot de passe réinitialisé pour ${user.username}: (${user._id})`)

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    })
  } catch (err) {
    console.error('Confirm password reset error:', err)
    res.status(500).json({ error: 'Erreur serveur lors de la confirmation de la réinitialisation' })
  }
}
