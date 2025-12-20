// user/userSecurity.controller.js
// Gestion de la sécurité utilisateur - Point d'entrée refactorisé

// Re-exports depuis les modules spécialisés
export {
  initiateDeleteAccount,
  confirmDeleteAccount,
  deleteAccount
} from './security/accountOperations.js'

export {
  initiatePasswordChange,
  confirmPasswordChange,
  initiatePasswordReset,
  confirmPasswordReset
} from './security/passwordOperations.js'

export {
  addEmail,
  verifyEmailChange
} from './security/emailOperations.js'
