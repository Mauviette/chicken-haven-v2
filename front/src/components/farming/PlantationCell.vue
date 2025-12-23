<template>
  <Tooltip :text="timerTooltip" :forceHide="isReady" class="plantation-tooltip">
    <div class="plantation-cell" @click="onCellClick">
      <!-- Badge légume en haut à gauche -->
      <span v-if="!isReady" class="vegetable-badge">{{ vegetableIcon }}</span>
      <div class="plant-visual" :class="growthStage">
        <span class="plant-icon">{{ plantIcon }}</span>
      </div>
      <div v-if="!isReady" class="growth-timer">
        <div class="timer-bar">
          <div class="timer-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="timer-text">{{ formattedTimeLeft }}</span>
      </div>
      <div v-else class="ready-indicator">
        <span class="ready-text">🌟 Prêt!</span>
      </div>
    </div>
  </Tooltip>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Tooltip from '@/components/menu/Tooltip.vue'
import { useGameData } from '@/composables/useGameData'

const props = defineProps({
  plantation: {
    type: Object,
    required: true
  },
  weather: Object
})

const emit = defineEmits(['harvest'])

const { farming: farmingData } = useGameData()

const now = ref(Date.now())
const isMobile = ref(false)
let timerInterval = null

// Icône du légume depuis sharedGameData
const vegetableIcon = computed(() => {
  const vegData = farmingData.value?.vegetables?.[props.plantation.vegetableType]
  return vegData?.icon || '🥔'
})

const plantedAt = computed(() => new Date(props.plantation.plantedAt).getTime())
const readyAt = computed(() => new Date(props.plantation.readyAt).getTime())
const totalTime = computed(() => readyAt.value - plantedAt.value)
const elapsedTime = computed(() => Math.min(now.value - plantedAt.value, totalTime.value))
const remainingTime = computed(() => Math.max(0, readyAt.value - now.value))

const isReady = computed(() => now.value >= readyAt.value)

const progressPercent = computed(() => {
  if (totalTime.value <= 0) return 100
  return Math.min(100, (elapsedTime.value / totalTime.value) * 100)
})

// Étape de croissance (pour l'animation)
const growthStage = computed(() => {
  if (isReady.value) return 'stage-ready'
  if (progressPercent.value < 33) return 'stage-seed'
  if (progressPercent.value < 66) return 'stage-growing'
  return 'stage-almost'
})

const plantIcon = computed(() => {
  const vegData = farmingData.value?.vegetables?.[props.plantation.vegetableType]
  if (isReady.value) return vegData?.icon || '🥔'
  if (progressPercent.value < 33) return '🫘' // graine
  if (progressPercent.value < 66) return '🌱' // pousse
  return '🪴' // pot pour le dernier stade
})

// Icône du légume final (pour le badge) - maintenant défini plus haut
// const vegetableIcon = computed(() => {
//   const icons = vegetableIcons[props.plantation.vegetableType] || vegetableIcons.potato
//   return icons.ready
// })

// Formater le temps restant
const formattedTimeLeft = computed(() => {
  const ms = remainingTime.value
  if (ms <= 0) return 'Prêt!'
  
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
  }
  return `${seconds}s`
})

// Tooltip du timer
const timerTooltip = computed(() => {
  const vegData = farmingData.value?.vegetables?.[props.plantation.vegetableType]
  const vegName = vegData?.name || 'Légume'
  
  let html = `<strong>${vegName} en croissance</strong><br>`
  html += `Progression: ${Math.round(progressPercent.value)}%<br>`
  html += `Temps restant: ${formattedTimeLeft.value}`
  
  // Ajouter les effets météo si disponibles
  const formatWeatherEffect = (weather, type) => {
    if (!weather?.effects) return ''
    const effect = weather.effects[type]
    if (!effect || effect === 0) return ''
    
    const icon = weather.icon || '☀️'
    const sign = effect > 0 ? '+' : ''
    const effectText = effect > 0 ? 'Croissance accélérée' : 'Croissance ralentie'
    const color = effect > 0 ? '#4CAF50' : '#F44336'
    return `<br>${icon} <span style="color: ${color}">${effectText} (${sign}${Math.round(effect * 100)}%)</span>`
  }
  
  if (props.weather?.current) {
    html += formatWeatherEffect(props.weather.current, props.plantation.vegetableType)
  }
  
  return html
})

function onCellClick() {
  if (isReady.value) {
    emit('harvest')
  }
}

onMounted(() => {
  isMobile.value = window.innerWidth <= 768 || 'ontouchstart' in window
  timerInterval = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.plantation-tooltip {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plantation-tooltip :deep(.tooltip-trigger) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plantation-cell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-sizing: border-box;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  position: relative;
}

.vegetable-badge {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 12px;
  opacity: 0.7;
}

.plant-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.plant-icon {
  font-size: 48px;
  transition: all 0.3s ease;
}

/* Étapes de croissance */
.stage-seed .plant-icon {
  font-size: 28px;
  opacity: 0.7;
}

.stage-growing .plant-icon {
  font-size: 38px;
}

.stage-almost .plant-icon {
  font-size: 44px;
}

.stage-ready .plant-icon {
  font-size: 52px;
}

/* Timer */
.growth-timer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.timer-bar {
  width: 80%;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 4px;
  transition: width 1s linear;
}

.timer-text {
  font-family: 'Fredoka', sans-serif;
  font-size: 11px;
  color: #FFF;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* Indicateur prêt */
.ready-indicator {
  margin-top: 8px;
}

.ready-text {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  color: #FFD700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  animation: ready-glow 1s infinite alternate;
}

@keyframes ready-glow {
  from { text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5), 0 0 5px rgba(255, 215, 0, 0.5); }
  to { text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 215, 0, 0.8); }
}

/* Responsive */
@media (max-width: 600px) {
  .vegetable-badge {
    font-size: 10px;
    top: 2px;
    left: 2px;
  }
  
  .plant-icon {
    font-size: 28px;
  }
  
  .timer-bar {
    width: 85%;
    height: 6px;
  }
  
  .timer-text {
    font-size: 9px;
  }
  
  .growth-timer {
    gap: 2px;
    margin-top: 5px;
  }
  
  .ready-indicator {
    margin-top: 0;
  }
  
  .ready-text {
    font-size: 12px;
    display: none;
  }
  
  .plantation-cell {
    justify-content: center;
  }
}

@media (max-width: 400px) {
  .vegetable-badge {
    font-size: 9px;
  }
  
  .plant-icon {
    font-size: 24px;
  }
  
  .timer-text {
    font-size: 8px;
  }
  
  .ready-text {
    font-size: 11px;
  }
}
</style>
