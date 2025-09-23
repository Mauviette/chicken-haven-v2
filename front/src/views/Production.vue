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
              'loading': eggState.isLoading 
            }"
            @click="handleEggClick"
          >
            <div class="egg-sprite">🥚</div>
            <div class="egg-glow" v-if="isClickable"></div>
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
import { onMounted, onUnmounted } from 'vue'
import { useEgg } from '@/composables/useEgg'

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

const handleEggClick = () => {
  if (isClickable.value) {
    clickEgg()
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
  cursor: pointer;
  transition: transform 0.2s ease, filter 0.2s ease;
  filter: grayscale(0.5);
}

.clickable-egg.clickable {
  filter: grayscale(0);
  animation: pulse 2s infinite;
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
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.gains-progress {
  height: 100%;
  background: #FFA500;
  transition: width 0.3s ease;
  border-radius: 4px;
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
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
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
