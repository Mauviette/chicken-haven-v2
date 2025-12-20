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
        <div class="header-right">
          <!-- Info drops possibles -->
          <Tooltip :text="getDropsTooltip(isApocalypse)" position="bottom">
            <div class="drops-info-header">
              <span>🎁</span>
            </div>
          </Tooltip>
          <div class="tokens">
            🪨 {{ miningTokens }}
            <!-- Debug rapide: nombre de cases révélées (hint) -->
            <!--span v-if="hintCount > 0" class="hint-counter" title="Cases révélées"> ❓ {{ hintCount }}</span-->
          </div>
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
        <br><br>
        <ActionButton 
          :onClick="goToArtifacts"
          style="background-color: #8B4513; border-color: #654321;"
        >
          Voir mes Artefacts
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
              <!-- overlay d'explosion (affiché pendant l'animation 'explosion') -->
              <div v-if="explosionActive" class="explosion-effect" aria-hidden="true"></div>
              <div
                v-for="cell in cells"
                :key="`${cell.row}-${cell.col}`"
                class="cell"
                :class="getCellClass(cell)"
                :style="getCellStyle(cell)"
                @mouseenter="hoveredCell = { row: cell.row, col: cell.col }"
                @click="digAt(cell.row, cell.col)"
              >
                <!-- Indicateur reveal_rewards : point d'interrogation si le backend a marqué la cellule -->
                <div v-if="hasHint(cell) && cell.hp > 0" class="cell-hint" aria-hidden="true">❓</div>

                <!-- Récompense récupérée (case creusée) -->
                <div 
                  v-if="cell.hp === 0 && cell.reward" 
                  class="reward"
                  :class="{ 'large-emoji': isLargeReward(cell.reward), 'rare-reward': isRareReward(cell.reward) }"
                >
                  <Tooltip :text="getDugRewardTooltip(cell.reward)" position="top">
                    {{ formatReward(cell.reward, true) }}
                  </Tooltip>
                </div>

                <!-- Récompense non obtenue : afficher en semi‑transparent quand la partie est terminée et le bouton 'Continuer' visible -->
                <div 
                  v-else-if="gameOver && !showResults && cell.reward && (cell.hp == null || cell.hp > 0)"
                  class="reward unobtained"
                  :class="{ 'large-emoji': isLargeReward(cell.reward) }"
                  :style="getMarkQuestionCursorStyle()"
                >
                  <Tooltip :text="getDugRewardTooltip(cell.reward)" position="top">
                    {{ formatReward(cell.reward, true) }}
                  </Tooltip>
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
                    :style="getToolCursorStyle(tool, idx)"
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
          <div class="continue-wrapper">
            <ActionButton :onClick="() => { miningContinue(); showResults = true; updateTokensAfterRewards() }">
              Continuer
            </ActionButton>
          </div>
        </div>
      </div>

      <!-- Écran de fin avec résultats -->
      <div v-else-if="showResults" class="game-over">
        <h3>Partie terminée !</h3>
        <div class="rewards-list">
          <p v-if="groupedRewards.length === 0">Aucune récompense trouvée...</p>
          <div v-else>
            <p><strong>Récompenses obtenues :</strong></p>
            <ul>
              <li v-for="(reward, idx) in groupedRewards" :key="idx">
                <Tooltip :text="getGroupedRewardTooltip(reward)" position="top">
                  {{ formatGroupedReward(reward) }}
                </Tooltip>
              </li>
            </ul>
          </div>
        </div>
        <ActionButton :onClick="resetGame" :disabled="miningTokens < 1">
          {{ miningTokens >= 1 ? 'Rejouer (1 🪨)' : 'Pas assez de jetons' }}
        </ActionButton>
        
          <br>
          <ActionButton 
            :onClick="goToArtifacts"
            style="background-color: #8B4513; border-color: #654321; margin-top: 10px;"
          >
            Voir mes Artefacts
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
import { apiPost } from '@/utils/api'
import { useSound } from '@/composables/useSound'
import { useGameData } from '@/composables/useGameData'
import { useRouter } from 'vue-router'
import { usePlayer } from '@/composables/usePlayer'

// Import des helpers de minage (curseurs, outils, artefacts, récompenses)
import {
  cursor_hand,
  cursor_mark_question,
  getToolConfig,
  getToolIcon,
  getToolName,
  getToolTooltip,
  getToolCursorStyle as _getToolCursorStyle,
  getMarkQuestionCursorStyle,
  computeCurrentCursor,
  willBeAffected as _willBeAffected,
  getDamageAt as _getDamageAt,
  getArtifactIcon,
  getArtifactName,
  getArtifactTooltip,
  getArtifactBadgeStyle,
  hasHint,
  formatReward,
  formatGroupedReward,
  groupRewards,
  isLargeReward,
  isRareReward,
  getRewardTooltip,
  getDugRewardTooltip,
  getGroupedRewardTooltip,
  getContinueTooltip,
  getDropsTooltip,
} from './mining'

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
  dig,
  artifactModifiers
} = useMining()

const { miningBasic, miningExplosion, miningContinue } = useSound()

const { getItemInfo } = useGameData()

const { apocalypse } = usePlayer()

const router = useRouter()

// Mode apocalypse
const isApocalypse = computed(() => Boolean(apocalypse?.value))

// Copie locale pour forcer la réactivité
const localEquippedArtifacts = ref([])

// NOUVEAU : animation explosion
const animatingExplosions = ref(new Set())
const explosionActive = ref(false)

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
const tokensBeforeGameOver = ref(0) // Stocker les jetons avant gameOver

// computed: nombre de cases marquées "hint" (non creusées)
const hintCount = computed(() => {
  try {
    return Array.isArray(cells.value) ? cells.value.filter(c => hasHint(c) && (c.hp == null ? true : c.hp > 0)).length : 0
  } catch (_) { return 0 }
})

// debug : log lorsque hintCount change (utile pour diagnostiquer si le backend n'envoie rien)
watch(hintCount, (n) => {
  try { console.debug('[MiningGame] hintCount ->', n) } catch (_) {}
})

// Outils visibles (seulement ceux non utilisés)
const visibleTools = computed(() => {
  return tools.value.slice(currentToolIndex.value)
})

// Tooltip pour le bouton continuer (utilise le helper avec computed locale)
const continueTooltip = computed(() => {
  return getContinueTooltip(gameOver.value, showResults.value, groupedRewards.value)
})

// Wrappers de tooltips pour passer getItemInfo
const _getRewardTooltip = (reward) => getRewardTooltip(reward, getItemInfo)
const _getDugRewardTooltip = (reward) => getDugRewardTooltip(reward, getItemInfo)
const _getGroupedRewardTooltip = (reward) => getGroupedRewardTooltip(reward, getItemInfo)

// Grouper les récompenses par type pour les afficher stackées
const groupedRewards = computed(() => groupRewards(finalRewards.value))

// Configuration des outils (utilise le helper)
const toolConfig = getToolConfig()

onMounted(async () => {
  await fetchState()
  // Si une partie était déjà active, la restaurer
  if (gameActive.value && rewards.value.length > 0) {
    // Partie en cours
  }
})

// Curseur actuel basé sur l'outil
const currentCursor = computed(() => {
  return computeCurrentCursor(gameActive.value, currentToolIndex.value, tools.value)
})

// Retourne un style pour le curseur d'un outil (utilisé par les éléments de la pile d'outils)
function getToolCursorStyle(tool, idx) {
  return _getToolCursorStyle(tool, idx, currentCursor.value)
}

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

  // Animation de creusage classique
  if (animatingCells.value.has(cellKey)) {
    classes.push('digging')
  }

  // Animation explosion (classe spécifique)
  if (animatingExplosions.value.has(cellKey)) {
    classes.push('explosion')
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

// Wrappers pour les fonctions de helpers avec le contexte local
function willBeAffected(row, col) {
  if (!hoveredCell.value || currentToolIndex.value >= tools.value.length) return false
  const tool = tools.value[currentToolIndex.value]
  return _willBeAffected(row, col, hoveredCell.value, tool)
}

function getDamageAt(row, col) {
  if (!hoveredCell.value || currentToolIndex.value >= tools.value.length) return 0
  const tool = tools.value[currentToolIndex.value]
  const toolDamageAdd = Number(artifactModifiers.value?.toolDamageAdd || 0)
  return _getDamageAt(row, col, hoveredCell.value, tool, toolDamageAdd)
}

async function digAt(row, col) {
  if (!gameActive.value || currentToolIndex.value >= tools.value.length) return
  
  const cellKey = `${row}-${col}`
  
  // Récupérer le type d'outil et sa config pour savoir quelle animation jouer
  const toolType = tools.value[currentToolIndex.value]
  const config = toolConfig[toolType]

  // Ajouter l'animation de creusage (classique) si animation === 'mining'
  if (!config || config.animation === 'mining' || !config.animation) {
    animatingCells.value.add(cellKey)
    miningBasic()
  }

  // Si l'outil a une animation 'explosion', marquer toutes les cases affectées pour l'animation explosion
  if (config && config.animation === 'explosion') {
    // marquer overlay global et cellules
    explosionActive.value = true
    miningExplosion()
    // déterminer les cellules affectées localement (utilise willBeAffected qui se base sur hoveredCell)
    // fallback: inclure la case ciblée si hoveredCell absent
    const affected = []
    if (hoveredCell.value) {
      for (const c of cells.value) {
        if (willBeAffected(c.row, c.col)) affected.push(c)
      }
    } else {
      // au moins la case ciblée
      affected.push({ row, col })
    }
    for (const a of affected) {
      animatingExplosions.value.add(`${a.row}-${a.col}`)
    }
  }

  // Animation de l'outil utilisé (visuel pile)
  toolUsed.value = true
  setTimeout(() => {
    toolUsed.value = false
  }, 300)
  
  const result = await dig(row, col)
  
  // Retirer l'animation après un court délai (différent si explosion)
  if (config && config.animation === 'explosion') {
    setTimeout(() => {
      animatingExplosions.value.clear()
      explosionActive.value = false
    }, 700) // explosion slightly longer
  } else {
    setTimeout(() => {
      animatingCells.value.delete(cellKey)
    }, 400)
  }
  
  if (result?.gameOver) {
    // Stocker les jetons avant mise à jour
    tokensBeforeGameOver.value = miningTokens.value
    gameOver.value = true
    finalRewards.value = result.game.rewards
    // Mettre à jour les jetons si fournis dans la réponse
    if (result.miningTokens !== undefined) {
      //console.log('[MiningGame] Mise à jour jetons après gameOver:', result.miningTokens, 'ancien:', miningTokens.value)
      miningTokens.value = result.miningTokens
    } else {
      //console.warn('[MiningGame] Pas de miningTokens dans la réponse gameOver')
      // Calculer manuellement les jetons gagnés
      const miningTokensGained = finalRewards.value.filter(reward => reward.startsWith('mining_token:')).reduce((sum, reward) => {
        const amount = parseInt(reward.split(':')[1]) || 0
        return sum + amount
      }, 0)
      if (miningTokensGained > 0) {
        miningTokens.value = tokensBeforeGameOver.value + miningTokensGained
        //console.log('[MiningGame] Jetons calculés manuellement:', miningTokens.value, 'gagnés:', miningTokensGained)
      }
    }
    emit('game-over', result.resources)
    // Déclencher la vérification automatique des succès
    window.dispatchEvent(new CustomEvent('mining-action'))
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

// Fonction pour forcer la mise à jour des jetons après attribution des récompenses
async function updateTokensAfterRewards() {
  try {
    //console.log('[MiningGame] updateTokensAfterRewards - avant fetchState:', miningTokens.value)
    // Récupérer l'état actuel pour s'assurer que les jetons sont à jour
    await fetchState()
    //console.log('[MiningGame] updateTokensAfterRewards - après fetchState:', miningTokens.value)
    
    // Si les jetons n'ont pas été mis à jour correctement, calculer manuellement
    if (miningTokens.value === tokensBeforeGameOver.value && finalRewards.value.length > 0) {
      const miningTokensGained = finalRewards.value.filter(reward => reward.startsWith('mining_token:')).reduce((sum, reward) => {
        const amount = parseInt(reward.split(':')[1]) || 0
        return sum + amount
      }, 0)
      if (miningTokensGained > 0) {
        miningTokens.value = tokensBeforeGameOver.value + miningTokensGained
        //console.log('[MiningGame] Jetons corrigés dans updateTokensAfterRewards:', miningTokens.value)
      }
    }
  } catch (err) {
    //console.warn('Erreur lors de la mise à jour des jetons:', err)
  }
}

function handleClose() {
  ;(async () => {
    try {
      // Si la partie est active ET que tous les outils ont déjà été utilisés,
      // considérer la partie terminée côté serveur avant de fermer le popup.
      const toolsCount = (tools.value || []).length
      if (gameActive.value && toolsCount > 0 && currentToolIndex.value >= toolsCount) {
        try {
          const resp = await apiPost('/api/mining/finish')
          if (resp && resp.success) {
            // Mettre à jour l'état local d'après la réponse serveur
            gameActive.value = false
            gameOver.value = true
            finalRewards.value = resp.game?.rewards || []
            // Mettre à jour les jetons si fournis par le serveur
            if (resp.miningTokens !== undefined) {
              miningTokens.value = resp.miningTokens
            }
            if (resp.game) {
              // Synchroniser grille / outils côté client
              cells.value = resp.game.cells || cells.value
              currentToolIndex.value = resp.game.currentToolIndex || currentToolIndex.value
            }
            if (resp.resources) {
              // informer le reste de l'app que des ressources ont été créditées
              window.dispatchEvent(new CustomEvent('mining-game-over', { detail: { resources: resp.resources } }))
            }
            // Déclencher la vérification automatique des succès
            window.dispatchEvent(new CustomEvent('mining-action'))
            // Déclencher la vérification automatique des quêtes
            window.dispatchEvent(new CustomEvent('quest-action'))
            // Mettre à jour le flag global mining
            if (typeof window !== 'undefined') {
              window.__miningActive = false
              window.dispatchEvent(new CustomEvent('mining-active-changed', { detail: { active: false } }))
            }
          }
        } catch (err) {
          //console.warn('Erreur lors de la clôture de la partie sur le serveur:', err)
          // continuer et fermer le popup même si l'appel échoue
        }
      }
    } catch (_) {}
    emit('close')
  })()
 }

function goToArtifacts() {
  emit('close')
  router.push('/collection?tab=artifacts')
}

// Les fonctions sont importées depuis ./mining:
// - getToolIcon, getToolName, getToolTooltip
// - getArtifactIcon, getArtifactName, getArtifactTooltip
// - formatReward, formatGroupedReward, isLargeReward, isRareReward
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

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drops-info-header {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: rgba(139, 69, 19, 0.4);
  border: 2px solid #8B4513;
  border-radius: 6px;
  cursor: url('@/assets/ui/cursor/mark_question.png') 0 0, auto;
  transition: all 0.2s ease;
}

.drops-info-header:hover {
  background: rgba(139, 69, 19, 0.7);
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Petit badge compteur de hints pour debug / visibilité */
.hint-counter {
  font-size: 13px;
  background: rgba(0,0,0,0.45);
  color: #fffbe5;
  padding: 2px 6px;
  border-radius: 10px;
  border: 1px solid rgba(255,198,110,0.35);
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
  position: relative; /* <-- nécessaire pour overlay d'explosion */
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
  user-select: none; /* Désactiver sélection de texte */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
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
  overflow: hidden;
  user-select: none; /* Désactiver sélection de texte */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
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

.reward.rare-reward {
  animation: rareShine 2s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(147, 112, 219, 0.6));
}

@keyframes rareShine {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    filter: drop-shadow(0 0 8px rgba(147, 112, 219, 0.6)) brightness(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    filter: drop-shadow(0 0 12px rgba(147, 112, 219, 0.9)) brightness(1.2);
  }
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

/* Wrapper pour le bouton continuer avec étoiles */
.continue-wrapper {
  position: relative;
  display: inline-block;
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
    gap: 12px;
  }

  .grid {
    width: 75vw;
    height: 75vw;
    max-width: 380px;
    max-height: 380px;
    gap: 3px;
  }

  .tools-panel {
    width: 75vw;
    max-width: 380px;
    height: 80px; /* Réduit de 110px à 80px pour économiser l'espace vertical */
    padding: 8px;
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
    gap: 6px;
  }

  .tools-stack::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Edge */
  }

  /* Cacher le nom de l'outil, sauf pour l'outil actuel */
  .tool-item:not(.current) .tool-name {
    display: none;
  }

  .tool-item {
    min-width: 48px;
    min-height: 48px;
    justify-content: center;
    padding: 6px;
    flex-shrink: 0;
  }

  .tool-item.current {
    min-width: auto;
    min-height: 52px;
  }

  .tool-icon {
    font-size: 20px;
  }

  .tool-name {
    font-size: 12px;
  }

  /* Désactiver les effets hover sur mobile */
  .cell:hover {
    transform: none;
  }

  /* Désactiver les effets de preview sur mobile */
  .cell.preview,
  .cell.preview-strong,
  .cell.preview-destroy {
    outline: none;
    box-shadow: none;
  }

  /* Améliorer interactions tactiles */
  .cell {
    touch-action: manipulation; /* Améliorer réponse tactile */
    -webkit-tap-highlight-color: rgba(255, 198, 110, 0.3); /* Highlight de tap */
  }

  .tool-item {
    touch-action: manipulation;
    -webkit-tap-highlight-color: rgba(255, 198, 110, 0.2);
  }

  /* Améliorer visibilité des tooltips sur mobile */
  .mining-popup :deep(.tooltip) {
    font-size: 12px;
    max-width: 200px;
  }

  /* Améliorer contraste pour accessibilité mobile */
  .cell.intact {
    border-width: 1px; /* Bordures plus fines pour plus de cases */
  }

  .cell.cracked-light,
  .cell.cracked-heavy,
  .cell.dug {
    border-width: 1px;
  }

  /* Optimiser performance mobile */
  .grid {
    -webkit-transform: translateZ(0); /* Accélérer rendu */
    transform: translateZ(0);
  }

  .tools-stack {
    -webkit-overflow-scrolling: touch; /* Smooth scroll iOS */
  }
}

@media (max-width: 480px) {
  .grid {
    width: 90vw;
    height: 90vw;
    max-width: 320px;
    max-height: 320px;
    gap: 2px;
    padding: 6px;
  }

  .tools-panel {
    width: 90vw;
    max-width: 320px;
    height: 70px; /* Réduit de 90px à 70px pour les très petits écrans */
    padding: 6px;
  }

  .cell {
    min-height: 28px;
    min-width: 28px;
    font-size: 10px;
  }

  .reward {
    font-size: 12px;
  }

  .reward.large-emoji {
    font-size: 20px;
  }

  .tool-item {
    min-width: 40px;
    min-height: 40px;
    padding: 4px;
  }

  .tool-item.current {
    min-height: 44px;
  }

  .tool-icon {
    font-size: 16px;
  }

  .tool-name {
    font-size: 11px;
  }

  .header h2 {
    font-size: 16px;
  }

  .artifact-badge {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .tokens {
    font-size: 12px;
    padding: 3px 8px;
  }

  .hint-counter {
    font-size: 11px;
    padding: 1px 4px;
  }

  /* Désactiver les effets hover sur très petits écrans */
  .cell:hover {
    transform: none;
  }

  /* Désactiver les effets de preview sur très petits écrans */
  .cell.preview,
  .cell.preview-strong,
  .cell.preview-destroy {
    outline: none;
    box-shadow: none;
  }

  /* Améliorer les boutons */
  .start-screen p,
  .continue-screen p {
    font-size: 14px;
    margin-bottom: 16px;
  }

  .game-over h3 {
    font-size: 18px;
  }

  .rewards-list {
    padding: 12px;
  }

  .rewards-list li {
    font-size: 14px;
    padding: 3px 0;
  }

  /* Améliorer popup très petit écran */
  .mining-popup :deep(.popup-content) {
    max-width: 100vw !important;
    max-height: 100vh !important;
    padding: 8px !important;
  }

  /* Désactiver complètement les particules sur très petits écrans */
  .cell.digging::before,
  .cell.digging::after {
    display: none !important;
  }

  .explosion-effect {
    display: none; /* Désactiver overlay explosion sur très petits écrans */
  }

  .cell.explosion {
    box-shadow: 0 0 8px rgba(255, 150, 50, 0.6);
    transform: scale(1.03);
    animation: none; /* Désactiver animation explosion */
  }

  /* Simplifier hint */
  .cell-hint {
    width: 16px;
    height: 16px;
    font-size: 10px;
    animation: none; /* Désactiver pulse */
  }
}

/* Ajout : style pour les cases affectées par une explosion */
.cell.explosion {
  /* flash + glow plus prononcé */
  box-shadow: 0 0 18px rgba(255, 150, 50, 0.9), inset 0 0 10px rgba(255,200,120,0.15);
  transform: scale(1.06);
  z-index: 5;
  animation: explosionFlash 550ms ease-out;
}

@keyframes explosionFlash {
  0% { transform: scale(0.95); opacity: 0.0; filter: blur(0px); }
  30% { transform: scale(1.12); opacity: 1; filter: blur(1px); }
  100% { transform: scale(1.0); opacity: 1; filter: blur(0); }
}

/* Overlay global d'explosion (effet lumineux central) */
.explosion-effect {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 40;
  background: radial-gradient(circle at 50% 50%, rgba(255,200,80,0.14) 0%, rgba(255,140,40,0.08) 20%, rgba(0,0,0,0) 50%);
  animation: explosionOverlay 600ms ease-out forwards;
  mix-blend-mode: screen;
}

@keyframes explosionOverlay {
  0% { opacity: 0; transform: scale(0.9); }
  30% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0; transform: scale(1.15); }
}

/* Hint visual for revealed reward cells (from artifacts reveal_rewards) */
.cell-hint {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  font-size: 14px;
  line-height: 1;
  background: linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.35));
  color: #fffbe5;
  border-radius: 6px;
  border: 1px solid rgba(255,198,110,0.5);
  z-index: 60; /* s'assurer au dessus */
  pointer-events: none;
  transform-origin: center;
  animation: hintPulse 1200ms ease-in-out infinite;
  box-shadow: 0 3px 8px rgba(0,0,0,0.45);
  opacity: 0.98;
}

@keyframes hintPulse {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 0.9; }
}

/* Récompenses non obtenues (semi‑transparentes) */
.reward.unobtained {
  opacity: 0.45;
  transform: translate(-50%, -50%) scale(0.95);
  filter: grayscale(30%) brightness(1.05);
  pointer-events: auto;
  font-size: 13px;
  cursor: url('/src/assets/ui/cursor/mark_question.png') 0 0, help;
}

.reward.unobtained.large-emoji {
  font-size: 22px;
}

/* Mode Apocalypse */
.apocalypse-mode .mining-popup {
  background-color: rgba(26, 10, 10, 0.95);
  border-color: #ff6666;
}

.apocalypse-mode .mining-popup :deep(.popup-content) {
  background-color: rgba(42, 17, 17, 0.98);
  border-color: #ff6666;
}


.apocalypse-mode .mining-popup :deep(.popup-title) {
  color: #ff6666;
}

.apocalypse-mode .mining-popup :deep(.popup-close) {
  color: #ff6666;
}

.apocalypse-mode .mining-popup :deep(.popup-close:hover) {
  background-color: #331111;
}

.apocalypse-mode .grid {
  background: #1a0a0a;
  border-color: #441111;
}

.apocalypse-mode .cell {
  background: #2a1111;
  border-color: #662222;
  color: #ffaaaa;
}

.apocalypse-mode .cell.intact {
  background: #331111;
}

.apocalypse-mode .cell.cracked-light {
  background: #2a0f0f;
}

.apocalypse-mode .cell.cracked-heavy {
  background: #220a0a;
}

.apocalypse-mode .cell.dug {
  background: #1a0808;
}

.apocalypse-mode .tools-panel {
  background: #1a0a0a;
  border-color: #441111;
}

.apocalypse-mode .tool-item {
  background: #2a1111;
  border-color: #662222;
  color: #ffaaaa;
}

.apocalypse-mode .tool-item.current {
  background: #331111;
  border-color: #ff6666;
}

.apocalypse-mode .tool-item:hover {
  background: #3a1515;
}

.apocalypse-mode .tokens {
  background-color: #662222;
  border-color: #ff6666;
  color: #ffaaaa;
}

.apocalypse-mode .hint-counter {
  background-color: #441111;
  border-color: #662222;
  color: #ffaaaa;
}

.apocalypse-mode .artifact-badge {
  background: #ff6666;
  border-color: #cc3333;
  color: #ffffff;
}

.apocalypse-mode .tools-stack-container::-webkit-scrollbar-track {
  background: rgba(42, 10, 10, 0.5);
}

.apocalypse-mode .tools-stack-container::-webkit-scrollbar-thumb {
  background: #ff6666;
}

.apocalypse-mode .tools-stack-container::-webkit-scrollbar-thumb:hover {
  background: #ff8888;
}

.apocalypse-mode .rewards-list {
  background-color: rgba(42, 10, 10, 0.5);
  border-color: #ff6666;
}

.apocalypse-mode .cell-hint {
  background: linear-gradient(180deg, rgba(255, 102, 102, 0.5), rgba(204, 51, 51, 0.35));
  border-color: rgba(255, 102, 102, 0.5);
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(255, 102, 102, 0.45);
}

</style>
