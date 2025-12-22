<template>
  <Popup @close="onClose">
    <div class="minesweeper-game">
      <h2>🥔 Récolte des Patates</h2>
      <p class="game-desc">Déterrez la grille sans toucher les bombes! <br><small v-if="!isMobile">Clic droit = poser un drapeau 🚩</small><small v-else>Maintenir = poser un drapeau 🚩</small></p>
      
      <!-- Timer -->
      <div class="timer-bar">
        <div class="timer-fill" :style="{ width: timerPercent + '%' }"></div>
        <span class="timer-text">{{ formattedTime }}</span>
      </div>
      
      <!-- Score -->
      <div class="score-display">
        <span>Démineur</span>
        <span class="flag-count">🚩 {{ flagsPlaced }} / {{ totalBombs }}</span>
      </div>
      
      <!-- Grille -->
      <div class="grid-container">
        <div 
          class="minesweeper-grid"
          :style="{ 
            gridTemplateColumns: `repeat(${config.gridWidth}, 1fr)`,
            gridTemplateRows: `repeat(${config.gridHeight}, 1fr)`
          }"
        >
          <div 
            v-for="(cell, index) in grid" 
            :key="index"
            class="cell"
            :class="getCellClass(cell)"
            @click="revealCell(index)"
            @contextmenu.prevent="toggleFlag(index)"
            @touchstart="onTouchStart(index)"
            @touchend="onTouchEnd"
            @touchmove="onTouchMove"
          >
            <span v-if="cell.flagged && !cell.revealed" class="cell-flag">🚩</span>
            <span v-else-if="cell.revealed" class="cell-content">
              {{ getCellContent(cell) }}
            </span>
            <span v-else class="cell-hidden">?</span>
          </div>
        </div>
      </div>
      
      <!-- Game Over -->
      <div v-if="gameOver" class="game-over-overlay">
        <div class="game-over-content">
          <h3>{{ hitBomb ? '💥 Boom!' : (timerExpired ? '⏱️ Temps écoulé!' : '🎉 Victoire!') }}</h3>
          <p class="result-text">
            Grille découverte: {{ revealedPercent }}%<br>
            Vous récoltez <strong>{{ finalReward }}</strong> patate(s)!
          </p>
          <button class="collect-btn" @click="collectReward">
            Récupérer 🥔
          </button>
        </div>
      </div>
    </div>
  </Popup>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Popup from '@/components/menu/Popup.vue'
import { useSound } from '@/composables/useSound'

const { mineReveal, mineFlag, mineBomb, gameWin, harvestCollect } = useSound()

const props = defineProps({
  config: {
    type: Object,
    required: true
  },
  vegetableData: Object
})

const emit = defineEmits(['complete', 'close', 'save-result'])

// Configuration
const GRID_WIDTH = props.config.gridWidth || 6
const GRID_HEIGHT = props.config.gridHeight || 5
const MIN_BOMBS = props.config.minBombs || 3
const MAX_BOMBS = props.config.maxBombs || 5
const TIME_LIMIT = props.config.timeLimit || 60

// État du jeu
const grid = ref([])
const gameOver = ref(false)
const hitBomb = ref(false)
const timerExpired = ref(false)
const timeLeft = ref(TIME_LIMIT)
const totalBombs = ref(0)
const totalSafeCells = ref(0)
const revealedCells = ref(0)
const firstClick = ref(true)
const flagsPlaced = ref(0)
const rewardSent = ref(false)
const isMobile = ref(false)

let timerInterval = null
let longPressTimer = null
let longPressIndex = null
const LONG_PRESS_DURATION = 400 // ms

// Formater le temps
const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60)
  const seconds = timeLeft.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const timerPercent = computed(() => (timeLeft.value / TIME_LIMIT) * 100)

// Pourcentage de cases découvertes
const revealedPercent = computed(() => {
  if (totalSafeCells.value === 0) return 0
  return Math.round((revealedCells.value / totalSafeCells.value) * 100)
})

// Calcul de la récompense finale basée sur la progression
const finalReward = computed(() => {
  const percent = revealedPercent.value
  // Moins de 50% : 1 patate
  // 50% à 99% : 2 patates
  // 100% : 3 patates
  if (percent >= 100) return 3
  if (percent >= 50) return 2
  return 1
})

// Générer la grille (sans placer les bombes si firstClickIndex est null)
function generateGrid(firstClickIndex = null) {
  const totalCells = GRID_WIDTH * GRID_HEIGHT
  const numBombs = MIN_BOMBS + Math.floor(Math.random() * (MAX_BOMBS - MIN_BOMBS + 1))
  
  // Créer les cellules
  const cells = []
  for (let i = 0; i < totalCells; i++) {
    cells.push({
      type: 'empty',
      revealed: false,
      flagged: false,
      adjacentBombs: 0
    })
  }
  
  // Zone protégée autour du premier clic (le clic + les 8 cases adjacentes)
  const protectedCells = new Set()
  if (firstClickIndex !== null) {
    protectedCells.add(firstClickIndex)
    const row = Math.floor(firstClickIndex / GRID_WIDTH)
    const col = firstClickIndex % GRID_WIDTH
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const newRow = row + dr
        const newCol = col + dc
        if (newRow >= 0 && newRow < GRID_HEIGHT && newCol >= 0 && newCol < GRID_WIDTH) {
          protectedCells.add(newRow * GRID_WIDTH + newCol)
        }
      }
    }
  }
  
  // Placer les bombes (pas dans la zone protégée)
  let bombsPlaced = 0
  while (bombsPlaced < numBombs) {
    const idx = Math.floor(Math.random() * totalCells)
    if (cells[idx].type === 'empty' && !protectedCells.has(idx)) {
      cells[idx].type = 'bomb'
      bombsPlaced++
    }
  }
  
  totalBombs.value = numBombs
  totalSafeCells.value = totalCells - numBombs
  
  // Calculer les bombes adjacentes pour chaque cellule
  for (let i = 0; i < totalCells; i++) {
    if (cells[i].type !== 'bomb') {
      cells[i].adjacentBombs = countAdjacentBombs(i, cells)
    }
  }
  
  grid.value = cells
}

function countAdjacentBombs(index, cells) {
  const row = Math.floor(index / GRID_WIDTH)
  const col = index % GRID_WIDTH
  let count = 0
  
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const newRow = row + dr
      const newCol = col + dc
      if (newRow >= 0 && newRow < GRID_HEIGHT && newCol >= 0 && newCol < GRID_WIDTH) {
        const newIndex = newRow * GRID_WIDTH + newCol
        if (cells[newIndex].type === 'bomb') count++
      }
    }
  }
  
  return count
}

function revealCell(index) {
  if (gameOver.value) return
  const cell = grid.value[index]
  if (cell.revealed || cell.flagged) return
  
  // Premier clic: régénérer la grille pour que ce clic soit sûr
  if (firstClick.value) {
    firstClick.value = false
    generateGrid(index)
    // Récupérer la cellule après régénération
    const newCell = grid.value[index]
    newCell.revealed = true
    revealedCells.value++
    mineReveal()
    
    // Si c'est une cellule vide sans bombes adjacentes, révéler les voisines
    if (newCell.adjacentBombs === 0) {
      revealAdjacentCells(index)
    }
    checkWin()
    return
  }
  
  cell.revealed = true
  
  if (cell.type === 'bomb') {
    hitBomb.value = true
    mineBomb()
    // Révéler toutes les cellules immédiatement
    grid.value.forEach(c => { c.revealed = true })
    // Attendre 1 seconde avant de terminer
    setTimeout(() => {
      endGame()
    }, 1000)
    return
  }
  
  mineReveal()
  revealedCells.value++
  
  // Si c'est une cellule vide sans bombes adjacentes, révéler les voisines
  if (cell.adjacentBombs === 0) {
    revealAdjacentCells(index)
  }
  
  checkWin()
}

// Toggle drapeau avec clic droit
function toggleFlag(index) {
  if (gameOver.value) return
  const cell = grid.value[index]
  if (cell.revealed) return
  
  cell.flagged = !cell.flagged
  flagsPlaced.value += cell.flagged ? 1 : -1
  mineFlag()
}

// Support tactile mobile - long press pour drapeau
function onTouchStart(index) {
  if (!isMobile.value || gameOver.value) return
  longPressIndex = index
  longPressTimer = setTimeout(() => {
    if (longPressIndex === index) {
      toggleFlag(index)
      longPressIndex = null
    }
  }, LONG_PRESS_DURATION)
}

function onTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onTouchMove() {
  // Annuler le long press si l'utilisateur bouge
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
    longPressIndex = null
  }
}

function revealAdjacentCells(index) {
  const row = Math.floor(index / GRID_WIDTH)
  const col = index % GRID_WIDTH
  
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const newRow = row + dr
      const newCol = col + dc
      if (newRow >= 0 && newRow < GRID_HEIGHT && newCol >= 0 && newCol < GRID_WIDTH) {
        const newIndex = newRow * GRID_WIDTH + newCol
        const cell = grid.value[newIndex]
        if (!cell.revealed && cell.type !== 'bomb') {
          cell.revealed = true
          revealedCells.value++
          if (cell.adjacentBombs === 0) {
            revealAdjacentCells(newIndex)
          }
        }
      }
    }
  }
}

function checkWin() {
  // Victoire si toutes les cases non-bombes sont révélées
  if (revealedCells.value >= totalSafeCells.value) {
    gameWin()
    // Attendre 1 seconde avant de terminer
    setTimeout(() => {
      endGame()
    }, 1000)
  }
}

function endGame() {
  gameOver.value = true
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  
  // Révéler toutes les cellules
  grid.value.forEach(cell => {
    cell.revealed = true
  })
  
  // Sauvegarder la récompense immédiatement pour éviter la perte si actualisation
  if (!rewardSent.value) {
    rewardSent.value = true
    emit('save-result', finalReward.value)
  }
}

function getCellClass(cell) {
  const classes = []
  if (cell.flagged && !cell.revealed) classes.push('flagged')
  if (cell.revealed) {
    classes.push('revealed')
    if (cell.type === 'bomb') classes.push('bomb')
  }
  return classes
}

function getCellContent(cell) {
  if (cell.type === 'bomb') return '💣'
  if (cell.adjacentBombs > 0) return cell.adjacentBombs
  return ''
}

function collectReward() {
  harvestCollect()
  emit('complete')
}

function onClose() {
  // Si le jeu n'est pas fini, sauvegarder la récompense de base
  if (!rewardSent.value) {
    rewardSent.value = true
    emit('save-result', 1)
  }
  emit('complete')
}

// Timer
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      timerExpired.value = true
      endGame()
    }
  }, 1000)
}

onMounted(() => {
  // Détecter si mobile
  isMobile.value = window.innerWidth <= 768 || 'ontouchstart' in window
  generateGrid() // Génération initiale sans placement de bombes définitif
  startTimer()
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<style scoped>
.minesweeper-game {
  text-align: center;
  position: relative;
}

.minesweeper-game h2 {
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
  height: 24px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 1s linear;
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.score-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  color: var(--button-text);
}

.flag-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 4px 10px;
  border-radius: 6px;
}

.grid-container {
  display: flex;
  justify-content: center;
}

.minesweeper-grid {
  display: grid;
  gap: 4px;
  padding: 10px;
  background: #8B4513;
  border-radius: 10px;
}

.cell {
  width: 40px;
  height: 40px;
  background: #A0826D;
  border: 2px solid #654321;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  font-size: 18px;
  font-family: 'Fredoka', sans-serif;
  transition: all 0.2s ease;
}

.cell:hover:not(.revealed):not(.flagged) {
  background: #B8956D;
}

.cell.flagged {
  background: #E8D4A8;
}

.cell.revealed {
  background: #D2B48C;
  cursor: url('@/assets/ui/cursor/hand_point.png') 0 0, auto;
}

.cell.bomb.revealed {
  background: #FF6B6B;
}

.cell-hidden {
  color: #654321;
  font-weight: bold;
}

.cell-flag {
  font-size: 20px;
}

.cell-content {
  font-size: 20px;
}

/* Game Over Overlay */
.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.game-over-content {
  background: var(--bg-primary, #F5DEB3);
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  border: 3px solid #8B4513;
}

.game-over-content h3 {
  margin: 0 0 15px 0;
  font-family: 'Fredoka', sans-serif;
  font-size: 24px;
  color: #5D4037;
}

.result-text {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #5D4037;
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

/* Responsive */
@media (max-width: 480px) {
  .minesweeper-game h2 {
    font-size: 18px;
    margin-bottom: 3px;
  }
  
  .game-desc {
    font-size: 11px;
    margin-bottom: 10px;
  }
  
  .timer-bar {
    height: 20px;
  }
  
  .timer-text {
    font-size: 12px;
  }
  
  .score-display {
    font-size: 12px;
    margin-bottom: 10px;
  }
  
  .minesweeper-grid {
    gap: 3px;
    padding: 8px;
  }
  
  .cell {
    width: 36px;
    height: 36px;
    font-size: 16px;
    border-width: 1px;
    border-radius: 4px;
  }
  
  .cell-flag {
    font-size: 16px;
  }
  
  .cell-content {
    font-size: 16px;
  }
  
  .cell-hidden {
    font-size: 14px;
  }
  
  .game-over-content {
    padding: 20px;
  }
  
  .game-over-content h3 {
    font-size: 20px;
  }
  
  .result-text {
    font-size: 14px;
  }
  
  .collect-btn {
    padding: 10px 24px;
    font-size: 14px;
  }
}

@media (max-width: 360px) {
  .cell {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
  
  .cell-flag {
    font-size: 14px;
  }
  
  .cell-content {
    font-size: 14px;
  }
  
  .minesweeper-grid {
    gap: 2px;
    padding: 6px;
  }
}
</style>
