<template>
  <form class="auth-form" :class="{ 'apocalypse-active': apocalypseMode }" @submit.prevent="submit">
    <h2>Vérification email</h2>

    <p class="verification-info">
      <span v-if="isDeleteAccount">
        Un code de confirmation a été envoyé à <strong>{{ email }}</strong>.<br>
        Saisissez-le ci-dessous pour confirmer la suppression de votre compte.
      </span>
      <span v-else>
        Un code de vérification a été envoyé à <strong>{{ email }}</strong>.<br>
        Saisissez-le ci-dessous pour {{ isEmailChange ? 'finaliser le changement d\'email' : 'finaliser votre inscription' }}.
      </span>
    </p>

    <div class="input-group">
      <input
        id="verification-code"
        type="text"
        v-model="verificationCode"
        placeholder="Code à 6 chiffres"
        maxlength="6"
        @input="validateCode"
        class="code-input"
      />
      <div v-if="codeError" class="field-error">{{ codeError }}</div>
    </div>

    <button type="submit" class="verify-btn" :disabled="!isFormValid || isVerifying">
      {{ isVerifying ? 'Vérification...' : 'Vérifier le code' }}
    </button>

    <div class="verification-actions">
      <ActionButton
        :onClick="resendCode"
        :disabled="isResending || resendCooldown > 0 || isDeleteAccount"
        style="background-color: #6c757d; border-color: #6c757d; font-size: 12px; padding: 6px 12px;"
      >
        {{ resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : (isResending ? 'Envoi...' : 'Renvoyer le code') }}
      </ActionButton>

      <ActionButton
        :onClick="() => emit('back-to-register')"
        style="background-color: #6c757d; border-color: #6c757d; font-size: 12px; padding: 6px 12px;"
      >
        {{ isDeleteAccount ? 'Annuler' : (isEmailChange ? 'Retour aux paramètres' : 'Modifier l\'email') }}
      </ActionButton>
    </div>

    <p class="auth-link" @click="switchToLogin">
      <span class="link-text">Retour à la connexion</span>
    </p>

    <p class="error-text" v-if="message">{{ message }}</p>
  </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiPost } from '@/utils/api'
import ActionButton from '@/components/menu/ActionButton.vue'

const verificationCode = ref('')
const message = ref('')
const codeError = ref('')
const isVerifying = ref(false)
const isResending = ref(false)
const resendCooldown = ref(0)

const emit = defineEmits(['verified', 'back-to-register', 'switch-to-login'])

const props = defineProps({
  email: {
    type: String,
    required: true
  },
  apocalypseMode: {
    type: Boolean,
    default: false
  },
  isEmailChange: {
    type: Boolean,
    default: false
  },
  isDeleteAccount: {
    type: Boolean,
    default: false
  }
})

// Validation du code
function validateCode() {
  const value = verificationCode.value.trim()
  if (!value) {
    codeError.value = ''
    return
  }

  if (!/^\d{6}$/.test(value)) {
    codeError.value = 'Le code doit contenir 6 chiffres'
    return
  }

  codeError.value = ''
}

// Formulaire valide
const isFormValid = computed(() => {
  return verificationCode.value.trim().length === 6 && !codeError.value
})

async function submit() {
  if (!isFormValid.value) return

  try {
    isVerifying.value = true
    message.value = ''

    const endpoint = props.isDeleteAccount 
      ? '/api/user/confirm-delete-account' 
      : (props.isEmailChange ? '/api/auth/user/verify-email-change' : '/api/auth/verify-email')
    
    const res = await apiPost(endpoint, {
      email: props.email,
      verificationCode: verificationCode.value.trim()
    })

    if (props.isDeleteAccount) {
      // Pour la suppression de compte
      if (res.success) {
        emit('account-deleted')
      }
    } else if (props.isEmailChange) {
      // Pour le changement d'email, on reçoit success: true
      if (res.success) {
        emit('verified', { email: props.email })
      }
    } else {
      // Pour l'inscription, on reçoit un token
      if (res.token) {
        emit('verified', res.token)
      }
    }
  } catch (err) {
    let errorMessage = err.message || "Erreur lors de la vérification"

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
    isVerifying.value = false
  }
}

async function resendCode() {
  if (isResending.value || resendCooldown.value > 0) return

  try {
    isResending.value = true
    message.value = ''

    if (props.isDeleteAccount) {
      // Pour la suppression de compte, on ne peut pas renvoyer facilement
      message.value = 'Pour recevoir un nouveau code, veuillez retourner aux paramètres du compte et recommencer le processus.'
      return
    }

    if (props.isEmailChange) {
      // Pour les changements d'email, on ne peut pas renvoyer facilement car on a besoin du mot de passe
      // On demande à l'utilisateur de recommencer le processus
      message.value = 'Pour renvoyer un code, veuillez retourner aux paramètres du compte et ressaisir votre mot de passe.'
      return
    }

    // Créer une nouvelle inscription en attente (ça va remplacer l'ancienne)
    const res = await apiPost('/api/auth/register', {
      username: 'temp', // Ces valeurs seront ignorées car on ne fait que renvoyer
      displayName: 'temp',
      password: 'temp123',
      email: props.email
    })

    if (res.requiresVerification) {
      message.value = 'Un nouveau code a été envoyé à votre adresse email.'
      startResendCooldown()
    }
  } catch (err) {
    let errorMessage = err.message || "Erreur lors de l'envoi du code"

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
    isResending.value = false
  }
}

function startResendCooldown() {
  resendCooldown.value = 30 // 30 secondes
  const interval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(interval)
    }
  }, 1000)
}

function switchToLogin() {
  emit('switch-to-login')
}

onMounted(() => {
  // Focus sur le champ de code
  const codeInput = document.getElementById('verification-code')
  if (codeInput) {
    codeInput.focus()
  }
})
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
  width: 360px;
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

.verification-info {
  text-align: center;
  font-size: 14px;
  color: #ffcc8a;
  line-height: 1.4;
  margin-bottom: 20px;
}

.input-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.code-input {
  text-align: center;
  font-size: 24px !important;
  font-weight: bold;
  letter-spacing: 8px;
  padding: 12px 16px !important;
  max-width: 200px;
  margin: 0 auto;
}

.field-error {
  font-size: 12px;
  color: #ff4757;
  margin-top: 2px;
  font-weight: bold;
  text-align: center;
}

.auth-form button {
  background-color: #7a3e10;
  border: 2px solid #ffc66e;
  color: #fff9e5;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.auth-form button:hover:not(:disabled) {
  background-color: #8a4a1c;
  transform: translateY(-1px);
}

.auth-form button:disabled {
  background-color: #5c2c08;
  color: #bbb;
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
  opacity: 0.7;
  transform: none;
}

.verification-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
}

.auth-link {
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: opacity 0.2s ease;
  text-align: center;
  margin-top: 16px;
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
  color: #ff4757 !important;
  background-color: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 6px;
  padding: 8px 12px;
  font-weight: bold;
  text-align: center;
}

/* Mode APOCALYPSE */
.auth-form.apocalypse-active {
  border-color: #ff0000;
  background-color: #2a0000;
  background-image: linear-gradient(45deg, rgba(255, 0, 0, 0.1) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(255, 0, 0, 0.1) 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, rgba(255, 0, 0, 0.1) 75%),
                    linear-gradient(-45deg, transparent 75%, rgba(255, 0, 0, 0.1) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  animation: apocalypse-pulse 2s ease-in-out infinite alternate;
  box-shadow: 0 0 20px rgba(255, 0, 0, 0.5), 0 4px 10px rgba(0,0,0,0.2);
}

.auth-form.apocalypse-active h2 {
  color: #ff6666;
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
  animation: apocalypse-text-pulse 1.5s ease-in-out infinite alternate;
}

.auth-form.apocalypse-active .verification-info {
  color: #ff8888;
}

@keyframes apocalypse-pulse {
  0% {
    border-color: #ff0000;
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.5), 0 4px 10px rgba(0,0,0,0.2);
  }
  100% {
    border-color: #ff4444;
    box-shadow: 0 0 30px rgba(255, 68, 68, 0.7), 0 4px 10px rgba(0,0,0,0.2);
  }
}

@keyframes apocalypse-text-pulse {
  0% {
    color: #ff6666;
    text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
  }
  100% {
    color: #ffaaaa;
    text-shadow: 0 0 15px rgba(255, 170, 170, 1);
  }
}
</style>