// user/security/passwordOperations.js
// Opérations liées aux mots de passe

import User from '../../../models/User.js'
import {
  verifyPassword,
  hashPassword,
  createPendingRequest,
  sendVerificationEmailWrapper,
  deletePendingRequest,
  getPendingRegistration,
  isValidEmail,
  normalizeEmail
} from './securityHelpers.js'

/**
 * POST /api/user/initiate-password-change
 * Initie le changement de mot de passe (utilisateur connecté)
 */
export async function initiatePasswordChange(req, res) {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    if (!user.email) {
      return res.status(400).json({ error: 'Un email est requis pour cette action' })
    }

    const isCurrentPasswordValid = await verifyPassword(user, currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' })
    }

    const isSamePassword = await verifyPassword(user, newPassword)
    if (isSamePassword) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'actuel' })
    }

    const hashedNewPassword = await hashPassword(newPassword)

    const { pending, verificationCode } = await createPendingRequest(user, {
      isPasswordChange: true,
      newPassword: hashedNewPassword
    })

    const emailSent = await sendVerificationEmailWrapper(
      user.email,
      verificationCode,
      user.username,
      'password-change'
    )

    if (!emailSent) {
      await deletePendingRequest(pending._id)
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

/**
 * POST /api/user/confirm-password-change
 * Confirme le changement de mot de passe
 */
export async function confirmPasswordChange(req, res) {
  try {
    const { verificationCode } = req.body

    if (!verificationCode) {
      return res.status(400).json({ error: 'Code de vérification requis' })
    }

    const PendingRegistration = await getPendingRegistration()

    const pendingPasswordChange = await PendingRegistration.findOne({
      userId: req.userId,
      verificationCode: verificationCode,
      isPasswordChange: true
    })

    if (!pendingPasswordChange) {
      return res.status(400).json({ error: 'Code de vérification invalide ou expiré' })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      await deletePendingRequest(pendingPasswordChange._id)
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    user.password = pendingPasswordChange.newPassword
    await user.save()

    await deletePendingRequest(pendingPasswordChange._id)

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

/**
 * POST /api/auth/forgot-password
 * Initie la réinitialisation de mot de passe (utilisateur non connecté)
 */
export async function initiatePasswordReset(req, res) {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Adresse email requise' })
    }

    const trimmedEmail = normalizeEmail(email)
    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({ error: 'Adresse email invalide' })
    }

    const user = await User.findOne({ email: trimmedEmail })
    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe
      return res.json({ success: true, message: 'Si cette adresse email est associée à un compte, un code de réinitialisation a été envoyé' })
    }

    const { pending, verificationCode } = await createPendingRequest(user, {
      isPasswordReset: true,
      email: trimmedEmail
    })

    const emailSent = await sendVerificationEmailWrapper(
      trimmedEmail,
      verificationCode,
      user.username,
      'password-reset'
    )

    if (!emailSent) {
      await deletePendingRequest(pending._id)
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

/**
 * POST /api/auth/reset-password
 * Confirme la réinitialisation de mot de passe
 */
export async function confirmPasswordReset(req, res) {
  try {
    const { email, verificationCode, newPassword } = req.body

    if (!email || !verificationCode || !newPassword) {
      return res.status(400).json({ error: 'Email, code de vérification et nouveau mot de passe requis' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' })
    }

    const trimmedEmail = normalizeEmail(email)

    const PendingRegistration = await getPendingRegistration()

    const pendingReset = await PendingRegistration.findOne({
      email: trimmedEmail,
      verificationCode: verificationCode,
      isPasswordReset: true
    })

    if (!pendingReset) {
      return res.status(400).json({ error: 'Code de vérification invalide ou expiré' })
    }

    const user = await User.findById(pendingReset.userId)
    if (!user) {
      await deletePendingRequest(pendingReset._id)
      return res.status(404).json({ error: 'Utilisateur introuvable' })
    }

    const hashedNewPassword = await hashPassword(newPassword)
    user.password = hashedNewPassword
    await user.save()

    await deletePendingRequest(pendingReset._id)

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
