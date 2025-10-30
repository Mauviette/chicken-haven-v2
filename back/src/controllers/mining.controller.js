import User from '../models/User.js'
import { miningData, artifactsData } from '../data/sharedGameData.js'

// Utiliser la source unique de vérité pour la configuration du mini-jeu
const MINING_CONFIG = miningData
import { updateAchievementProgress } from './achievements.controller.js'
import { updateQuestProgress } from './quests.controller.js'

// NOUVEAU : helpers pour vérifier si l'utilisateur a une partie de minage active
export async function isUserMining(userId) {
  try {
    const user = await User.findById(userId).select('miningGame')
    if (!user) return false
    return !!(user.miningGame && user.miningGame.active)
  } catch (err) {
    console.warn('isUserMining error for', userId, err)
    return false
  }
}

/**
 * Assert helper à appeler avant d'autoriser equip/unequip d'artefacts côté serveur.
 * Lance une erreur (Error) si l'utilisateur a une partie de minage active.
 * Le controller d'équipement doit attraper cette erreur et renvoyer un 400/409 approprié.
 */
export async function assertUserCanModifyArtifacts(userId) {
  const active = await isUserMining(userId)
  if (active) {
    const e = new Error('Impossible de modifier les artefacts pendant une partie de minage active')
    e.code = 'MINING_ACTIVE'
    throw e
  }
  return true
}

// NOUVEAU : middleware Express réutilisable (optionnel)
export function checkCanModifyArtifactsMiddleware(req, res, next) {
  ;(async () => {
    try {
      const userId = req.userId || (req.user && req.user._id)
      if (!userId) return res.status(401).json({ error: 'Non authentifié' })
      const active = await isUserMining(userId)
      if (active) {
        return res.status(409).json({ error: 'Impossible de modifier les artefacts pendant une partie de minage active' })
      }
      next()
    } catch (err) {
      console.error('checkCanModifyArtifactsMiddleware error:', err)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  })()
}

// Helper : calcule les modificateurs appliqués par une liste d'artefacts équipés
function computeArtifactModifiers(equipped = []) {
  const modifiers = {
    extraRewardChance: 0, // ajout en probabilité absolue (ex: +0.05)
    rewardAmountPercent: 0, // somme en pourcentage (ex: 20 => +20%)
    toolDamageAdd: 0, // ajout plat aux dégâts d'outil (appliqué au centre)
    extraSlotsFromArtifacts: 0,
    // Nouveaux champs pour effets d'outils
    extraToolCount: 0, // nombre d'outils supplémentaires à ajouter
    lastDynamite: false, // forcer le dernier outil à être une dynamite
    toolChanges: [], // list of { origin, dest } to map tool types
    duplicates: [], // list of { detect, add } pour dupliquer certains outils
    revealRewardsChance: 0, // probabilité cumulée de révéler des cases avec récompense
    chainDamage: 0, // dégâts supplémentaires aux cases adjacentes quand une case est brisée
    revealCrackedRewards: false, // révéler les cases avec récompenses fissurées
    fragileGrid: { chance: 0, damage: 0 } // chance et dégâts initiaux pour les cases
  }

  // Normaliser les entrées "equipped" : accepter string id ou objets { artifactId } / { id }
  const normalizedIds = (Array.isArray(equipped) ? equipped : [])
    .map(item => {
      if (!item) return null
      if (typeof item === 'string') return item
      if (typeof item === 'object') return item.artifactId || item.id || null
      return null
    })
    .filter(Boolean)

  for (const id of normalizedIds) {
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
    } else if (e.type === 'increase_tool_count') {
      modifiers.extraToolCount += (e.amount || 0)
    } else if (e.type === 'last_dynamite') {
      modifiers.lastDynamite = true
    } else if (e.type === 'tool_change') {
      if (e.origin && e.dest) modifiers.toolChanges.push({ origin: e.origin, dest: e.dest })
    } else if (e.type === 'when_tool_add_another') {
      if (e.detect && e.add) modifiers.duplicates.push({ detect: e.detect, add: e.add })
    } else if (e.type === 'reveal_rewards') {
      modifiers.revealRewardsChance += (e.chance || 0)
    } else if (e.type === 'chain_damage') {
      modifiers.chainDamage = Math.max(modifiers.chainDamage, e.amount || 0)
    } else if (e.type === 'reveal_cracked_rewards') {
      modifiers.revealCrackedRewards = true
    } else if (e.type === 'fragile_grid') {
      modifiers.fragileGrid.chance = Math.max(modifiers.fragileGrid.chance, e.chance || 0)
      modifiers.fragileGrid.damage = Math.max(modifiers.fragileGrid.damage, e.damage || 0)
    }
    // autres types futurs possibles...
  }

  // DEBUG: lister les IDs normalisés et modificateurs calculés (utile pour diagnostics)
  try {
    console.debug('[mining] computeArtifactModifiers -> normalizedIds:', normalizedIds, 'modifiers:', modifiers)
  } catch (_) {}

  return modifiers
}

// Génère une récompense aléatoire basée sur le pool pondéré
function generateReward(rewardAmountPercent = 0, isApocalypse = false) {
  if (isApocalypse && Math.random() < 0.25) {
    return 'rotten_tomato:1'
  }
  
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
function generateGrid(size, rewardChance = 0.4, rewardAmountPercent = 0, isApocalypse = false, fragileGrid = { chance: 0, damage: 0 }) {
  const cells = []
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      let hp = MINING_CONFIG.defaultHP
      
      // Appliquer l'effet fragile_grid : réduire les HP initiaux
      if (fragileGrid.chance > 0 && Math.random() < fragileGrid.chance) {
        hp = Math.max(1, hp - fragileGrid.damage) // Ne pas descendre en dessous de 1
      }
      
      cells.push({
        row,
        col,
        hp,
        reward: Math.random() < rewardChance ? generateReward(rewardAmountPercent, isApocalypse) : null,
        hint: false // <- explicit default so front-side normalization / debug shows presence
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
    
    // Vérifier que l'utilisateur a le niveau requis pour le minage
    const playerLevel = user.experience?.level || 1
    if (playerLevel < 5) {
      return res.status(403).json({ error: 'Niveau 5 requis pour accéder au minage' })
    }

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
    
    // Vérifier que l'utilisateur a le niveau requis pour le minage
    const playerLevel = user.experience?.level || 1
    if (playerLevel < 5) {
      return res.status(403).json({ error: 'Niveau 5 requis pour accéder au minage' })
    }

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

    // DEBUG: log des artefacts équipés et des modificateurs calculés
    try {
      console.debug('[mining] startMining - equippedArtifacts:', equipped)
      console.debug('[mining] startMining - computed modifiers:', mods)
    } catch (_) {}
    
     // Générer une nouvelle partie en appliquant les modificateurs
     const gridSize = MINING_CONFIG.gridSize
     const rewardChanceBase = 0.4
     const rewardChance = Math.max(0, rewardChanceBase + (mods.extraRewardChance || 0))
     const isApocalypse = !!user.apocalypse
     const cells = generateGrid(gridSize, rewardChance, mods.rewardAmountPercent, isApocalypse, mods.fragileGrid)

    // DEBUG: combien de cellules ont une reward avant reveal
    try {
      const rewardCellsCount = Array.isArray(cells) ? cells.filter(c => !!c.reward).length : 0
      console.debug('[mining] startMining - generated gridSize=', gridSize, 'rewardCells=', rewardCellsCount, 'rewardChance=', rewardChance)
    } catch (_) {}
    
    // Appliquer reveal_cracked_rewards : marquer les cases avec récompenses fissurées
    if (mods.revealCrackedRewards) {
      let crackedRevealed = 0
      for (const cell of cells) {
        if (cell.reward && cell.hp < MINING_CONFIG.defaultHP) {
          cell.hint = true
          crackedRevealed++
        }
      }
      // DEBUG: log du nombre de cellules révélées
      try { console.debug('[mining] startMining - reveal_cracked_rewards markedHints=', crackedRevealed) } catch(_) {}
    }

    // Générer outils (on conserve la liste des types) - les dégâts additionnels seront appliqués dynamiquement lors du dig
    const baseTools = generateTools()

    // Appliquer les effets liés aux artefacts sur la liste d'outils
    let appliedTools = [...baseTools]

    // 1) Duplication : when_tool_add_another (ex: hole-ace : duplicate shovels)
    if (mods.duplicates && mods.duplicates.length > 0) {
      for (const dup of mods.duplicates) {
        const tmp = []
        for (const t of appliedTools) {
          tmp.push(t)
          if (t === dup.detect) tmp.push(dup.add)
        }
        appliedTools = tmp
      }
    }

    // 2) Add extra tools (increase_tool_count)
    if (mods.extraToolCount && mods.extraToolCount > 0) {
      const totalWeight = MINING_CONFIG.toolPool.reduce((s, t) => s + t.weight, 0)
      for (let i = 0; i < mods.extraToolCount; i++) {
        let rand = Math.random() * totalWeight
        for (const entry of MINING_CONFIG.toolPool) {
          rand -= entry.weight
          if (rand <= 0) {
            appliedTools.push(entry.type)
            break
          }
        }
      }
    }

    // 3) Forcer dernier outil = dynamite si demandé (avant application des tool_change,
    //    afin que les tool_change puissent transformer éventuellement cette dynamite)
    if (mods.lastDynamite) {
      if (appliedTools.length === 0) {
        appliedTools.push('dynamite')
      } else {
        appliedTools[appliedTools.length - 1] = 'dynamite'
      }
    }

    // 4) Appliquer les remplacements d'outils (tool_change) (ex: dynamite -> bomb, shovel -> pickaxe)
    if (mods.toolChanges && mods.toolChanges.length > 0) {
      const mapping = new Map()
      for (const tc of mods.toolChanges) mapping.set(tc.origin, tc.dest)
      for (let i = 0; i < appliedTools.length; i++) {
        if (mapping.has(appliedTools[i])) appliedTools[i] = mapping.get(appliedTools[i])
      }
    }

    // Mélanger légèrement la pile pour conserver un peu d'aléa
    //appliedTools = appliedTools.sort(() => Math.random() - 0.5)

    const tools = appliedTools

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

    // Incrémenter le nombre de parties jouées
    await updateAchievementProgress(req.userId, 'increment', { miningGamesPlayed: 1 })
    
    // Mettre à jour le progrès des quêtes
    await updateQuestProgress(req.userId, 'mining_games_played', 1)

    // Déclencher un événement pour notifier le frontend
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mining-game-started'))
    }

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
        equippedArtifacts: user.miningGame.equippedArtifacts || [],
        artifactModifiers: user.miningGame.artifactModifiers || {} // <-- exposer les modifs dès le start
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Fonction helper pour appliquer les dégâts en chaîne
function applyChainDamage(cells, row, col, chainDamage, newRewards, rewards, processedCells = new Set()) {
  const cellKey = `${row}-${col}`
  
  // Éviter de retraiter la même case
  if (processedCells.has(cellKey)) return
  processedCells.add(cellKey)
  
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1] // haut, bas, gauche, droite
  ]
  
  for (const [dr, dc] of directions) {
    const newRow = row + dr
    const newCol = col + dc
    
    // Vérifier que la case est dans les limites de la grille
    if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5) {
      const adjacentCell = cells.find(c => c.row === newRow && c.col === newCol)
      
      if (adjacentCell && adjacentCell.hp > 0) {
        adjacentCell.hp = Math.max(0, adjacentCell.hp - chainDamage)
        
        // Si cette case adjacente est détruite par la réaction en chaîne
        if (adjacentCell.hp === 0) {
          if (adjacentCell.reward) {
            newRewards.push(adjacentCell.reward)
            rewards.push(adjacentCell.reward)
          }
          
          // Propagation récursive de la réaction en chaîne
          applyChainDamage(cells, newRow, newCol, chainDamage, newRewards, rewards, processedCells)
        }
      }
    }
  }
}

// POST /api/mining/dig - Creuse une case avec l'outil actuel
export async function digCell(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    // Vérifier que l'utilisateur a le niveau requis pour le minage
    const playerLevel = user.experience?.level || 1
    if (playerLevel < 5) {
      return res.status(403).json({ error: 'Niveau 5 requis pour accéder au minage' })
    }

    if (!user.miningGame?.active) {
      return res.status(400).json({ error: 'Aucune partie en cours' })
    }

    console.log('[mining] digCell - user.apocalypse:', user.apocalypse)

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
    // secondary_damage correspond aux dégâts sur les cases autres que la case cliquée (fallback = 1)
    const secondaryDamage = (typeof tool.secondary_damage === 'number') ? tool.secondary_damage : 1
    const centerDamage = tool.damage + (artifactMods.toolDamageAdd || 0)
    if (tool.pattern === 'single') {
      affectedCells.push({ row, col, damage: centerDamage })
    } else if (tool.pattern === 'cross') {
      affectedCells.push({ row, col, damage: centerDamage })
      affectedCells.push({ row: row - 1, col, damage: secondaryDamage })
      affectedCells.push({ row: row + 1, col, damage: secondaryDamage })
      affectedCells.push({ row, col: col - 1, damage: secondaryDamage })
      affectedCells.push({ row, col: col + 1, damage: secondaryDamage })
    } else if (tool.pattern === 'square') {
      // 3x3 centered on (row, col) : centre reçoit tool.damage (+artifact), voisins reçoivent secondaryDamage
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr
          const c = col + dc
          const isCenter = (dr === 0 && dc === 0)
          const base = isCenter ? centerDamage : secondaryDamage
          affectedCells.push({ row: r, col: c, damage: base })
        }
      }
    }

    const newRewards = []
    let cellsBroken = 0

    // Appliquer les dégâts aux cases
    for (const affected of affectedCells) {
      const cell = user.miningGame.cells.find(
        c => c.row === affected.row && c.col === affected.col
      )
      
      if (cell && cell.hp > 0) {
        cell.hp = Math.max(0, cell.hp - affected.damage)
        
        // Si la case est détruite
        if (cell.hp === 0) {
          cellsBroken++
          
          // Appliquer l'effet chain_damage si activé
          if (artifactMods.chainDamage && artifactMods.chainDamage > 0) {
            applyChainDamage(user.miningGame.cells, cell.row, cell.col, artifactMods.chainDamage, newRewards, user.miningGame.rewards)
          }
          
          // Si la case a une récompense
          if (cell.reward) {
            console.log('[mining] Cell has reward:', cell.reward)
            const finalReward = cell.reward
            if (finalReward) {
              newRewards.push(finalReward)
              user.miningGame.rewards.push(finalReward)
            } else {
              console.log('[mining] finalReward is null/undefined for cell.reward:', cell.reward)
            }
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
        } else if (type === 'chest_key') {
          user.resources.chest_key = (user.resources.chest_key || 0) + amt
        } else if (type === 'precious_stone') {
          user.resources.precious_stone = (user.resources.precious_stone || 0) + amt
        } else if (type === 'rotten_tomato') {
          user.resources.rotten_tomato = (user.resources.rotten_tomato || 0) + amt
        }
      }

      // Terminer la partie
      user.miningGame.active = false
      
      // Compter les tomates pourries obtenues pour les succès
      const rottenTomatoesCount = user.miningGame.rewards.filter(reward => reward.startsWith('rotten_tomato:')).length
      if (rottenTomatoesCount > 0) {
        await updateAchievementProgress(req.userId, 'increment', {
          rottenTomatoesReceived: rottenTomatoesCount
        })
      }
    }

    await user.save()

    // Mettre à jour les progrès des succès
    const progressUpdates = { miningCellsBroken: cellsBroken }
    if (gameOver) {
      const totalCellsBroken = user.miningGame.cells.filter(c => c.hp === 0).length
      if (totalCellsBroken === 25) {
        await updateAchievementProgress(req.userId, 'max', { miningFullGridBroken: 1 })
      }
      if (user.miningGame.rewards.length === 0) {
        await updateAchievementProgress(req.userId, 'max', { miningNoRewardGame: 1 })
      }
      // Mettre à jour le meilleur score de cellules cassées dans une partie
      await updateAchievementProgress(req.userId, 'max', { miningBestCellsInGame: totalCellsBroken })
    }
    await updateAchievementProgress(req.userId, 'increment', progressUpdates)
    
    // Mettre à jour le progrès des quêtes
    await updateQuestProgress(req.userId, 'mining_cells_broken', cellsBroken)

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
        production_token: user.resources.production_token,
        chest_key: user.resources.chest_key,
        precious_stone: user.resources.precious_stone,
        rotten_tomato: user.resources.rotten_tomato
      } : undefined
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/mining/finish - Clôture une partie si tous les outils ont été utilisés
export async function finishMining(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    if (!user.miningGame || !user.miningGame.active) {
      return res.status(400).json({ error: 'Aucune partie en cours' })
    }

    const toolIndex = user.miningGame.currentToolIndex || 0
    const toolsList = user.miningGame.tools || []
    // Si tous les outils ont été consommés, considérer la partie finie
    if (toolIndex < toolsList.length) {
      return res.status(400).json({ error: 'La partie n\'est pas encore terminée' })
    }

    // Appliquer les récompenses accumulées
    for (const reward of user.miningGame.rewards || []) {
      const [type, amount] = (reward || '').split(':')
      const amt = parseInt(amount) || 0
      if (!type) continue
      if (type === 'eggs') {
        user.resources.eggs = (user.resources.eggs || 0) + amt
      } else if (type === 'mining_token') {
        user.resources.mining_token = (user.resources.mining_token || 0) + amt
      } else if (type === 'stock_token') {
        user.resources.stock_token = (user.resources.stock_token || 0) + amt
      } else if (type === 'production_token') {
        user.resources.production_token = (user.resources.production_token || 0) + amt
      } else if (type === 'chest_key') {
        user.resources.chest_key = (user.resources.chest_key || 0) + amt
      } else if (type === 'precious_stone') {
        user.resources.precious_stone = (user.resources.precious_stone || 0) + amt
      } else if (type === 'rotten_tomato') {
        user.resources.rotten_tomato = (user.resources.rotten_tomato || 0) + amt
      }
    }

    // Marquer la partie terminée
    user.miningGame.active = false
    
    // Compter les tomates pourries obtenues pour les succès
    const rottenTomatoesCount = (user.miningGame.rewards || []).filter(reward => (reward || '').startsWith('rotten_tomato:')).length
    if (rottenTomatoesCount > 0) {
      await updateAchievementProgress(req.userId, 'increment', {
        rottenTomatoesReceived: rottenTomatoesCount
      })
    }
    await user.save()

    // Mettre à jour les progrès des succès pour la fin de partie
    const totalCellsBroken = user.miningGame.cells.filter(c => c.hp === 0).length
    if (totalCellsBroken === 25) {
      await updateAchievementProgress(req.userId, 'max', { miningFullGridBroken: 1 })
    }
    if ((user.miningGame.rewards || []).length === 0) {
      await updateAchievementProgress(req.userId, 'max', { miningNoRewardGame: 1 })
    }
    // Mettre à jour le meilleur score de cellules cassées dans une partie
    await updateAchievementProgress(req.userId, 'max', { miningBestCellsInGame: totalCellsBroken })
    
    // Mettre à jour le progrès des quêtes
    await updateQuestProgress(req.userId, 'mining_cells_broken', totalCellsBroken)

    res.json({
      success: true,
      gameOver: true,
      game: {
        gridSize: user.miningGame.gridSize,
        cells: user.miningGame.cells,
        tools: user.miningGame.tools,
        currentToolIndex: user.miningGame.currentToolIndex,
        rewards: user.miningGame.rewards || [],
        equippedArtifacts: user.miningGame.equippedArtifacts || [],
        artifactModifiers: user.miningGame.artifactModifiers || {}
      },
      resources: {
        eggs: user.resources.eggs,
        mining_token: user.resources.mining_token,
        stock_token: user.resources.stock_token,
        production_token: user.resources.production_token,
        chest_key: user.resources.chest_key,
        precious_stone: user.resources.precious_stone,
        rotten_tomato: user.resources.rotten_tomato
      }
    })
  } catch (err) {
    console.error('finishMining error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
