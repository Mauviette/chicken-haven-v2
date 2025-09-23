<template>
  <div class="production-screen">
    <div class="production-content">

      <div class="egg-clicker">
        <!-- Œuf cliquable principal -->
        <div class="egg-container">
          <div 
            class="clickable-egg"
            :class="{ 
              'clickable': isClickable, 
              'max-gains': currentGains >= eggState.maxIncome,
              'loading': eggState.isLoading 
            }"
            @click="handleEggClick"
          >
            <div class="egg-sprite">🥚</div>
            <div class="egg-glow" v-if="currentGains >= eggState.maxIncome"></div>
            
            <!-- Effets visuels d'œufs qui sautent -->
            <div class="egg-effects-container">
              <div 
                v-for="effect in eggEffects" 
                :key="effect.id"
                class="flying-egg"
                :style="{
                  '--start-x': effect.startX + 'px',
                  '--start-y': effect.startY + 'px',
                  '--jump-x': effect.jumpX + 'px',
                  '--jump-y': effect.jumpY + 'px',
                  '--fall-y': effect.fallY + 'px',
                  '--rotation': effect.rotation + 'deg',
                  animationDelay: effect.delay + 'ms',
                  animationDuration: effect.duration + 'ms'
                }"
              >
                🥚
              </div>
            </div>
          </div>

          <!-- Barre de progression des gains -->
          <div class="gains-display">
            <div class="gains-bar-container">
              <div class="gains-bar">
                <div 
                  class="gains-progress" 
                  :style="{ width: progressPercentage + '%' }"
                ></div>
              </div>
              <div class="gains-text">
                {{ currentGains }} / {{ eggState.maxIncome }}
              </div>
            </div>
            
            <div class="income-info">
              <span class="income-rate">{{ eggState.income }}/s</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useEgg } from '@/composables/useEgg'
import { usePlayer } from '@/composables/usePlayer'

const { 
  eggState, 
  currentGains, 
  isClickable, 
  progressPercentage,
  fetchEggStatus, 
  clickEgg, 
  startUpdates, 
  stopUpdates 
} = useEgg()

const { refreshPlayer } = usePlayer()

// Effets visuels
const eggEffects = ref([])
let effectId = 0

// Fonction pour créer l'effet d'œufs qui sautent
const createEggEffect = (eggsGained) => {
  const numEggs = Math.min(eggsGained, 8)
  
  for (let i = 0; i < numEggs; i++) {
    // Position de départ plus proche du centre (rayon plus petit)
    const startRadius = Math.random() * 10 // 0-10px du centre
    const startAngle = Math.random() * Math.PI * 2
    const startX = Math.cos(startAngle) * startRadius
    const startY = Math.sin(startAngle) * startRadius
    
    // Direction aléatoire pour le saut
    const jumpAngle = Math.random() * Math.PI * 2
    const jumpDistance = 40 + Math.random() * 60 // 40-100px
    const jumpX = Math.cos(jumpAngle) * jumpDistance
    const jumpY = Math.sin(jumpAngle) * jumpDistance - (20 + Math.random() * 20) // Légèrement vers le haut
    
    // Gravité pour la chute
    const fallDistance = 80 + Math.random() * 40 // Distance de chute
    
    const effect = {
      id: effectId++,
      startX: startX,
      startY: startY,
      jumpX: jumpX,
      jumpY: jumpY,
      fallY: jumpY + fallDistance,
      delay: i * 30, // Délai échelonné plus rapide
      duration: 1200 + Math.random() * 400, // Durée plus longue pour la physique
      rotation: Math.random() * 360 // Rotation initiale aléatoire
    }
    
    eggEffects.value.push(effect)
    
    // Supprimer l'effet après l'animation
    setTimeout(() => {
      const index = eggEffects.value.findIndex(e => e.id === effect.id)
      if (index > -1) {
        eggEffects.value.splice(index, 1)
      }
    }, effect.duration + effect.delay + 100)
  }
}

const handleEggClick = async () => {
  if (isClickable.value) {
    const eggsGained = Math.floor(currentGains.value)
    await clickEgg()
    // Créer l'effet visuel
    if (eggsGained > 0) {
      createEggEffect(eggsGained)
    }
    // Actualiser l'affichage des œufs dans la TopBar
    await refreshPlayer()
  }
}

onMounted(async () => {
  await fetchEggStatus()
  startUpdates()
})

onUnmounted(() => {
  stopUpdates()
})
</script>

<style scoped>
.production-screen {
  flex: 1;
  width: 100%;
  background: #f9f3e8;
  overflow: hidden;
  position: relative;
  font-family: 'Fredoka', sans-serif;
}

.production-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.egg-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.clickable-egg {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: transform 0.2s ease, filter 0.2s ease;
  filter: grayscale(0.5);
}

.clickable-egg.clickable {
  filter: grayscale(0);
  animation: pulse 2s infinite;
}

.clickable-egg.max-gains {
  animation: pulse 2s infinite, max-glow 2s infinite alternate;
}

.clickable-egg.clickable:hover {
  transform: scale(1.1);
}

.clickable-egg.loading {
  pointer-events: none;
  opacity: 0.7;
}

.egg-sprite {
  font-size: 80px;
  z-index: 2;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.egg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: glow 2s infinite alternate;
  z-index: 1;
}

.egg-effects-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.flying-egg {
  position: absolute;
  font-size: 12px;
  animation: fly-and-fall 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  pointer-events: none;
  transform: translate(-50%, -50%);
  left: 50%;
  top: 50%;
}

.gains-display {
  background: rgba(255, 255, 255, 0.95);
  border: 3px solid #8B4513;
  border-radius: 12px;
  padding: 15px;
  min-width: 200px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.gains-bar-container {
  margin-bottom: 10px;
}

.gains-bar {
  width: 100%;
  height: 20px;
  background: #E0E0E0;
  border: 2px solid #8B4513;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.gains-progress {
  height: 100%;
  background: #b77b3d;
  transition: width 0.3s ease;
  border-radius: 2px;
  background-image: url('@/assets/bar/bg.png');
}

.gains-text {
  text-align: center;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  font-size: 16px;
  color: #8B4513;
  margin-top: 5px;
}

.income-info {
  text-align: center;
  font-family: 'Courier New', monospace;
  color: #666;
  font-size: 14px;
}

.income-rate {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.egg-clicker {
  background-color: #421d00;
  background-image: url('@/assets/bar/bg.png');
  background-repeat: repeat;
  width: 350px;
  height: 290px;
  padding-top: 20px;
  border-radius: 10px;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  position: relative;
  border: 4px solid #b77b3d;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.25);
}

@keyframes fly-and-fall {
  0% {
    opacity: 1;
    transform: translate(var(--start-x), var(--start-y)) scale(1) rotate(var(--rotation));
  }
  30% {
    opacity: 1;
    transform: translate(var(--jump-x), var(--jump-y)) scale(1.1) rotate(calc(var(--rotation) + 180deg));
  }
  100% {
    opacity: 0;
    transform: translate(var(--jump-x), var(--fall-y)) scale(0.8) rotate(calc(var(--rotation) + 720deg));
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes max-glow {
  0% { filter: brightness(1) drop-shadow(0 0 5px rgba(255, 215, 0, 0.3)); }
  100% { filter: brightness(1.1) drop-shadow(0 0 10px rgba(255, 215, 0, 0.5)); }
}

@keyframes glow {
  0% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
