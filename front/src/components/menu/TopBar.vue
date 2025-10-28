<template>
  <div class="top-bar">
    <div class="top-bar-inner">
      <!-- Menu hamburger sur mobile, titre sur desktop -->
      <div class="left-section">
        <Tooltip v-if="isApocalypseMode" :text="apocalypseTooltipHtml" position="bottom">
          <div class="game-title desktop-only">{{ isApocalypseMode ? '💀 Chicken Haven' : 'Chicken Haven' }}</div>
        </Tooltip>
        <div v-else class="game-title desktop-only">Chicken Haven</div>
        <div class="mobile-menu mobile-only">
          <button class="hamburger-btn" @click="handleHamburgerClick" :class="{ active: showMobileMenu || achievementsOpen }">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <!-- Menu déroulant mobile -->
          <div class="mobile-dropdown" :class="{ visible: showMobileMenu }">
            <div class="mobile-menu-item" @click="navigateTo('/production')" :class="{ active: isActive('/production') }">
              ⚒️ Production
            </div>
            <div class="mobile-menu-item" @click="navigateTo('/market')" :class="{ active: isActive('/market'), disabled: !isMarketUnlocked }">
              🛒 Marché
              <span v-if="isMarketUnlocked && hasAvailableUpgrade" class="menu-badge"></span>
            </div>
            <div class="mobile-menu-item" @click="navigateTo('/collection')" :class="{ active: isActive('/collection') }">
              🐔 Collection
            </div>
            <div class="mobile-menu-item" @click="navigateTo('/social')" :class="{ active: isActive('/social') }">
              👥 Social
            </div>
            <div class="mobile-menu-divider"></div>
            <div class="mobile-menu-item" @click="openAchievements">
              🏆 Succès
              <span v-if="hasUnclaimedRewards" class="menu-badge"></span>
            </div>
            <div v-if="isMiningUnlocked" class="mobile-menu-item" @click="isMiningUnlocked ? openMiningFromMenu() : null" :class="{ disabled: !isMiningUnlocked }">
              🪨 Minage 
            </div>
            <div class="mobile-menu-item" @click="openOptions">
              ⚙️ Paramètres
            </div>
          </div>
        </div>
      </div>
      <div class="top-right">
        <Tooltip v-if="showTooltips" :text="eggTooltipHtml" position="bottom">
          <div
            class="egg-counter"
            :class="{ clickable: isMarketUnlocked, disabled: !isMarketUnlocked }"
            role="button"
            tabindex="0"
            @click="openMarketFromEggCounter"
            @keydown.enter.prevent="openMarketFromEggCounter"
            @keydown.space.prevent="openMarketFromEggCounter"
          >
              <span>🥚 {{ formatEggs(eggs) }} œufs</span>
          </div>
        </Tooltip>
        <div v-else
          class="egg-counter"
          :class="{ clickable: isMarketUnlocked, disabled: !isMarketUnlocked }"
          role="button"
          tabindex="0"
          @click="openMarketFromEggCounter"
          @keydown.enter.prevent="openMarketFromEggCounter"
          @keydown.space.prevent="openMarketFromEggCounter"
        >
          <span>🥚 {{ formatEggs(eggs) }} œufs</span>
        </div>
        <Tooltip v-if="showTooltips" :text="levelTooltipHtml()">
          <button class="profile-btn" @click="openProfile">
            <div class="avatar-wrap">
              <img id="avatar-anchor" :src="topAvatarSrc" alt="avatar" class="avatar noselect" draggable="false" />
              <span class="level-badge">{{ level }}</span>
            </div>
          </button>
        </Tooltip>
        <button v-else class="profile-btn" @click="openProfile">
          <div class="avatar-wrap">
            <img id="avatar-anchor" :src="topAvatarSrc" alt="avatar" class="avatar noselect" draggable="false" />
            <span class="level-badge">{{ level }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { usePlayer } from '@/composables/usePlayer'
import Tooltip from '@/components/menu/Tooltip.vue'
import { useGameData } from '@/composables/useGameData'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { usePoules } from '@/composables/usePoules'
import { injectApocalypse } from '@/composables/useApocalypse'
import { useAchievements } from '@/composables/useAchievements'
import { apiGet } from '@/utils/api.js'
import { useUpgradesAvailability } from '@/composables/useUpgradesAvailability'
import { formatNumber, formatEggs } from '@/utils/format.js'

const { eggs, level, xp, xpRequired } = usePlayer()
const { levelUnlocks, getLevelRewardsBetween, items } = useGameData()
const router = useRouter()
const route = useRoute()
const { getImage, hiddenImage } = usePoules()
const { achievements } = useAchievements()
const { hasAvailableUpgrade, initUpgradesAvailability } = useUpgradesAvailability()
const { isApocalypseMode } = injectApocalypse()

// Données des items depuis le backend
const itemsData = computed(() => items.value)

const props = defineProps({
  achievementsOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-profile', 'open-achievements', 'open-options', 'close-achievements', 'open-mining'])

const showMobileMenu = ref(false)
const myProfileId = ref('')
const myAvatarId = ref('hidden')

// Handler pour les mises à jour d'avatar
const avatarUpdateHandler = (e) => {
  try { myAvatarId.value = e?.detail?.avatar ? String(e.detail.avatar) : 'hidden' } catch (_) {}
}

// Marché déverrouillé
const isMarketUnlocked = computed(() => {
  const l = level.value || 1
  for (let n = 1; n <= l; n++) {
    const arr = (levelUnlocks?.value && levelUnlocks.value[n]) ? levelUnlocks.value[n] : []
    if (arr.some(u => u.id === 'market')) return true
  }
  return false
})

// Minage déverrouillé
const isMiningUnlocked = computed(() => {
  const l = level.value || 1
  return l >= 5
})

// Succès non réclamés
const hasUnclaimedRewards = computed(() =>
  (achievements?.value || []).some(a => a.completed && !a.rewardClaimed)
)

const topAvatarSrc = computed(() => {
  const a = myAvatarId.value
  if (!a || a === 'hidden') return hiddenImage
  return getImage(String(a))
})

const apocalypseTooltipHtml = computed(() => {
  if (!isApocalypseMode.value) return ''
  return `<strong>Mode apocalypse</strong><br>- Chaque cadeau de poule a 75% de chance de donner une tomate pourrie à la place de la récompense de base.<br>- Chaque case de minage avec récompense a 25% que la récompense soit une tomate pourrie à la place.<br>- On ne peut pas remplacer une poule (avec capacité activable) dont le cooldown n'est pas prêt.<br>- Les production d'oeufs donnent 10% des oeufs.<br>- Les prix d'améliorations et d'agrandissements dans le marché sont multipliés par 2`
})

const showTooltips = ref(true)

// Détecter si on est sur mobile
const updateShowTooltips = () => {
  showTooltips.value = window.innerWidth > 768
}

onMounted(async () => {
  updateShowTooltips()
  window.addEventListener('resize', updateShowTooltips)
  
  try {
    const token = localStorage.getItem('token')
    if (!token) return
    const me = await apiGet('/api/user/me')
    myProfileId.value = String(me.profileId || '').toUpperCase()
    myAvatarId.value = me.avatar ? String(me.avatar) : 'hidden'
    // Mettre à jour immédiatement le niveau/xp/œufs du store (évite d'attendre un autre refresh)
    try {
      if (me?.experience) {
        level.value = me.experience.level ?? level.value
        xp.value = me.experience.points ?? xp.value
        xpRequired.value = me.experience.required_points ?? xpRequired.value
      }
      if (me?.resources) {
        eggs.value = Number(me.resources.eggs ?? eggs.value)
      }
      // Apocalypse mode is now immutable, no need to update it
    } catch (_) {}
  } catch (_) {}

  // Ecouter les mises à jour d'avatar globales (depuis UserProfile)
  window.addEventListener('avatar-updated', avatarUpdateHandler)

  // Init upgrades availability for global badge
  try { initUpgradesAvailability() } catch (_) {}
})

// Nettoyage des event listeners
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateShowTooltips)
  window.removeEventListener('avatar-updated', avatarUpdateHandler)
})

function toggleMobileMenu() {
  showMobileMenu.value = !showMobileMenu.value
}

function handleHamburgerClick() {
  if (props.achievementsOpen) {
    // Si le menu achievements est ouvert, le fermer
    emit('close-achievements')
  } else {
    // Sinon, toggle le menu mobile
    toggleMobileMenu()
  }
}

function navigateTo(path) {
  if (path === '/market' && !isMarketUnlocked.value) return
  router.push(path)
  showMobileMenu.value = false
}

function isActive(path) {
  return route.path === path
}

function openProfile() {
  if (myProfileId.value) {
    router.push(`/user/${myProfileId.value}`)
  } else {
    emit('open-profile')
  }
  // Sur mobile uniquement : fermer les menus
  if (window.innerWidth <= 768) {
    showMobileMenu.value = false // Fermer le menu mobile
    if (props.achievementsOpen) {
      emit('close-achievements') // Fermer le menu achievements s'il est ouvert
    }
  }
}

function openAchievements() {
  showMobileMenu.value = false // Fermer le menu mobile
  emit('open-achievements')
}

function openOptions() {
  emit('open-options')
  showMobileMenu.value = false
}

function openMiningFromMenu() {
  emit('open-mining')
  showMobileMenu.value = false // Fermer le menu mobile
}

const eggTooltipHtml = computed(() => {
  const eggsData = itemsData.value?.eggs
  if (!eggsData) return '<strong>🥚 Œufs</strong><br>La monnaie principale de votre ferme.'
  return `<strong>${eggsData.nom.charAt(0).toUpperCase() + eggsData.nom.slice(1)}</strong><br>${eggsData.description}`
})

const levelTooltipHtml = () => {
  const l = level.value
  const curXp = xp.value ?? 0
  const reqXp = xpRequired.value ?? 0
  const current = `<strong>Niveau ${l}</strong> <span style="opacity:0.9">(${curXp}/${reqXp} 🫐)</span>`
  const nextLevel = l + 1
  const unlocks = (levelUnlocks?.value && levelUnlocks.value[nextLevel]) ? levelUnlocks.value[nextLevel] : []
  const rewards = getLevelRewardsBetween ? getLevelRewardsBetween(l, nextLevel) : []

  const unlocksHtml = unlocks.length
    ? unlocks.filter(u => u && u.label).map(u => `${u.icon || '✨'} ${u.label}`).join('<br>')
    : ''

  const rewardsHtml = rewards.length
    ? rewards.filter(r => r && r.label).map(r => `${r.icon} ${r.label}`).join('<br>')
    : ''

  let html = `${current}<br><em>À venir au niveau ${nextLevel} :</em>`
  if (unlocksHtml) html += `<br>${unlocksHtml}`
  html += `<br>${rewardsHtml}`

  return html
}

function getMarketRequiredLevel() {
  try {
    const map = levelUnlocks?.value || {}
    for (const k of Object.keys(map)) {
      const arr = map[k] || []
      if (arr.some(u => u && u.id === 'market')) return Number(k)
    }
  } catch (_) {}
  return null
}

function getMarketLockedTitle() {
  const lvl = getMarketRequiredLevel()
  return lvl ? `Débloqué au niveau ${lvl}` : 'Marché verrouillé'
}

function openMarketFromEggCounter() {
  try {
    if (isMarketUnlocked.value) {
      router.push('/market')
    } else {
      const lvl = getMarketRequiredLevel()
      if (lvl) {
        window.$toast?.(`Marché débloqué au niveau ${lvl}`, 'error')
      } else {
        window.$toast?.('Marché verrouillé', 'error')
      }
    }
  } catch (e) {
    console.error('openMarketFromEggCounter error', e)
  }
}
</script>


<style scoped>
.top-bar {
  width: 100%;
  height: 60px;
  min-height: 60px;
  max-height: 60px;
  background-color: var(--bg-header);
  background-repeat: repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Fredoka', sans-serif;
  box-shadow: 0 2px 6px var(--shadow-primary);
  overflow: visible;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.top-bar-inner {
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: visible;
}

.left-section {
  position: relative;
  overflow: visible;
}

.game-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-header);
}

.mobile-menu {
  position: relative;
  overflow: visible;
}

.hamburger-btn {
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  position: relative;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 3px;
  z-index: 1001;
  overflow: visible;
}

.hamburger-btn span {
  display: block;
  width: 18px;
  height: 2px;
  background-color: var(--text-header);
  border-radius: 1px;
  transition: all 0.3s ease;
  transform-origin: center;
  position: absolute;
}

.hamburger-btn span:nth-child(1) {
  top: calc(50% - 6px);
}

.hamburger-btn span:nth-child(2) {
  top: calc(50% - 1px);
}

.hamburger-btn span:nth-child(3) {
  top: calc(50% + 4px);
}

.hamburger-btn.active span:nth-child(1) {
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
}

.hamburger-btn.active span:nth-child(2) {
  opacity: 0;
  transform: scale(0);
}

.hamburger-btn.active span:nth-child(3) {
  top: 50%;
  transform: translateY(-50%) rotate(-45deg);
}

.mobile-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--bg-header);
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-tertiary);
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 1000;
}

.mobile-dropdown.visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.mobile-menu-item {
  padding: 12px 16px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  color: var(--text-header);
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 198, 110, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.2s ease;
}

.mobile-menu-item:hover:not(.disabled) {
  background-color: rgba(255, 198, 110, 0.2);
}

.mobile-menu-item.active {
  background-color: rgba(255, 198, 110, 0.4);
  font-weight: bold;
}

.mobile-menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mobile-menu-item:last-child {
  border-bottom: none;
}

.mobile-menu-divider {
  height: 1px;
  background-color: rgba(255, 198, 110, 0.5);
  margin: 4px 0;
}

.menu-badge {
  width: 8px;
  height: 8px;
  background-color: #FFD700;
  border: 1px solid #8B4513;
  border-radius: 50%;
  margin-left: 8px;
}

.level-requirement {
  font-size: 10px;
  color: #8B4513;
  background-color: rgba(255, 198, 110, 0.3);
  padding: 2px 4px;
  border-radius: 4px;
  margin-left: auto;
}

.top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.egg-counter {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 12px;
  padding: 5px 10px;
  font-size: 15px;
  color: var(--text-primary);
  white-space: nowrap;
  box-shadow: 0 1px 2px var(--shadow-primary);
}

.egg-counter.clickable { cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer; }
.egg-counter.disabled { cursor: not-allowed; opacity: 0.85 }

.profile-btn {
  background: none;
  border: none;
  padding: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--border-primary);
  background-color: white;
}

.noselect {
  user-select: none;
}

.avatar-wrap { 
  position: relative; 
  display: inline-block; 
}

.level-badge {
  position: absolute;
  right: -4px;
  bottom: 2px;
  background: #7b61ff;
  color: white;
  font-weight: bold;
  border: 2px solid #fff;
  font-size: 12px;
  line-height: 1;
  padding: 3px 7px;
  border-radius: 999px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Responsivité */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: block;
  }

  .top-bar-inner {
    padding: 0 16px;
  }

  .egg-counter {
    font-size: 13px;
    padding: 4px 8px;
  }

  .avatar {
    width: 28px;
    height: 28px;
  }

  .level-badge {
    font-size: 10px;
    padding: 2px 5px;
  }
}

@media (max-width: 480px) {
  .top-bar-inner {
    padding: 0 12px;
  }

  .top-right {
    gap: 8px;
  }

  .egg-counter {
    font-size: 12px;
    padding: 3px 6px;
  }

  .avatar {
    width: 26px;
    height: 26px;
  }
}
</style>
