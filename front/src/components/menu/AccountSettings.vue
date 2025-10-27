<template>
  <Popup v-if="visible" @close="emit('close')">
    <h2>Paramètres du compte</h2>

    <div class="settings-section">
      <h3>⚠️ Zone dangereuse</h3>
      <p class="warning-text">
        Attention : Cette action est irréversible. Toutes vos données seront supprimées définitivement.
      </p>

      <ActionButton
        v-if="!showDeleteConfirmation"
        :onClick="() => showDeleteConfirmation = true"
        class="delete-button"
        style="background-color: #dc3545; border-color: #dc3545;"
      >
        🗑️ Supprimer mon compte
      </ActionButton>

      <!-- Confirmation de suppression -->
      <div v-if="showDeleteConfirmation" class="delete-confirmation">
        <p class="confirmation-text">
          Êtes-vous sûr de vouloir supprimer votre compte ?<br>
          Cette action est <strong>irréversible</strong>.
        </p>

        <div class="password-input">
          <label for="delete-password">Confirmez avec votre mot de passe :</label>
          <input
            id="delete-password"
            type="password"
            v-model="deletePassword"
            placeholder="Votre mot de passe"
            @keyup.enter="confirmDelete"
          />
        </div>

        <div class="confirmation-buttons">
          <ActionButton
            :onClick="() => { showDeleteConfirmation = false; deletePassword = '' }"
            style="background-color: #6c757d; border-color: #6c757d;"
          >
            Annuler
          </ActionButton>

          <ActionButton
            :onClick="confirmDelete"
            :disabled="!deletePassword.trim() || isDeleting"
            class="delete-confirm-button"
            style="background-color: #dc3545; border-color: #dc3545;"
          >
            {{ isDeleting ? '🗑️ Suppression...' : '🗑️ Confirmer la suppression' }}
          </ActionButton>
        </div>
      </div>
    </div>
  </Popup>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { apiDelete } from '@/utils/api.js'
import Popup from '@/components/menu/Popup.vue'
import ActionButton from '@/components/menu/ActionButton.vue'
import ToastManager from '@/components/menu/ToastManager.vue'

defineProps({
  visible: Boolean
})

const emit = defineEmits(['close', 'accountDeleted'])

const { logout } = useAuth()
const router = useRouter()

const showDeleteConfirmation = ref(false)
const deletePassword = ref('')
const isDeleting = ref(false)

async function confirmDelete() {
  if (!deletePassword.value.trim()) return

  try {
    isDeleting.value = true

    const result = await apiDelete('/api/user/delete-account', {
      password: deletePassword.value
    })

    if (result.success) {
      // Afficher un toast de succès
      if (window.$toast) {
        window.$toast('Votre compte a été supprimé avec succès', 'success')
      }

      // Déconnexion et redirection vers Auth
      await logout()
      emit('accountDeleted')
      
      // Petite pause pour que le toast soit visible avant la redirection
      setTimeout(() => {
        router.push('/auth')
      }, 1000)
    } else {
      // Afficher un toast d'erreur
      if (window.$toast) {
        window.$toast('Erreur lors de la suppression : ' + (result.error || 'Erreur inconnue'), 'error')
      }
    }
  } catch (error) {
    console.error('Erreur suppression compte:', error)
    // Afficher un toast d'erreur
    if (window.$toast) {
      window.$toast('Erreur lors de la suppression. Vérifiez votre mot de passe.', 'error')
    }
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.settings-section {
  margin-top: 20px;
}

.settings-section h3 {
  color: #ffd700;
  margin-bottom: 10px;
  font-size: 18px;
}

.warning-text {
  color: #ff6b6b;
  font-size: 14px;
  margin-bottom: 15px;
  line-height: 1.4;
}

.delete-button {
  display: block;
  margin: 0 auto;
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
}

.password-input {
  margin-bottom: 15px;
}

.password-input label {
  display: block;
  color: #fff9e5;
  margin-bottom: 5px;
  font-size: 14px;
}

.password-input input {
  width: 100%;
  max-width: 280px;
  padding: 8px;
  border: 2px solid #ffd700;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 14px;
  box-sizing: border-box;
}

.password-input input:focus {
  outline: none;
  border-color: #ff6b35;
}

.confirmation-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.delete-confirm-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>