<template>
  <div class="top-bar">
    <div class="top-bar-inner">
      <div class="game-title">Chicken Haven</div>
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
import { useRouter } from 'vue-router'
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { usePoules } from '@/composables/usePoules'
const { eggs, level, xp, xpRequired } = usePlayer()
const { levelUnlocks, getLevelRewardsBetween } = useGameData()
const router = useRouter()
const { getImage, hiddenImage } = usePoules()

const emit = defineEmits(['open-profile'])

const myProfileId = ref('')
const myAvatarId = ref('hidden')
const topAvatarSrc = computed(() => {
  const a = myAvatarId.value
  if (!a || a === 'hidden') return hiddenImage
  return getImage(String(a))
})
onMounted(async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return
    const res = await fetch('/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const me = await res.json()
      myProfileId.value = String(me.profileId || '').toUpperCase()
      myAvatarId.value = me.avatar ? String(me.avatar) : 'hidden'
    }
  } catch (_) {}

  // Ecouter les mises à jour d'avatar globales (depuis UserProfile)
  const handler = (e) => {
    try { myAvatarId.value = e?.detail?.avatar ? String(e.detail.avatar) : 'hidden' } catch (_) {}
  }
  window.addEventListener('avatar-updated', handler)
  // Nettoyage
  onBeforeUnmount(() => window.removeEventListener('avatar-updated', handler))
})

function openProfile() {
  if (myProfileId.value) {
    router.push(`/user/${myProfileId.value}`)
  } else {
    emit('open-profile')
  }
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
    ? unlocks.map(u => `${u.icon || '✨'} ${u.label}`).join('<br>')
    : ''

  const rewardsHtml = rewards.length
    ? rewards.map(r => `${r.icon} ${r.label}`).join('<br>')
    : 'Aucune récompense'

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
  background-color: #f6e4c3;
  background-image: url("@/assets/bar/top-texture.png");
  background-repeat: repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Fredoka', sans-serif;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.top-bar-inner {
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.avatar-wrap { position: relative; display: inline-block; }
.level-badge {
  position: absolute;
  right: -4px;
  bottom: 2px;
  background: #7b61ff; /* violet myrtille */
  color: white;
  font-weight: bold;
  border: 2px solid #fff;
  font-size: 12px;
  line-height: 1;
  padding: 3px 7px;
  border-radius: 999px; /* plus rond */
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

@media (max-width: 600px) {
  .top-bar-inner {
    padding: 0 10px;
  }

  .game-title {
    font-size: 14px;
  }

  .egg-counter {
    font-size: 13px;
    padding: 4px 6px;
  }

  .avatar {
    width: 26px;
    height: 26px;
  }
  .level-badge {
    font-size: 10px;
    right: -4px;
    bottom: 2px;
  }
}

</style>
