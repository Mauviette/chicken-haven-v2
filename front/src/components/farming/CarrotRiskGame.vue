<template>
  <Popup @close="onClose">
    <div class="carrot-risk-game">
      <h2>🥕 Choix Risqué</h2>
      <p class="game-desc">Choisissez des carottes, mais attention à la bombe!</p>
      
      <!-- Score actuel -->
      <div class="score-display">
        <span class="score-label">Carottes récoltées:</span>
        <span class="score-value">{{ carrotsCollected }} 🥕</span>
      </div>
      
      <!-- Avertissement -->
      <div v-if="carrotsCollected > 0 && !gameOver" class="warning-text">
        ⚠️ Si vous touchez la bombe, vous perdez tout!
      </div>
      
      <!-- Les carottes -->
      <div class="carrots-container">
        <div 
          v-for="(carrot, index) in carrots" 
          :key="index"
          class="carrot-slot"
          :class="{ 
            'revealed': carrot.revealed,
            'is-bomb': carrot.revealed && carrot.isBomb,
            'is-carrot': carrot.revealed && !carrot.isBomb,
            'hidden': !carrot.revealed && gameOver
          }"
          @click="selectCarrot(index)"
        >
          <span v-if="carrot.revealed" class="carrot-content">
            {{ carrot.isBomb ? '💣' : '🥕' }}
          </span>
          <span v-else class="carrot-hidden">
            <span class="carrot-top">🥬</span>
            <span class="carrot-underground">?</span>
          </span>
        </div>
      </div>
      
      <!-- Bouton pour s'arrêter -->
      <div v-if="!gameOver && carrotsCollected > 0" class="stop-section">
        <button class="stop-btn" @click="stopAndCollect">
          🛑 S'arrêter et garder {{ carrotsCollected }} carotte(s)
        </button>
      </div>
      
      <!-- Game Over -->
      <div v-if="gameOver" class="game-over">
        <h3 v-if="hitBomb">💥 Boom! Vous avez touché la bombe!</h3>
        <h3 v-else-if="allCarrotsCollected">🎉 Parfait! Toutes les carottes!</h3>
        <h3 v-else>✅ Bien joué!</h3>
        <p>Vous récoltez <strong>{{ finalReward }}</strong> carotte(s)!</p>
        <button class="collect-btn" @click="collectReward">
          Récupérer 🥕
        </button>
      </div>
    </div>
  </Popup>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Popup from '@/components/menu/Popup.vue'
import { useSound } from '@/composables/useSound'

const { carrotPick, carrotBomb, gameWin, harvestCollect, click } = useSound()

const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  vegetableData: Object
})

const emit = defineEmits(['complete', 'close'])

// Configuration
const CARROT_COUNT = props.config.carrotCount || 5
const BOMB_COUNT = props.config.bombCount || 1

// État du jeu
const carrots = ref([])
const carrotsCollected = ref(0)
const gameOver = ref(false)
const hitBomb = ref(false)
const allCarrotsCollected = ref(false)
const rewardSent = ref(false)

// Récompense finale
const finalReward = computed(() => {
  if (hitBomb.value) return 0
  return carrotsCollected.value
})

// Générer les carottes
function generateCarrots() {
  const slots = []
  
  // Créer toutes les carottes (une est une bombe)
  for (let i = 0; i < CARROT_COUNT; i++) {
    slots.push({
      isBomb: false,
      revealed: false
    })
  }
  
  // Placer la bombe aléatoirement
  const bombIndex = Math.floor(Math.random() * CARROT_COUNT)
  slots[bombIndex].isBomb = true
  
  carrots.value = slots
}

function selectCarrot(index) {
  if (gameOver.value) return
  const carrot = carrots.value[index]
  if (carrot.revealed) return
  
  carrot.revealed = true
  
  if (carrot.isBomb) {
    hitBomb.value = true
    carrotsCollected.value = 0 // Perd tout!
    carrotBomb()
    // Révéler toutes les carottes immédiatement
    carrots.value.forEach(c => { c.revealed = true })
    // Attendre 1 seconde avant de terminer
    setTimeout(() => {
      endGame()
    }, 1000)
  } else {
    carrotsCollected.value++
    carrotPick()
    
    // Vérifier si toutes les vraies carottes ont été récoltées
    const remainingCarrots = carrots.value.filter(c => !c.revealed && !c.isBomb).length
    if (remainingCarrots === 0) {
      allCarrotsCollected.value = true
      gameWin()
      // Révéler la bombe et attendre 1 seconde
      carrots.value.forEach(c => { c.revealed = true })
      setTimeout(() => {
        endGame()
      }, 1000)
    }
  }
}

function stopAndCollect() {
  click()
  // Révéler toutes les carottes avant de terminer
  carrots.value.forEach(c => { c.revealed = true })
  setTimeout(() => {
    endGame()
  }, 500)
}

function endGame() {
  gameOver.value = true
  
  // Envoyer la récompense immédiatement pour éviter la perte si actualisation
  if (!rewardSent.value) {
    rewardSent.value = true
    emit('complete', finalReward.value)
  }
}

function collectReward() {
  harvestCollect()
  emit('close')
}

function onClose() {
  // Si le jeu n'est pas fini, envoyer ce qu'on a
  if (!gameOver.value && !rewardSent.value) {
    rewardSent.value = true
    emit('complete', carrotsCollected.value)
  }
}

onMounted(() => {
  generateCarrots()
})
</script>

<style scoped>
.carrot-risk-game {
  text-align: center;
}

.carrot-risk-game h2 {
  margin: 0 0 5px 0;
  font-family: 'Fredoka', sans-serif;
  color: var(--button-text);
}

.game-desc {
  margin: 0 0 20px 0;
  font-size: 13px;
  color: var(--button-text);
  opacity: 0.8;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px 20px;
  background: rgba(255, 165, 0, 0.2);
  border-radius: 10px;
}

.score-label {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  color: var(--button-text);
}

.score-value {
  font-family: 'Fredoka', sans-serif;
  font-size: 20px;
  font-weight: bold;
  color: #FF8C00;
}

.warning-text {
  margin-bottom: 15px;
  font-size: 13px;
  color: #FF6B6B;
  font-weight: bold;
  animation: pulse-warning 1s infinite;
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.carrots-container {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
}

.carrot-slot {
  width: 55px;
  height: 80px;
  background: linear-gradient(180deg, #8B7355 0%, #654321 100%);
  border: 3px solid #4A3728;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.carrot-slot:hover:not(.revealed) {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.carrot-slot.revealed {
  cursor: url('@/assets/ui/cursor/hand_point.png') 0 0, auto;
}

.carrot-slot.is-carrot {
  background: linear-gradient(180deg, #98FB98 0%, #228B22 100%);
  border-color: #006400;
}

.carrot-slot.is-bomb {
  background: linear-gradient(180deg, #FF6B6B 0%, #8B0000 100%);
  border-color: #4A0000;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}

.carrot-hidden {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.carrot-top {
  font-size: 24px;
  margin-bottom: -5px;
}

.carrot-underground {
  font-size: 20px;
  color: #DEB887;
  font-family: 'Fredoka', sans-serif;
  font-weight: bold;
}

.carrot-content {
  font-size: 36px;
}

.stop-section {
  margin: 20px 0;
}

.stop-btn {
  padding: 12px 24px;
  background: #228B22;
  color: white;
  border: none;
  border-radius: 10px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
}

.stop-btn:hover {
  background: #2E8B2E;
  transform: translateY(-2px);
}

.game-over {
  margin-top: 20px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.game-over h3 {
  margin: 0 0 10px 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 20px;
  color: var(--button-text);
}

.game-over p {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: var(--button-text);
}

.collect-btn {
  padding: 12px 30px;
  background: #8B4513;
  color: white;
  border: none;
  border-radius: 10px;
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transition: all 0.2s ease;
}

.collect-btn:hover {
  background: #A0522D;
  transform: translateY(-2px);
}
</style>
