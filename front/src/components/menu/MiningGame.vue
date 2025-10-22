<template>
  <Popup @close="handleClose" class="mining-popup">
    <div class="mining-game">
      <!-- En-tête avec jetons et artefacts -->
      <div class="header">
        <div class="header-left">
          <h2>⛏️ Ma mine</h2>
          <!-- Artefacts équipés (seulement pendant le jeu) -->
          <div class="equipped-artifacts" v-if="gameActive && artifactSlotsCount > 0">
            <template v-for="idx in artifactSlotsCount" :key="`artifact-slot-${idx}`">
              <Tooltip 
                v-if="localEquippedArtifacts[idx - 1]"
                :text="getArtifactTooltip(localEquippedArtifacts[idx - 1])"
                position="bottom"
                :followMouse="false"
              >
                <div 
                  class="artifact-badge"
                  :style="getArtifactBadgeStyle(localEquippedArtifacts[idx - 1])"
                >
                  {{ getArtifactIcon(localEquippedArtifacts[idx - 1]) }}
                </div>
              </Tooltip>
            </template>
          </div>
        </div>
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
      <div v-else-if="gameActive && !showResults" class="game-area fixed-height">
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
              <div 
                v-if="cell.hp === 0 && cell.reward" 
                class="reward"
                :class="{ 'large-emoji': isLargeReward(cell.reward) }"
              >
                {{ formatReward(cell.reward, true) }}
              </div>
            </div>
          </div>

          <!-- Pile d'outils -->
          <div class="tools-panel">
            <div class="tools-stack-container">
              <div class="tools-stack">
                <Tooltip 
                  v-for="(tool, idx) in visibleTools" 
                  :key="`tool-${idx}`"
                  :text="getToolTooltip(tool)"
                  position="left"
                >
                  <div 
                    class="tool-item"
                    :class="{ 
                      'current': idx === 0,
                      'used': idx === 0 && toolUsed
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
        <div v-if="gameOver && !showResults" class="continue-button-container">
          <ActionButton :onClick="() => showResults = true">
            Continuer
          </ActionButton>
        </div>
      </div>

      <!-- Écran de fin avec résultats -->
      <div v-else-if="showResults" class="game-over">
        <h3>Partie terminée !</h3>
        <div class="rewards-list">
          <p v-if="aggregatedRewards.length === 0">Aucune récompense trouvée...</p>
          <div v-else>
            <p><strong>Récompenses obtenues :</strong></p>
            <ul>
              <li v-for="(reward, idx) in aggregatedRewards" :key="idx">
                {{ formatReward(reward) }}
              </li>
            </ul>
          </div>
        </div>
        <ActionButton :onClick="resetGame">
          Rejouer (1 🪨)
        </ActionButton>
      </div>

      <!-- Chargement initial uniquement -->
      <div v-if="loading && !gameActive && !showResults" class="loading">Chargement...</div>
    </div>
  </Popup>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import Popup from '@/components/menu/Popup.vue'
import ActionButton from '@/components/menu/ActionButton.vue'
import Tooltip from '@/components/menu/Tooltip.vue'
import { useMining } from '@/composables/useMining'
import { MINING_CONFIG } from '@/data/mining'

const emit = defineEmits(['close', 'game-over'])

const {
  miningTokens,
  gameActive,
  gridSize,
  cells,
  tools,
  currentToolIndex,
  rewards,
  equippedArtifacts,
  artifactSlotsCount,
  loading,
  fetchState,
  startGame: startMiningGame,
  dig
} = useMining()

// Copie locale pour forcer la réactivité
const localEquippedArtifacts = ref([])

// Watcher pour synchroniser les artefacts
watch([equippedArtifacts, artifactSlotsCount], ([artifacts, count]) => {
  localEquippedArtifacts.value = [...(artifacts || [])]
}, { immediate: true, deep: true })

// NOUVEAU : exposer un flag global pour indiquer qu'une partie est active
watch(gameActive, (val) => {
  try {
    if (typeof window !== 'undefined') {
      window.__miningActive = !!val
      window.dispatchEvent(new CustomEvent('mining-active-changed', { detail: { active: !!val } }))
    }
  } catch (_) {}
}, { immediate: true })

const hoveredCell = ref(null)
const gameOver = ref(false)
const showResults = ref(false)
const finalRewards = ref([])
const animatingCells = ref(new Set())
const toolUsed = ref(false)

// Outils visibles (seulement ceux non utilisés)
const visibleTools = computed(() => {
  return tools.value.slice(currentToolIndex.value)
})

// Récompenses agrégées par type
const aggregatedRewards = computed(() => {
  const totals = {}
  
  finalRewards.value.forEach(reward => {
    const [type, amount] = reward.split(':')
    const qty = parseInt(amount)
    
    if (totals[type]) {
      totals[type] += qty
    } else {
      totals[type] = qty
    }
  })
  
  return Object.entries(totals).map(([type, amount]) => `${type}:${amount}`)
})

// Construire dynamiquement la config des outils à partir des données synchronisées
const toolConfig = (() => {
  const cfg = {}
  const shared = MINING_CONFIG && MINING_CONFIG.tools ? MINING_CONFIG.tools : {}
  Object.entries(shared).forEach(([key, v]) => {
    cfg[key] = {
      damage: v.damage,
      pattern: v.pattern,
      icon: v.icon || '🔧',
      name: v.name || key,
      description: v.desc || v.description || '',
      cursorPath: `/src/assets/ui/cursor/tool_${key}.png`,
      // inclure secondary_damage (fallback 1) pour que la preview utilise la bonne valeur
      secondaryDamage: (typeof v.secondary_damage === 'number') ? v.secondary_damage : 1
    }
  })
  return cfg
})()

onMounted(async () => {
  await fetchState()
  // Si une partie était déjà active, la restaurer
  if (gameActive.value && rewards.value.length > 0) {
    // Partie en cours
  }
})

// Curseur actuel basé sur l'outil
const currentCursor = computed(() => {
  if (!gameActive.value || currentToolIndex.value >= tools.value.length) {
    // hotspot 0 0 pour éviter offset bizarre
    return "url('/src/assets/ui/cursor/hand_point.png') 0 0, pointer"
  }
  const tool = tools.value[currentToolIndex.value]
  const config = toolConfig[tool]
  if (config?.cursorPath) {
    // hotspot 0 0 pour le curseur d'outil personnalisé
    return `url("${config.cursorPath}") 0 0, pointer`
  }
  return "url('/src/assets/ui/cursor/hand_point.png') 0 0, pointer"
})

function getCellClass(cell) {
  const classes = []
  const cellKey = `${cell.row}-${cell.col}`
  
  if (cell.hp === 0) {
    classes.push('dug')
  } else if (cell.hp === 1) {
    classes.push('cracked-heavy')
  } else if (cell.hp === 2) {
    classes.push('cracked-light')
  } else {
    classes.push('intact')
  }

  // Animation de creusage
  if (animatingCells.value.has(cellKey)) {
    classes.push('digging')
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
  else if (config.pattern === 'square') {
    return Math.abs(row - hRow) <= 1 && Math.abs(col - hCol) <= 1
  }
  
  return false
}

function getDamageAt(row, col) {
  if (!hoveredCell.value || currentToolIndex.value >= tools.value.length) return 0
  const tool = tools.value[currentToolIndex.value]
  const config = toolConfig[tool]
  
  if (!config) return 0
  
  const { row: hRow, col: hCol } = hoveredCell.value
  const sec = Number(config.secondaryDamage || 1)

  if (config.pattern === 'single') {
    return (row === hRow && col === hCol) ? config.damage : 0
  } else if (config.pattern === 'cross') {
    if (row === hRow && col === hCol) return config.damage
    return sec
  }
  else if (config.pattern === 'square') {
    if (row === hRow && col === hCol) return config.damage
    if (Math.abs(row - hRow) <= 1 && Math.abs(col - hCol) <= 1) return sec
    return 0
  }

  return 0
}

async function digAt(row, col) {
  if (!gameActive.value || currentToolIndex.value >= tools.value.length) return
  
  const cellKey = `${row}-${col}`
  
  // Ajouter l'animation de creusage
  animatingCells.value.add(cellKey)
  
  // Animation de l'outil utilisé
  toolUsed.value = true
  setTimeout(() => {
    toolUsed.value = false
  }, 300)
  
  const result = await dig(row, col)
  
  // Retirer l'animation après un court délai
  setTimeout(() => {
    animatingCells.value.delete(cellKey)
  }, 300)
  
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
  gameOver.value = false
  showResults.value = false
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

// Helpers pour les artefacts — lire depuis window.__gameDataCache.artifacts
function getArtifactData(artifactId) {
  try {
    // Les artefacts sont dans window.__gameDataCache.artifacts (pas .mining.artifacts)
    const server = (typeof window !== 'undefined' && window.__gameDataCache && window.__gameDataCache.artifacts) ? window.__gameDataCache.artifacts : null
    if (server && artifactId) return server[artifactId] || null
  } catch (_) {}
  // fallback: chercher dans MINING_CONFIG si disponible
  try {
    if (MINING_CONFIG && MINING_CONFIG.artifacts && artifactId) return MINING_CONFIG.artifacts[artifactId] || null
  } catch (_) {}
  return null
}

function getArtifactIcon(aid) {
  const d = getArtifactData(aid)
  return d ? (d.icon || '❖') : '❖'
}

function getArtifactName(aid) {
  const d = getArtifactData(aid)
  return d ? (d.name || aid) : aid || 'Vide'
}

function getArtifactTooltip(aid) {
  if (!aid) return '<div style="opacity:0.7;">Emplacement vide</div>'
  
  const d = getArtifactData(aid)
  if (!d) return '<div>Artefact inconnu</div>'
  
  return `
    <div style="max-width: 250px;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
        ${d.icon || '❖'} ${d.name}
      </div>
      <div style="font-size: 13px; line-height: 1.4; opacity: 0.95;">
        ${d.description || 'Aucune description'}
      </div>
    </div>
  `
}

function formatReward(reward, inCell = false) {
  if (!reward) return ''

  // support string 'type:amount' or object { type, amount }
  let type, amount
  if (typeof reward === 'string') {
    const parts = reward.split(':')
    type = parts[0]
    amount = parts[1]
  } else if (typeof reward === 'object') {
    type = reward.type
    amount = reward.amount != null ? String(reward.amount) : undefined
  }

  if (!type) return ''

  const icons = {
    eggs: '🥚',
    mining_token: '🪨',
    stock_token: '📦',
    production_token: '⚡'
  }
  const icon = icons[type] || (MINING_CONFIG.rewardTypes && MINING_CONFIG.rewardTypes[type]?.icon) || '❓'
  const qty = amount ? parseInt(amount) : NaN

  if (inCell && !isNaN(qty) && qty === 1) return icon

  // fallback when amount missing
  if (!amount) return icon

  return `${icon} ${amount}`
}

function isLargeReward(reward) {
  if (!reward) return false
  let amount
  if (typeof reward === 'string') {
    amount = reward.split(':')[1]
  } else if (typeof reward === 'object') {
    amount = reward.amount
  }
  return parseInt(amount) === 1
}

// NOUVEAU : style dynamique en fonction de la rareté
function getArtifactBadgeStyle(aid) {
  const d = getArtifactData(aid)
  const rarity = d?.rarete || 'commune'
  const borderColors = {
    commune: 'rgba(194,194,194,0.55)',
    rare: 'rgba(123,192,255,0.45)',
    epique: 'rgba(201,139,255,0.44)',
    legendaire: 'rgba(212,175,55,0.7)'
  }
  const textColors = {
    commune: '#5c2c08',
    rare: '#0b4a66',
    epique: '#4b1e5a',
    legendaire: '#5c2c08'
  }
  const bgMap = {
    commune: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(194,194,194,0.08))',
    rare: 'linear-gradient(180deg, rgba(123,192,255,0.10), rgba(255,255,255,0.02))',
    epique: 'linear-gradient(180deg, rgba(201,139,255,0.10), rgba(255,255,255,0.02))',
    legendaire: 'linear-gradient(180deg, rgba(212,175,55,0.10), rgba(255,255,255,0.03))'
  }

  return {
    background: bgMap[rarity] || bgMap.commune,
    color: textColors[rarity] || textColors.commune,
    border: `2.5px solid ${borderColors[rarity] || borderColors.commune}`,
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.04)'
  }
}
</script>

<style scoped>
.mining-game {
  font-family: 'Fredoka', sans-serif;
  color: #fff9e5;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Style spécial pour le popup du mini-jeu */
.mining-popup :deep(.popup-content) {
  width: auto !important;
  max-width: 95vw !important;
  max-height: 95vh !important;
  padding: 20px !important;
  height: auto !important;
  /* keep popup content from scrolling the whole window when internal controls appear */
  display: flex !important;
  flex-direction: column;
  overflow: hidden !important;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
  padding-right: 30px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equipped-artifacts {
  display: flex;
  gap: 6px;
  align-items: center;
}

.artifact-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border-radius: 8px;
  transition: all 0.18s ease;
}

.tokens {
  font-size: 14px;
  font-weight: 600;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #ffc66e;
  flex-shrink: 0;
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
  align-items: flex-start;
  justify-content: center;
}

.grid {
  display: grid;
  gap: 6px;
  width: 500px;
  height: 500px;
  flex-shrink: 0;
  background-color: #3d2817;
  background-image: 
    radial-gradient(circle at 20% 30%, rgba(90, 74, 58, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(90, 74, 58, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(60, 40, 23, 0.4) 0%, transparent 60%);
  border: 3px solid #5a4a3a;
  border-radius: 8px;
  padding: 8px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.cell {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  position: relative;
  cursor: inherit;
}

.cell.intact {
  background: #6d4e2d;
  border: 2px solid #4a3018;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.3);
  position: relative;
}

.cell.intact::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 30% 40%, rgba(80, 60, 45, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 70% 70%, rgba(60, 45, 30, 0.12) 0%, transparent 35%);
  pointer-events: none;
}

.cell.cracked-light {
  background: #6d4e2d;
  border: 2px solid #4a3018;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.3);
  position: relative;
}

.cell.cracked-light::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(125deg, transparent 0%, transparent 35%, rgba(0,0,0,0.5) 37%, rgba(0,0,0,0.6) 39%, rgba(0,0,0,0.5) 41%, transparent 43%, transparent 100%),
    radial-gradient(ellipse at 35% 40%, rgba(0, 0, 0, 0.3) 0%, transparent 25%);
  pointer-events: none;
}

.cell.cracked-heavy {
  background: #6d4e2d;
  border: 2px solid #4a3018;
  box-shadow: inset 2px 2px 3px rgba(0, 0, 0, 0.4);
  position: relative;
}

.cell.cracked-heavy::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(125deg, transparent 0%, transparent 30%, rgba(0,0,0,0.6) 33%, rgba(0,0,0,0.7) 36%, rgba(0,0,0,0.6) 39%, transparent 42%, transparent 100%),
    linear-gradient(55deg, transparent 0%, transparent 32%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.6) 38%, rgba(0,0,0,0.5) 41%, transparent 44%, transparent 100%),
    radial-gradient(ellipse at 35% 40%, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 20%, transparent 30%),
    radial-gradient(ellipse at 60% 65%, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.15) 18%, transparent 28%);
  pointer-events: none;
}

.cell.dug {
  background: #4a3a2a;
  border: 2px solid #2d1f12;
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.7);
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
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.6), inset 0 0 12px rgba(255, 255, 255, 0.3);
  outline: 3px solid rgba(255, 255, 255, 0.8);
  outline-offset: -3px;
}

.cell:hover {
  transform: scale(1.05);
}

/* Animation de creusage */
.cell.digging {
  animation: digShake 0.3s ease;
}

@keyframes digShake {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(0.95) rotate(-3deg);
  }
  50% {
    transform: scale(0.9) rotate(3deg);
  }
  75% {
    transform: scale(0.95) rotate(-2deg);
  }
}

/* Effet de particules lors du creusage - Fond lumineux */
.cell.digging::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(139, 105, 20, 0.5) 0%, rgba(90, 74, 58, 0.3) 40%, transparent 70%);
  animation: digFlash 0.3s ease-out;
  pointer-events: none;
  z-index: 1;
}

/* Particules de terre qui volent */
.cell.digging::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200%;
  height: 200%;
  background-image: 
    radial-gradient(circle, #6b4423 2px, transparent 2px),
    radial-gradient(circle, #8b6914 1.5px, transparent 1.5px),
    radial-gradient(circle, #7a5518 2.5px, transparent 2.5px),
    radial-gradient(circle, #5a4a3a 1px, transparent 1px);
  background-size: 
    50% 50%,
    60% 60%,
    45% 45%,
    55% 55%;
  background-position: 
    10% 20%,
    80% 30%,
    30% 70%,
    70% 80%;
  animation: dirtParticles 0.4s ease-out;
  pointer-events: none;
  z-index: 2;
  opacity: 0;
}

@keyframes digFlash {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.3);
  }
}

@keyframes dirtParticles {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.3) rotate(0deg);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1) rotate(180deg);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.8) rotate(360deg);
  }
}

.reward {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.reward.large-emoji {
  font-size: 28px;
}

.tools-panel {
  display: flex;
  flex-direction: column;
  background-color: #7d5500;
  background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z' fill='%23957339' fill-opacity='0.43' fill-rule='evenodd'/%3E%3C/svg%3E");
  border: 3px solid #b77b3d;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  height: 475px;
  flex-shrink: 0;
}

.tools-stack-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 140px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
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
  transition: all 0.3s ease;
  cursor: url('/src/assets/ui/cursor/mark_question.png') 0 0, help;
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
  box-shadow: 0 4px 12px rgba(255, 198, 110, 0.4);
  transform: scale(1.05);
}

.tool-item.used {
  animation: toolUse 0.3s ease;
}

@keyframes toolUse {
  0% {
    transform: scale(1.05) translateY(0);
  }
  50% {
    transform: scale(0.95) translateY(-5px);
  }
  100% {
    transform: scale(1.05) translateY(0);
  }
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

.game-area {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.game-area.fixed-height {
  min-height: 550px;
  height: 550px;
  box-sizing: border-box;
  position: relative; /* allow absolute positioning of the continue button so it doesn't push the layout */
}

/* Reserve space inside the game container so the continue button (positioned absolute) never overlaps content */
.game-container {
  /* ensure inner content doesn't increase popup size; allow internal scrolls only where desired */
  padding-bottom: 80px; /* reserve space for the continue button */
}

.game-area.fixed-height .continue-button-container {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.continue-button-container {
  margin-top: 16px;
  text-align: center;
}

.game-area.fixed-height .continue-button-container {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
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

@media (max-width: 1024px) {
  .grid {
    width: 400px;
    height: 400px;
  }

  .tools-panel {
    height: 380px;
  }
}

@media (max-width: 768px) {
  .game-container {
    flex-direction: column;
    align-items: center;
  }

  .grid {
    width: 70vw;
    height: 70vw;
    max-width: 400px;
    max-height: 400px;
  }

  .tools-panel {
    width: 70vw;
    max-width: 400px;
    height: 120px;
  }

  .tools-stack-container {
    height: 100%;
    min-width: 100%;
    padding-right: 0;
  }

  .tools-stack {
    flex-direction: row-reverse;
    justify-content: flex-start;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */
  }

  .tools-stack::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Edge */
  }

  /* Cacher le nom de l'outil, sauf pour l'outil actuel */
  .tool-item:not(.current) .tool-name {
    display: none;
  }

  .tool-item {
    min-width: 50px;
    justify-content: center;
  }

  .tool-item.current {
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .grid {
    width: 85vw;
    height: 85vw;
    max-width: 350px;
    max-height: 350px;
    gap: 4px;
  }

  .tools-panel {
    width: 85vw;
    max-width: 350px;
    height: 100px;
  }
  
  .header {
    padding-right: 25px;
  }
  
  .header h2 {
    font-size: 18px;
  }

  /* En très petit écran aussi, cacher les noms sauf pour l'outil actuel */
  .tool-item:not(.current) .tool-name {
    display: none;
  }

  .tool-item {
    min-width: 45px;
    padding: 6px 8px;
  }
}
</style>
