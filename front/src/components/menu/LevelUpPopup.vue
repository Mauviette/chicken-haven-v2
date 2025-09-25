<template>
  <div class="levelup-overlay" @click.self="close">
    <div class="confetti-layer" ref="confettiLayer"></div>
    <div class="levelup-card">
      <button class="close-btn" @click="close">✕</button>
      <div class="avatar-wrap">
        <img src="@/assets/ui/avatar-default.svg" class="avatar" />
        <span class="level-badge">{{ to }}</span>
      </div>
      <h3>Bravo !</h3>
      <p>Vous passez au niveau <strong>{{ to }}</strong> 🎉</p>
      <div class="unlocks" v-if="unlocks.length">
        <div class="unlocks-title">Nouveautés débloquées :</div>
        <ul class="unlocks-list">
          <li v-for="u in unlocks" :key="u.id" class="unlock-item">
            <span class="icon">{{ u.icon || '✨' }}</span>
            <span class="label">{{ u.label }}</span>
          </li>
        </ul>
      </div>
      <div class="unlocks none" v-else>
        <div class="unlocks-title"></div>
      </div>

      <div class="rewards" v-if="levelRewards.length">
        <div class="rewards-title">Récompenses obtenues :</div>
        <ul class="rewards-list">
          <li v-for="r in levelRewards" :key="r.type" class="reward-item">
            <Tooltip :text="`<strong>${(items?.[r.type]?.nom || '').charAt(0).toUpperCase() + (items?.[r.type]?.nom || '').slice(1)}</strong>`" position="right">
              <span class="icon">{{ r.icon }}</span>
              <span class="label">{{ r.label }}</span>
            </Tooltip>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useGameData } from '@/composables/useGameData'
import Tooltip from '@/components/menu/Tooltip.vue'
const props = defineProps({
  from: { type: Number, required: true },
  to: { type: Number, required: true }
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}

const { getUnlocksBetween, getLevelRewardsBetween, items } = useGameData()
const unlocks = computed(() => getUnlocksBetween(props.from, props.to))

const levelRewards = computed(() => getLevelRewardsBetween(props.from, props.to))

// Confettis à l'ouverture du popup
const confettiLayer = ref(null)
const _confettiTimers = []

function launchConfetti() {
  const colors = ['#FFC66E','#7B61FF','#FF6EC7','#6EFFE8','#FF9B6E','#F7E06E','#8FFF6E']
  const count = 70
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span')
    el.className = 'confetti-piece'
    el.style.setProperty('--left', Math.random() * 100 + 'vw')
    el.style.setProperty('--dur', (1.8 + Math.random() * 1.6) + 's')
    el.style.setProperty('--rot', Math.floor(Math.random() * 360) + 'deg')
    el.style.setProperty('--rotEnd', (180 + Math.floor(Math.random() * 540)) + 'deg')
    el.style.background = colors[i % colors.length]
    el.style.animationDelay = (Math.random() * 0.6) + 's'
    confettiLayer.value && confettiLayer.value.appendChild(el)
    const t = setTimeout(() => el.remove(), 3600)
    _confettiTimers.push(t)
  }
}

onMounted(() => {
  launchConfetti()
})

onBeforeUnmount(() => {
  _confettiTimers.forEach(clearTimeout)
  _confettiTimers.length = 0
  if (confettiLayer.value) confettiLayer.value.innerHTML = ''
})
</script>

<style scoped>
.levelup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20,10,0,0.35);
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.confetti-layer { position: absolute; inset: 0; pointer-events: none; z-index: 2; }
.levelup-card {
  width: 320px;
  max-width: 90vw;
  background: #7a3e10;
  background-image: url('@/assets/bar/bg.png');
  border: 2px solid #ffc66e;
  color: #fff9e5;
  border-radius: 16px;
  padding: 18px 16px 22px;
  text-align: center;
  font-family: 'Fredoka', sans-serif;
  animation: popIn 220ms ease-out;
  position: relative;
  box-shadow: 0 12px 30px rgba(0,0,0,0.4);
  z-index: 3;
}
.close-btn {
  position: absolute;
  right: 10px;
  top: 8px;
  background: none;
  border: none;
  font-size: 18px;
  color: #fff9e5;
}
.avatar-wrap { position: relative; display: inline-block; }
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid #ffc66e;
  background: white;
}
.level-badge {
  position: absolute;
  right: -6px;
  bottom: -4px;
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
.sparkles {
  margin-top: 8px;
  font-size: 18px;
}
.unlocks { margin-top: 10px; text-align: left; }
.unlocks-title { font-weight: bold; margin-bottom: 6px; }
.unlocks-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
.unlock-item { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 6px 8px; }
.unlock-item .icon { width: 20px; text-align: center; }
.unlock-item .label { font-size: 14px; }
@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Rewards section */
.rewards { margin-top: 14px; text-align: left; }
.rewards-title { font-weight: bold; margin-bottom: 6px; }
.rewards-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
.reward-item { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 6px 8px; }
.reward-item .icon { width: 20px; text-align: center; }
.reward-item .label { font-size: 14px; }

/* Confetti */
:deep(.confetti-piece) {
  position: absolute;
  top: -20px;
  left: var(--left);
  width: 8px;
  height: 14px;
  background: #ffc66e;
  opacity: 0.9;
  transform: rotate(var(--rot));
  border-radius: 2px;
  animation: confetti-fall var(--dur) ease-in forwards;
}

@keyframes confetti-fall {
  0%   { transform: translateY(-10vh) rotate(var(--rot)); opacity: 0; }
  10%  { opacity: 1; }
  100% { transform: translateY(110vh) rotate(var(--rotEnd)); opacity: 0; }
}
</style>
