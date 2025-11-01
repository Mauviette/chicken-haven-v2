<template>
  <div class="quests-overlay" :class="{ 'visible': visible, 'apocalypse-mode': isApocalypseMode }">
    <div class="quests-menu">
      <div class="quests-header">
        <h2>{{ isApocalypseMode ? '📜 Quêtes' : '📜 Quêtes' }}</h2>
        <div class="header-actions">
          <button
            class="refresh-btn"
            @click="handleRefresh"
            :disabled="refreshing"
            :title="refreshing ? 'Actualisation...' : 'Actualiser les quêtes'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="refresh-icon" :class="{ 'spinning': refreshing }">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
          <button class="close-btn" @click="closeMenu">✕</button>
        </div>
      </div>

      <div class="quests-content">
        <div class="quests-stats">
          <div class="stat-item">
            <span class="stat-number">{{ completedCount }}</span>
            <span class="stat-label">Complétées</span>
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

        <!-- Quête active -->
        <div v-if="activeQuest" class="active-quest-section">
          <h3>Quête Active</h3>
          <div class="active-quest-card">
            <div class="quest-header">
              <div class="quest-icon">{{ activeQuest?.icon || '📜' }}</div>
              <div class="quest-info">
                <div class="quest-name">{{ activeQuest?.nom || 'Chargement...' }}</div>
                <div class="quest-description">{{ activeQuest?.description || '' }}</div>
              </div>
              <button class="abandon-btn" @click="handleAbandonQuest" title="Abandonner la quête">
                🗑️
              </button>
            </div>

            <div class="quest-steps">
              <!-- Affichage de l'étape actuelle seulement -->
              <div
                v-if="currentStep"
                class="quest-step"
                :class="{ 
                  'completed': currentStep.completed, 
                  'waiting': currentStep.completed && !canClaimStepReward(currentStep) 
                }"
              >
                <!-- Indicateur d'étape -->
                <div class="step-indicator">
                  Étape {{ currentStep.stepNumber }}/{{ currentStep.totalSteps }}
                </div>
                
                <div class="step-content">
                  <div class="step-description">{{ currentStep.description }}</div>
                  
                  <!-- Liste des défis individuels -->
                  <div class="step-challenges">
                    <div
                      v-for="challenge in currentStep.challenges"
                      :key="challenge.type"
                      class="challenge-item"
                      :class="{ 'completed': getChallengeProgress(currentStep, challenge.type) >= challenge.objectif }"
                    >
                      <div class="challenge-header">
                        <span class="challenge-text">
                          {{ formatChallenge(challenge, getChallengeProgress(currentStep, challenge.type)) }}
                        </span>
                      </div>
                      <div class="challenge-progress">
                        <div class="progress-bar">
                          <div
                            class="progress-fill"
                            :style="{ width: Math.min(100, (getChallengeProgress(currentStep, challenge.type) / challenge.objectif) * 100) + '%' }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="!canClaimStepReward(currentStep)" class="step-reward">
                  <Tooltip
                    :text="getRewardDescription(currentStep.reward)"
                    position="left"
                  >
                    <div class="reward-preview">
                      <div class="reward-icon">
                        <img v-if="currentStep.reward.type === 'chicken'" :src="getRewardIcon(currentStep.reward)" :alt="formatReward(currentStep.reward)" class="reward-chicken-image" />
                        <span v-else>{{ getRewardIcon(currentStep.reward) }}</span>
                      </div>
                      <div class="reward-amount">{{ formatReward(currentStep.reward) }}</div>
                    </div>
                  </Tooltip>
                </div>
                <div v-else class="step-reward">
                  <button
                    class="claim-reward-btn"
                    @click="(e) => handleClaimStepReward(currentStep, e)"
                  >
                    <div class="reward-icon">
                      <img v-if="currentStep.reward.type === 'chicken'" :src="getRewardIcon(currentStep.reward)" :alt="formatReward(currentStep.reward)" class="reward-chicken-image" />
                      <span v-else>{{ getRewardIcon(currentStep.reward) }}</span>
                    </div>
                    <div class="reward-amount">{{ formatReward(currentStep.reward) }}</div>
                  </button>
                </div>
              </div>
              
              <!-- Message si quête terminée -->
              <div v-if="!currentStep" class="quest-completed-message">
                <div class="completed-icon">🎉</div>
                <div class="completed-text">Toutes les étapes sont terminées !</div>
                <div class="completed-subtext">Vous pouvez abandonner cette quête ou en accepter une nouvelle.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quêtes disponibles -->
        <div class="available-quests-section">
          <h3>Quêtes Disponibles</h3>
          <div class="available-quests-list">
            <div
              v-for="quest in availableQuests || []"
              :key="quest.id"
              class="available-quest-item"
            >
              <div class="quest-icon">{{ quest.icon || '📜' }}</div>
              <div class="quest-details">
                <div class="quest-name">{{ quest.nom || 'Chargement...' }}</div>
                <div class="quest-description">{{ quest.description || '' }}</div>
                <div class="quest-unlock" v-if="quest.abandoned">
                  Étape {{ quest.currentStepIndex + 1 }}/{{ quest.steps?.length || 1 }}
                </div>
                <div class="quest-unlock" v-else>
                  {{ quest.steps?.length || 1 }} étape{{ (quest.steps?.length || 1) > 1 ? 's' : '' }}
                </div>
                <div class="quest-final-reward" v-if="getFinalReward(quest)">
                  <span class="reward-label">Récompense finale:</span>
                  <Tooltip :text="getRewardDescription(getFinalReward(quest))">
                    <span class="reward-display">
                      <span class="reward-icon">
                        <img v-if="getFinalReward(quest).type === 'chicken'" :src="getRewardIcon(getFinalReward(quest))" :alt="formatReward(getFinalReward(quest))" class="reward-chicken-image-small" />
                        <span v-else>{{ getRewardIcon(getFinalReward(quest)) }}</span>
                      </span>
                      <span class="reward-amount">{{ formatReward(getFinalReward(quest)) }}</span>
                    </span>
                  </Tooltip>
                </div>
              </div>
              <button
                class="accept-quest-btn"
                @click="handleAcceptQuest(quest.id)"
                :disabled="!!activeQuest"
              >
                {{ quest.abandoned ? 'Continuer' : 'Accepter' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Quêtes à venir -->
        <div class="upcoming-quests-section" v-if="upcomingQuests && upcomingQuests.length > 0">
          <h3>Quêtes à Venir</h3>
          <div class="upcoming-quests-list">
            <div
              v-for="quest in upcomingQuests || []"
              :key="quest.id"
              class="upcoming-quest-item"
            >
              <div class="quest-icon">{{ quest.icon || '📜' }}</div>
              <div class="quest-details">
                <div class="quest-name">{{ quest.nom || 'Chargement...' }}</div>
                <div class="quest-description">{{ quest.description || '' }}</div>
                <div class="quest-unlock">
                  Débloquée au niveau {{ quest.unlock_level }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quêtes terminées -->
        <div class="completed-quests-section" v-if="completedQuests && completedQuests.length > 0">
          <h3>Quêtes Terminées</h3>
          <div class="completed-quests-list">
            <div
              v-for="quest in completedQuests || []"
              :key="quest.id"
              class="completed-quest-item"
            >
              <div class="quest-icon">{{ quest.icon || '📜' }}</div>
              <div class="quest-details">
                <div class="quest-name">{{ quest.nom || 'Chargement...' }}</div>
                <div class="quest-description">{{ quest.description || '' }}</div>
                <div class="quest-completed-badge">✓ Terminée</div>
              </div>
            </div>
          </div>
        </div>

        <br/><br/><br/>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useQuests } from '@/composables/useQuests'
import Tooltip from '@/components/menu/Tooltip.vue'
import { flyBlueberriesToAvatar } from '@/utils/blueberryAnimation.js'
import { usePlayer } from '@/composables/usePlayer'
import { useSound } from '@/composables/useSound'
import { useGameData } from '@/composables/useGameData'
import { useRoute } from 'vue-router'
import { usePoules } from '@/composables/usePoules'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

  const {
    userQuests,
    quests,
    activeQuest,
    availableQuests,
    completedCount,
    totalCount,
    progressPercentage,
    fetchQuestsStatus,
    acceptQuest,
    abandonQuest,
    claimStepReward,
    checkQuestProgress,
    startAutoCheck,
    stopAutoCheck,
    getStepProgress,
    canClaimStepReward,
    getChallengeProgress,
    formatChallenge,
    fetchGameData,
    completedQuests,
    upcomingQuests
  } = useQuests()

const { items, especies } = useGameData()
const { eggs, addEggs, addTokens, refreshPlayer, apocalypse } = usePlayer()
const { confirm: sndConfirm } = useSound()
const route = useRoute()
const { getImage, poules, hiddenImage } = usePoules()

// Données des items depuis le backend
const itemsData = computed(() => items.value)

const isApocalypseMode = computed(() => {
  const val = Boolean(apocalypse?.value)
  return val
})

// Étape actuelle de la quête active
const currentStep = computed(() => {
  if (!activeQuest.value || !activeQuest.value.steps) return null
  
  const quest = activeQuest.value
  
  // Trouver la première étape qui n'a pas eu sa récompense réclamée
  for (let i = 0; i < quest.steps.length; i++) {
    const step = quest.steps[i]
    const stepProgress = userQuests.value?.questProgress?.[quest.id]?.[step.id] || {}
    
    // Si la récompense n'a pas été réclamée, c'est l'étape actuelle
    if (!stepProgress.rewardClaimed) {
      return {
        ...step,
        stepNumber: i + 1,
        totalSteps: quest.steps.length,
        completed: getStepProgress(step) === 100
      }
    }
  }
  
  // Si toutes les étapes ont été réclamées, la quête est terminée
  return null
})

const refreshing = ref(false)

// Charger les quêtes au montage du composant
onMounted(async () => {
  await fetchQuestsStatus()
  await checkQuestProgress()
  startAutoCheck()
})

onUnmounted(() => {
  stopAutoCheck()
})

// Fermer automatiquement le menu sur mobile lors de la navigation vers un profil utilisateur
watch(() => route.path, (newPath) => {
  if (props.visible && newPath.startsWith('/user/') && window.innerWidth <= 768) {
    closeMenu()
  }
})

const closeMenu = () => {
  emit('close')
}

const claiming = ref({})

const handleClaimStepReward = async (step, event) => {
  if (canClaimStepReward(step) && !claiming.value[step.id]) {
    // Anti double-clic sur cette étape
    claiming.value[step.id] = true

    // Obtenir le rect de départ pour l'animation (bouton cliqué)
    let startRect
    try {
      const el = event?.currentTarget || event?.target
      startRect = el?.getBoundingClientRect?.()
    } catch (_) {}

    const reward = await claimStepReward(step.id)
    if (reward) {
      // Son de récompense
      try { sndConfirm() } catch (_) {}
      // Appliquer localement une mise à jour UI rapide
      if (reward.type === 'eggs') {
        addEggs?.(reward.quantite || 0)
      } else if (reward.type === 'stock_token' || reward.type === 'production_token' || reward.type === 'mining_token') {
        addTokens?.(reward.type, reward.quantite || 0)
      } else if (reward.type === 'blueberry') {
        // Animation de myrtilles -> avatar
        flyBlueberriesToAvatar({ count: Math.min(6, reward.quantite || 1), startRect })
      }

      // Rafraîchir les données joueur pour refléter les changements serveur (œufs/XP)
      try { await refreshPlayer() } catch (_) {}
    }
    claiming.value[step.id] = false
  }
}

const handleAcceptQuest = async (questId) => {
  if (activeQuest.value) return

  const success = await acceptQuest(questId)
  if (success) {
    // Son de confirmation
    try { sndConfirm() } catch (_) {}
  }
}

const handleAbandonQuest = async () => {
  if (!activeQuest.value) return

  const success = await abandonQuest()
  if (success) {
    // Son de confirmation
    try { sndConfirm() } catch (_) {}
  }
}

const handleRefresh = async () => {
  if (refreshing.value) return

  refreshing.value = true
  try {
    // Forcer le rechargement des données de jeu (pour les nouvelles quêtes)
    await fetchGameData(true)

    await fetchQuestsStatus()
    await checkQuestProgress()
  } catch (error) {
    console.error('Erreur lors de l\'actualisation des quêtes:', error)
  } finally {
    // Garder le bouton désactivé pendant 1 seconde
    setTimeout(() => {
      refreshing.value = false
    }, 1000)
  }
}

const formatReward = (reward) => {
  if (!reward) return ''
  
  if (reward.type === 'chicken') {
    // Pour les récompenses secrètes, afficher un texte mystère
    if (reward.secret) {
      return 'Poule ???'
    }
    // Pour les récompenses de poules, on affiche le nom de l'espèce
    const especiesData = especies.value?.[reward.especeId]
    const chickenName = especiesData?.nom || reward.especeId
    return `${reward.quantite}x ${chickenName}`
  }

  const itemData = itemsData.value?.[reward.type]
  if (!itemData || typeof reward.quantite !== 'number') return 'Valeur invalide'
  return `${reward.quantite} ${reward.quantite === 1 ? itemData.nom_singulier : itemData.nom}`
}

const getRewardIcon = (reward) => {
  if (!reward) return '❓'

  if (reward.type === 'chicken') {
    // Pour les récompenses secrètes, utiliser l'image cachée
    if (reward.secret) {
      return hiddenImage
    }
    return getImage(reward.especeId)
  }

  const itemData = itemsData.value?.[reward.type]
  return itemData ? itemData.icon : '❓'
}

const getRewardDescription = (reward) => {
  if (!reward) return 'Aucune récompense'

  if (reward.type === 'chicken') {
    // Pour les récompenses secrètes, afficher une description mystère
    if (reward.secret) {
      return `<strong>Poule ???</strong><br>Une poule mystérieuse que vous n'avez pas encore découverte.`
    }
    const especiesData = especies.value?.[reward.especeId]
    const chickenName = especiesData?.nom || reward.especeId
    const description = especiesData?.description || 'Une nouvelle poule à ajouter à votre équipe.'
    return `<strong>${formatReward(reward)}</strong><br>${description}`
  }

  const itemData = itemsData.value?.[reward.type]
  if (!itemData) return 'Récompense inconnue'

  return `<strong>${formatReward(reward)}</strong><br>${itemData.description}`
}

const getStepProgressWidth = (step) => {
  return getStepProgress(step)
}

const getStepProgressText = (step) => {
  const progress = getStepProgress(step)
  return `${progress}%`
}

const getFinalReward = (quest) => {
  if (!quest || !quest.steps || quest.steps.length === 0) return null
  // Retourner la récompense de la dernière étape
  const finalReward = quest.steps[quest.steps.length - 1]?.reward || null

  // Appliquer la logique de récompense secrète comme dans le backend
  if (finalReward && finalReward.type === 'chicken' && !poules.value?.some(p => p.especeId === finalReward.especeId && p.owned)) {
    return { ...finalReward, secret: true }
  }

  return finalReward
}
</script>

<style scoped>
.quests-overlay {
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

.quests-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.quests-menu {
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

.quests-overlay.visible .quests-menu {
  transform: translateX(0);
}

.quests-header {
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

.quests-header h2 {
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
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
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

.quests-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

.quests-stats {
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

.available-quests-section,
.upcoming-quests-section {
  padding: 15px;
}

.available-quests-section h3,
.upcoming-quests-section h3 {
  margin: 0 0 10px 0;
  color: #8B4513;
  font-size: 16px;
  font-weight: bold;
}

.available-quests-list,
.upcoming-quests-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.available-quest-item,
.upcoming-quest-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #ddd;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.available-quest-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.upcoming-quest-item {
  opacity: 0.7;
  background: rgba(255, 255, 255, 0.6);
  border-color: #ccc;
}

.upcoming-quest-item:hover {
  transform: none;
  box-shadow: none;
  cursor: default;
}

.available-quest-item .quest-icon,
.upcoming-quest-item .quest-icon {
  font-size: 20px;
  min-width: 25px;
}

.available-quest-item .quest-details,
.upcoming-quest-item .quest-details {
  flex: 1;
}

.available-quest-item .quest-name,
.upcoming-quest-item .quest-name {
  font-size: 14px;
  font-weight: bold;
  color: #8B4513;
  margin-bottom: 2px;
}

.available-quest-item .quest-description,
.upcoming-quest-item .quest-description {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  line-height: 1.3;
}

.quest-unlock {
  font-size: 10px;
  color: #888;
  font-style: italic;
}

.quest-final-reward {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  padding: 4px 8px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid #FFD700;
  border-radius: 4px;
}

.reward-label {
  font-size: 10px;
  color: #8B4513;
  font-weight: bold;
}

.reward-display {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: url('@/assets/ui/cursor/mark_question.png') 0 0, auto;
}

.reward-display .reward-icon {
  font-size: 14px;
}

.reward-display .reward-amount {
  font-size: 11px;
  color: #8B4513;
  font-weight: bold;
}

.accept-quest-btn {
  background: linear-gradient(145deg, #28a745, #20c997);
  border: 2px solid #155724;
  color: white;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: bold;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s ease;
}

.accept-quest-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #218838, #17a2b8);
  transform: scale(1.05);
}

.accept-quest-btn:disabled {
  opacity: 0.5;
    cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;

  transform: none;
}

/* Section Quêtes Terminées */
.completed-quests-section {
  padding: 15px;
}

.completed-quests-section h3 {
  margin: 0 0 10px 0;
  color: #8B4513;
  font-size: 16px;
  font-weight: bold;
}

.completed-quests-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.completed-quest-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(40, 167, 69, 0.1);
  border: 2px solid #28a745;
  border-radius: 6px;
  opacity: 0.8;
}

.completed-quest-item .quest-icon {
  font-size: 18px;
  min-width: 22px;
  opacity: 0.7;
}

.completed-quest-item .quest-details {
  flex: 1;
}

.completed-quest-item .quest-name {
  font-size: 13px;
  font-weight: bold;
  color: #28a745;
  margin-bottom: 2px;
}

.completed-quest-item .quest-description {
  font-size: 10px;
  color: #666;
  line-height: 1.3;
}

.quest-completed-badge {
  font-size: 9px;
  color: #28a745;
  font-weight: bold;
  background: rgba(40, 167, 69, 0.2);
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid #28a745;
}

/* Section Quête Active */
.active-quest-section {
  padding: 15px;
}

.active-quest-section h3 {
  margin: 0 0 10px 0;
  color: #8B4513;
  font-size: 16px;
  font-weight: bold;
}

.active-quest-card {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 15px;
}

.quest-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.quest-icon {
  font-size: 24px;
  min-width: 30px;
  text-align: center;
}

.quest-info {
  flex: 1;
}

.quest-name {
  font-size: 16px;
  font-weight: bold;
  color: #8B4513;
  margin-bottom: 4px;
}

.quest-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.abandon-btn {
  background: #dc3545;
  border: 2px solid #b02a37;
  color: white;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s ease;
}

.abandon-btn:hover {
  background: #c82333;
  transform: scale(1.1);
}

.quest-steps {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.quest-step {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quest-step.completed {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.1);
}

.step-indicator {
  background: #8B4513;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  align-self: flex-start;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-description {
  color: #8B4513;
  font-size: 14px;
  font-weight: bold;
  line-height: 1.4;
}

.step-challenges {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.challenge-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.challenge-item.completed .challenge-text {
  color: #28a745;
}

.challenge-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.challenge-text {
  color: #666;
  font-size: 12px;
  line-height: 1.3;
}

.challenge-progress {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s ease;
}

.step-reward {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 10px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid #ffd700;
  border-radius: 6px;
  margin-top: 8px;
  max-width: fit-content;
  align-self: center;
}

.reward-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: url('@/assets/ui/cursor/mark_question.png') 0 0, auto;
}

.reward-preview .reward-icon {
  font-size: 16px;
}

.reward-preview .reward-amount {
  font-size: 12px;
  color: #8B4513;
  font-weight: bold;
}

.claim-reward-btn {
  background: linear-gradient(145deg, #ffd700, #FFA500);
  border: 2px solid #444444;
  color: #8B4513;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: bold;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.claim-reward-btn:hover {
  background: linear-gradient(145deg, #FFA500, #FF8C00);
  transform: scale(1.05);
}

.claim-reward-btn .reward-icon {
  font-size: 16px;
}

.claim-reward-btn .reward-amount {
  font-size: 12px;
  font-weight: bold;
}

.reward-chicken-image {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 2px;
}

.reward-chicken-image-small {
  width: 16px;
  height: 16px;
  object-fit: contain;
  border-radius: 2px;
}

.quest-completed-message {
  background: rgba(40, 167, 69, 0.1);
  border: 2px solid #28a745;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.completed-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.completed-text {
  color: #28a745;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}

.completed-subtext {
  color: #666;
  font-size: 12px;
}

/* Mode Apocalypse */
.quests-overlay.apocalypse-mode .quests-menu {
  background: #2d1b1b;
  border-left: 4px solid #8b0000;
}

.quests-overlay.apocalypse-mode .quests-header {
  background: #1a0f0f;
  border-bottom: 2px solid #8b0000;
}

.quests-overlay.apocalypse-mode .quests-header h2 {
  color: #ffcccc;
}

.quests-overlay.apocalypse-mode .close-btn,
.quests-overlay.apocalypse-mode .refresh-btn {
  background: #4a1a0a;
  border: 2px solid #ff4444;
  color: #ffcccc;
}

.quests-overlay.apocalypse-mode .close-btn:hover,
.quests-overlay.apocalypse-mode .refresh-btn:hover:not(:disabled) {
  background: #5a2a1a;
}

.quests-overlay.apocalypse-mode .quests-stats {
  background: rgba(45, 27, 27, 0.8);
}

.quests-overlay.apocalypse-mode .stat-number {
  color: #ff6b6b;
}

.quests-overlay.apocalypse-mode .quest-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.quests-overlay.apocalypse-mode .quest-icon {
  font-size: 24px;
  min-width: 30px;
  text-align: center;
}

.quests-overlay.apocalypse-mode .quest-info {
  flex: 1;
}

.quests-overlay.apocalypse-mode .quest-step {
  background: rgba(45, 27, 27, 0.8);
  border-color: #ff4444;
}

.quests-overlay.apocalypse-mode .quest-step.completed {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.quests-overlay.apocalypse-mode .step-indicator {
  background: #8b0000;
}

.quests-overlay.apocalypse-mode .quest-completed-message {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}

.quests-overlay.apocalypse-mode .completed-text {
  color: #ff6b6b;
}

.quests-overlay.apocalypse-mode .completed-subtext {
  color: #ffaaaa;
}

.quests-overlay.apocalypse-mode .step-description {
  color: #ffcccc;
}

.quests-overlay.apocalypse-mode .challenge-text {
  color: #ffaaaa;
}

.quests-overlay.apocalypse-mode .challenge-item.completed .challenge-text {
  color: #ff6b6b;
}

.quests-overlay.apocalypse-mode .challenge-progress .progress-bar {
  background: #3d1f1f;
  border-color: #ff4444;
}

.quests-overlay.apocalypse-mode .challenge-progress .progress-fill {
  background: linear-gradient(90deg, #ff6b6b, #ff4444);
}

.quests-overlay.apocalypse-mode .step-reward {
  background: rgba(255, 68, 68, 0.2);
  border-color: #ff4444;
}

.quests-overlay.apocalypse-mode .claim-reward-btn {
  background: linear-gradient(145deg, #ff4444, #cc3333);
  border-color: #8b0000;
}

.quests-overlay.apocalypse-mode .claim-reward-btn:hover {
  background: linear-gradient(145deg, #cc3333, #aa2222);
}

.quests-overlay.apocalypse-mode .reward-preview {
  background: rgba(45, 27, 27, 0.3);
  border-color: #ff4444;
}

.quests-overlay.apocalypse-mode .reward-amount {
  color: #ffcccc;
}

.quests-overlay.apocalypse-mode .active-quest-section,
.quests-overlay.apocalypse-mode .available-quests-section,
.quests-overlay.apocalypse-mode .upcoming-quests-section {
  padding: 15px;
}

.quests-overlay.apocalypse-mode .active-quest-section h3,
.quests-overlay.apocalypse-mode .available-quests-section h3,
.quests-overlay.apocalypse-mode .upcoming-quests-section h3 {
  margin: 0 0 10px 0;
  color: #ffcccc;
  font-size: 16px;
  font-weight: bold;
}

.quests-overlay.apocalypse-mode .quest-unlock {
  color: #ff8888;
}

.quests-overlay.apocalypse-mode .quest-final-reward {
  background: rgba(255, 68, 68, 0.1);
  border-color: #ff4444;
}

.quests-overlay.apocalypse-mode .reward-label {
  color: #ffcccc;
}

.quests-overlay.apocalypse-mode .reward-display .reward-amount {
  color: #ffcccc;
}

.quests-overlay.apocalypse-mode .accept-quest-btn {
  background: linear-gradient(145deg, #ff4444, #cc3333);
  border-color: #8b0000;
}

.quests-overlay.apocalypse-mode .accept-quest-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #cc3333, #aa2222);
}

.quests-overlay.apocalypse-mode .completed-quest-item {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}

.quests-overlay.apocalypse-mode .completed-quest-item .quest-name {
  color: #ff6b6b;
}

.quests-overlay.apocalypse-mode .completed-quest-item .quest-description {
  color: #ffaaaa;
}

.quests-overlay.apocalypse-mode .quest-completed-badge {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.2);
  border-color: #ff6b6b;
}

/* Responsive */
@media (max-width: 768px) {
  .quests-overlay {
    top: 0;
    width: 100vw;
    left: 0;
    right: auto;
    height: 100vh;
  }

  .quests-menu {
    border-left: none;
    border-top: none;
    border-bottom: 2px solid #8B4513;
  }

  .quests-overlay.apocalypse-mode .quests-menu {
    border-bottom: 2px solid #8b0000;
  }
}

/* Dark Mode */
.dark-mode .quests-overlay.visible .quests-menu {
  background: #1a1a1a;
  border-left: 4px solid #444444;
}

.dark-mode .quests-header {
  background: #2a2a2a;
  border-bottom: 2px solid #444444;
}

.dark-mode .quests-header h2 {
  color: #e0e0e0;
}

.dark-mode .close-btn,
.dark-mode .refresh-btn {
  background: #444444;
  border: 2px solid #666666;
  color: #e0e0e0;
}

.dark-mode .close-btn:hover,
.dark-mode .refresh-btn:hover:not(:disabled) {
  background: #555555;
}

.dark-mode .quests-stats {
  background: rgba(26, 26, 26, 0.8);
}

.dark-mode .stat-number {
  color: #cccccc;
}

.dark-mode .quest-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.dark-mode .quest-icon {
  font-size: 24px;
  min-width: 30px;
  text-align: center;
}

.dark-mode .quest-info {
  flex: 1;
}

.dark-mode .quest-step {
  background: rgba(26, 26, 26, 0.8);
  border-color: #666666;
}

.dark-mode .quest-step.completed {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.1);
}

.dark-mode .step-indicator {
  background: #666666;
}

.dark-mode .quest-completed-message {
  background: rgba(40, 167, 69, 0.1);
  border-color: #28a745;
}

.dark-mode .completed-text {
  color: #28a745;
}

.dark-mode .completed-subtext {
  color: #cccccc;
}

.dark-mode .step-description {
  color: #e0e0e0;
}

.dark-mode .challenge-text {
  color: #cccccc;
}

.dark-mode .challenge-item.completed .challenge-text {
  color: #28a745;
}

.dark-mode .challenge-progress .progress-bar {
  background: #2a2a2a;
  border-color: #666666;
}

.dark-mode .challenge-progress .progress-fill {
  background: linear-gradient(90deg, #28a745, #20c997);
}

.dark-mode .step-reward {
  background: rgba(255, 215, 0, 0.1);
  border-color: #ffd700;
}

.dark-mode .claim-reward-btn {
  background: linear-gradient(145deg, #ffd700, #FFA500);
  border-color: #444444;
}

.dark-mode .claim-reward-btn:hover {
  background: linear-gradient(145deg, #FFA500, #FF8C00);
}

.dark-mode .reward-preview {
  background: rgba(255, 255, 255, 0.1);
  border-color: #666666;
}

.dark-mode .reward-amount {
  color: #e0e0e0;
}

.dark-mode .active-quest-section,
.dark-mode .available-quests-section,
.dark-mode .upcoming-quests-section {
  padding: 15px;
}

.dark-mode .active-quest-section h3,
.dark-mode .available-quests-section h3,
.dark-mode .upcoming-quests-section h3 {
  margin: 0 0 10px 0;
  color: #e0e0e0;
  font-size: 16px;
  font-weight: bold;
}

.dark-mode .quest-unlock {
  color: #888888;
}

.dark-mode .quest-final-reward {
  background: rgba(255, 215, 0, 0.05);
  border-color: #ffd700;
}

.dark-mode .reward-label {
  color: #e0e0e0;
}

.dark-mode .reward-display .reward-amount {
  color: #e0e0e0;
}

.dark-mode .accept-quest-btn {
  background: linear-gradient(145deg, #28a745, #20c997);
  border-color: #155724;
}

.dark-mode .completed-quest-item {
  background: rgba(40, 167, 69, 0.05);
  border-color: #28a745;
}

.dark-mode .completed-quest-item .quest-name {
  color: #28a745;
}

.dark-mode .completed-quest-item .quest-description {
  color: #cccccc;
}

.dark-mode .quest-completed-badge {
  color: #28a745;
  background: rgba(40, 167, 69, 0.1);
  border-color: #28a745;
}

/* Dark Mode + Apocalypse */
.dark-mode.apocalypse-mode .quests-overlay.visible .quests-menu {
  background: #1a0f0f;
  border-left: 4px solid #8b0000;
}

.dark-mode.apocalypse-mode .quests-header {
  background: #1a0f0f;
  border-bottom: 2px solid #8b0000;
}

.dark-mode.apocalypse-mode .quests-header h2 {
  color: #ffaaaa;
}

.dark-mode.apocalypse-mode .close-btn,
.dark-mode.apocalypse-mode .refresh-btn {
  background: #4a1a0a;
  border: 2px solid #ff4444;
  color: #ffaaaa;
}

.dark-mode.apocalypse-mode .close-btn:hover,
.dark-mode.apocalypse-mode .refresh-btn:hover:not(:disabled) {
  background: #5a2a1a;
}

.dark-mode.apocalypse-mode .quests-stats {
  background: rgba(26, 15, 15, 0.8);
}

.dark-mode.apocalypse-mode .stat-number {
  color: #ff6b6b;
}

.dark-mode.apocalypse-mode .quest-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
}

.dark-mode.apocalypse-mode .quest-icon {
  font-size: 24px;
  min-width: 30px;
  text-align: center;
}

.dark-mode.apocalypse-mode .quest-info {
  flex: 1;
}

.dark-mode.apocalypse-mode .quest-step {
  background: rgba(26, 15, 15, 0.8);
  border-color: #ff4444;
}

.dark-mode.apocalypse-mode .quest-step.completed {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.dark-mode.apocalypse-mode .step-indicator {
  background: #8b0000;
}

.dark-mode.apocalypse-mode .quest-completed-message {
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}

.dark-mode.apocalypse-mode .completed-text {
  color: #ff6b6b;
}

.dark-mode.apocalypse-mode .completed-subtext {
  color: #ffaaaa;
}

.dark-mode.apocalypse-mode .step-description {
  color: #ffaaaa;
}

.dark-mode.apocalypse-mode .challenge-text {
  color: #ff8888;
}

.dark-mode.apocalypse-mode .challenge-item.completed .challenge-text {
  color: #ff6b6b;
}

.dark-mode.apocalypse-mode .challenge-progress .progress-bar {
  background: #1a0f0f;
  border-color: #ff4444;
}

.dark-mode.apocalypse-mode .challenge-progress .progress-fill {
  background: linear-gradient(90deg, #ff6b6b, #ff4444);
}

.dark-mode.apocalypse-mode .step-reward {
  background: rgba(255, 68, 68, 0.2);
  border-color: #ff4444;
}

.dark-mode.apocalypse-mode .claim-reward-btn {
  background: linear-gradient(145deg, #ff4444, #cc3333);
  border-color: #8b0000;
}

.dark-mode.apocalypse-mode .claim-reward-btn:hover {
  background: linear-gradient(145deg, #cc3333, #aa2222);
}

.dark-mode.apocalypse-mode .reward-preview {
  background: rgba(26, 15, 15, 0.3);
  border-color: #ff4444;
}

.dark-mode.apocalypse-mode .reward-amount {
  color: #ffaaaa;
}

.dark-mode.apocalypse-mode .active-quest-section,
.dark-mode.apocalypse-mode .available-quests-section,
.dark-mode.apocalypse-mode .upcoming-quests-section {
  padding: 15px;
}

.dark-mode.apocalypse-mode .active-quest-section h3,
.dark-mode.apocalypse-mode .available-quests-section h3,
.dark-mode.apocalypse-mode .upcoming-quests-section h3 {
  margin: 0 0 10px 0;
  color: #ffaaaa;
  font-size: 16px;
  font-weight: bold;
}

.dark-mode.apocalypse-mode .quest-unlock {
  color: #ff6666;
}

.dark-mode.apocalypse-mode .quest-final-reward {
  background: rgba(255, 68, 68, 0.1);
  border-color: #ff4444;
}

.dark-mode.apocalypse-mode .reward-label {
  color: #ffaaaa;
}

.dark-mode.apocalypse-mode .reward-display .reward-amount {
  color: #ffaaaa;
}

.dark-mode.apocalypse-mode .accept-quest-btn {
  background: linear-gradient(145deg, #ff4444, #cc3333);
  border-color: #8b0000;
}

.dark-mode.apocalypse-mode .accept-quest-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #cc3333, #aa2222);
}

.dark-mode.apocalypse-mode .completed-quest-item {
  background: rgba(255, 107, 107, 0.05);
  border-color: #ff6b6b;
}

.dark-mode.apocalypse-mode .completed-quest-item .quest-name {
  color: #ff6b6b;
}

.dark-mode.apocalypse-mode .completed-quest-item .quest-description {
  color: #ffaaaa;
}

.dark-mode.apocalypse-mode .quest-completed-badge {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  border-color: #ff6b6b;
}
</style>