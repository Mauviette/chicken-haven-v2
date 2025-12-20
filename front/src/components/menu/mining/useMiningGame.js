import { ref, computed, watch } from 'vue'
import { cursorMap, getToolCursor } from './miningGameConstants'

/**
 * Composable pour gérer la logique du mini-jeu de minage
 * @param {Object} miningComposable - Résultat de useMining()
 */
export function useMiningGame(miningComposable) {
  const {
    cells,
    tools,
    currentToolIndex,
    gameActive,
    rewards,
    gridSize,
    equippedArtifacts,
    artifactModifiers,
    dig,
    fetchState,
    startGame: apiStartGame,
    continueGame: apiContinueGame,
    loading,
    miningTokens,
  } = miningComposable

  // État local du jeu UI
  const previewCells = ref([])
  const usedToolAnimation = ref(false)
  const explosionCells = ref([])
  const showExplosionOverlay = ref(false)
  const diggingCell = ref(null)
  const gameStarted = ref(false)
  const showContinuePrompt = ref(false)

  // Outil actuel
  const currentTool = computed(() => {
    if (!tools.value || tools.value.length === 0) return null
    return tools.value[currentToolIndex.value] || null
  })

  // Curseur dynamique basé sur l'outil actuel
  const gridCursor = computed(() => {
    if (!currentTool.value) return 'pointer'
    return getToolCursor(currentTool.value.type)
  })

  // Vérifie si le jeu est terminé (plus d'outils)
  const isGameOver = computed(() => {
    return gameStarted.value && gameActive.value && (!tools.value || tools.value.length === 0)
  })

  // Grille 2D pour le template
  const grid2D = computed(() => {
    if (!cells.value || cells.value.length === 0) return []
    const size = gridSize.value || 5
    const result = []
    for (let row = 0; row < size; row++) {
      const rowCells = []
      for (let col = 0; col < size; col++) {
        const index = row * size + col
        rowCells.push(cells.value[index] || { state: 'intact', reward: null })
      }
      result.push(rowCells)
    }
    return result
  })

  // Calcule les cellules affectées par l'outil actuel à une position donnée
  function getAffectedCells(row, col) {
    if (!currentTool.value) return []

    const affected = []
    const size = gridSize.value || 5
    const toolType = currentTool.value.type

    // Pattern selon le type d'outil
    const patterns = {
      pickaxe: [[0, 0]],
      'pickaxe-iron': [[0, 0]],
      'pickaxe-gold': [[0, 0]],
      'pickaxe-diamond': [[0, 0]],
      'pickaxe-netherite': [[0, 0]],
      'pickaxe-aurora': [[0, 0]],
      'pickaxe-obsidian': [[0, 0]],
      brush: [[0, 0]],
      bomb: [
        [0, 0],
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ], // Croix
      dynamite: [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 0],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ], // 3x3
      drill: [], // Colonne entière
      laser: [], // Ligne entière
      scanner: [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 0],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ], // 3x3
      xray: [], // Toute la grille
    }

    // Patterns spéciaux
    if (toolType === 'drill') {
      // Colonne entière
      for (let r = 0; r < size; r++) {
        affected.push({ row: r, col })
      }
      return affected
    }

    if (toolType === 'laser') {
      // Ligne entière
      for (let c = 0; c < size; c++) {
        affected.push({ row, col: c })
      }
      return affected
    }

    if (toolType === 'xray') {
      // Toute la grille
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          affected.push({ row: r, col: c })
        }
      }
      return affected
    }

    // Pattern standard
    const pattern = patterns[toolType] || [[0, 0]]
    pattern.forEach(([dr, dc]) => {
      const newRow = row + dr
      const newCol = col + dc
      if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
        affected.push({ row: newRow, col: newCol })
      }
    })

    return affected
  }

  // Gestion du survol pour le preview
  function handleCellHover(row, col) {
    previewCells.value = getAffectedCells(row, col)
  }

  function clearPreview() {
    previewCells.value = []
  }

  // Vérifie si une cellule est en preview
  function isCellInPreview(row, col) {
    return previewCells.value.some((p) => p.row === row && p.col === col)
  }

  // Type de preview pour une cellule
  function getPreviewType(row, col) {
    if (!isCellInPreview(row, col)) return ''

    const cell = grid2D.value[row]?.[col]
    if (!cell) return 'preview'

    const toolType = currentTool.value?.type || ''

    // Outils qui détruisent complètement
    if (['dynamite', 'laser', 'drill'].includes(toolType)) {
      return 'preview-destroy'
    }

    // Outils avec effet fort
    if (['bomb', 'pickaxe-diamond', 'pickaxe-netherite', 'pickaxe-aurora', 'pickaxe-obsidian'].includes(toolType)) {
      return 'preview-strong'
    }

    return 'preview'
  }

  // Animation d'utilisation d'outil
  function triggerToolAnimation() {
    usedToolAnimation.value = true
    setTimeout(() => {
      usedToolAnimation.value = false
    }, 300)
  }

  // Animation d'explosion
  function triggerExplosion(affectedCells) {
    explosionCells.value = affectedCells.map((c) => `${c.row}-${c.col}`)
    showExplosionOverlay.value = true

    setTimeout(() => {
      explosionCells.value = []
      showExplosionOverlay.value = false
    }, 600)
  }

  // Vérifie si une cellule est en explosion
  function isCellExploding(row, col) {
    return explosionCells.value.includes(`${row}-${col}`)
  }

  // Action de creuser
  async function handleDig(row, col) {
    if (!currentTool.value || loading.value) return

    const index = row * (gridSize.value || 5) + col
    diggingCell.value = index

    triggerToolAnimation()

    // Déclencher explosion pour les outils AOE
    const aoeTools = ['bomb', 'dynamite', 'drill', 'laser']
    if (aoeTools.includes(currentTool.value.type)) {
      triggerExplosion(getAffectedCells(row, col))
    }

    try {
      await dig(index)
    } catch (err) {
      console.error('Erreur lors du creusement:', err)
    } finally {
      setTimeout(() => {
        diggingCell.value = null
      }, 200)
    }
  }

  // Démarrer une nouvelle partie
  async function startNewGame() {
    await apiStartGame()
    gameStarted.value = true
    showContinuePrompt.value = false
  }

  // Continuer une partie existante
  async function continueExistingGame() {
    showContinuePrompt.value = false
    gameStarted.value = true
  }

  // Initialiser le jeu
  async function initGame() {
    await fetchState()

    if (gameActive.value && tools.value?.length > 0) {
      // Une partie est en cours, proposer de continuer
      showContinuePrompt.value = true
    }
  }

  // Observers pour détecter la fin de partie
  watch(
    () => tools.value?.length,
    (newLen) => {
      if (gameStarted.value && gameActive.value && newLen === 0) {
        // Partie terminée
      }
    }
  )

  return {
    // État
    previewCells,
    usedToolAnimation,
    explosionCells,
    showExplosionOverlay,
    diggingCell,
    gameStarted,
    showContinuePrompt,

    // Computed
    currentTool,
    gridCursor,
    isGameOver,
    grid2D,

    // Méthodes
    handleCellHover,
    clearPreview,
    isCellInPreview,
    getPreviewType,
    isCellExploding,
    handleDig,
    startNewGame,
    continueExistingGame,
    initGame,
    getAffectedCells,
  }
}
