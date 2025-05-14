<template>
    <div class="auth-view">
      <div class="auth-header" @click="dropEggs">🐔 Chicken Haven</div>
      <div class="auth-forms">
        <RegisterForm @registered="handleRegistered" />
        <LoginForm @logged-in="handleLogin" />
      </div>
    </div>
  
    <div ref="eggContainer" class="falling-eggs-container"></div>
  </template>
  
  
  
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuth } from '@/composables/useAuth'
  import RegisterForm from '@/components/auth/RegisterForm.vue'
  import LoginForm from '@/components/auth/LoginForm.vue'
  
  const router = useRouter()
  const { login } = useAuth()


  const eggContainer = ref(null)

    function dropEggs() {
    for (let i = 0; i < 20; i++) {
        const span = document.createElement('span')
        span.textContent = '🥚'
        span.classList.add('falling-egg')

        // Rotation aléatoire entre -360° et +720°
        const rotateDeg = Math.floor(Math.random() * 1080 - 360) // -360 à 720
        span.style.setProperty('--rotation', `${rotateDeg}deg`)

        // Position, taille, délai
        span.style.left = Math.random() * 100 + 'vw'
        span.style.fontSize = Math.random() * 16 + 16 + 'px'
        span.style.animationDelay = Math.random() * 0.5 + 's'

        eggContainer.value.appendChild(span)

        setTimeout(() => {
        span.remove()
        }, 3000)
    }
    }


  function handleRegistered() {
    console.log("🎉 Inscription réussie")
  }
  
  function handleLogin(token) {
    login(token)
    router.push('/production')
  }
  
  </script>

  <style scoped>
  .auth-view {
    position: relative;
    height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #fef7e0;
    font-family: 'Fredoka', sans-serif;
    overflow: hidden;
  }
  
  .auth-header {
    font-size: 32px;
    font-weight: bold;
    color: #4d2e00;
    margin-bottom: 40px;
    
    text-shadow: 1px 1px 0 #fff;
    user-select: none;
  }
  
  .auth-forms {
    display: flex;
    gap: 60px;
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

  </style>
  