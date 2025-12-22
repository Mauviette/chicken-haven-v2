<template>
  <Popup @close="onClose">
    <div class="corn-falling-game">
      <h2>🌽 Attrape-Grains!</h2>
      <p class="game-desc">Cliquez sur les grains de maïs avant qu'ils tombent!</p>
      
      <!-- Timer -->
      <div class="timer-bar">
        <div class="timer-fill" :style="{ width: timerPercent + '%' }"></div>
        <span class="timer-text">{{ formattedTime }}</span>
      </div>
      
      <!-- Score -->
      <div class="score-display">
        <span class="score-icon">🌽</span>
        <span class="score-value">{{ grainsCollected }}</span>
      </div>
      
      <!-- Zone de jeu -->
      <div 
        class="game-area" 
        ref="gameArea"
      >
        <div 
          v-for="grain in activeGrains" 
          :key="grain.id"
          class="grain"
          :style="getGrainStyle(grain)"
          @click="collectGrain(grain.id)"
        >
          🌽
        </div>
        
        <!-- Message de début -->
        <div v-if="!gameStarted && !gameOver" class="start-message">
          <button class="start-btn" @click="startGame">
            ▶️ Commencer
          </button>
        </div>
      </div>
      
      <!-- Game Over -->
      <div v-if="gameOver" class="game-over">
        <h3>Temps écoulé!</h3>
        <p>Vous avez attrapé <strong>{{ grainsCollected }}</strong> grains!</p>
        <p>Récompense: <strong>{{ finalReward }}</strong> maïs 🌽</p>
        <button class="collect-btn" @click="collectReward">
          Récupérer 🌽
        </button>
      </div>
    </div>
  </Popup>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Popup from '@/components/menu/Popup.vue'
import { useSound } from '@/composables/useSound'

const { cornCatch, gameStart, harvestCollect } = useSound()

const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  vegetableData: Object
})

const emit = defineEmits(['complete', 'close', 'save-result'])

// Configuration
const DURATION = props.config.duration || 10 // secondes
const INITIAL_SPAWN_INTERVAL = props.config.initialSpawnInterval || 750 // ms
const FINAL_SPAWN_INTERVAL = props.config.finalSpawnInterval || 400 // ms
const GRAIN_VISIBLE_TIME = props.config.grainVisibleTime || 1750 // ms

// État du jeu
const gameArea = ref(null)
const gameStarted = ref(false)
const gameOver = ref(false)
const timeLeft = ref(DURATION)
const grainsCollected = ref(0)
const activeGrains = ref([])
const rewardSent = ref(false)

let grainIdCounter = 0
let timerInterval = null
let spawnInterval = null
let animationFrame = null
let lastSpawnTime = 0

// Formater le temps
const formattedTime = computed(() => {
  const seconds = Math.ceil(timeLeft.value)
  return `${seconds}s`
})

const timerPercent = computed(() => (timeLeft.value / DURATION) * 100)

// Récompense finale (1 à 3 basé sur les grains attrapés)
const finalReward = computed(() => {
  // Environ 10-15 grains possibles
  if (grainsCollected.value >= 12) return 3
  if (grainsCollected.value >= 6) return 2
  return 1
})

// Calculer l'intervalle de spawn actuel (accélère avec le temps)
function getCurrentSpawnInterval() {
  const progress = 1 - (timeLeft.value / DURATION)
  return INITIAL_SPAWN_INTERVAL - (progress * (INITIAL_SPAWN_INTERVAL - FINAL_SPAWN_INTERVAL))
}

// Générer un nouveau grain
function spawnGrain() {
  if (!gameArea.value || gameOver.value) return
  
  const areaRect = gameArea.value.getBoundingClientRect()
  const grainSize = 40
  
  const grain = {
    id: grainIdCounter++,
    x: Math.random() * (areaRect.width - grainSize),
    y: -grainSize,
    createdAt: Date.now(),
    collected: false,
    rotation: Math.random() * 360 // Rotation aléatoire
  }
  
  activeGrains.value.push(grain)
}

// Obtenir le style d'un grain
function getGrainStyle(grain) {
  const elapsed = Date.now() - grain.createdAt
  const progress = Math.min(elapsed / GRAIN_VISIBLE_TIME, 1)
  
  // Le grain tombe du haut vers le bas
  const areaHeight = gameArea.value?.clientHeight || 300
  const y = grain.y + (progress * (areaHeight + 50))
  
  return {
    left: `${grain.x}px`,
    top: `${y}px`,
    opacity: grain.collected ? 0 : (1 - progress * 0.5),
    transform: `rotate(${grain.rotation}deg)`
  }
}

// Collecter un grain
function collectGrain(grainId) {
  const grain = activeGrains.value.find(g => g.id === grainId)
  if (!grain || grain.collected) return
  
  grain.collected = true
  grainsCollected.value++
  cornCatch()
  
  // Retirer le grain après un court délai
  setTimeout(() => {
    activeGrains.value = activeGrains.value.filter(g => g.id !== grainId)
  }, 100)
}

// Boucle d'animation
let stopSpawning = false

function gameLoop() {
  if (gameOver.value) return
  
  const now = Date.now()
  
  // Spawn de nouveaux grains (seulement si on n'a pas stoppé)
  if (!stopSpawning && now - lastSpawnTime >= getCurrentSpawnInterval()) {
    spawnGrain()
    lastSpawnTime = now
  }
  
  // Retirer les grains expirés
  activeGrains.value = activeGrains.value.filter(grain => {
    if (grain.collected) return false
    return (now - grain.createdAt) < GRAIN_VISIBLE_TIME
  })
  
  // Continuer la boucle
  animationFrame = requestAnimationFrame(gameLoop)
}

function startGame() {
  gameStarted.value = true
  lastSpawnTime = Date.now()
  gameStart()
  
  // Timer principal
  timerInterval = setInterval(() => {
    timeLeft.value -= 0.1
    if (timeLeft.value <= 0) {
      endGame()
    }
  }, 100)
  
  // Démarrer la boucle de jeu
  gameLoop()
}

function endGame() {
  // Arrêter le timer et le spawn
  stopSpawning = true
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  
  // Continuer à animer jusqu'à ce que tous les grains disparaissent
  function waitForGrains() {
    const now = Date.now()
    // Retirer les grains expirés
    activeGrains.value = activeGrains.value.filter(grain => {
      if (grain.collected) return false
      return (now - grain.createdAt) < GRAIN_VISIBLE_TIME
    })
    
    if (activeGrains.value.length > 0) {
      requestAnimationFrame(waitForGrains)
    } else {
      // Tous les grains sont partis, terminer le jeu
      gameOver.value = true
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
      
      // Sauvegarder la récompense immédiatement pour éviter la perte si actualisation
      if (!rewardSent.value) {
        rewardSent.value = true
        emit('save-result', finalReward.value)
      }
    }
  }
  
  waitForGrains()
}

function collectReward() {
  harvestCollect()
  emit('complete')
}

function onClose() {
  if (!rewardSent.value) {
    rewardSent.value = true
    if (gameStarted.value) {
      emit('save-result', finalReward.value)
    } else {
      emit('save-result', 1) // Récompense minimum
    }
  }
  emit('complete')
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (animationFrame) cancelAnimationFrame(animationFrame)
})
</script>

<style scoped>
.corn-falling-game {
  text-align: center;
}

.corn-falling-game h2 {
  margin: 0 0 5px 0;
  font-family: 'Fredoka', sans-serif;
  color: var(--button-text);
}

.game-desc {
  margin: 0 0 15px 0;
  font-size: 13px;
  color: var(--button-text);
  opacity: 0.8;
}

.timer-bar {
  position: relative;
  height: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA500);
  transition: width 0.1s linear;
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 15px;
}

.score-icon {
  font-size: 28px;
}

.score-value {
  font-family: 'Fredoka', sans-serif;
  font-size: 32px;
  font-weight: bold;
  color: #FFD700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.game-area {
  position: relative;
  width: 100%;
  height: 250px;
  background: linear-gradient(180deg, #87CEEB 0%, #98FB98 100%);
  border-radius: 12px;
  border: 3px solid #8B4513;
  overflow: hidden;
  cursor: url('@/assets/ui/cursor/target_round_b.png') 0 0, pointer;
}

.grain {
  position: absolute;
  width: 56px;
  height: 56px;
  font-size: 32px;
  cursor: url('@/assets/ui/cursor/target_round_a.png') 0 0, pointer;
  transition: opacity 0.1s ease;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  /* Zone de clic plus grande que l'emoji */
  margin: -8px;
}

.grain:hover {
  filter: brightness(1.2);
}

.grain:active {
  filter: brightness(0.9);
}

.start-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.start-btn {
  padding: 15px 40px;
  background: #FFD700;
  color: #8B4513;
  border: none;
  border-radius: 12px;
  font-family: 'Fredoka', sans-serif;
  font-size: 20px;
  font-weight: bold;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.start-btn:hover {
  background: #FFA500;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.game-over {
  margin-top: 15px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.game-over h3 {
  margin: 0 0 10px 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 18px;
  color: var(--button-text);
}

.game-over p {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: var(--button-text);
}

.collect-btn {
  padding: 10px 25px;
  background: #8B4513;
  color: white;
  border: none;
  border-radius: 10px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
}

.collect-btn:hover {
  background: #A0522D;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 480px) {
  .corn-falling-game h2 {
    font-size: 18px;
  }
  
  .game-desc {
    font-size: 11px;
    margin-bottom: 10px;
  }
  
  .timer-bar {
    height: 16px;
    margin-bottom: 8px;
  }
  
  .timer-text {
    font-size: 10px;
  }
  
  .score-display {
    margin-bottom: 10px;
  }
  
  .score-icon {
    font-size: 24px;
  }
  
  .score-value {
    font-size: 26px;
  }
  
  .game-area {
    height: 200px;
    border-width: 2px;
    border-radius: 10px;
  }
  
  .grain {
    width: 48px;
    height: 48px;
    font-size: 26px;
    margin: -6px;
  }
  
  .start-btn {
    padding: 12px 30px;
    font-size: 16px;
    border-radius: 10px;
  }
  
  .game-over {
    padding: 12px;
    margin-top: 12px;
  }
  
  .game-over h3 {
    font-size: 16px;
  }
  
  .game-over p {
    font-size: 12px;
    margin-bottom: 8px;
  }
  
  .collect-btn {
    padding: 8px 20px;
    font-size: 13px;
  }
}

@media (max-width: 360px) {
  .game-area {
    height: 180px;
  }
  
  .grain {
    width: 42px;
    height: 42px;
    font-size: 22px;
    margin: -5px;
  }
  
  .start-btn {
    padding: 10px 24px;
    font-size: 14px;
  }
}

/* Touch-friendly: augmenter les zones de tap */
@media (pointer: coarse) {
  .grain {
    width: 60px;
    height: 60px;
    margin: -10px;
  }
}
</style>
