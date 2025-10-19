import User from '../models/User.js'
import { miningData } from '../data/sharedGameData.js'

// Utiliser la source unique de vérité pour la configuration du mini-jeu
const MINING_CONFIG = miningData

// Génère une récompense aléatoire basée sur le pool pondéré
function generateReward() {
  const total = MINING_CONFIG.rewardPool.reduce((sum, r) => sum + r.weight, 0)
  let rand = Math.random() * total
  
  for (const reward of MINING_CONFIG.rewardPool) {
    rand -= reward.weight
    if (rand <= 0) {
      return `${reward.type}:${reward.amount}`
    }
  }
  return null
}

// Génère une nouvelle grille de jeu
function generateGrid(size) {
  const cells = []
  const rewardChance = 0.4 // 40% de chance d'avoir une récompense par case
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      cells.push({
        row,
        col,
        hp: MINING_CONFIG.defaultHP,
        reward: Math.random() < rewardChance ? generateReward() : null
      })
    }
  }
  
  return cells
}

// Génère une liste d'outils aléatoires
// Effectue un tirage pondéré avec remise pour générer la liste d'outils
function generateTools() {
  const totalWeight = MINING_CONFIG.toolPool.reduce((s, t) => s + t.weight, 0)
  const picks = []

  for (let i = 0; i < (MINING_CONFIG.toolsCount || 6); i++) {
    let rand = Math.random() * totalWeight
    for (const entry of MINING_CONFIG.toolPool) {
      rand -= entry.weight
      if (rand <= 0) {
        picks.push(entry.type)
        break
      }
    }
  }

  // Mélanger légèrement l'ordre pour un peu d'aléa visuel
  return picks.sort(() => Math.random() - 0.5)
}

// GET /api/mining/state - Récupère l'état actuel du jeu de minage
export async function getMiningState(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    res.json({
      miningTokens: user.resources.mining_token || 0,
      active: user.miningGame?.active || false,
      game: user.miningGame?.active ? {
        gridSize: user.miningGame.gridSize,
        cells: user.miningGame.cells,
        tools: user.miningGame.tools,
        currentToolIndex: user.miningGame.currentToolIndex,
        rewards: user.miningGame.rewards
      } : null
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/mining/start - Démarre une nouvelle partie (consomme 1 jeton)
export async function startMining(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    // Vérifier si une partie est déjà active
    if (user.miningGame?.active) {
      return res.status(400).json({ error: 'Une partie est déjà en cours' })
    }

    // Vérifier les jetons
    if ((user.resources.mining_token || 0) < 1) {
      return res.status(400).json({ error: 'Pas assez de jetons de minage' })
    }

    // Consommer un jeton
    user.resources.mining_token -= 1

    // Générer une nouvelle partie
    const gridSize = MINING_CONFIG.gridSize
    const cells = generateGrid(gridSize)
    const tools = generateTools()

    user.miningGame = {
      active: true,
      gridSize,
      cells,
      tools,
      currentToolIndex: 0,
      rewards: []
    }

    await user.save()

    res.json({
      success: true,
      miningTokens: user.resources.mining_token,
      game: {
        gridSize: user.miningGame.gridSize,
        cells: user.miningGame.cells,
        tools: user.miningGame.tools,
        currentToolIndex: user.miningGame.currentToolIndex,
        rewards: user.miningGame.rewards
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/mining/dig - Creuse une case avec l'outil actuel
export async function digCell(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    if (!user.miningGame?.active) {
      return res.status(400).json({ error: 'Aucune partie en cours' })
    }

    const { row, col } = req.body
    if (row === undefined || col === undefined) {
      return res.status(400).json({ error: 'Position invalide' })
    }

    // Récupérer l'outil actuel
    const toolIndex = user.miningGame.currentToolIndex
    if (toolIndex >= user.miningGame.tools.length) {
      return res.status(400).json({ error: 'Plus d\'outils disponibles' })
    }

    const toolType = user.miningGame.tools[toolIndex]
    const tool = MINING_CONFIG.tools[toolType]
    if (!tool) {
      return res.status(400).json({ error: 'Outil invalide' })
    }

    // Calculer les cases affectées selon le pattern de l'outil
    const affectedCells = []
    if (tool.pattern === 'single') {
      affectedCells.push({ row, col, damage: tool.damage })
    } else if (tool.pattern === 'cross') {
      affectedCells.push({ row, col, damage: tool.damage })
      affectedCells.push({ row: row - 1, col, damage: 1 })
      affectedCells.push({ row: row + 1, col, damage: 1 })
      affectedCells.push({ row, col: col - 1, damage: 1 })
      affectedCells.push({ row, col: col + 1, damage: 1 })
    } else if (tool.pattern === 'square') {
      // 3x3 centered on (row, col) : centre reçoit tool.damage, voisins reçoivent 1
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr
          const c = col + dc
          const dmg = (dr === 0 && dc === 0) ? tool.damage : 1
          affectedCells.push({ row: r, col: c, damage: dmg })
        }
      }
    }

    const newRewards = []

    // Appliquer les dégâts aux cases
    for (const affected of affectedCells) {
      const cell = user.miningGame.cells.find(
        c => c.row === affected.row && c.col === affected.col
      )
      
      if (cell && cell.hp > 0) {
        cell.hp = Math.max(0, cell.hp - affected.damage)
        
        // Si la case est détruite et a une récompense
        if (cell.hp === 0 && cell.reward) {
          newRewards.push(cell.reward)
          user.miningGame.rewards.push(cell.reward)
        }
      }
    }

    // Passer à l'outil suivant
    user.miningGame.currentToolIndex += 1

    // Vérifier si la partie est terminée (plus d'outils)
    const gameOver = user.miningGame.currentToolIndex >= user.miningGame.tools.length

    if (gameOver) {
      // Appliquer les récompenses
      for (const reward of user.miningGame.rewards) {
        const [type, amount] = reward.split(':')
        const amt = parseInt(amount)
        
        if (type === 'eggs') {
          user.resources.eggs = (user.resources.eggs || 0) + amt
        } else if (type === 'mining_token') {
          user.resources.mining_token = (user.resources.mining_token || 0) + amt
        } else if (type === 'stock_token') {
          user.resources.stock_token = (user.resources.stock_token || 0) + amt
        } else if (type === 'production_token') {
          user.resources.production_token = (user.resources.production_token || 0) + amt
        }
      }

      // Terminer la partie
      user.miningGame.active = false
    }

    await user.save()

    res.json({
      success: true,
      newRewards,
      gameOver,
      game: {
        gridSize: user.miningGame.gridSize,
        cells: user.miningGame.cells,
        tools: user.miningGame.tools,
        currentToolIndex: user.miningGame.currentToolIndex,
        rewards: user.miningGame.rewards
      },
      resources: gameOver ? {
        eggs: user.resources.eggs,
        mining_token: user.resources.mining_token,
        stock_token: user.resources.stock_token,
        production_token: user.resources.production_token
      } : undefined
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
