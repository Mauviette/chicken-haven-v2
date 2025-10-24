<template>
  <div id="app">
    <TopBar v-if="!isAuthPage" 
      @open-profile="toast('Bientôt disponible !')"
      @open-achievements="toggleAchievementsWithSound"
      @open-options="openOptions"
      @close-achievements="closeAchievements"
      @open-mining="() => showMiningGame = true"
      :achievements-open="showAchievements"
    />
    <div class="main-content">
      <router-view />
      <!-- Objets spawnables visibles sur toutes les vues principales -->
      <SpawnableObjects />
      <TeamParade v-if="!isAuthPage" />
    </div>
  <!-- BuffsBar global supprimé: affichage des buffs désormais uniquement dans la vue Production -->
  <LevelUpPopup
    v-if="levelUpVisible"
    :from="levelUpFrom"
    :to="levelUpTo"
    @close="levelUpVisible = false"
  />
    <ToastManager ref="toastManager" :hasBottomBar="!isAuthPage"/>
    <AppLoading />
    <Options :visible="showOptions" @close="showOptions = false" @logout="logout" />
  <AchievementsMenu v-if="!isAuthPage" :visible="showAchievements" @close="showAchievements = false" />
    <BottomBar
      v-if="!isAuthPage"
      @open-production="goProduction"
      @open-market="goMarket"
      @open-collection="goCollection"
      @open-social="goSocial"
      @open-help="toast('Bientôt disponible !')"
      @open-options="openOptions"
      @open-achievements="toggleAchievementsWithSound"
      @open-mining="() => showMiningGame = true"
    />
    <!-- Mining popup global accessible depuis la BottomBar -->
    <MiningGame v-if="showMiningGame && !isAuthPage" @close="showMiningGame = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import ToastManager from '@/components/menu/ToastManager.vue'
import Options from '@/components/menu/Options.vue'
import BottomBar from '@/components/menu/BottomBar.vue'
import MiningGame from '@/components/menu/MiningGame.vue'
import TopBar from '@/components/menu/TopBar.vue'
import TeamParade from '@/components/menu/TeamParade.vue'
import SpawnableObjects from '@/components/SpawnableObjects.vue'
import AchievementsMenu from '@/components/menu/AchievementsMenu.vue'
import LevelUpPopup from '@/components/menu/LevelUpPopup.vue'
import AppLoading from '@/components/menu/AppLoading.vue'
import { getUnlocksBetween } from '@/data/unlocks.js'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { usePlayer } from '@/composables/usePlayer'
import { useDataSync } from '@/composables/useDataSync'
import { useSound } from '@/composables/useSound'
import { useToast } from '@/composables/useToast'
import { useAppLoading } from '@/composables/useAppLoading'
import { useSettings } from '@/composables/useSettings'
import { useChickenGifts } from '@/composables/useChickenGifts'

const router = useRouter()
const toastManager = ref(null)
const showOptions = ref(false)
const showAchievements = ref(false)
const levelUpVisible = ref(false)
const levelUpFrom = ref(1)
const levelUpTo = ref(1)
const showMiningGame = ref(false)
const { logout: performLogout } = useAuth()
const playerComposable = usePlayer()
const { refreshPlayer, fetchTeam } = {
  refreshPlayer: typeof playerComposable.refreshPlayer === 'function' ? playerComposable.refreshPlayer : () => Promise.resolve(),
  fetchTeam: typeof playerComposable.fetchTeam === 'function' ? playerComposable.fetchTeam : () => Promise.resolve()
}
const { syncStatus } = useDataSync()
const soundComposable = useSound()
const { click, open: sndOpen, close: sndClose, toast: toastSound, achievement: sndAchievement } = {
  click: typeof soundComposable.click === 'function' ? soundComposable.click : () => {},
  open: typeof soundComposable.open === 'function' ? soundComposable.open : () => {},
  close: typeof soundComposable.close === 'function' ? soundComposable.close : () => {},
  toast: typeof soundComposable.toast === 'function' ? soundComposable.toast : () => {},
  achievement: typeof soundComposable.achievement === 'function' ? soundComposable.achievement : () => {}
}
const { setToastManager } = useToast()
const { setGameDataLoading, setUserDataLoading, setSettingsLoading } = useAppLoading()
const { settings } = useSettings()
const chickenGiftsComposable = useChickenGifts()
const { startPeriodicCheck } = {
  startPeriodicCheck: typeof chickenGiftsComposable.startPeriodicCheck === 'function' ? chickenGiftsComposable.startPeriodicCheck : () => {}
}

onMounted(async () => {
  window.$toast = toast
  
  // Enregistrer l'instance du ToastManager pour usage global
  if (toastManager.value) {
    setToastManager(toastManager.value)
  }
  
  // Initialiser la synchronisation des données de jeu
  setGameDataLoading(true)
  
  // Charger les données du joueur si connecté
  if (localStorage.getItem('token')) {
    setUserDataLoading(true)
    setSettingsLoading(true)
    
    try {
      await Promise.all([
        refreshPlayer(),
        fetchTeam()
      ])
      setUserDataLoading(false)
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error)
      setUserDataLoading(false)
    }
    
    // Charger les paramètres
    try {
      const { useSettings } = await import('@/composables/useSettings')
      const { fetchSettings } = useSettings()
      await fetchSettings()
      setSettingsLoading(false)
    } catch (error) {
      console.error('Erreur chargement paramètres:', error)
      setSettingsLoading(false)
    }

    // Démarrer la vérification périodique des cadeaux de poules
    startPeriodicCheck()
  } else {
    setUserDataLoading(false)
    setSettingsLoading(false)
  }
  
  setGameDataLoading(false)

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
    // Son de level up
    sndAchievement()
    // Pas de toast ici (demandé)
  }
}


function toast(message, type = 'info') {
  if (toastManager.value?.showToast) {
    toastSound(type)
    toastManager.value.showToast(message, type)
  } else {
    console.warn('Système de pop-ups pas prêt :', message)
  }
}

const route = useRoute()

// Vérifie si la route actuelle est la page de connexion
const isAuthPage = computed(() => route.name === 'Auth')

// Handlers avec sons
function goProduction() {
  click(); router.push('/production')
}
function goMarket() {
  click(); router.push('/market')
}
function goCollection() {
  click(); router.push('/collection')
}
function goSocial() {
  click(); router.push('/social')
}
function openOptions() {
  sndOpen(); showOptions.value = true
}
function toggleAchievementsWithSound() {
  const opening = !showAchievements.value
  showAchievements.value = !showAchievements.value
  opening ? sndOpen() : sndClose()
}
function closeAchievements() {
  showAchievements.value = false
  sndClose()
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  max-height: 100vh;
  cursor: url('@/assets/ui/cursor/hand_point.png') 0 0, auto;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
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
  min-height: 100vh;
  max-height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.main-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 80px; /* espace pour la BottomBar fixe */
  position: relative;
}

/* Ajustements responsifs pour la main-content */
@media (max-width: 768px) {
  .main-content {
    margin-bottom: 0; /* pas de BottomBar sur mobile */
    height: calc(100vh - 60px); /* hauteur TopBar */
    max-height: calc(100vh - 60px);
  }
  
  html, body {
    position: fixed;
    overflow: hidden;
  }
  
  #app {
    height: 100vh;
    max-height: 100vh;
  }
}

@media (max-width: 480px) {
  .main-content {
    margin-bottom: 0; /* pas de BottomBar sur très petits écrans */
    height: calc(100vh - 60px);
    max-height: calc(100vh - 60px);
  }
  
  html, body {
    position: fixed;
    overflow: hidden;
    height: 100vh;
    max-height: 100vh;
  }
}

</style>
