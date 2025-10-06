  <template>
    <form class="auth-form" @submit.prevent="submit">
      <h2>Connexion</h2>
      <input v-model="username" placeholder="Nom d'utilisateur" required />
      <div class="input-group">
        <input 
          v-model="password" 
          :type="showPassword ? 'text' : 'password'" 
          placeholder="Mot de passe" 
          required 
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
      </div>
      <button type="submit" class="login-btn">Se connecter</button>
      <p class="auth-link" @click="switchToRegister">
        Pas de compte? <span class="link-text">S'inscrire</span>
      </p>
      <p class="error-text" v-if="message">{{ message }}</p>
    </form>
  </template>  <script setup>
  import { ref } from 'vue'
  import axios from 'axios'
  
  const username = ref('')
  const password = ref('')
  const message = ref('')
  
  // Visibilité du mot de passe
  const showPassword = ref(false)
  
  const emit = defineEmits(['logged-in', 'switch-to-register'])
  
  async function submit() {
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.disabled = true;
    loginBtn.textContent = "Connexion...";
    
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        username: username.value,
        password: password.value
      })
      emit('logged-in', res.data.token)
      //toast("Connexion réussie!", 'success')
    } catch (err) {
      console.log(err)
      message.value = err.response?.data?.error || "Erreur de connexion"
    }

    loginBtn.disabled = false;
    loginBtn.textContent = "Se connecter";
  }
  
  function switchToRegister() {
    emit('switch-to-register')
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

.auth-form input {
  padding: 8px 12px;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  font-size: 15px;
  background-color: #fff9e5;
  color: #3a1d00;
}

.input-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-group input {
  padding: 8px 40px 8px 12px;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  font-size: 15px;
  background-color: #fff9e5;
  color: #3a1d00;
}

.eye-icon {
  position: absolute;
  right: 12px;
  top: 6px;
  width: 20px;
  height: 20px;
  stroke: #7a3e10 !important;
  stroke-width: 2.5;
  fill: none;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  z-index: 5;
}

.auth-form input::placeholder {
  color: #8a6d4d;
}

.auth-form button {
  background-color: #7a3e10;
  border: 2px solid #ffc66e;
  color: #fff9e5;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  transition: background-color 0.2s;
}

.auth-form button:hover {
  background-color: #8a4a1c;
}

  /* État désactivé */
  .auth-form button:disabled {
    background-color: #5c2c08;
    color: #bbb;  
    cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
    opacity: 0.7;
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

@media (max-width: 480px) {
  .auth-form {
    width: 95vw;
    padding: 20px;
  }
  
  .eye-icon {
    right: 10px;
    top: 4px;
    width: 18px;
    height: 18px;
    stroke: #7a3e10 !important;
    stroke-width: 2.5;
    fill: none;
  }
}

  </style>
