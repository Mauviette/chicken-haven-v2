// user/security/securityHelpers.js
// Utilitaires communs pour les opérations de sécurité

import User from '../../../models/User.js'

// Regex pour validation email
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Importer bcrypt de façon dynamique
 */
export async function getBcrypt() {
  return (await import('bcrypt')).default
}

/**
 * Importer PendingRegistration de façon dynamique
 */
export async function getPendingRegistration() {
  return (await import('../../../models/PendingRegistration.js')).default
}

/**
 * Importer les fonctions d'email de façon dynamique
 */
export async function getEmailService() {
  return await import('../../../utils/emailService.js')
}

/**
 * Valider le format d'un email
 */
export function isValidEmail(email) {
  return EMAIL_REGEX.test(email)
}

/**
 * Nettoyer et normaliser un email
 */
export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

/**
 * Vérifier le mot de passe d'un utilisateur
 */
export async function verifyPassword(user, password) {
  const bcrypt = await getBcrypt()
  return bcrypt.compare(password, user.password)
}

/**
 * Hasher un nouveau mot de passe
 */
export async function hashPassword(password) {
  const bcrypt = await getBcrypt()
  return bcrypt.hash(password, 10)
}

/**
 * Créer une demande en attente (PendingRegistration)
 */
export async function createPendingRequest(user, options) {
  const PendingRegistration = await getPendingRegistration()
  const { generateVerificationCode } = await getEmailService()

  // Supprimer les demandes existantes du même type
  const searchCriteria = { userId: user._id || options.userId }
  if (options.isDeleteRequest) searchCriteria.isDeleteRequest = true
  if (options.isPasswordChange) searchCriteria.isPasswordChange = true
  if (options.isPasswordReset) searchCriteria.isPasswordReset = true
  if (options.email && !options.isPasswordReset) searchCriteria.email = options.email

  const existingPending = await PendingRegistration.findOne(searchCriteria)
  if (existingPending) {
    await PendingRegistration.findByIdAndDelete(existingPending._id)
  }

  const verificationCode = generateVerificationCode()

  const pendingData = {
    username: user.username,
    displayName: user.displayName,
    password: user.password,
    email: options.email || user.email,
    verificationCode,
    userId: user._id || options.userId,
    apocalypse: user.apocalypse,
    ...options
  }

  const pending = new PendingRegistration(pendingData)
  await pending.save()

  return { pending, verificationCode }
}

/**
 * Envoyer un email de vérification
 */
export async function sendVerificationEmailWrapper(email, code, username, type = 'default') {
  const { sendVerificationEmail } = await getEmailService()
  return sendVerificationEmail(email, code, username, type)
}

/**
 * Supprimer une demande en attente
 */
export async function deletePendingRequest(pendingId) {
  const PendingRegistration = await getPendingRegistration()
  await PendingRegistration.findByIdAndDelete(pendingId)
}
