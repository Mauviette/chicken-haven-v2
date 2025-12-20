// user/security/accountOperations.js
// Opérations liées à la suppression de compte

import User from '../../../models/User.js'
import {
  verifyPassword,
  createPendingRequest,
  sendVerificationEmailWrapper,
  deletePendingRequest,
  getPendingRegistration
} from './securityHelpers.js'

/**
 * POST /api/user/initiate-delete-account
 * Initie la suppression de compte (avec vérification email)
 */
export async function initiateDeleteAccount(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })
    }

    if (!user.email) {
      return res.status(400).json({ success: false, error: 'Un email est requis pour cette action' })
    }

    const { pending, verificationCode } = await createPendingRequest(user, {
      isDeleteRequest: true
    })

    const emailSent = await sendVerificationEmailWrapper(
      user.email,
      verificationCode,
      user.username,
      'delete-account'
    )

    if (!emailSent) {
      await deletePendingRequest(pending._id)
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

/**
 * POST /api/user/confirm-delete-account
 * Confirme la suppression de compte
 */
export async function confirmDeleteAccount(req, res) {
  try {
    const { verificationCode } = req.body

    if (!verificationCode) {
      return res.status(400).json({ success: false, error: 'Code de vérification requis' })
    }

    const PendingRegistration = await getPendingRegistration()

    const pendingDelete = await PendingRegistration.findOne({
      userId: req.userId,
      verificationCode: verificationCode,
      isDeleteRequest: true
    })

    if (!pendingDelete) {
      return res.status(400).json({ success: false, error: 'Code de vérification invalide ou expiré' })
    }

    await User.findByIdAndDelete(req.userId)
    await deletePendingRequest(pendingDelete._id)

    console.log(`🗑️ Compte supprimé avec confirmation email: ${pendingDelete.username} (${req.userId})`)

    res.json({ success: true, message: 'Compte supprimé avec succès' })
  } catch (err) {
    console.error('Confirm delete account error:', err)
    res.status(500).json({ success: false, error: 'Erreur serveur lors de la confirmation de suppression' })
  }
}

/**
 * DELETE /api/user/delete-account
 * Supprime définitivement le compte (avec mot de passe, sans email)
 */
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

    const isPasswordValid = await verifyPassword(user, password)
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, error: 'Mot de passe incorrect' })
    }

    await User.findByIdAndDelete(req.userId)

    console.log(`🗑️ Compte supprimé: ${user.username} (${req.userId})`)

    res.json({ success: true, message: 'Compte supprimé avec succès' })
  } catch (err) {
    console.error('Erreur suppression compte:', err)
    res.status(500).json({ success: false, error: 'Erreur serveur lors de la suppression du compte' })
  }
}
