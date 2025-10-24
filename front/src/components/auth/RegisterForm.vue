<template>
    <form class="auth-form" :class="{ 'apocalypse-active': apocalypseMode }" @submit.prevent="submit">
      <h2>Créer un compte</h2>
      
      <!-- Nom d'utilisateur -->
      <div class="input-group">
        <input 
          v-model="username" 
          placeholder="Nom d'utilisateur" 
          required 
          :class="{ 'input-error': usernameError }"
          @input="validateUsername"
          class="input-with-help-only"
        />
        <Tooltip :text="tooltipInfo.username.html" position="right" :followMouse="false">
          <span class="help-icon" title="Aide">?</span>
        </Tooltip>
        <div v-if="usernameError" class="field-error">{{ usernameError }}</div>
      </div>
      
      <!-- Nom d'affichage -->
      <div class="input-group">
        <input 
          v-model="displayName" 
          placeholder="Nom d'affichage" 
          required 
          :class="{ 'input-error': displayNameError }"
          @input="validateDisplayName"
          class="input-with-help-only"
        />
        <Tooltip :text="tooltipInfo.displayName.html" position="right" :followMouse="false">
          <span class="help-icon" title="Aide">?</span>
        </Tooltip>
        <div v-if="displayNameError" class="field-error">{{ displayNameError }}</div>
      </div>
      
      <!-- Mot de passe -->
      <div class="input-group">
        <input 
          v-model="password" 
          :type="showPassword ? 'text' : 'password'" 
          placeholder="Mot de passe" 
          required 
          :class="{ 'input-error': passwordError }"
          @input="validatePassword"
        />
        <svg 
          v-if="!showPassword" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke-width="1.5" 
          stroke="currentColor" 
          class="eye-icon"
          @mousedown="showPassword = true"
          @mouseup="showPassword = false"
          @mouseleave="showPassword = false"
          @touchstart="showPassword = true"
          @touchend="showPassword = false"
          title="Maintenir pour afficher le mot de passe"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>

        <svg 
          v-else 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke-width="1.5" 
          stroke="currentColor" 
          class="eye-icon"
          @mousedown="showPassword = true"
          @mouseup="showPassword = false"
          @mouseleave="showPassword = false"
          @touchstart="showPassword = true"
          @touchend="showPassword = false"
          title="Maintenir pour afficher le mot de passe"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
        <Tooltip :text="tooltipInfo.password.html" position="right" :followMouse="false">
          <span class="help-icon" title="Aide">?</span>
        </Tooltip>
        <div v-if="passwordError" class="field-error">{{ passwordError }}</div>
      </div>
      
      <!-- Confirmation mot de passe -->
      <div class="input-group">
        <input 
          v-model="confirmPassword" 
          :type="showConfirmPassword ? 'text' : 'password'" 
          placeholder="Confirmer le mot de passe" 
          required 
          :class="{ 'input-error': confirmPasswordError }"
          @input="validateConfirmPassword"
        />
        <svg 
          v-if="!showConfirmPassword" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke-width="1.5" 
          stroke="currentColor" 
          class="eye-icon"
          @mousedown="showConfirmPassword = true"
          @mouseup="showConfirmPassword = false"
          @mouseleave="showConfirmPassword = false"
          @touchstart="showConfirmPassword = true"
          @touchend="showConfirmPassword = false"
          title="Maintenir pour afficher le mot de passe"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
          
        <svg 
          v-else 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke-width="1.5" 
          stroke="currentColor" 
          class="eye-icon"
          @mousedown="showConfirmPassword = true"
          @mouseup="showConfirmPassword = false"
          @mouseleave="showConfirmPassword = false"
          @touchstart="showConfirmPassword = true"
          @touchend="showConfirmPassword = false"
          title="Maintenir pour afficher le mot de passe"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
        <Tooltip :text="tooltipInfo.confirmPassword.html" position="right" :followMouse="false">
          <span class="help-icon" title="Aide">?</span>
        </Tooltip>
        <div v-if="confirmPasswordError" class="field-error">{{ confirmPasswordError }}</div>
      </div>
      
      <button type="submit" class="register-btn" :disabled="!isFormValid">S'inscrire</button>
      <p class="auth-link" @click="switchToLogin">
        Déjà un compte? <span class="link-text">Se connecter</span>
      </p>
      <p class="error-text" v-if="message">{{ message }}</p>
    </form>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { apiPost } from '@/utils/api'
  import Tooltip from '@/components/menu/Tooltip.vue'
  import { containsForbiddenWords } from '@/utils/forbiddenWords.js'
  
  const username = ref('')
  const displayName = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const message = ref('')
  
  // Visibilité des mots de passe
  const showPassword = ref(false)
  const showConfirmPassword = ref(false)
  
  // Erreurs de validation
  const usernameError = ref('')
  const displayNameError = ref('')
  const passwordError = ref('')
  const confirmPasswordError = ref('')
  
  const emit = defineEmits(['registered', 'switch-to-login', 'auto-login'])
  
  const props = defineProps({
    apocalypseMode: {
      type: Boolean,
      default: false
    }
  })
  
  // Variable pour indiquer si la validation asynchrone est en cours
  const validatingForbiddenWords = ref(false)
  
  // Validation du nom d'utilisateur
  async function validateUsername() {
    const value = username.value.trim()
    if (!value) {
      usernameError.value = ''
      return
    }
    
    if (value.length < 3) {
      usernameError.value = 'Minimum 3 caractères'
      return
    }
    
    if (value.length > 20) {
      usernameError.value = 'Maximum 20 caractères'
      return
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      usernameError.value = 'Lettres, chiffres, _ et - uniquement'
      return
    }
    
    // Vérification asynchrone des mots interdits
    try {
      validatingForbiddenWords.value = true
      const hasForbiddenWord = await containsForbiddenWords(value)
      if (hasForbiddenWord) {
        usernameError.value = 'Nom d\'utilisateur non autorisé'
        return
      }
    } catch (error) {
      console.warn('Erreur validation mots interdits:', error)
      // En cas d'erreur, continuer sans bloquer
    } finally {
      validatingForbiddenWords.value = false
    }
    
    usernameError.value = ''
  }
  
  // Validation du nom d'affichage
  async function validateDisplayName() {
    const value = displayName.value.trim()
    if (!value) {
      displayNameError.value = ''
      return
    }
    
    if (value.length < 2) {
      displayNameError.value = 'Minimum 2 caractères'
      return
    }
    
    if (value.length > 30) {
      displayNameError.value = 'Maximum 30 caractères'
      return
    }
    
    if (!/^[a-zA-Z0-9À-ÿ\s_-]+$/.test(value)) {
      displayNameError.value = 'Caractères alphanumériques uniquement'
      return
    }
    
    // Vérification asynchrone des mots interdits
    try {
      validatingForbiddenWords.value = true
      const hasForbiddenWord = await containsForbiddenWords(value)
      if (hasForbiddenWord) {
        displayNameError.value = 'Nom d\'affichage non autorisé'
        return
      }
    } catch (error) {
      console.warn('Erreur validation mots interdits:', error)
      // En cas d'erreur, continuer sans bloquer
    } finally {
      validatingForbiddenWords.value = false
    }
    
    displayNameError.value = ''
  }
  
  // Validation du mot de passe
  function validatePassword() {
    const value = password.value
    if (!value) {
      passwordError.value = ''
      return
    }
    
    if (value.length < 6) {
      passwordError.value = 'Minimum 6 caractères'
      return
    }
    
    if (value.length > 50) {
      passwordError.value = 'Maximum 50 caractères'
      return
    }
    
    passwordError.value = ''
    // Re-valider la confirmation si elle existe
    if (confirmPassword.value) {
      validateConfirmPassword()
    }
  }
  
  // Validation de la confirmation du mot de passe
  function validateConfirmPassword() {
    const value = confirmPassword.value
    if (!value) {
      confirmPasswordError.value = ''
      return
    }
    
    if (value !== password.value) {
      confirmPasswordError.value = 'Les mots de passe ne correspondent pas'
      return
    }
    
    confirmPasswordError.value = ''
  }
  
  // Formulaire valide
  const isFormValid = computed(() => {
    return username.value.trim() && 
           displayName.value.trim() && 
           password.value && 
           confirmPassword.value &&
           !usernameError.value && 
           !displayNameError.value && 
           !passwordError.value && 
           !confirmPasswordError.value
  })
  
  // Données des tooltips
  const tooltipInfo = {
    username: {
      html: `<strong>Nom d'utilisateur</strong><br>
             Votre identifiant unique pour vous connecter au jeu.<br><br>
             <strong>Règles :</strong><br>
             • 3 à 20 caractères<br>
             • Lettres, chiffres, _ et - uniquement<br>
             • Pas d'espaces<br>
             • Doit être unique<br>
             • Ne peut pas être modifié`
    },
    displayName: {
      html: `<strong>Nom d'affichage</strong><br>
             Le nom visible par les autres joueurs dans le jeu.<br><br>
             <strong>Règles :</strong><br>
             • 2 à 30 caractères<br>
             • Lettres, chiffres, espaces, accents autorisés<br>
             • Peut être modifié plus tard<br>
             • Visible dans votre profil et les classements`
    },
    password: {
      html: `<strong>Mot de passe</strong><br>
             Protège l'accès à votre compte. Choisissez un mot de passe fort.<br><br>
             <strong>Règles :</strong><br>
             • 6 à 50 caractères<br>
             • Gardez-le secret !`
    },
    confirmPassword: {
      html: `<strong>Confirmation du mot de passe</strong><br>
             Saisissez à nouveau votre mot de passe pour éviter les erreurs de frappe.<br><br>
             • Doit être identique au mot de passe<br>`
    }
  }
  
  async function submit() {
    // Valider tous les champs avant soumission
    validateUsername()
    validateDisplayName()
    validatePassword()
    validateConfirmPassword()
    
    if (!isFormValid.value) {
      message.value = 'Veuillez corriger les erreurs avant de continuer'
      return
    }
    
    const registerBtn = document.querySelector('.register-btn');
    registerBtn.disabled = true;
    registerBtn.textContent = "Inscription...";

    try {
      const res = await apiPost('/api/auth/register', {
        username: username.value.trim(),
        displayName: displayName.value.trim(),
        password: password.value,
        apocalypse: props.apocalypseMode
      })
      
      // Si on reçoit un token, connecter automatiquement
      if (res.token) {
        emit('auto-login', res.token)
      } else {
        message.value = "Inscription réussie !"
        emit('registered')
      }
    } catch (err) {
      // Essayer d'extraire le message d'erreur du JSON si possible
      let errorMessage = err.message || "Erreur lors de l'inscription"
      
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
    }
    
    registerBtn.disabled = false;
    registerBtn.textContent = "S'inscrire";
  }
  
  function switchToLogin() {
    emit('switch-to-login')
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

.input-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group input {
  padding: 8px 60px 8px 12px;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  font-size: 15px;
  background-color: #fff9e5;
  color: #3a1d00;
  transition: border-color 0.2s ease;
}

.input-group input.input-with-help-only {
  padding: 8px 32px 8px 12px;
}

.input-group input:focus {
  outline: none;
  border-color: #ffaa00;
  box-shadow: 0 0 5px rgba(255, 170, 0, 0.3);
}

.input-group input.input-error {
  border-color: #ff4757;
  background-color: #fff5f5;
}

.auth-form input::placeholder {
  color: #8a6d4d;
}

.help-icon {
  position: absolute;
  right: 6px;
  top: -34px;
  width: 20px;
  height: 20px;
  background: #ffd700;
  color: #421d00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  z-index: 10;
}

.help-icon:hover {
  background: #ffed4e;
}

.eye-icon {
  position: absolute;
  right: 32px;
  top: 10px;
  width: 20px;
  height: 20px;
  stroke: #7a3e10 !important;
  stroke-width: 2.5;
  fill: none;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  z-index: 5;
}

.field-error {
  font-size: 12px;
  color: #ff4757;
  margin-top: 2px;
  font-weight: bold;
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

.auth-form p {
  text-align: center;
  font-size: 14px;
  color: #ffcc8a;
}

.auth-link {
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: opacity 0.2s ease;
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
}

/* Tooltip Modal */
.tooltip-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.tooltip-content {
  background: #fff7dc;
  border: 3px solid #ffc66e;
  border-radius: 16px;
  padding: 20px;
  max-width: 400px;
  width: 90vw;
  color: #421d00;
  font-family: 'Fredoka', sans-serif;
  animation: tooltipAppear 0.3s ease-out;
}

.tooltip-content h3 {
  color: #7a3e10;
  margin: 0 0 12px 0;
  font-size: 18px;
}

.tooltip-content p {
  margin: 0 0 12px 0;
  color: #6d3c00;
  line-height: 1.4;
}

.tooltip-content ul {
  margin: 0 0 16px 0;
  padding-left: 20px;
  color: #6d3c00;
}

.tooltip-content li {
  margin-bottom: 4px;
  line-height: 1.3;
}

.tooltip-content button {
  background: #7a3e10;
  color: #fff9e5;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  padding: 8px 16px;
  font-family: 'Fredoka', sans-serif;
  font-weight: bold;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: background-color 0.2s ease;
  width: 100%;
}

.tooltip-content button:hover {
  background: #8a4a1c;
}

@keyframes tooltipAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 480px) {
  .auth-form {
    width: 95vw;
    padding: 20px;
  }
  
  .tooltip-content {
    width: 95vw;
    padding: 16px;
  }
  
  .help-icon {
    width: 18px;
    height: 18px;
    font-size: 11px;
    right: 4px;
    top: 4px;
  }
  
  .eye-icon {
    right: 26px;
    top: 4px;
    width: 18px;
    height: 18px;
    stroke: #7a3e10 !important;
    stroke-width: 2.5;
    fill: none;
  }
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

.auth-form.apocalypse-active .input-group input {
  border-color: #ff4444;
  background-color: #330000;
  color: #ffaaaa;
}

.auth-form.apocalypse-active .input-group input:focus {
  border-color: #ff6666;
  box-shadow: 0 0 8px rgba(255, 102, 102, 0.4);
}

.auth-form.apocalypse-active .input-group input::placeholder {
  color: #aa6666;
}

.auth-form.apocalypse-active .input-group input.input-error {
  border-color: #ff6666;
  background-color: #440000;
}

.auth-form.apocalypse-active button {
  background-color: #660000;
  border-color: #ff4444;
  color: #ffaaaa;
}

.auth-form.apocalypse-active button:hover:not(:disabled) {
  background-color: #880000;
}

.auth-form.apocalypse-active button:disabled {
  background-color: #440000;
  color: #aa6666;
}

.auth-form.apocalypse-active .auth-link {
  color: #ff8888;
}

.auth-form.apocalypse-active .link-text {
  color: #ffaaaa;
}

.auth-form.apocalypse-active .link-text:hover {
  color: #ffcccc;
}

.auth-form.apocalypse-active .error-text {
  color: #ff6666 !important;
  background-color: rgba(255, 102, 102, 0.1);
  border-color: rgba(255, 102, 102, 0.3);
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
  