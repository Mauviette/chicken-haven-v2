<template>
  <div class="weather-display">
    <Tooltip :text="currentWeatherTooltip">
      <div class="current-weather">
        <span class="weather-icon">{{ currentWeather?.icon || '☀️' }}</span>
        <span class="weather-name">{{ currentWeather?.name || 'Chargement...' }}</span>
        <span class="weather-timer">({{ formattedTime }})</span>
      </div>
    </Tooltip>
    <span class="weather-separator">→</span>
    <Tooltip :text="nextWeatherTooltip">
      <div class="next-weather">
        <span class="weather-icon">{{ nextWeather?.icon || '☁️' }}</span>
      </div>
    </Tooltip>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Tooltip from '@/components/menu/Tooltip.vue'

const props = defineProps({
  weather: Object
})

const emit = defineEmits(['refresh'])

const remainingMs = ref(0)
let timerInterval = null

const currentWeather = computed(() => props.weather?.current)
const nextWeather = computed(() => props.weather?.next)

// Formater le temps restant
const formattedTime = computed(() => {
  const ms = remainingMs.value
  if (ms <= 0) return '0:00'
  
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}h${minutes.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

// Tooltips
const currentWeatherTooltip = computed(() => {
  if (!currentWeather.value) return ''
  const effects = currentWeather.value.effects || {}
  let html = `<strong>${currentWeather.value.name}</strong><br>`
  html += `${currentWeather.value.description}<br><br>`
  html += '<strong>Effets:</strong><br>'
  
  if (effects.potato !== 0) {
    const sign = effects.potato > 0 ? '+' : ''
    const color = effects.potato > 0 ? '#4CAF50' : '#F44336'
    html += `<span style="color: ${color}">🥔 Patates: ${sign}${Math.round(effects.potato * 100)}%</span><br>`
  }
  if (effects.carrot !== 0) {
    const sign = effects.carrot > 0 ? '+' : ''
    const color = effects.carrot > 0 ? '#4CAF50' : '#F44336'
    html += `<span style="color: ${color}">🥕 Carottes: ${sign}${Math.round(effects.carrot * 100)}%</span><br>`
  }
  if (effects.corn !== 0) {
    const sign = effects.corn > 0 ? '+' : ''
    const color = effects.corn > 0 ? '#4CAF50' : '#F44336'
    html += `<span style="color: ${color}">🌽 Maïs: ${sign}${Math.round(effects.corn * 100)}%</span><br>`
  }
  
  return html
})

const nextWeatherTooltip = computed(() => {
  if (!nextWeather.value) return ''
  const effects = nextWeather.value.effects || {}
  let html = `<strong>${nextWeather.value.name}</strong><br>`
  html += `${nextWeather.value.description}<br><br>`
  html += '<strong>Effets:</strong><br>'
  
  if (effects.potato !== 0) {
    const sign = effects.potato > 0 ? '+' : ''
    const color = effects.potato > 0 ? '#4CAF50' : '#F44336'
    html += `<span style="color: ${color}">🥔 Patates: ${sign}${Math.round(effects.potato * 100)}%</span><br>`
  }
  if (effects.carrot !== 0) {
    const sign = effects.carrot > 0 ? '+' : ''
    const color = effects.carrot > 0 ? '#4CAF50' : '#F44336'
    html += `<span style="color: ${color}">🥕 Carottes: ${sign}${Math.round(effects.carrot * 100)}%</span><br>`
  }
  if (effects.corn !== 0) {
    const sign = effects.corn > 0 ? '+' : ''
    const color = effects.corn > 0 ? '#4CAF50' : '#F44336'
    html += `<span style="color: ${color}">🌽 Maïs: ${sign}${Math.round(effects.corn * 100)}%</span><br>`
  }
  
  return html
})

// Timer
function updateTimer() {
  if (currentWeather.value?.remainingMs) {
    // Calculer le temps restant basé sur le temps initial moins le temps écoulé
    const elapsed = Date.now() - (props.weather?._fetchTime || Date.now())
    remainingMs.value = Math.max(0, currentWeather.value.remainingMs - elapsed)
    
    // Si le temps est écoulé, demander un refresh
    if (remainingMs.value <= 0) {
      emit('refresh')
    }
  }
}

watch(() => props.weather, (newWeather) => {
  if (newWeather) {
    // Stocker le timestamp de fetch pour calculer le temps écoulé
    newWeather._fetchTime = Date.now()
    updateTimer()
  }
}, { immediate: true })

onMounted(() => {
  timerInterval = setInterval(updateTimer, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.weather-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 15px;
  background: rgba(135, 206, 235, 0.3);
  border-radius: 6px;
  border: 2px solid #87CEEB;
}

.current-weather, .next-weather {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: url('@/assets/ui/cursor/mark_question.png') 0 0, help;
}

.weather-icon {
  font-size: 24px;
}

.weather-name {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  color: #5D4037;
  font-weight: 600;
}

.weather-timer {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  color: #8B4513;
}

.weather-separator {
  font-size: 16px;
  color: #8B4513;
  opacity: 0.7;
}

.next-weather .weather-icon {
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 600px) {
  .weather-display {
    padding: 6px 10px;
    gap: 6px;
  }
  
  .weather-icon {
    font-size: 20px;
  }
  
  .weather-name {
    font-size: 12px;
  }
  
  .weather-timer {
    font-size: 10px;
  }
  
  .weather-separator {
    font-size: 14px;
  }
}

@media (max-width: 400px) {
  .weather-display {
    padding: 5px 8px;
    gap: 4px;
  }
  
  .current-weather {
    gap: 4px;
  }
  
  .weather-icon {
    font-size: 18px;
  }
  
  .weather-name {
    font-size: 11px;
  }
  
  .weather-timer {
    font-size: 9px;
  }
  
  .weather-separator {
    font-size: 12px;
  }
}

/* Mode sombre */
:deep(.farming-view.dark-mode) .weather-display {
  background: rgba(74, 144, 226, 0.15);
  border-color: #6B8DB8;
}

:deep(.farming-view.dark-mode) .weather-name {
  color: #C0C0C0;
}

:deep(.farming-view.dark-mode) .weather-timer {
  color: #A0A0A0;
}

:deep(.farming-view.dark-mode) .weather-separator {
  color: #A0A0A0;
}
</style>
