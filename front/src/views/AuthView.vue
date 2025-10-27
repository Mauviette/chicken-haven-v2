<template>
  <div class="auth-view">
    <div class="auth-header" @click="handleTitleClick">🐔 Chicken Haven</div>
    <div class="auth-container">
      <!--div class="auth-tabs">
        <button 
          :class="['tab-btn', { active: isLoginMode }]"
          @click="isLoginMode = true"
        >
          Connexion
        </button>
        <button 
          :class="['tab-btn', { active: !isLoginMode }]"
          @click="isLoginMode = false"
        >
          Inscription
        </button>
      </div-->
      <div class="auth-form-container">
        <LoginForm 
          v-if="isLoginMode" 
          @logged-in="handleLogin" 
          @switch-to-register="isLoginMode = false"
          @switch-to-forgot-password="switchToForgotPassword"
        />
        <RegisterForm 
          v-else-if="!isEmailVerificationMode && !isForgotPasswordMode"
          @registered="handleRegistered" 
          @switch-to-login="isLoginMode = true"
          @auto-login="handleAutoLogin"
          @email-verification-required="handleEmailVerificationRequired"
        />
        <ForgotPasswordForm
          v-else-if="isForgotPasswordMode && !isEmailVerificationMode"
          @back-to-login="backToLogin"
        />
        <EmailVerification
          v-else
          :email="verificationEmail"
          :is-email-change="isEmailChangeMode"
          @verified="handleEmailVerified"
          @back-to-register="isEmailVerificationMode = false"
          @switch-to-login="isLoginMode = true"
        />
      </div>
    </div>
    <div class="version-link" @click="openAnnouncements">
      Version {{ dataVersion || '0.0.2' }}
    </div>
  </div>    <div ref="eggContainer" class="falling-eggs-container"></div>
  </template>
  
  
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { usePlayer } from '@/composables/usePlayer'
import { useGameData } from '@/composables/useGameData'
import RegisterForm from '@/components/auth/RegisterForm.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm.vue'
import EmailVerification from '@/components/auth/EmailVerification.vue'

const router = useRouter()
  const { login } = useAuth()
  const { } = usePlayer()
  const { dataVersion } = useGameData()
  const isLoginMode = ref(true)
  const isEmailVerificationMode = ref(false)
  const isForgotPasswordMode = ref(false)
  const verificationEmail = ref('')
  const isEmailChangeMode = ref(false)
  const eggContainer = ref(null)
  const titleClickCount = ref(0)
  // Apocalypse mode is now immutable after account creation

  function handleTitleClick() {
    titleClickCount.value++
    // Apocalypse mode is now immutable after account creation
    dropEggs()
  }

  // Apocalypse mode is now immutable after account creation

  // Apocalypse mode is now immutable after account creation

  // Apocalypse mode is now immutable after account creation

  function dropEggs() {
    for (let i = 0; i < 20; i++) {
        const span = document.createElement('span')
        span.textContent = '🥚'
        span.classList.add('falling-egg')

        // Rotation aléatoire entre -360° et +720°
        const rotateDeg = Math.floor(Math.random() * 1080 - 360) // -360 à 720
        span.style.setProperty('--rotation', `${rotateDeg}deg`)

        // Position, taille, délai
        const offset = 32 // max taille de l’emoji (en px)
        const maxLeft = window.innerWidth - offset
        const leftPx = Math.random() * maxLeft
        span.style.left = `${leftPx}px`
        span.style.fontSize = Math.random() * 16 + 16 + 'px'
        span.style.animationDelay = Math.random() * 0.5 + 's'

        eggContainer.value.appendChild(span)

        setTimeout(() => {
        span.remove()
        }, 3000)
    }
  }

  function handleRegistered() {
    window.$toast("Inscription réussie ! Vous pouvez maintenant vous connecter.", 'success')
    // Basculer vers le mode login après inscription réussie
    setTimeout(() => {
      isLoginMode.value = true
    }, 1500)
  }
  
  function handleAutoLogin(token) {
    login(token)
    router.push('/production')
    window.$toast("Compte créé et connexion réussie !", 'success')
  }
  
  function handleEmailVerificationRequired(email) {
    verificationEmail.value = email
    isEmailVerificationMode.value = true
    isEmailChangeMode.value = false
    window.$toast("Vérifiez vos emails pour le code de confirmation", 'info')
  }
  
  function handleEmailChangeVerificationRequired(email) {
    verificationEmail.value = email
    isEmailVerificationMode.value = true
    isEmailChangeMode.value = true
    window.$toast("Vérifiez vos emails pour le code de confirmation", 'info')
  }
  
  function handleEmailVerified(result) {
    if (isEmailChangeMode.value) {
      // Pour les changements d'email, result contient { email: string }
      window.$toast("Email ajouté avec succès à votre compte !", 'success')
      // Recharger les données du joueur pour mettre à jour l'email
      const { refreshPlayer } = usePlayer()
      refreshPlayer()
    } else {
      // Pour l'inscription, result est un token
      login(result)
      router.push('/production')
      window.$toast("Email vérifié ! Compte créé avec succès.", 'success')
    }
    
    // Reset state
    isEmailVerificationMode.value = false
    verificationEmail.value = ''
    isEmailChangeMode.value = false
  }
  
  function handleLogin(token) {
    login(token)
    router.push('/production')
    window.$toast("Connexion réussie !", 'success')
  }
  
  function switchToForgotPassword() {
    isLoginMode.value = false
    isForgotPasswordMode.value = true
  }
  
  function backToLogin() {
    isForgotPasswordMode.value = false
    isLoginMode.value = true
  }
  
  function openAnnouncements() {
    window.open('/announcements', '_blank')
  }
  
  onMounted(() => {
    // Écouter les événements de vérification d'email depuis les paramètres du compte
    window.addEventListener('email-verification-required', (event) => {
      handleEmailChangeVerificationRequired(event.detail.email)
    })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('email-verification-required', handleEmailChangeVerificationRequired)
  })
  </script>

  <style scoped>
  .auth-view {
    position: fixed;
    top: 0;
    left: 0;
    min-height: 100vh;
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #fef7e0;
    font-family: 'Fredoka', sans-serif;
    overflow: hidden;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  @media (max-width: 900px) {
    .auth-view {
      padding: 0 10px;
      justify-content: flex-start;
      min-height: 100vh;
      height: auto;
    }
    .auth-header {
      margin-top: 32px;
    }
  }

  @media (max-width: 700px) {
    .auth-view {
      padding: 0 0 32px 0;
      min-height: 100vh;
      height: auto;
      justify-content: flex-start;
    }
    .auth-header {
      font-size: 24px;
      margin-bottom: 24px;
      text-align: center;
      padding: 0 16px;
      margin-top: 24px;
    }
    .auth-container {
      width: 100%;
      padding: 0 8px;
      gap: 12px;
    }
    .auth-form-container {
      min-height: 220px;
      width: 100%;
      padding: 0;
    }
    .version-link {
      bottom: 8px;
      left: 8px;
      font-size: 11px;
    }
  }

  @media (max-width: 480px) {
    .auth-header {
      font-size: 18px;
      margin-bottom: 16px;
      margin-top: 16px;
      padding: 0 4px;
    }
    .auth-container {
      padding: 0 2px;
      gap: 8px;
    }
    .auth-form-container {
      min-height: 160px;
      width: 100%;
      padding: 0;
    }
    .version-link {
      bottom: 4px;
      left: 4px;
      font-size: 10px;
    }
  }
  
  .auth-header {
    font-size: 32px;
    font-weight: bold;
    color: #4d2e00;
    margin-bottom: 40px;
    text-shadow: 1px 1px 0 #fff;
    user-select: none;
    transition: font-size 0.2s, margin 0.2s;
  }

  .auth-header.apocalypse-active {
    color: #ff0000;
    text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000;
    animation: apocalypse-pulse 1s infinite alternate;
  }

  @keyframes apocalypse-pulse {
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
  }
  
  .auth-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    max-width: 420px;
    box-sizing: border-box;
  }
  
  .auth-tabs {
    display: flex;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 4px;
    gap: 4px;
  }
  
  .tab-btn {
    background: transparent;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: 'Fredoka', sans-serif;
    font-size: 16px;
    font-weight: bold;
    color: #6d3c00;
    cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
    transition: all 0.3s ease;
    opacity: 0.7;
  }
  
  .tab-btn.active {
    background-color: #fff;
    color: #4d2e00;
    opacity: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .tab-btn:hover:not(.active) {
    opacity: 0.9;
    background-color: rgba(255, 255, 255, 0.5);
  }
  
  .auth-form-container {
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    box-sizing: border-box;
  }

  .version-link {
    position: absolute;
    bottom: 16px;
    left: 16px;
    font-size: 12px;
    color: #6d3c00;
    cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    user-select: none;
  }

  .version-link:hover {
    opacity: 1;
  }
  </style>

  <style>
    .falling-eggs-container {
      position: fixed;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
    }

    .falling-egg {
      position: absolute;
      top: -40px;
      animation: egg-drop 2.5s linear forwards;
      user-select: none;
      pointer-events: none;
      z-index: 9999;
      transform: rotate(0deg); /* point de départ */
    }

    @keyframes egg-drop {
      to {
          top: 100vh;
          transform: rotate(var(--rotation));
          opacity: 0;
      }
    }

    @media (max-width: 700px) {
      .falling-eggs-container {
        width: 100vw;
        height: 100vh;
      }
    }

    @media (max-width: 480px) {
      .falling-eggs-container {
        width: 100vw;
        height: 100vh;
      }
    }
  </style>
  
  <style>
    .falling-egg {
    position: absolute;
    top: -40px;
    animation: egg-drop 2.5s linear forwards;
    user-select: none;
    pointer-events: none;
    z-index: 9999;
    transform: rotate(0deg); /* point de départ */
    }

    @keyframes egg-drop {
    to {
        top: 100vh;
        transform: rotate(var(--rotation));
        opacity: 0;
    }
    }

    @media (max-width: 700px) {
    .auth-header {
      font-size: 24px;
      margin-bottom: 24px;
      text-align: center;
      padding: 0 16px;
    }

    .auth-container {
      width: 100%;
      padding: 0 16px;
    }
    
    .tab-btn {
      font-size: 14px;
      padding: 10px 20px;
    }
    
    .auth-form-container {
      min-height: 250px;
    }
  }


  </style>
  