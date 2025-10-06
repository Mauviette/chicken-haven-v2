<template>
    <form class="auth-form" @submit.prevent="submit">
      <h2>Créer un compte</h2>
      
      <!-- Nom d'utilisateur -->
      <div class="input-group">
        <input 
          v-model="username" 
          placeholder="Nom d'utilisateur" 
          required 
          :class="{ 'input-error': usernameError }"
          @input="validateUsername"
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
          type="password" 
          placeholder="Mot de passe" 
          required 
          :class="{ 'input-error': passwordError }"
          @input="validatePassword"
        />
        <Tooltip :text="tooltipInfo.password.html" position="right" :followMouse="false">
          <span class="help-icon" title="Aide">?</span>
        </Tooltip>
        <div v-if="passwordError" class="field-error">{{ passwordError }}</div>
      </div>
      
      <!-- Confirmation mot de passe -->
      <div class="input-group">
        <input 
          v-model="confirmPassword" 
          type="password" 
          placeholder="Confirmer le mot de passe" 
          required 
          :class="{ 'input-error': confirmPasswordError }"
          @input="validateConfirmPassword"
        />
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
  import axios from 'axios'
  import Tooltip from '@/components/menu/Tooltip.vue'
  
  const username = ref('')
  const displayName = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const message = ref('')
  
  // Erreurs de validation
  const usernameError = ref('')
  const displayNameError = ref('')
  const passwordError = ref('')
  const confirmPasswordError = ref('')
  
  const emit = defineEmits(['registered', 'switch-to-login', 'auto-login'])
  
  // Mots interdits
  const forbiddenWords = [
    'admin', 'moderator', 'mod', 'bot', 'system', 'null', 'undefined', 'test',
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'sex', 'porn',
    'nazi', 'hitler', 'terrorist', 'suicide', 'kill', 'death', 'murder'
  ]
  
  // Validation du nom d'utilisateur
  function validateUsername() {
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
    
    if (forbiddenWords.some(word => value.toLowerCase().includes(word))) {
      usernameError.value = 'Nom d\'utilisateur non autorisé'
      return
    }
    
    usernameError.value = ''
  }
  
  // Validation du nom d'affichage
  function validateDisplayName() {
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
    
    if (forbiddenWords.some(word => value.toLowerCase().includes(word))) {
      displayNameError.value = 'Nom d\'affichage non autorisé'
      return
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
    
    if (!/(?=.*[a-z])/.test(value)) {
      passwordError.value = 'Au moins une minuscule requise'
      return
    }
    
    if (!/(?=.*[A-Z])/.test(value)) {
      passwordError.value = 'Au moins une majuscule requise'
      return
    }
    
    if (!/(?=.*\d)/.test(value)) {
      passwordError.value = 'Au moins un chiffre requis'
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
             • 6 à 50 caractères minimum<br>
             • Au moins une minuscule (a-z)<br>
             • Au moins une majuscule (A-Z)<br>
             • Au moins un chiffre (0-9)<br>
             • Gardez-le secret !`
    },
    confirmPassword: {
      html: `<strong>Confirmation du mot de passe</strong><br>
             Saisissez à nouveau votre mot de passe pour éviter les erreurs de frappe.<br><br>
             <strong>Règles :</strong><br>
             • Doit être identique au mot de passe<br>
             • Vérification de sécurité`
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
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, {
        username: username.value.trim(),
        displayName: displayName.value.trim(),
        password: password.value
      })
      
      // Si on reçoit un token, connecter automatiquement
      if (res.data.token) {
        emit('auto-login', res.data.token)
      } else {
        message.value = "Inscription réussie !"
        emit('registered')
      }
    } catch (err) {
      message.value = err.response?.data?.error || "Erreur lors de l'inscription"
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
  padding: 8px 35px 8px 12px;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  font-size: 15px;
  background-color: #fff9e5;
  color: #3a1d00;
  transition: border-color 0.2s ease;
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
  right: 10px;
  top: 10px;
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
  transition: all 0.2s ease;
  z-index: 10;
}

.help-icon:hover {
  background: #ffed4e;
  transform: scale(1.1);
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
    right: 8px;
    top: 9px;
  }
}
  </style>
  