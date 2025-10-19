import User from '../models/User.js'
import { miningData, artifactsData } from '../data/sharedGameData.js'

// Utiliser la source unique de vérité pour la configuration du mini-jeu
const MINING_CONFIG = miningData

// Helper : calcule les modificateurs appliqués par une liste d'artefacts équipés
function computeArtifactModifiers(equipped = []) {
  const modifiers = {
    extraRewardChance: 0, // ajout en probabilité absolue (ex: +0.05)
    rewardAmountPercent: 0, // somme en pourcentage (ex: 20 => +20%)
    toolDamageAdd: 0, // ajout plat aux dégâts d'outil
    extraSlotsFromArtifacts: 0
  }

  for (const id of equipped) {
    if (!id) continue
    const art = artifactsData[id]
    if (!art || !art.effect) continue
    const e = art.effect
    if (e.type === 'increase_reward_chance') {
      modifiers.extraRewardChance += (e.amount || 0)
    } else if (e.type === 'increase_reward_amount_percent') {
      modifiers.rewardAmountPercent += (e.percent || 0)
    } else if (e.type === 'increase_tool_damage') {
      modifiers.toolDamageAdd += (e.amount || 0)
    } else if (e.type === 'add_artifact_slot') {
      modifiers.extraSlotsFromArtifacts += (e.amount || 0)
    }
  }

  return modifiers
}

// Génère une récompense aléatoire basée sur le pool pondéré
function generateReward(rewardAmountPercent = 0) {
  const total = MINING_CONFIG.rewardPool.reduce((sum, r) => sum + r.weight, 0)
  let rand = Math.random() * total
  
  for (const reward of MINING_CONFIG.rewardPool) {
    rand -= reward.weight
    if (rand <= 0) {
      // Appliquer multiplicateur de quantité si demandé
      const base = reward.amount || 0
      const finalAmount = Math.max(1, Math.round(base * (1 + rewardAmountPercent / 100)))
      return `${reward.type}:${finalAmount}`
    }
  }
  return null
}

// Génère une nouvelle grille de jeu
function generateGrid(size, rewardChance = 0.4, rewardAmountPercent = 0) {
  const cells = []
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      cells.push({
        row,
        col,
        hp: MINING_CONFIG.defaultHP,
        reward: Math.random() < rewardChance ? generateReward(rewardAmountPercent) : null
      })
    }
  }
  
  return cells
}

// Génère une liste d'outils aléatoires
// Effectue un tirage pondéré avec remise pour générer la liste d'outils
function generateTools(toolDamageAdd = 0) {
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

  // Si on doit augmenter les dégâts, on stockera l'augmentation dans une map séparée au moment de start
  return picks.sort(() => Math.random() - 0.5)
}

// GET /api/mining/state - Récupère l'état actuel du jeu de minage
export async function getMiningState(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    // S'assurer que equipped a la bonne longueur avec des nulls si nécessaire
    const slotsCount = user.artifactSlots?.slotsCount || 2
    let equipped = user.artifactSlots?.equipped || []
    
    // Compléter avec des null si le tableau est trop court
    while (equipped.length < slotsCount) {
      equipped.push(null)
    }
    
    res.json({
      miningTokens: user.resources.mining_token || 0,
      active: user.miningGame?.active || false,
      equippedArtifacts: equipped,
      artifactSlotsCount: slotsCount,
      game: user.miningGame?.active ? {
        gridSize: user.miningGame.gridSize,
        cells: user.miningGame.cells,
        tools: user.miningGame.tools,
        currentToolIndex: user.miningGame.currentToolIndex,
        rewards: user.miningGame.rewards,
        equippedArtifacts: user.miningGame.equippedArtifacts || equipped
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

    // S'assurer que artifactSlots existe et est initialisé
    if (!user.artifactSlots) {
      user.artifactSlots = { slotsCount: 2, equipped: [] }
    }
    if (!user.artifactSlots.equipped) {
      user.artifactSlots.equipped = []
    }

    // Préparer les artefacts équipés (on lit depuis artifactSlots.equipped)
    // S'assurer que equipped a la bonne longueur avec des nulls si nécessaire
    const slotsCount = user.artifactSlots.slotsCount || 2
    let equipped = Array.isArray(user.artifactSlots.equipped) ? [...user.artifactSlots.equipped] : []
    
    // Compléter avec des null si le tableau est trop court
    while (equipped.length < slotsCount) {
      equipped.push(null)
    }

    // Calculer les modificateurs provenant des artefacts
    const mods = computeArtifactModifiers(equipped)

    // Générer une nouvelle partie en appliquant les modificateurs
    const gridSize = MINING_CONFIG.gridSize
    const rewardChanceBase = 0.4
    const rewardChance = Math.max(0, rewardChanceBase + (mods.extraRewardChance || 0))
    const cells = generateGrid(gridSize, rewardChance, mods.rewardAmountPercent)

    // Générer outils (on conserve la liste des types) - les dégâts additionnels seront appliqués dynamiquement lors du dig
    const tools = generateTools()

    user.miningGame = {
      active: true,
      gridSize,
      cells,
      tools,
      currentToolIndex: 0,
      rewards: [],
      equippedArtifacts: equipped,
      artifactModifiers: mods
    }

    await user.save()

    res.json({
      success: true,
      miningTokens: user.resources.mining_token,
      artifactSlotsCount: user.artifactSlots?.slotsCount || 0,
      game: {
        gridSize: user.miningGame.gridSize,
        cells: user.miningGame.cells,
        tools: user.miningGame.tools,
        currentToolIndex: user.miningGame.currentToolIndex,
        rewards: user.miningGame.rewards,
        equippedArtifacts: user.miningGame.equippedArtifacts || []
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
    // Déterminer les modificateurs d'artefacts pour cette partie
    const artifactMods = user.miningGame && user.miningGame.artifactModifiers ? user.miningGame.artifactModifiers : { toolDamageAdd: 0, rewardAmountPercent: 0 }

    // Calculer les cases affectées selon le pattern de l'outil (en appliquant le bonus de dégât si présent)
    const affectedCells = []
    if (tool.pattern === 'single') {
      affectedCells.push({ row, col, damage: tool.damage + (artifactMods.toolDamageAdd || 0) })
    } else if (tool.pattern === 'cross') {
      affectedCells.push({ row, col, damage: tool.damage + (artifactMods.toolDamageAdd || 0) })
      affectedCells.push({ row: row - 1, col, damage: 1 })
      affectedCells.push({ row: row + 1, col, damage: 1 })
      affectedCells.push({ row, col: col - 1, damage: 1 })
      affectedCells.push({ row, col: col + 1, damage: 1 })
    } else if (tool.pattern === 'square') {
      // 3x3 centered on (row, col) : centre reçoit tool.damage (+artifact), voisins reçoivent 1
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr
          const c = col + dc
          const isCenter = (dr === 0 && dc === 0)
          const base = isCenter ? tool.damage + (artifactMods.toolDamageAdd || 0) : 1
          affectedCells.push({ row: r, col: c, damage: base })
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
          // Si un multiplicateur de quantité a été appliqué, on peut reformater la récompense
          const rewardPercent = artifactMods.rewardAmountPercent || 0
          if (rewardPercent && typeof cell.reward === 'string') {
            const [t, a] = cell.reward.split(':')
            const baseAmt = parseInt(a) || 1
            const finalAmt = Math.max(1, Math.round(baseAmt * (1 + rewardPercent / 100)))
            const formatted = `${t}:${finalAmt}`
            newRewards.push(formatted)
            user.miningGame.rewards.push(formatted)
          } else {
            newRewards.push(cell.reward)
            user.miningGame.rewards.push(cell.reward)
          }
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
        rewards: user.miningGame.rewards,
        equippedArtifacts: user.miningGame.equippedArtifacts || [],
        artifactModifiers: user.miningGame.artifactModifiers || {}
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
