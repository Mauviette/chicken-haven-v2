<template>
  <div id="app" :class="{ 'apocalypse-mode': isApocalypseMode, 'announcements-page': isAnnouncementsPage }">
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
      <!-- Objets spawnables visibles sur toutes les vues principales sauf auth et announcements -->
      <SpawnableObjects v-if="!isAuthPage && !isAnnouncementsPage" />
      <TeamParade v-if="!isAuthPage && !isAnnouncementsPage" />
    </div>
  <!-- BuffsBar global supprimé: affichage des buffs désormais uniquement dans la vue Production -->
  <LevelUpPopup
    v-if="levelUpVisible && !isAnnouncementsPage"
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
    <UpdatePopup
      v-if="updatePopupVisible && currentUpdateAnnouncement && !isAnnouncementsPage"
      :announcement="currentUpdateAnnouncement"
      @close="closeUpdatePopup"
    />
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
import UpdatePopup from '@/components/menu/UpdatePopup.vue'
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
import { provideApocalypse } from '@/composables/useApocalypse'
import { apiGet } from '@/utils/api'

const router = useRouter()
const toastManager = ref(null)
const showOptions = ref(false)
const showAchievements = ref(false)
const levelUpVisible = ref(false)
const levelUpFrom = ref(1)
const levelUpTo = ref(1)
const showMiningGame = ref(false)
const updatePopupVisible = ref(false)
const currentUpdateAnnouncement = ref(null)
const { logout: performLogout } = useAuth()
const playerComposable = usePlayer() || {}
const refreshPlayer = playerComposable.refreshPlayer || (() => Promise.resolve())
const fetchTeam = playerComposable.fetchTeam || (() => Promise.resolve())
const dataSyncComposable = useDataSync() || {}
const syncStatus = dataSyncComposable.syncStatus || 'idle'
const soundComposable = useSound() || {}
const click = soundComposable.click || (() => {})
const sndOpen = soundComposable.open || (() => {})
const sndClose = soundComposable.close || (() => {})
const toastSound = soundComposable.toast || (() => {})
const sndAchievement = soundComposable.achievement || (() => {})
const toastComposable = useToast() || {}
const setToastManager = toastComposable.setToastManager || (() => {})
const appLoadingComposable = useAppLoading() || {}
const setGameDataLoading = appLoadingComposable.setGameDataLoading || (() => {})
const setUserDataLoading = appLoadingComposable.setUserDataLoading || (() => {})
const setSettingsLoading = appLoadingComposable.setSettingsLoading || (() => {})
const settingsComposable = useSettings() || {}
const settings = settingsComposable.settings || ref({})
const chickenGiftsComposable = useChickenGifts() || {}
const startPeriodicCheck = chickenGiftsComposable.startPeriodicCheck || (() => {})

// Fournir l'état apocalypse à tous les composants enfants
const { isApocalypseMode } = provideApocalypse()

onMounted(async () => {
  window.$toast = toast
  
  // Enregistrer l'instance du ToastManager pour usage global
  if (toastManager.value) {
    setToastManager(toastManager.value)
  }
  
  // Initialiser la synchronisation des données de jeu
  setGameDataLoading(true)
  
  // Charger les données du joueur si connecté
  const token = localStorage.getItem('token')
  if (token) {
    setUserDataLoading(true)
    setSettingsLoading(true)
    
    try {
      await Promise.all([
        refreshPlayer(),
        fetchTeam()
      ])
      setUserDataLoading(false)
      
      // Vérifier les mises à jour après le chargement du joueur
      //console.log('👤 Données joueur chargées, vérification des mises à jour...')
      await checkForUpdates()
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
    window.addEventListener('show-update-popup', onShowUpdatePopup)
  } catch (_) {}
})

onBeforeUnmount(() => {
  try {
    window.removeEventListener('level-up', onLevelUp)
    window.removeEventListener('show-update-popup', onShowUpdatePopup)
  } catch (_) {}
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

function onShowUpdatePopup(e) {
  const announcement = e?.detail
  if (announcement) {
    currentUpdateAnnouncement.value = announcement
    updatePopupVisible.value = true
  }
}

function closeUpdatePopup() {
  updatePopupVisible.value = false
  currentUpdateAnnouncement.value = null
}

// Fonction pour vérifier les mises à jour
async function checkForUpdates() {
  try {
    // Récupérer la dernière version vue par le joueur
    let lastSeenVersion = localStorage.getItem('lastSeenVersion') || '0.0.0'
    
    // Récupérer la liste des annonces
    const announcements = await apiGet('/api/announcements')
    
    if (announcements && announcements.length > 0) {
      // Prendre la première annonce (la plus récente)
      const latestAnnouncement = announcements[0]
      
      // Comparer les versions
      const comparison = compareVersions(latestAnnouncement.version, lastSeenVersion)
      
      // Afficher la popup si :
      // 1. Nouvelle version supérieure à l'ancienne (comparison > 0)
      // 2. OU si l'ancienne version semble invalide/ancienne et qu'on a une annonce récente
      const shouldShowPopup = comparison > 0 || (lastSeenVersion === '0.0.0' && latestAnnouncement.version !== '0.0.0')
      
      if (shouldShowPopup) {
        // Nouvelle version disponible, afficher la popup
        currentUpdateAnnouncement.value = latestAnnouncement
        updatePopupVisible.value = true
        
        // Mettre à jour la dernière version vue
        localStorage.setItem('lastSeenVersion', latestAnnouncement.version)
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des mises à jour:', error)
  }
}

// Fonction utilitaire pour comparer les versions
function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  
  return 0
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

// Vérifie si la route actuelle est la page de connexion ou une page publique
const isAuthPage = computed(() => route.name === 'Auth' || route.name === 'Announcements' || route.name === 'AnnouncementDetail')

// Vérifie si la route actuelle est une page d'annonces
const isAnnouncementsPage = computed(() => route.name === 'Announcements' || route.name === 'AnnouncementDetail')

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
/* Variables CSS pour les couleurs du thème */
:root {
  /* Couleurs normales */
  --bg-primary: #f9f3e8;
  --bg-secondary: #fffaf1;
  --bg-tertiary: #3d1f1f;
  --bg-header: #f6e4c3;
  --bg-menu: #421d00;
  --bg-overlay: rgba(255, 255, 255, 0.8);
  --bg-achievement: rgba(255, 255, 255, 0.9);
  --text-primary: #4b2e06;
  --text-secondary: #ffaaaa;
  --text-accent: #ffcccc;
  --text-header: #6d3c00;
  --text-menu: #fff9e5;
  --text-achievement: #8B4513;
  --border-primary: #ffc66e;
  --border-secondary: #ff4444;
  --border-tertiary: #ffd99a;
  --border-menu: #8B4513;
  --button-bg: #7a3e10;
  --button-hover: #8a4a1c;
  --button-text: #fff9e5;
  --level-bg: #e6f3ff;
  --level-border: #8bb4d6;
  --level-text: #234;
  --error-bg: #fff5f5;
  --error-border: #ff6b6b;
  --error-text: #ff6b6b;
  --success-bg: #2e8b57;
  --success-border: #90ee90;
  --cancel-bg: #cd5c5c;
  --cancel-border: #ffa07a;
  --progress-bg: #e0e0e0;
  --progress-border: #ccc;
  --progress-fill: linear-gradient(90deg, #4CAF50, #8BC34A);
  --reward-bg: rgba(255, 215, 0, 0.2);
  --reward-border: #FFD700;
  --reward-claimed-bg: rgba(76, 175, 80, 0.2);
  --reward-claimed-border: #4CAF50;
  --shadow-primary: rgba(0, 0, 0, 0.05);
  --shadow-secondary: rgba(139, 69, 19, 0.1);
  --shadow-tertiary: rgba(0, 0, 0, 0.15);
}

.apocalypse-mode {
  /* Couleurs apocalypse */
  --bg-primary: #2d1b1b;
  --bg-secondary: #3d1f1f;
  --bg-tertiary: #4a1a0a;
  --bg-header: #2d1b1b;
  --bg-menu: #1a0f0f;
  --bg-overlay: rgba(45, 27, 27, 0.8);
  --bg-achievement: rgba(45, 27, 27, 0.9);
  --text-primary: #ffcccc;
  --text-secondary: #ffaaaa;
  --text-accent: #ff6b6b;
  --text-header: #ff6b6b;
  --text-menu: #ffcccc;
  --text-achievement: #ff6b6b;
  --border-primary: #ff4444;
  --border-secondary: #ff4444;
  --border-tertiary: #ff4444;
  --border-menu: #8b0000;
  --button-bg: #4a1a0a;
  --button-hover: #5a2a1a;
  --button-text: #ffcccc;
  --level-bg: #4a1a0a;
  --level-border: #ff4444;
  --level-text: #ffcccc;
  --error-bg: #4a1a0a;
  --error-border: #ff4444;
  --error-text: #ff6b6b;
  --success-bg: #2e5a3a;
  --success-border: #5a8a5a;
  --cancel-bg: #8a3a3a;
  --cancel-border: #aa5a5a;
  --progress-bg: #3d1f1f;
  --progress-border: #ff4444;
  --progress-fill: linear-gradient(90deg, #ff6b6b, #ff4444);
  --reward-bg: rgba(255, 68, 68, 0.2);
  --reward-border: #ff4444;
  --reward-claimed-bg: rgba(255, 107, 107, 0.1);
  --reward-claimed-border: #ff6b6b;
  --shadow-primary: rgba(0, 0, 0, 0.3);
  --shadow-secondary: rgba(139, 69, 19, 0.3);
  --shadow-tertiary: rgba(0, 0, 0, 0.3);
}

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

/* Ajustements pour les pages d'annonces sans BottomBar */
.announcements-page .main-content {
  margin-bottom: 0;
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
