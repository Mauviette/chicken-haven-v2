<template>
  <div id="app">
    <TopBar v-if="!isAuthPage" 
      @open-profile="toast('Bientôt disponible !')"
    />
    <router-view />
  <TeamParade v-if="!isAuthPage" />
  <LevelUpPopup
    v-if="levelUpVisible"
    :from="levelUpFrom"
    :to="levelUpTo"
    @close="levelUpVisible = false"
  />
    <ToastManager ref="toastManager" :hasBottomBar="!isAuthPage"/>
    <Options :visible="showOptions" @close="showOptions = false" @logout="logout" />
  <AchievementsMenu v-if="!isAuthPage" :visible="showAchievements" @close="showAchievements = false" />
    <BottomBar
      v-if="!isAuthPage"
      @open-production="router.push('/production')"
      @open-market="router.push('/market')"
      @open-collection="router.push('/collection')"
      @open-help="toast('Bientôt disponible !')"
      @open-options="showOptions = true"
      @open-achievements="toggleAchievements"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToastManager from '@/components/menu/ToastManager.vue'
import Options from '@/components/menu/Options.vue'
import BottomBar from '@/components/menu/BottomBar.vue'
import TopBar from '@/components/menu/TopBar.vue'
import TeamParade from '@/components/menu/TeamParade.vue'
import AchievementsMenu from '@/components/menu/AchievementsMenu.vue'
import LevelUpPopup from '@/components/menu/LevelUpPopup.vue'
import { getUnlocksBetween } from '@/data/unlocks.js'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { usePlayer } from '@/composables/usePlayer'
import { useDataSync } from '@/composables/useDataSync'

const router = useRouter()
const toastManager = ref(null)
const showOptions = ref(false)
const showAchievements = ref(false)
const levelUpVisible = ref(false)
const levelUpFrom = ref(1)
const levelUpTo = ref(1)
const { logout: performLogout } = useAuth()
const { refreshPlayer, fetchTeam } = usePlayer()
const { syncStatus } = useDataSync()

onMounted(async () => {
  window.$toast = toast
  
  // Initialiser la synchronisation des données de jeu
  console.log('🔄 Initialisation de la synchronisation des données...')
  
  // Charger les données du joueur si connecté
  if (localStorage.getItem('token')) {
    await refreshPlayer()
    await fetchTeam()
  }

  // Écoute de l'événement global level-up
  try {
    window.addEventListener('level-up', onLevelUp)
  } catch (_) {}
})

onBeforeUnmount(() => {
  try { window.removeEventListener('level-up', onLevelUp) } catch (_) {}
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

function toggleAchievements() {
  showAchievements.value = !showAchievements.value
}

function onLevelUp(e) {
  const { from, to } = e?.detail || {}
  if (typeof from === 'number' && typeof to === 'number' && to > from) {
    levelUpFrom.value = from
    levelUpTo.value = to
    levelUpVisible.value = true
    // Pas de toast ici (demandé)
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
