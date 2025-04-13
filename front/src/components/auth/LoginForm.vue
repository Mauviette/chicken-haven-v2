<template>
    <form class="auth-form" @submit.prevent="submit">
      <h2>Connexion</h2>
      <input v-model="username" placeholder="Nom d'utilisateur" required />
      <input v-model="password" type="password" placeholder="Mot de passe" required />
      <button type="submit">Se connecter</button>
      <p v-if="message">{{ message }}</p>
    </form>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import axios from 'axios'
  
  const username = ref('')
  const password = ref('')
  const message = ref('')
  
  const emit = defineEmits(['logged-in'])
  
  async function submit() {
    try {
      const res = await axios.post('http://localhost:3001/api/auth/login', {
        username: username.value,
        password: password.value
      })
      emit('logged-in', res.data.token)
      window.$toast("Connexion réussie!", 'success')
    } catch (err) {
      console.log(err)
      message.value = err.response?.data?.error || "Erreur de connexion"
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
  width: 280px;
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

.auth-form p {
  text-align: center;
  font-size: 14px;
  color: #ffcc8a;
}

  </style>
  