import { ref } from 'vue'
import { apiGet, apiPost } from '@/utils/api'

const miningTokens = ref(0)
const gameActive = ref(false)
const gridSize = ref(5)
const cells = ref([])
const tools = ref([])
const currentToolIndex = ref(0)
const rewards = ref([])
const equippedArtifacts = ref([])
const artifactSlotsCount = ref(0)
const loading = ref(false)
const artifactModifiers = ref({}) // <-- nouveau état pour modifs d'artefacts

// Normalise les cellules reçues du serveur : assure que cell.hint soit un booléen
function normalizeCells(arr) {
  if (!Array.isArray(arr)) return arr
  const normalized = arr.map(c => {
    const nc = { ...(c || {}) }
    // normaliser hint (true, 'true', 1, '1', 'yes' => true)
    const v = nc.hint
    nc.hint = !!(v === true || v === 'true' || v === 1 || v === '1' || v === 'yes' || (!!v && v !== 'false'))
    return nc
  })
  // Debug: combien de cellules avec hint ont été signalées
  try {
    const hints = normalized.filter(c => !!c.hint).length
    console.debug('[useMining] normalizeCells -> cells:', normalized.length, 'hints:', hints)
  } catch (_) {}
  return normalized
}

export function useMining() {
  // Récupère l'état actuel du jeu de minage
  async function fetchState() {
    loading.value = true
    try {
      const data = await apiGet('/api/mining/state')
      // DEBUG: log réponse brute du serveur pour diagnostiquer presence de artifactModifiers / hints
      try { console.debug('[useMining] fetchState raw response:', data) } catch (_) {}
      miningTokens.value = data.miningTokens || 0
      gameActive.value = data.active || false
      equippedArtifacts.value = data.equippedArtifacts || []
      artifactSlotsCount.value = data.artifactSlotsCount || 0
      
      if (data.game) {
        gridSize.value = data.game.gridSize
        cells.value = normalizeCells(data.game.cells || [])
        // debug
        try { console.debug('[useMining] fetchState: hintCount=', cells.value.filter(c=>c.hint).length) } catch(_) {}
        tools.value = data.game.tools
        currentToolIndex.value = data.game.currentToolIndex
        rewards.value = data.game.rewards || []
        artifactModifiers.value = data.game.artifactModifiers || {} // <-- hydrate les modifs
        // If the server exposes equippedArtifacts for the active game, use it
        if (data.game.equippedArtifacts) {
          equippedArtifacts.value = data.game.equippedArtifacts
        }
      } else {
        artifactModifiers.value = {}
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
      // DEBUG: log réponse brute du serveur avant toute transformation
      try { console.debug('[useMining] startGame raw response:', data) } catch (_) {}
      
      if (data.success) {
        miningTokens.value = data.miningTokens
        gameActive.value = true
        gridSize.value = data.game.gridSize
        cells.value = normalizeCells(data.game.cells || [])
        try { console.debug('[useMining] startGame: hintCount=', cells.value.filter(c=>c.hint).length) } catch(_) {}
        tools.value = data.game.tools
        currentToolIndex.value = data.game.currentToolIndex
        rewards.value = data.game.rewards || []
        equippedArtifacts.value = data.game.equippedArtifacts || []
        artifactSlotsCount.value = data.artifactSlotsCount || 0
        artifactModifiers.value = data.game.artifactModifiers || {} // <-- hydrate après start
        // server may expose artifactModifiers if needed
        // artifactModifiers.value = data.game.artifactModifiers || {}
        
        // Émettre un événement pour les achievements après le démarrage d'une partie
        window.dispatchEvent(new CustomEvent('mining-action'))
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
        cells.value = normalizeCells(data.game.cells || [])
        try { console.debug('[useMining] dig: hintCount=', cells.value.filter(c=>c.hint).length) } catch(_) {}
        currentToolIndex.value = data.game.currentToolIndex
        rewards.value = data.game.rewards || []
        artifactModifiers.value = data.game.artifactModifiers || {} // <-- mise à jour depuis le serveur (si fournie)
        // Ne pas mettre à jour equippedArtifacts - ils restent constants pendant une partie
        
        if (data.gameOver) {
          // Ne pas désactiver gameActive pour garder la grille visible
          // gameActive.value = false
          // Mettre à jour les jetons après attribution des récompenses
          if (data.miningTokens !== undefined) {
            miningTokens.value = data.miningTokens
          }
          // Émettre un événement pour actualiser les ressources globales
          if (data.resources) {
            window.dispatchEvent(new CustomEvent('mining-game-over', { 
              detail: { resources: data.resources } 
            }))
          }
        } else {
          // Émettre un événement pour les achievements après chaque creusage réussi
          window.dispatchEvent(new CustomEvent('mining-action'))
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
    equippedArtifacts,
    artifactSlotsCount,
    loading,
    artifactModifiers,
    fetchState,
    startGame,
    dig
  }
}
