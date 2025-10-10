<template>
  <div class="top-bar">
    <div class="top-bar-inner">
      <!-- Menu hamburger sur mobile, titre sur desktop -->
      <div class="left-section">
        <div class="game-title desktop-only">Chicken Haven</div>
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
            <div class="mobile-menu-item" @click="openOptions">
              ⚙️ Paramètres
            </div>
          </div>
        </div>
      </div>
      <div class="top-right">
        <Tooltip :text="eggTooltipHtml" position="bottom">
          <div class="egg-counter">
            <span>🥚 {{ eggs }} œufs</span>
          </div>
        </Tooltip>
        <Tooltip :text="levelTooltipHtml()">
          <button class="profile-btn" @click="openProfile">
            <div class="avatar-wrap">
              <img id="avatar-anchor" :src="topAvatarSrc" alt="avatar" class="avatar noselect" draggable="false" />
              <span class="level-badge">{{ level }}</span>
            </div>
          </button>
        </Tooltip>
      </div>
    </div>
  </div>
</template>


<script setup>
import { usePlayer } from '@/composables/usePlayer'
import Tooltip from '@/components/menu/Tooltip.vue'
import { achievementsData } from '@/data/items.js'
import { useGameData } from '@/composables/useGameData'
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { usePoules } from '@/composables/usePoules'
import { useAchievements } from '@/composables/useAchievements'
import { apiGet } from '@/utils/api.js'
import { useUpgradesAvailability } from '@/composables/useUpgradesAvailability'

const { eggs, level, xp, xpRequired } = usePlayer()
const { levelUnlocks, getLevelRewardsBetween } = useGameData()
const router = useRouter()
const route = useRoute()
const { getImage, hiddenImage } = usePoules()
const { achievements } = useAchievements()
const { hasAvailableUpgrade, initUpgradesAvailability } = useUpgradesAvailability()

const props = defineProps({
  achievementsOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['open-profile', 'open-achievements', 'open-options', 'close-achievements'])

const showMobileMenu = ref(false)
const myProfileId = ref('')
const myAvatarId = ref('hidden')

// Marché déverrouillé
const isMarketUnlocked = computed(() => {
  const l = level.value || 1
  for (let n = 1; n <= l; n++) {
    const arr = (levelUnlocks?.value && levelUnlocks.value[n]) ? levelUnlocks.value[n] : []
    if (arr.some(u => u.id === 'market')) return true
  }
  return false
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

onMounted(async () => {
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
    } catch (_) {}
  } catch (_) {}

  // Ecouter les mises à jour d'avatar globales (depuis UserProfile)
  const handler = (e) => {
    try { myAvatarId.value = e?.detail?.avatar ? String(e.detail.avatar) : 'hidden' } catch (_) {}
  }
  window.addEventListener('avatar-updated', handler)
  // Nettoyage
  onBeforeUnmount(() => window.removeEventListener('avatar-updated', handler))

  // Init upgrades availability for global badge
  try { initUpgradesAvailability() } catch (_) {}
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
}

function openAchievements() {
  showMobileMenu.value = false // Fermer le menu mobile
  emit('open-achievements')
}

function openOptions() {
  emit('open-options')
  showMobileMenu.value = false
}

const eggTooltipHtml = `<strong>${achievementsData.eggs.nom.charAt(0).toUpperCase() + achievementsData.eggs.nom.slice(1)}</strong><br>${achievementsData.eggs.description}`

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
</script>


<style scoped>
.top-bar {
  width: 100%;
  height: 60px;
  min-height: 60px;
  max-height: 60px;
  background-color: #f6e4c3;
  background-repeat: repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Fredoka', sans-serif;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
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
  color: #6d3c00;
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
  background-color: #6d3c00;
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
  background: #f6e4c3;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  color: #6d3c00;
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

.top-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.egg-counter {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #fff7dc;
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 5px 10px;
  font-size: 15px;
  color: #6d3c00;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.profile-btn {
  background: none;
  border: none;
  padding: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #ffc66e;
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
