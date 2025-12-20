// user/security/emailOperations.js
// Opérations liées aux emails

import User from '../../../models/User.js'
import {
  verifyPassword,
  createPendingRequest,
  sendVerificationEmailWrapper,
  deletePendingRequest,
  getPendingRegistration,
  isValidEmail,
  normalizeEmail
} from './securityHelpers.js'

/**
 * POST /api/user/add-email
 * Ajouter ou modifier l'email
 */
export async function addEmail(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' })
    }

    const trimmedEmail = normalizeEmail(email)
    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({ error: 'Adresse email invalide' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    const isPasswordValid = await verifyPassword(user, password)
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Mot de passe incorrect' })
    }

    const existingEmail = await User.findOne({ email: trimmedEmail, _id: { $ne: req.userId } })
    if (existingEmail) {
      return res.status(400).json({ error: 'Cette adresse email est déjà utilisée' })
    }

    const PendingRegistration = await getPendingRegistration()

    // Supprimer les demandes existantes pour cet email
    const existingPending = await PendingRegistration.findOne({ email: trimmedEmail })
    if (existingPending) {
      await PendingRegistration.findByIdAndDelete(existingPending._id)
    }

    const { pending, verificationCode } = await createPendingRequest(user, {
      email: trimmedEmail
    })

    const emailSent = await sendVerificationEmailWrapper(trimmedEmail, verificationCode, user.username)

    if (!emailSent) {
      await deletePendingRequest(pending._id)
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

/**
 * POST /api/user/verify-email-change
 * Vérifier le code pour changer l'email
 */
export async function verifyEmailChange(req, res) {
  try {
    const { email, verificationCode } = req.body

    if (!email || !verificationCode) {
      return res.status(400).json({ error: 'Email et code de vérification requis' })
    }

    const trimmedEmail = normalizeEmail(email)

    const PendingRegistration = await getPendingRegistration()

    const pendingEmailChange = await PendingRegistration.findOne({
      email: trimmedEmail,
      verificationCode: verificationCode,
      userId: req.userId
    })

    if (!pendingEmailChange) {
      return res.status(400).json({ error: 'Code de vérification invalide ou expiré' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      await deletePendingRequest(pendingEmailChange._id)
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    user.email = trimmedEmail
    await user.save()

    await deletePendingRequest(pendingEmailChange._id)

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
