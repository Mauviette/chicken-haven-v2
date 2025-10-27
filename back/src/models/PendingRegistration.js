import mongoose from 'mongoose'

const PendingRegistrationSchema = new mongoose.Schema({
  username: { type: String, required: true },
  displayName: { type: String, required: true },
  password: { type: String, required: true }, // Hashé
  email: { type: String, required: true },
  verificationCode: { type: String, required: true },
  apocalypse: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Pour les changements d'email existants
  isDeleteRequest: { type: Boolean, default: false }, // Pour différencier les demandes de suppression
  isPasswordChange: { type: Boolean, default: false }, // Pour différencier les demandes de changement de mot de passe
  isPasswordReset: { type: Boolean, default: false }, // Pour différencier les demandes de réinitialisation de mot de passe
  newPassword: { type: String }, // Nouveau mot de passe hashé pour les changements
  expiresAt: { type: Date, default: () => new Date(Date.now() + 15 * 60 * 1000) }, // 15 minutes
  createdAt: { type: Date, default: Date.now }
})

// Index pour expiration automatique
PendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const PendingRegistration = mongoose.model('PendingRegistration', PendingRegistrationSchema)
export default PendingRegistration