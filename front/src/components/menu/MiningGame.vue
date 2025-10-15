<template>
  <Popup @close="handleClose">
    <div class="mining-game">
      <!-- En-tête avec jetons -->
      <div class="header">
        <h2>⛏️ Mini-jeu de Minage</h2>
        <div class="tokens">
          🪨 {{ miningTokens }}
        </div>
      </div>

      <!-- Écran de démarrage -->
      <div v-if="!gameActive && !gameOver" class="start-screen">
        <p>Creusez pour découvrir des récompenses cachées !</p>
        <ActionButton 
          :onClick="startGame" 
          :disabled="miningTokens < 1"
        >
          {{ miningTokens >= 1 ? 'Démarrer (1 🪨)' : 'Pas assez de jetons' }}
        </ActionButton>
      </div>

      <!-- Jeu actif -->
      <div v-else-if="gameActive && !showResults" class="game-area">
        <div class="game-container">
          <!-- Grille de creusage -->
          <div 
            class="grid" 
            :style="{ 
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              cursor: currentCursor
            }"
            @mouseleave="hoveredCell = null"
          >
            <div
              v-for="cell in cells"
              :key="`${cell.row}-${cell.col}`"
              class="cell"
              :class="getCellClass(cell)"
              :style="getCellStyle(cell)"
              @mouseenter="hoveredCell = { row: cell.row, col: cell.col }"
              @click="digAt(cell.row, cell.col)"
            >
              <div v-if="cell.hp === 0 && cell.reward" class="reward">
                {{ formatReward(cell.reward) }}
              </div>
            </div>
          </div>

          <!-- Pile d'outils -->
          <div class="tools-stack-container">
            <div class="tools-stack">
              <Tooltip 
                v-for="(tool, idx) in tools" 
                :key="idx"
                :text="getToolTooltip(tool)"
                position="left"
              >
                <div 
                  class="tool-item"
                  :class="{ 
                    'current': idx === currentToolIndex,
                    'used': idx < currentToolIndex
                  }"
                >
                  <span class="tool-icon">{{ getToolIcon(tool) }}</span>
                  <span class="tool-name">{{ getToolName(tool) }}</span>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <!-- Bouton Continuer quand tous les outils sont utilisés -->
      <div v-else-if="gameOver && !showResults" class="continue-screen">
        <h3>✨ Tous les outils utilisés !</h3>
        <p>Voyons ce que vous avez trouvé...</p>
        <ActionButton :onClick="() => showResults = true">
          Continuer
        </ActionButton>
      </div>

      <!-- Écran de fin avec résultats -->
      <div v-else-if="showResults" class="game-over">
        <h3>🎉 Partie terminée !</h3>
        <div class="rewards-list">
          <p v-if="finalRewards.length === 0">Aucune récompense trouvée...</p>
          <div v-else>
            <p><strong>Récompenses obtenues :</strong></p>
            <ul>
              <li v-for="(reward, idx) in finalRewards" :key="idx">
                {{ formatReward(reward) }}
              </li>
            </ul>
          </div>
        </div>
        <ActionButton :onClick="resetGame">
          Rejouer (1 🪨)
        </ActionButton>
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="loading">Chargement...</div>
    </div>
  </Popup>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Popup from '@/components/menu/Popup.vue'
import ActionButton from '@/components/menu/ActionButton.vue'
import Tooltip from '@/components/menu/Tooltip.vue'
import { useMining } from '@/composables/useMining'

const emit = defineEmits(['close'])

const {
  miningTokens,
  gameActive,
  gridSize,
  cells,
  tools,
  currentToolIndex,
  rewards,
  loading,
  fetchState,
  startGame: startMiningGame,
  dig
} = useMining()

const hoveredCell = ref(null)
const gameOver = ref(false)
const showResults = ref(false)
const finalRewards = ref([])

// Configuration des outils (miroir du backend)
const toolConfig = {
  shovel: { 
    damage: 3, 
    pattern: 'single', 
    icon: '🔨', 
    name: 'Pelle',
    description: 'Inflige 3 dégâts sur une case',
    cursorPath: '/src/assets/ui/cursor/tool_shovel.png' 
  },
  pickaxe: { 
    damage: 2, 
    pattern: 'cross', 
    icon: '⛏️', 
    name: 'Pioche',
    description: 'Inflige 2 dégâts sur la case ciblée et 1 dégât sur les cases adjacentes',
    cursorPath: '/src/assets/ui/cursor/tool_pickaxe.png' 
  }
}

onMounted(async () => {
  await fetchState()
  // Si une partie était déjà active, la restaurer
  if (gameActive.value && rewards.value.length > 0) {
    // Partie en cours
  }
})

// Curseur actuel basé sur l'outil
const currentCursor = computed(() => {
  if (!gameActive.value || currentToolIndex.value >= tools.value.length) return 'default'
  const tool = tools.value[currentToolIndex.value]
  const config = toolConfig[tool]
  if (config?.cursorPath) {
    return `url("${config.cursorPath}") 16 16, pointer`
  }
  return 'pointer'
})

function getCellClass(cell) {
  const classes = []
  
  if (cell.hp === 0) {
    classes.push('dug')
  } else if (cell.hp === 1) {
    classes.push('cracked-heavy')
  } else if (cell.hp === 2) {
    classes.push('cracked-light')
  } else {
    classes.push('intact')
  }

  // Preview de l'impact
  if (hoveredCell.value && willBeAffected(cell.row, cell.col)) {
    const damage = getDamageAt(cell.row, cell.col)
    
    // Si le coup va détruire complètement la case, la faire briller entièrement
    if (damage >= cell.hp && cell.hp > 0) {
      classes.push('preview-destroy')
    } else {
      classes.push('preview')
      if (damage >= 2) {
        classes.push('preview-strong')
      }
    }
  }

  return classes
}

function getCellStyle(cell) {
  return {}
}

function willBeAffected(row, col) {
  if (!hoveredCell.value || currentToolIndex.value >= tools.value.length) return false
  const tool = tools.value[currentToolIndex.value]
  const config = toolConfig[tool]
  
  if (!config) return false
  
  const { row: hRow, col: hCol } = hoveredCell.value
  
  if (config.pattern === 'single') {
    return row === hRow && col === hCol
  } else if (config.pattern === 'cross') {
    if (row === hRow && col === hCol) return true
    if (row === hRow - 1 && col === hCol) return true
    if (row === hRow + 1 && col === hCol) return true
    if (row === hRow && col === hCol - 1) return true
    if (row === hRow && col === hCol + 1) return true
  }
  
  return false
}

function getDamageAt(row, col) {
  if (!hoveredCell.value || currentToolIndex.value >= tools.value.length) return 0
  const tool = tools.value[currentToolIndex.value]
  const config = toolConfig[tool]
  
  if (!config) return 0
  
  const { row: hRow, col: hCol } = hoveredCell.value
  
  if (config.pattern === 'single') {
    return (row === hRow && col === hCol) ? config.damage : 0
  } else if (config.pattern === 'cross') {
    if (row === hRow && col === hCol) return config.damage
    return 1
  }
  
  return 0
}

async function digAt(row, col) {
  if (!gameActive.value || currentToolIndex.value >= tools.value.length) return
  
  const result = await dig(row, col)
  
  if (result?.gameOver) {
    gameOver.value = true
    finalRewards.value = result.game.rewards
    emit('game-over', result.resources)
  }
}

async function startGame() {
  gameOver.value = false
  showResults.value = false
  finalRewards.value = []
  await startMiningGame()
}

function resetGame() {
  startGame()
}

function handleClose() {
  emit('close')
}

function getToolIcon(tool) {
  return toolConfig[tool]?.icon || '🔧'
}

function getToolName(tool) {
  return toolConfig[tool]?.name || 'Outil'
}

function getToolTooltip(tool) {
  const config = toolConfig[tool]
  if (!config) return 'Outil inconnu'
  return `<div><strong>${config.name}</strong></div><div style="margin-top:4px;">${config.description}</div>`
}

function formatReward(reward) {
  const [type, amount] = reward.split(':')
  const icons = {
    eggs: '🥚',
    mining_token: '🪨',
    stock_token: '📦',
    production_token: '⚡'
  }
  return `${icons[type] || '❓'} ${amount}`
}
</script>

<style scoped>
.mining-game {
  font-family: 'Fredoka', sans-serif;
  color: #fff9e5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
}

.tokens {
  font-size: 18px;
  font-weight: 600;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #ffc66e;
}

.start-screen,
.continue-screen,
.game-over {
  text-align: center;
  padding: 20px 0;
}

.start-screen p,
.continue-screen p {
  margin-bottom: 20px;
  font-size: 16px;
}

.continue-screen h3 {
  margin-bottom: 12px;
}

.game-container {
  display: flex;
  gap: 16px;
  align-items: stretch;
  height: 450px;
}

.grid {
  display: grid;
  gap: 4px;
  flex: 1;
  max-width: 400px;
  align-content: center;
}

.cell {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s ease;
  position: relative;
  cursor: inherit;
}

.cell.intact {
  background-color: #8b6914;
  border: 2px solid #a17e1a;
}

.cell.cracked-light {
  background-color: #8b6914;
  border: 2px solid #a17e1a;
  background-image: linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.2) 42%, rgba(0,0,0,0.2) 58%, transparent 60%);
}

.cell.cracked-heavy {
  background-color: #8b6914;
  border: 2px solid #a17e1a;
  background-image: 
    linear-gradient(135deg, transparent 35%, rgba(0,0,0,0.3) 38%, rgba(0,0,0,0.3) 62%, transparent 65%),
    linear-gradient(45deg, transparent 35%, rgba(0,0,0,0.3) 38%, rgba(0,0,0,0.3) 62%, transparent 65%);
}

.cell.dug {
  background-color: #5a4a3a;
  border: 2px solid #4a3a2a;
}

.cell.preview {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: -2px;
}

.cell.preview-strong {
  outline: 3px solid rgba(255, 255, 255, 0.8);
  outline-offset: -3px;
}

.cell.preview-destroy {
  background-color: rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.4);
  outline: 3px solid rgba(255, 255, 255, 0.9);
  outline-offset: -3px;
}

.cell:hover {
  transform: scale(1.05);
}

.reward {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  animation: rewardAppear 0.3s ease-out;
}

@keyframes rewardAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.tools-stack-container {
  display: flex;
  flex-direction: column;
  min-width: 140px;
  max-height: 450px;
  overflow-y: auto;
  overflow-x: hidden;
}

.tools-stack {
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  padding: 4px;
}

.tool-item {
  background-color: #7a3e10;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  cursor: help;
  min-height: 40px;
}

.tool-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.tool-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.tool-item.current {
  background-color: #a05a2d;
  border-color: #ffdb9f;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 198, 110, 0.4);
}

.tool-item.used {
  opacity: 0.3;
  filter: grayscale(1);
}

/* Styles pour la scrollbar */
.tools-stack-container::-webkit-scrollbar {
  width: 6px;
}

.tools-stack-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.tools-stack-container::-webkit-scrollbar-thumb {
  background: #ffc66e;
  border-radius: 3px;
}

.tools-stack-container::-webkit-scrollbar-thumb:hover {
  background: #ffdb9f;
}

.game-over h3 {
  margin-bottom: 16px;
}

.rewards-list {
  background-color: rgba(0, 0, 0, 0.2);
  border: 1px solid #ffc66e;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.rewards-list ul {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
}

.rewards-list li {
  padding: 4px 0;
  font-size: 16px;
}

.loading {
  text-align: center;
  padding: 20px;
  font-size: 16px;
  opacity: 0.7;
}

@media (max-width: 600px) {
  .game-container {
    flex-direction: column;
    height: auto;
  }

  .tools-stack-container {
    max-height: 150px;
    min-width: 100%;
  }

  .tools-stack {
    flex-direction: row;
    justify-content: flex-start;
  }

  .grid {
    max-width: 100%;
  }
}
</style>
