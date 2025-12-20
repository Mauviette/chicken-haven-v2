/**
 * Composable pour les opérations de sécurité du compte
 * (email, mot de passe, suppression)
 */

import { ref } from 'vue'
import { apiPost } from '@/utils/api.js'

/**
 * Toast helper
 */
function showToast(message, type = 'info') {
  if (window.$toast) {
    window.$toast(message, type)
  }
}

/**
 * Composable pour les opérations de sécurité du compte
 */
export function useAccountSecurity() {
  // États pour l'email
  const showAddEmailForm = ref(false)
  const newEmail = ref('')
  const emailPassword = ref('')
  const isAddingEmail = ref(false)
  const showEmail = ref(false)
  const showEmailCodeInput = ref(false)
  const emailVerificationCode = ref('')
  const isVerifyingEmail = ref(false)

  // États pour le mot de passe
  const showPasswordChangeForm = ref(false)
  const currentPassword = ref('')
  const newPassword = ref('')
  const passwordVerificationCode = ref('')
  const isInitiatingPasswordChange = ref(false)
  const isChangingPassword = ref(false)
  const showPasswordCodeInput = ref(false)

  // États pour la suppression
  const showDeleteConfirmation = ref(false)
  const deletePassword = ref('')
  const deleteVerificationCode = ref('')
  const isDeleting = ref(false)
  const isInitiatingDelete = ref(false)
  const showDeleteCodeInput = ref(false)

  /**
   * Masque un email pour l'affichage
   */
  function maskEmail(email) {
    if (!email) return ''
    const [localPart, domain] = email.split('@')
    if (localPart.length <= 2) return '*'.repeat(localPart.length) + '@' + domain
    return localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1] + '@' + domain
  }

  /**
   * Ajoute un email au compte
   */
  async function addEmail() {
    if (!newEmail.value.trim() || !emailPassword.value.trim() || isAddingEmail.value) return false

    try {
      isAddingEmail.value = true

      const result = await apiPost('/api/auth/user/add-email', {
        email: newEmail.value.trim(),
        password: emailPassword.value,
      })

      if (result.requiresVerification) {
        showEmailCodeInput.value = true
        showToast('Un code de vérification a été envoyé à votre email', 'info')
        return true
      } else {
        showToast('Erreur lors de l\'ajout de l\'email : ' + (result.error || 'Erreur inconnue'), 'error')
        return false
      }
    } catch (error) {
      console.error('Erreur ajout email:', error)
      showToast('Erreur lors de l\'ajout de l\'email. Vérifiez vos informations.', 'error')
      return false
    } finally {
      isAddingEmail.value = false
    }
  }

  /**
   * Vérifie le code de confirmation email
   */
  async function verifyEmail(refreshPlayerFn) {
    if (!emailVerificationCode.value.trim() || emailVerificationCode.value.length !== 6) return false

    try {
      isVerifyingEmail.value = true

      const result = await apiPost('/api/auth/user/verify-email-change', {
        email: newEmail.value.trim(),
        verificationCode: emailVerificationCode.value.trim(),
      })

      if (result.success) {
        await refreshPlayerFn?.()
        resetEmailForm()
        showToast('Votre email a été ajouté avec succès', 'success')
        return true
      } else {
        showToast('Erreur lors de la vérification : ' + (result.error || 'Erreur inconnue'), 'error')
        return false
      }
    } catch (error) {
      console.error('Erreur vérification email:', error)
      showToast('Code de vérification invalide ou expiré', 'error')
      return false
    } finally {
      isVerifyingEmail.value = false
    }
  }

  /**
   * Réinitialise le formulaire d'email
   */
  function resetEmailForm() {
    showAddEmailForm.value = false
    showEmailCodeInput.value = false
    newEmail.value = ''
    emailPassword.value = ''
    emailVerificationCode.value = ''
  }

  /**
   * Initie le changement de mot de passe
   */
  async function initiatePasswordChange() {
    if (!currentPassword.value.trim() || !newPassword.value.trim()) return false

    try {
      isInitiatingPasswordChange.value = true

      const result = await apiPost('/api/user/initiate-password-change', {
        currentPassword: currentPassword.value.trim(),
        newPassword: newPassword.value.trim(),
      })

      if (result.success) {
        showPasswordCodeInput.value = true
        showToast('Un code de confirmation a été envoyé à votre email', 'info')
        return true
      } else {
        showToast('Erreur lors de l\'envoi du code : ' + (result.error || 'Erreur inconnue'), 'error')
        return false
      }
    } catch (error) {
      console.error('Erreur initiation changement mot de passe:', error)
      showToast('Erreur lors de l\'envoi du code de confirmation', 'error')
      return false
    } finally {
      isInitiatingPasswordChange.value = false
    }
  }

  /**
   * Confirme le changement de mot de passe
   */
  async function confirmPasswordChange() {
    if (!passwordVerificationCode.value.trim() || passwordVerificationCode.value.length !== 6) return false

    try {
      isChangingPassword.value = true

      const result = await apiPost('/api/user/confirm-password-change', {
        verificationCode: passwordVerificationCode.value.trim(),
      })

      if (result.success) {
        resetPasswordForm()
        showToast('Votre mot de passe a été changé avec succès', 'success')
        return true
      } else {
        showToast('Erreur lors du changement : ' + (result.error || 'Erreur inconnue'), 'error')
        return false
      }
    } catch (error) {
      console.error('Erreur confirmation changement mot de passe:', error)
      showToast('Code de vérification invalide ou expiré', 'error')
      return false
    } finally {
      isChangingPassword.value = false
    }
  }

  /**
   * Réinitialise le formulaire de mot de passe
   */
  function resetPasswordForm() {
    showPasswordChangeForm.value = false
    showPasswordCodeInput.value = false
    currentPassword.value = ''
    newPassword.value = ''
    passwordVerificationCode.value = ''
  }

  /**
   * Initie la suppression avec confirmation email
   */
  async function initiateDeleteWithEmail() {
    try {
      isInitiatingDelete.value = true

      const result = await apiPost('/api/user/initiate-delete-account')

      if (result.success) {
        showDeleteCodeInput.value = true
        showToast('Un code de confirmation a été envoyé à votre email', 'info')
        return true
      } else {
        showToast('Erreur lors de l\'envoi du code : ' + (result.error || 'Erreur inconnue'), 'error')
        return false
      }
    } catch (error) {
      console.error('Erreur initiation suppression:', error)
      showToast('Erreur lors de l\'envoi du code de confirmation', 'error')
      return false
    } finally {
      isInitiatingDelete.value = false
    }
  }

  /**
   * Confirme la suppression avec code email
   */
  async function confirmDeleteWithCode() {
    if (!deleteVerificationCode.value.trim() || deleteVerificationCode.value.length !== 6) return false

    try {
      isDeleting.value = true

      const result = await apiPost('/api/user/confirm-delete-account', {
        verificationCode: deleteVerificationCode.value.trim(),
      })

      if (result.success) {
        showToast('Votre compte a été supprimé avec succès', 'success')
        return true
      } else {
        showToast('Erreur lors de la suppression : ' + (result.error || 'Erreur inconnue'), 'error')
        return false
      }
    } catch (error) {
      console.error('Erreur confirmation suppression:', error)
      showToast('Code de vérification invalide ou expiré', 'error')
      return false
    } finally {
      isDeleting.value = false
    }
  }

  /**
   * Confirme la suppression avec mot de passe
   */
  async function confirmDeleteWithPassword() {
    if (!deletePassword.value.trim()) return false

    try {
      isDeleting.value = true

      const result = await apiPost('/api/user/delete-account', {
        password: deletePassword.value.trim(),
      })

      if (result.success) {
        showToast('Votre compte a été supprimé avec succès', 'success')
        return true
      } else {
        showToast('Erreur lors de la suppression : ' + (result.error || 'Erreur inconnue'), 'error')
        return false
      }
    } catch (error) {
      console.error('Erreur suppression avec mot de passe:', error)
      showToast('Mot de passe incorrect ou erreur lors de la suppression', 'error')
      return false
    } finally {
      isDeleting.value = false
    }
  }

  /**
   * Réinitialise le formulaire de suppression
   */
  function resetDeleteForm() {
    showDeleteConfirmation.value = false
    showDeleteCodeInput.value = false
    deletePassword.value = ''
    deleteVerificationCode.value = ''
  }

  return {
    // États email
    showAddEmailForm,
    newEmail,
    emailPassword,
    isAddingEmail,
    showEmail,
    showEmailCodeInput,
    emailVerificationCode,
    isVerifyingEmail,

    // États mot de passe
    showPasswordChangeForm,
    currentPassword,
    newPassword,
    passwordVerificationCode,
    isInitiatingPasswordChange,
    isChangingPassword,
    showPasswordCodeInput,

    // États suppression
    showDeleteConfirmation,
    deletePassword,
    deleteVerificationCode,
    isDeleting,
    isInitiatingDelete,
    showDeleteCodeInput,

    // Méthodes
    maskEmail,
    addEmail,
    verifyEmail,
    resetEmailForm,
    initiatePasswordChange,
    confirmPasswordChange,
    resetPasswordForm,
    initiateDeleteWithEmail,
    confirmDeleteWithCode,
    confirmDeleteWithPassword,
    resetDeleteForm,
  }
}
