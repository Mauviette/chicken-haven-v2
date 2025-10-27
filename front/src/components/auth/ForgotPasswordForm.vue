<template>
  <form class="auth-form" @submit.prevent="submit">
    <h2>Mot de passe oublié</h2>

    <!-- Étape 1: Saisie de l'email -->
    <div v-if="!showResetForm">
      <p class="forgot-description">
        Entrez votre adresse email pour recevoir un code de réinitialisation.
      </p>

      <input
        v-model="email"
        type="email"
        placeholder="votre.email@exemple.com"
        required
      />

      <button type="submit" class="forgot-btn">
        {{ isSending ? 'Envoi...' : 'Envoyer le code' }}
      </button>
    </div>

    <!-- Étape 2: Saisie du code et nouveau mot de passe -->
    <div v-if="showResetForm">
      <p class="reset-description">
        Un code de réinitialisation a été envoyé à votre email.
        Entrez le code et votre nouveau mot de passe.
      </p>

      <div class="input-group">
        <label for="reset-code">Code de réinitialisation :</label>
        <input
          id="reset-code"
          v-model="verificationCode"
          type="text"
          placeholder="123456"
          maxlength="6"
          required
        />
      </div>

      <div class="input-group">
        <label for="new-password">Nouveau mot de passe :</label>
        <input
          id="new-password"
          v-model="newPassword"
          type="password"
          placeholder="Au moins 6 caractères"
          required
        />
      </div>

      <button type="button" @click="resetPassword" class="reset-btn">
        {{ isResetting ? 'Réinitialisation...' : 'Réinitialiser le mot de passe' }}
      </button>
    </div>

    <p class="auth-link" @click="$emit('back-to-login')">
      <span class="link-text">Retour à la connexion</span>
    </p>

    <p class="error-text" v-if="message">{{ message }}</p>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { apiPost } from '@/utils/api'

const email = ref('')
const verificationCode = ref('')
const newPassword = ref('')
const message = ref('')
const isSending = ref(false)
const isResetting = ref(false)
const showResetForm = ref(false)

const emit = defineEmits(['back-to-login'])

async function submit() {
  if (!email.value.trim()) return

  try {
    isSending.value = true
    message.value = ''

    const res = await apiPost('/api/auth/forgot-password', {
      email: email.value.trim()
    })

    if (res.success) {
      showResetForm.value = true
      message.value = 'Un code de réinitialisation a été envoyé à votre email'
      window.$toast?.('Un code de réinitialisation a été envoyé à votre email', 'info')
    } else {
      message.value = res.error || 'Erreur lors de l\'envoi du code'
    }
  } catch (err) {
    console.error('Forgot password error:', err)
    let errorMessage = err.message || "Erreur lors de l'envoi du code"

    // Si le message contient "API Error" suivi de JSON, extraire seulement le message d'erreur
    if (errorMessage.includes('API Error') && errorMessage.includes('{"error":')) {
      try {
        const jsonMatch = errorMessage.match(/\{.*\}/)
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0])
          errorMessage = errorData.error || errorMessage
        }
      } catch (parseError) {
        // Garder le message original si le parsing échoue
      }
    }

    message.value = errorMessage
  } finally {
    isSending.value = false
  }
}

async function resetPassword() {
  if (!verificationCode.value.trim() || !newPassword.value.trim()) return

  if (verificationCode.value.length !== 6) {
    message.value = 'Le code doit contenir 6 chiffres'
    return
  }

  if (newPassword.value.length < 6) {
    message.value = 'Le mot de passe doit contenir au moins 6 caractères'
    return
  }

  try {
    isResetting.value = true
    message.value = ''

    const res = await apiPost('/api/auth/reset-password', {
      email: email.value.trim(),
      verificationCode: verificationCode.value.trim(),
      newPassword: newPassword.value.trim()
    })

    if (res.success) {
      message.value = 'Mot de passe réinitialisé avec succès !'
      window.$toast?.('Mot de passe réinitialisé avec succès !', 'success')

      // Rediriger immédiatement vers la connexion
      emit('back-to-login')
    } else {
      message.value = res.error || 'Erreur lors de la réinitialisation'
    }
  } catch (err) {
    console.error('Reset password error:', err)
    let errorMessage = err.message || "Erreur lors de la réinitialisation"

    // Si le message contient "API Error" suivi de JSON, extraire seulement le message d'erreur
    if (errorMessage.includes('API Error') && errorMessage.includes('{"error":')) {
      try {
        const jsonMatch = errorMessage.match(/\{.*\}/)
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0])
          errorMessage = errorData.error || errorMessage
        }
      } catch (parseError) {
        // Garder le message original si le parsing échoue
      }
    }

    message.value = errorMessage
  } finally {
    isResetting.value = false
  }
}
</script>

<style scoped>
.auth-form {
  background-color: #421d00;
  background-image: url('@/assets/bar/bg.png');
  background-repeat: repeat;
  color: #fff8e1;
  border: 3px solid #ffc66e;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  width: 320px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: 'Fredoka', sans-serif;
}

.auth-form h2 {
  margin-bottom: 8px;
  color: #ffeaa7;
  text-align: center;
}

.forgot-description,
.reset-description {
  color: #ffcc8a;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.4;
  text-align: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.input-group label {
  color: #ffeaa7;
  font-size: 14px;
  font-weight: bold;
  text-align: left;
}

.auth-form input {
  padding: 8px 12px;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  font-size: 15px;
  background-color: #fff9e5;
  color: #3a1d00;
}

.auth-form input::placeholder {
  color: #8a6d4d;
}

.forgot-btn,
.reset-btn {
  background-color: #7a3e10;
  border: 2px solid #ffc66e;
  color: #fff9e5;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  transition: background-color 0.2s;
  margin-top: 8px;
}

.forgot-btn:hover,
.reset-btn:hover {
  background-color: #8a4a1c;
}

.auth-link {
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: opacity 0.2s ease;
  text-align: center;
  margin-top: 8px;
}

.auth-link:hover {
  opacity: 0.8;
}

.link-text {
  color: #ffd700;
  font-weight: bold;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.auth-link:hover .link-text {
  color: #ffed4e;
}

.error-text {
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
  margin-top: 8px;
}

/* État désactivé */
.auth-form button:disabled {
  background-color: #5c2c08;
  color: #bbb;
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
  opacity: 0.7;
}

@media (max-width: 480px) {
  .auth-form {
    width: 95vw;
    padding: 20px;
  }
}
</style>