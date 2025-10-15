import { ref } from 'vue'
import { apiGet, apiPost } from '@/utils/api'

const miningTokens = ref(0)
const gameActive = ref(false)
const gridSize = ref(5)
const cells = ref([])
const tools = ref([])
const currentToolIndex = ref(0)
const rewards = ref([])
const loading = ref(false)

export function useMining() {
  // Récupère l'état actuel du jeu de minage
  async function fetchState() {
    loading.value = true
    try {
      const data = await apiGet('/api/mining/state')
      miningTokens.value = data.miningTokens || 0
      gameActive.value = data.active || false
      
      if (data.game) {
        gridSize.value = data.game.gridSize
        cells.value = data.game.cells
        tools.value = data.game.tools
        currentToolIndex.value = data.game.currentToolIndex
        rewards.value = data.game.rewards || []
      }
      
      return data
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'état du minage:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Démarre une nouvelle partie
  async function startGame() {
    loading.value = true
    try {
      const data = await apiPost('/api/mining/start')
      
      if (data.success) {
        miningTokens.value = data.miningTokens
        gameActive.value = true
        gridSize.value = data.game.gridSize
        cells.value = data.game.cells
        tools.value = data.game.tools
        currentToolIndex.value = data.game.currentToolIndex
        rewards.value = data.game.rewards || []
      }
      
      return data
    } catch (err) {
      console.error('Erreur lors du démarrage du jeu:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Creuse une case
  async function dig(row, col) {
    loading.value = true
    try {
      const data = await apiPost('/api/mining/dig', { row, col })
      
      if (data.success) {
        // Mettre à jour l'état local
        cells.value = data.game.cells
        currentToolIndex.value = data.game.currentToolIndex
        rewards.value = data.game.rewards || []
        
        if (data.gameOver) {
          gameActive.value = false
          // Émettre un événement pour actualiser les ressources globales
          if (data.resources) {
            window.dispatchEvent(new CustomEvent('mining-game-over', { 
              detail: { resources: data.resources } 
            }))
          }
        }
      }
      
      return data
    } catch (err) {
      console.error('Erreur lors du creusage:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    miningTokens,
    gameActive,
    gridSize,
    cells,
    tools,
    currentToolIndex,
    rewards,
    loading,
    fetchState,
    startGame,
    dig
  }
}
