<template>
  <div class="achievements-overlay" :class="{ 'visible': visible }">
    <div class="achievements-menu">
      <div class="achievements-header">
        <h2>🏆 Succès</h2>
        <div class="header-actions">
          <button 
            class="refresh-btn" 
            @click="handleRefresh" 
            :disabled="refreshing"
            :title="refreshing ? 'Actualisation...' : 'Actualiser les succès'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="refresh-icon" :class="{ 'spinning': refreshing }">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          <button class="close-btn" @click="closeMenu">✕</button>
        </div>
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
            <div v-if="!achievement.rewardClaimed" class="achievement-reward">
              <button 
                v-if="achievement.completed"
                class="claim-reward-btn"
                @click="(e) => handleClaimReward(achievement, e)"
              >
                <div class="reward-icon">{{ getRewardIcon(achievement.reward) }}</div>
                <div class="reward-amount">{{ formatReward(achievement.reward) }}</div>
              </button>
              <!-- Aperçu uniquement tant que non complété -->
              <Tooltip 
                v-else
                :text="getRewardDescription(achievement.reward)" 
                position="left"
              >
                <div class="reward-preview">
                  <div class="reward-icon">{{ getRewardIcon(achievement.reward) }}</div>
                  <div class="reward-amount">{{ formatReward(achievement.reward) }}</div>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAchievements } from '@/composables/useAchievements'
import { formatString, achievementsData } from '@/data/items.js'
import Tooltip from '@/components/menu/Tooltip.vue'
import { flyBlueberriesToAvatar } from '@/utils/blueberryAnimation.js'
import { usePlayer } from '@/composables/usePlayer'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const { 
  achievements, 
  completedCount, 
  totalCount, 
  progressPercentage,
  fetchAchievements,
  checkAchievements,
  claimReward,
  startAutoCheck,
  stopAutoCheck
} = useAchievements()

const { eggs, addEggs, addTokens, refreshPlayer } = usePlayer()

const refreshing = ref(false)

// Charger les succès au montage du composant
onMounted(async () => {
  await fetchAchievements()
  await checkAchievements()
  startAutoCheck()
})

onUnmounted(() => {
  stopAutoCheck()
})

const getCurrentProgress = (achievement) => {
  return achievement.currentProgress || 0
}

const getProgressWidth = (achievement) => {
  return achievement.progressWidth || 0
}

const closeMenu = () => {
  emit('close')
}

const claiming = ref({})

const handleClaimReward = async (achievement, event) => {
  if (achievement.completed && !achievement.rewardClaimed) {
    // Anti double-clic sur ce succès
    if (claiming.value[achievement.id]) return
    claiming.value[achievement.id] = true
    // Obtenir le rect de départ pour l'animation (bouton cliqué)
    let startRect
    try {
      const el = event?.currentTarget || event?.target
      startRect = el?.getBoundingClientRect?.()
    } catch (_) {}

    const reward = await claimReward(achievement.id)
    if (reward) {
      // Appliquer localement une mise à jour UI rapide
      if (reward.type === 'eggs') {
        addEggs?.(reward.quantite || 0)
      } else if (reward.type === 'stock_token' || reward.type === 'production_token' || reward.type === 'wild_token') {
        addTokens?.(reward.type, reward.quantite || 0)
      } else if (reward.type === 'blueberry') {
        // Animation de myrtilles -> avatar
        flyBlueberriesToAvatar({ count: Math.min(6, reward.quantite || 1), startRect })
      }

      // Rafraîchir les données joueur pour refléter les changements serveur (œufs/XP)
      try { await refreshPlayer() } catch (_) {}

      // Optionnel: afficher une notification
      console.log(`Récompense réclamée: ${reward.quantite} ${reward.type}`)
      // Recharger l'état des succès pour refléter rewardClaimed
      try { await fetchAchievements(); await checkAchievements() } catch (_) {}
    }
    claiming.value[achievement.id] = false
  }
}

const handleRefresh = async () => {
  if (refreshing.value) return
  
  refreshing.value = true
  try {
    await fetchAchievements()
    const newAchievements = await checkAchievements()
    
    if (newAchievements && newAchievements.length > 0) {
      console.log(`🎉 ${newAchievements.length} nouveau(x) succès débloqué(s) !`)
    }
  } catch (error) {
    console.error('Erreur lors de l\'actualisation des succès:', error)
  } finally {
    // Garder le bouton désactivé pendant 1 seconde
    setTimeout(() => {
      refreshing.value = false
    }, 1000)
  }
}

const formatReward = (reward) => {
  if (!reward) return ''
  return formatString(reward.type, reward.quantite)
}

const getRewardIcon = (reward) => {
  if (!reward) return '❓'
  
  const itemData = achievementsData[reward.type]
  return itemData ? itemData.icon : '❓'
}

const getRewardDescription = (reward) => {
  if (!reward) return 'Aucune récompense'
  
  const itemData = achievementsData[reward.type]
  if (!itemData) return 'Récompense inconnue'
  
  return `<strong>${formatReward(reward)}</strong><br>${itemData.description}`
}
</script>

<style scoped>
.achievements-overlay {
  position: fixed;
  top: 60px;
  right: 0;
  width: 420px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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
  border-radius: 4px;
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

.refresh-btn {
  background: #8B4513;
  border: 2px solid #ffc66e;
  color: #fff9e5;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: #a0592a;
  transform: scale(1.1);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  border-radius: 4px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(139, 69, 19, 0.1);
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
  height: 8px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid #ccc;
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
  padding: 4px;
  background: rgba(255, 215, 0, 0.2);
  border: 2px solid #FFD700;
  border-radius: 3px;
}

.claim-reward-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(145deg, #FFD700, #FFA500);
  border: 2px solid #8B4513;
  border-radius: 3px;
  padding: 8px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s ease;
  font-family: inherit;
  min-width: 80px;
  box-shadow: 0 2px 4px rgba(139, 69, 19, 0.3);
}

.claim-reward-btn:hover {
  background: linear-gradient(145deg, #FFA500, #FF8C00);
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}



.reward-claimed {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.7;
  min-width: 80px;
  padding: 8px;
  background: rgba(76, 175, 80, 0.2);
  border: 2px solid #4CAF50;
  border-radius: 3px;
}

.reward-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 80px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid #ddd;
  border-radius: 3px;
  opacity: 0.6;
}

.reward-amount {
  font-size: 10px;
  color: #8B4513;
  font-weight: bold;
  text-align: center;
}

.reward-icon {
  font-size: 18px;
  min-width: 20px;
  text-align: center;
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