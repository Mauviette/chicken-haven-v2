<template>
  <TopBar v-if="!isAuthPage" 
    @open-profile="toast('Bientôt disponible !')"
  />
  <router-view />
  <ToastManager ref="toastManager" :hasBottomBar="!isAuthPage"/>
  <Options :visible="showOptions" @close="showOptions = false" @logout="logout" />
  <BottomBar
    v-if="!isAuthPage"
    @open-production="router.push('/production')"
    @open-market="router.push('/market')"
    @open-collection="router.push('/collection')"
    @open-help="toast('Bientôt disponible !')"
    @open-options="showOptions = true"
  />

</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToastManager from '@/components/menu/ToastManager.vue'
import Options from '@/components/menu/Options.vue'
import BottomBar from '@/components/menu/BottomBar.vue'
import TopBar from '@/components/menu/TopBar.vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const toastManager = ref(null)
const showOptions = ref(false)
const { logout: performLogout } = useAuth()

onMounted(() => {
  window.$toast = toast
})


function logout() {
  try {
    performLogout()
    toast('Déconnexion réussie.', 'success')
    showOptions.value = false
    router.push('/auth')
  } catch (error) {
    console.error('Logout failed:', error)
    toast('Déconnexion échouée.', 'error')
  }
}


function toast(message, type = 'info') {
  if (toastManager.value?.showToast) {
    toastManager.value.showToast(message, type)
  } else {
    console.warn('Système de pop-ups pas prêt :', message)
  }
}

const route = useRoute()

// Vérifie si la route actuelle est la page de connexion
const isAuthPage = computed(() => route.name === 'Auth')
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  cursor: url('@/assets/ui/cursor/hand_point.png') 0 0, auto;
}

a, button, input[type="button"], input[type="submit"], input[type="checkbox"] select, textarea, .pointer {
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

img,
.fence,
.tile,
.fog,
.chicken {
  image-rendering: pixelated;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

</style>
