<template>
  <Popup v-if="visible" @close="emit('close')">
    <h2>Paramètres du compte</h2>

    <!-- Section Email -->
    <div class="settings-section">
      <h3>Adresse email</h3>
      
      <!-- Si pas d'email -->
      <div v-if="!userEmail" class="email-section">
        <p class="email-description">
          Ajoutez une adresse email à votre compte pour améliorer sa sécurité.
        </p>
        
        <div v-if="!showAddEmailForm" class="add-email-section">
          <ActionButton
            :onClick="() => showAddEmailForm = true"
            style="background-color: #666; border-color: #666;"
          >
            Ajouter une adresse email
          </ActionButton>
        </div>

        <!-- Formulaire d'ajout d'email -->
        <div v-if="showAddEmailForm" class="add-email-form">
          <!-- Étape 1: Saisie email et mot de passe -->
          <div v-if="!showEmailCodeInput">
            <div class="email-input">
              <label for="email">Adresse email :</label>
              <input
                id="email"
                type="email"
                v-model="newEmail"
                placeholder="votre.email@exemple.com"
                @keyup.enter="addEmail"
              />
            </div>

            <div class="password-input">
              <label for="email-password">Confirmez avec votre mot de passe :</label>
              <input
                id="email-password"
                type="password"
                v-model="emailPassword"
                placeholder="Votre mot de passe"
                @keyup.enter="addEmail"
              />
            </div>

            <div class="email-form-buttons">
              <ActionButton
                :onClick="() => { showAddEmailForm = false; newEmail = ''; emailPassword = '' }"
                style="background-color: #666; border-color: #666;"
              >
                Annuler
              </ActionButton>

              <ActionButton
                :onClick="addEmail"
                :disabled="!newEmail.trim() || !emailPassword.trim() || isAddingEmail"
                style="background-color: #666; border-color: #666;"
              >
                {{ isAddingEmail ? 'Envoi...' : 'Envoyer le code' }}
              </ActionButton>
            </div>
          </div>

          <!-- Étape 2: Saisie du code de vérification -->
          <div v-if="showEmailCodeInput" class="code-input-section">
            <p class="code-instructions">
              Saisissez le code de confirmation envoyé à votre email pour valider l'ajout.
            </p>

            <div class="code-input">
              <label for="email-code">Code de confirmation :</label>
              <input
                id="email-code"
                type="text"
                v-model="emailVerificationCode"
                placeholder="123456"
                maxlength="6"
                @keyup.enter="verifyEmail"
              />
            </div>

            <div class="confirmation-buttons">
              <ActionButton
                :onClick="() => { showEmailCodeInput = false; emailVerificationCode = ''; newEmail = ''; emailPassword = '' }"
                style="background-color: #666; border-color: #666;"
              >
                Annuler
              </ActionButton>

              <ActionButton
                :onClick="verifyEmail"
                :disabled="!emailVerificationCode.trim() || emailVerificationCode.length !== 6 || isVerifyingEmail"
                style="background-color: #666; border-color: #666;"
              >
                {{ isVerifyingEmail ? 'Vérification...' : 'Vérifier' }}
              </ActionButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Si email existant -->
      <div v-else class="email-section">
        <p class="email-description">
          Votre adresse email est associée à votre compte.
        </p>
        
        <div class="email-display">
          <span class="email-label">Email :</span>
          <span class="email-value">
            {{ showEmail ? userEmail : maskEmail(userEmail) }}
          </span>
          <ActionButton
            :onClick="() => showEmail = !showEmail"
            class="show-email-button"
            style="background-color: #666; border-color: #666; font-size: 12px; padding: 4px 8px;"
          >
            {{ showEmail ? 'Masquer' : 'Afficher' }}
          </ActionButton>
        </div>
      </div>
    </div>

    <!-- Section Changement de mot de passe -->
    <div v-if="userEmail" class="settings-section">
      <h3>Changer de mot de passe</h3>
      <p class="password-description">
        Pour changer votre mot de passe, un code de confirmation sera envoyé à votre adresse email.
      </p>

      <ActionButton
        v-if="!showPasswordChangeForm"
        :onClick="() => showPasswordChangeForm = true"
        style="background-color: #666; border-color: #666;"
      >
        Changer mon mot de passe
      </ActionButton>

      <!-- Formulaire de changement de mot de passe -->
      <div v-if="showPasswordChangeForm" class="password-change-form">
        <div v-if="!showPasswordCodeInput">
          <div class="password-input">
            <label for="current-password">Mot de passe actuel :</label>
            <input
              id="current-password"
              type="password"
              v-model="currentPassword"
              placeholder="Votre mot de passe actuel"
            />
          </div>

          <div class="password-input">
            <label for="new-password">Nouveau mot de passe :</label>
            <input
              id="new-password"
              type="password"
              v-model="newPassword"
              placeholder="Votre nouveau mot de passe"
            />
          </div>

          <div class="password-form-buttons">
            <ActionButton
              :onClick="() => { showPasswordChangeForm = false; currentPassword = ''; newPassword = '' }"
              style="background-color: #666; border-color: #666;"
            >
              Annuler
            </ActionButton>

            <ActionButton
              :onClick="initiatePasswordChange"
              :disabled="!currentPassword.trim() || !newPassword.trim() || isInitiatingPasswordChange"
              style="background-color: #666; border-color: #666;"
            >
              {{ isInitiatingPasswordChange ? 'Envoi...' : 'Envoyer le code' }}
            </ActionButton>
          </div>
        </div>

        <!-- Saisie du code de confirmation -->
        <div v-if="showPasswordCodeInput" class="code-input-section">
          <p class="code-instructions">
            Saisissez le code de confirmation envoyé à votre email pour valider le changement de mot de passe.
          </p>

          <div class="code-input">
            <label for="password-code">Code de confirmation :</label>
            <input
              id="password-code"
              type="text"
              v-model="passwordVerificationCode"
              placeholder="123456"
              maxlength="6"
              @keyup.enter="confirmPasswordChange"
            />
          </div>

          <div class="confirmation-buttons">
            <ActionButton
              :onClick="() => { showPasswordCodeInput = false; passwordVerificationCode = ''; currentPassword = ''; newPassword = '' }"
              style="background-color: #666; border-color: #666;"
            >
              Annuler
            </ActionButton>

            <ActionButton
              :onClick="confirmPasswordChange"
              :disabled="!passwordVerificationCode.trim() || passwordVerificationCode.length !== 6 || isChangingPassword"
              style="background-color: #666; border-color: #666;"
            >
              {{ isChangingPassword ? 'Changement...' : 'Confirmer le changement' }}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>Zone dangereuse</h3>
      <p class="warning-text">
        Attention : Cette action est irréversible. Toutes vos données seront supprimées définitivement.
      </p>

      <ActionButton
        v-if="!showDeleteConfirmation"
        :onClick="() => showDeleteConfirmation = true"
        class="delete-button"
        style="background-color: #666; border-color: #666;"
      >
        Supprimer mon compte
      </ActionButton>

      <!-- Confirmation de suppression -->
      <div v-if="showDeleteConfirmation" class="delete-confirmation">
        <p class="confirmation-text">
          Êtes-vous sûr de vouloir supprimer votre compte ?<br>
          Cette action est <strong>irréversible</strong>.
        </p>

        <!-- Si l'utilisateur a un email, utiliser confirmation par email -->
        <div v-if="userEmail" class="email-delete-flow">
          <div v-if="!showDeleteCodeInput">
            <p class="email-instructions">
              Un code de confirmation sera envoyé à votre adresse email pour valider cette action.
            </p>
            
            <div class="confirmation-buttons">
              <ActionButton
                :onClick="() => { showDeleteConfirmation = false }"
                style="background-color: #666; border-color: #666;"
              >
                Annuler
              </ActionButton>

              <ActionButton
                :onClick="initiateDeleteWithEmail"
                :disabled="isInitiatingDelete"
                style="background-color: #666; border-color: #666;"
              >
                {{ isInitiatingDelete ? 'Envoi...' : 'Envoyer le code' }}
              </ActionButton>
            </div>
          </div>

          <!-- Saisie du code de confirmation -->
          <div v-if="showDeleteCodeInput" class="code-input-section">
            <p class="code-instructions">
              Saisissez le code de confirmation envoyé à votre email pour supprimer définitivement votre compte.
            </p>

            <div class="code-input">
              <label for="delete-code">Code de confirmation :</label>
              <input
                id="delete-code"
                type="text"
                v-model="deleteVerificationCode"
                placeholder="123456"
                maxlength="6"
                @keyup.enter="confirmDeleteWithCode"
              />
            </div>

            <div class="confirmation-buttons">
              <ActionButton
                :onClick="() => { showDeleteCodeInput = false; deleteVerificationCode = '' }"
                style="background-color: #666; border-color: #666;"
              >
                Annuler
              </ActionButton>

              <ActionButton
                :onClick="confirmDeleteWithCode"
                :disabled="!deleteVerificationCode.trim() || deleteVerificationCode.length !== 6 || isDeleting"
                style="background-color: #666; border-color: #666;"
              >
                {{ isDeleting ? 'Suppression...' : 'Confirmer la suppression' }}
              </ActionButton>
            </div>
          </div>
        </div>

        <!-- Si pas d'email, utiliser mot de passe -->
        <div v-else class="password-delete-flow">
          <div class="password-input">
            <label for="delete-password">Confirmez avec votre mot de passe :</label>
            <input
              id="delete-password"
              type="password"
              v-model="deletePassword"
              placeholder="Votre mot de passe"
              @keyup.enter="confirmDeleteWithPassword"
            />
          </div>

          <div class="confirmation-buttons">
            <ActionButton
              :onClick="() => { showDeleteConfirmation = false; deletePassword = '' }"
              style="background-color: #666; border-color: #666;"
            >
              Annuler
            </ActionButton>

            <ActionButton
              :onClick="confirmDeleteWithPassword"
              :disabled="!deletePassword.trim() || isDeleting"
              class="delete-confirm-button"
              style="background-color: #666; border-color: #666;"
            >
              {{ isDeleting ? 'Suppression...' : 'Confirmer la suppression' }}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  </Popup>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { usePlayer } from '@/composables/usePlayer'
import { useAccountSecurity } from '@/composables/useAccountSecurity'
import Popup from '@/components/menu/Popup.vue'
import ActionButton from '@/components/menu/ActionButton.vue'

defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'accountDeleted'])

const { logout } = useAuth()
const { player, refreshPlayer } = usePlayer()
const router = useRouter()

// Utilisation du composable de sécurité
const {
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
  addEmail: addEmailApi,
  verifyEmail: verifyEmailApi,
  resetEmailForm,
  initiatePasswordChange: initiatePasswordChangeApi,
  confirmPasswordChange: confirmPasswordChangeApi,
  resetPasswordForm,
  initiateDeleteWithEmail: initiateDeleteApi,
  confirmDeleteWithCode: confirmDeleteCodeApi,
  confirmDeleteWithPassword: confirmDeletePasswordApi,
  resetDeleteForm,
} = useAccountSecurity()

// Données utilisateur
const userEmail = computed(() => player.value?.email || null)

// Wrapper pour verifyEmail avec refreshPlayer
async function verifyEmail() {
  await verifyEmailApi(refreshPlayer)
}

// Wrapper pour addEmail
async function addEmail() {
  await addEmailApi()
}

// Wrapper pour initiatePasswordChange
async function initiatePasswordChange() {
  await initiatePasswordChangeApi()
}

// Wrapper pour confirmPasswordChange
async function confirmPasswordChange() {
  await confirmPasswordChangeApi()
}

// Wrapper pour initiateDeleteWithEmail
async function initiateDeleteWithEmail() {
  await initiateDeleteApi()
}

// Wrapper pour confirmDeleteWithCode avec logout
async function confirmDeleteWithCode() {
  const success = await confirmDeleteCodeApi()
  if (success) {
    emit('close')
    emit('accountDeleted')
    await logout()
    setTimeout(() => {
      router.push('/auth')
    }, 1000)
  }
}

// Wrapper pour confirmDeleteWithPassword avec logout
async function confirmDeleteWithPassword() {
  const success = await confirmDeletePasswordApi()
  if (success) {
    emit('close')
    emit('accountDeleted')
    await logout()
    setTimeout(() => {
      router.push('/auth')
    }, 1000)
  }
}
</script>

<style scoped>
::v-deep(.popup-content) {
  max-width: 600px;
  width: 90vw;
}

.settings-section {
  margin-top: 20px;
}

.settings-section h3 {
  color: #ffeaa7;
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.warning-text {
  color: #ffcc8a;
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.4;
}

.delete-button {
  display: block;
  margin: 0 auto;
  background-color: #dc3545 !important;
  border-color: #dc3545 !important;
  color: #fff !important;
  transition: all 0.2s ease;
}

.delete-button:hover:not(:disabled) {
  background-color: #c82333 !important;
  border-color: #bd2130 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.delete-confirmation {
  background-color: rgba(220, 53, 69, 0.1);
  border: 2px solid #dc3545;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
}

.confirmation-text {
  color: #fff;
  margin-bottom: 15px;
  text-align: center;
  font-weight: bold;
}

.email-instructions {
  color: #ffcc8a;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
  line-height: 1.4;
}

.code-instructions {
  color: #ffcc8a;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
  line-height: 1.4;
}

.code-input {
  margin-bottom: 15px;
}

.code-input label {
  display: block;
  color: #ffeaa7;
  margin-bottom: 8px;
  font-size: 14px;
  text-align: center;
  font-weight: bold;
}

.code-input input {
  width: 100%;
  max-width: 200px;
  padding: 12px 16px;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.95);
  color: #421d00;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
  letter-spacing: 4px;
  box-sizing: border-box;
  margin: 0 auto;
  display: block;
  transition: all 0.2s ease;
}

.code-input input:focus {
  outline: none;
  border-color: #ffaa00;
  box-shadow: 0 0 8px rgba(255, 198, 110, 0.4);
  background-color: #fff;
}

.password-input {
  margin-bottom: 15px;
}

.password-input label {
  display: block;
  color: #ffeaa7;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
}

.password-input input {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.95);
  color: #421d00;
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.password-input input:focus {
  outline: none;
  border-color: #ffaa00;
  box-shadow: 0 0 8px rgba(255, 198, 110, 0.4);
  background-color: #fff;
}

.confirmation-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.delete-confirm-button:disabled {
  opacity: 0.6;  
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
}

/* Styles pour la section email */
.email-section {
  margin-bottom: 20px;
}

.email-description {
  color: #ffcc8a;
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.4;
}

.add-email-section {
  text-align: center;
}

.add-email-form {
  background: linear-gradient(135deg, rgba(122, 62, 16, 0.1), rgba(255, 198, 110, 0.05));
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 20px;
  margin-top: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.email-input {
  margin-bottom: 15px;
}

.email-input label {
  display: block;
  color: #ffeaa7;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
}

.email-input input {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.95);
  color: #421d00;
  font-size: 14px;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.email-input input:focus {
  outline: none;
  border-color: #ffaa00;
  box-shadow: 0 0 8px rgba(255, 198, 110, 0.4);
  background-color: #fff;
}

.email-form-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.email-display {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(122, 62, 16, 0.1), rgba(255, 198, 110, 0.05));
  border: 2px solid #ffc66e;
  border-radius: 8px;
  padding: 12px 18px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.email-label {
  color: #ffeaa7;
  font-size: 14px;
  font-weight: bold;
}

.email-value {
  color: #fff8e1;
  font-family: monospace;
  flex: 1;
  font-weight: bold;
}

.show-email-button {
  margin-left: auto;
  background-color: #7a3e10 !important;
  border-color: #ffc66e !important;
  color: #fff8e1 !important;
  transition: all 0.2s ease;
}

.show-email-button:hover:not(:disabled) {
  background-color: #8a4a1c !important;
  border-color: #ffaa00 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Styles pour la section changement de mot de passe */
.password-description {
  color: #ffcc8a;
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.4;
}

.password-change-form {
  background: linear-gradient(135deg, rgba(122, 62, 16, 0.1), rgba(255, 198, 110, 0.05));
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 20px;
  margin-top: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.password-form-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

/* Amélioration générale des boutons ActionButton */
::v-deep(.action-button) {
  background-color: #7a3e10 !important;
  border-color: #ffc66e !important;
  color: #fff8e1 !important;
  font-weight: bold;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

::v-deep(.action-button:hover:not(:disabled)) {
  background-color: #8a4a1c !important;
  border-color: #ffaa00 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

::v-deep(.action-button:disabled) {
  background-color: #5c2c08 !important;
  border-color: #666 !important;
  color: #bbb !important;
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
  transform: none;
  box-shadow: none;
}
</style>