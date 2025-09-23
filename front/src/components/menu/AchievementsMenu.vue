<template>
  <div class="achievements-overlay" :class="{ 'visible': visible }">
    <div class="achievements-menu">
      <div class="achievements-header">
        <h2>🏆 Succès</h2>
        <button class="close-btn" @click="closeMenu">✕</button>
      </div>
      
      <div class="achievements-content">
        <div class="achievements-stats">
          <div class="stat-item">
            <span class="stat-number">{{ completedCount }}</span>
            <span class="stat-label">Complétés</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ totalCount }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ progressPercentage }}%</span>
            <span class="stat-label">Progression</span>
          </div>
        </div>

        <div class="achievements-list">
          <div 
            v-for="achievement in achievements" 
            :key="achievement.id"
            class="achievement-item"
            :class="{ 'completed': achievement.completed }"
          >
            <div class="achievement-icon">{{ achievement.icon }}</div>
            <div class="achievement-details">
              <div class="achievement-name">{{ achievement.nom }}</div>
              <div class="achievement-description">{{ achievement.description }}</div>
              <div class="achievement-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: getProgressWidth(achievement) + '%' }"
                  ></div>
                </div>
                <div class="progress-text">
                  {{ getCurrentProgress(achievement) }} / {{ achievement.objectif }}
                </div>
              </div>
            </div>
            <div class="achievement-reward" v-if="achievement.completed">
              <div class="reward-icon">🎁</div>
              <div class="reward-text">+{{ achievement.recompense.quantite }} œufs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { achievementsData } from '@/data/achievements.js'
import { usePlayer } from '@/composables/usePlayer'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const { eggs } = usePlayer()

const achievements = computed(() => {
  return Object.values(achievementsData)
})

const completedCount = computed(() => {
  return achievements.value.filter(a => a.completed).length
})

const totalCount = computed(() => {
  return achievements.value.length
})

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const getCurrentProgress = (achievement) => {
  if (achievement.type === 'eggs') {
    return Math.min(eggs.value, achievement.objectif)
  }
  return 0
}

const getProgressWidth = (achievement) => {
  const current = getCurrentProgress(achievement)
  return Math.min((current / achievement.objectif) * 100, 100)
}

const closeMenu = () => {
  emit('close')
}
</script>

<style scoped>
.achievements-overlay {
  position: fixed;
  top: 60px;
  right: 0;
  width: 350px;
  height: calc(100vh - 140px);
  z-index: 50;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.achievements-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.achievements-menu {
  width: 100%;
  height: 100%;
  background: #f9f3e8;
  border-left: 4px solid #8B4513;
  display: flex;
  flex-direction: column;
  font-family: 'Fredoka', sans-serif;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.achievements-overlay.visible .achievements-menu {
  transform: translateX(0);
}

.achievements-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #421d00;
  background-image: url('@/assets/bar/bg.png');
  background-repeat: repeat;
  border-bottom: 2px solid #8B4513;
}

.achievements-header h2 {
  margin: 0;
  color: #fff9e5;
  font-size: 20px;
}

.close-btn {
  background: #8B4513;
  border: 2px solid #ffc66e;
  color: #fff9e5;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;  
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: background 0.2s ease, transform 0.1s ease;
}

.close-btn:hover {
  background: #a0592a;
  transform: scale(1.1);
}

.achievements-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.achievements-stats {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 2px solid #8B4513;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #8B4513;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.achievements-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  gap: 12px;
  display: flex;
  flex-direction: column;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 3px solid #ddd;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.achievement-item.completed {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.achievement-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.achievement-icon {
  font-size: 28px;
  min-width: 35px;
  text-align: center;
}

.achievement-details {
  flex: 1;
}

.achievement-name {
  font-size: 14px;
  font-weight: bold;
  color: #8B4513;
  margin-bottom: 3px;
}

.achievement-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  color: #666;
  min-width: 55px;
  text-align: right;
}

.achievement-reward {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px;
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid #FFD700;
  border-radius: 6px;
}

.reward-icon {
  font-size: 16px;
}

.reward-text {
  font-size: 10px;
  color: #8B4513;
  font-weight: bold;
}

@media (max-width: 600px) {
  .achievements-overlay {
    width: 100vw;
    left: 0;
    right: auto;
  }
  
  .achievements-menu {
    border-left: none;
    border-top: 2px solid #8B4513;
    border-bottom: 2px solid #8B4513;
  }
}
</style>