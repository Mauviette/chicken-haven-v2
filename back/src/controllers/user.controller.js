// controllers/user.controller.js
// Point d'entrée principal - réexporte les sous-modules pour compatibilité
// 
// Structure modulaire:
// - user/userProfile.controller.js    - Profil, avatar, displayName
// - user/userArtifacts.controller.js  - Gestion des artefacts
// - user/userSecurity.controller.js   - Mots de passe, email, suppression compte

// Réexporter les fonctions de profil
export {
  getBuffs,
  updateAvatar,
  getMe,
  getPublicProfile,
  updateDisplayName,
  ensureProfileId
} from './user/userProfile.controller.js'

// Réexporter les fonctions d'artefacts
export {
  getArtifacts,
  getArtifactSlots,
  equipArtifact,
  unequipArtifact
} from './user/userArtifacts.controller.js'

// Réexporter les fonctions de sécurité
export {
  initiateDeleteAccount,
  confirmDeleteAccount,
  initiatePasswordChange,
  confirmPasswordChange,
  deleteAccount,
  addEmail,
  verifyEmailChange,
  initiatePasswordReset,
  confirmPasswordReset
} from './user/userSecurity.controller.js'
