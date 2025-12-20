/**
 * Contrôleur du minage (mining)
 * Gère les endpoints HTTP pour le système de mini-jeu de minage
 */
import User from '../models/User.js'
import { miningData } from '../data/sharedGameData.js'
import { updateAchievementProgress } from './achievements.controller.js'
import { updateQuestProgress } from './quests.controller.js'

// Imports des utilitaires
import { computeArtifactModifiers } from './mining/artifactModifiers.utils.js'
import { 
  generateGrid, 
  generateTools, 
  applyToolModifiers, 
  getMiningConfig 
} from './mining/gridGeneration.utils.js'
import { 
  applyChainDamage, 
  calculateAffectedCells, 
  getToolConfig,
  applyRewardsToResources,
  countRottenTomatoes
} from './mining/digUtils.utils.js'
import { 
  isUserMining, 
  assertUserCanModifyArtifacts, 
  checkCanModifyArtifactsMiddleware 
} from './mining/miningState.utils.js'

// Re-exports pour compatibilité avec les autres contrôleurs
export { isUserMining, assertUserCanModifyArtifacts, checkCanModifyArtifactsMiddleware }

const MINING_CONFIG = miningData

/**
 * GET /api/mining/state - Récupère l'état actuel du jeu de minage
 */
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

/**
 * POST /api/mining/start - Démarre une nouvelle partie (consomme 1 jeton)
 */
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

    // Préparer les artefacts équipés
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
      try { console.debug('[mining] startMining - reveal_cracked_rewards markedHints=', crackedRevealed) } catch(_) {}
    }

    // Générer et modifier les outils
    const baseTools = generateTools()
    const tools = applyToolModifiers(baseTools, mods)

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
        artifactModifiers: user.miningGame.artifactModifiers || {}
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/mining/dig - Creuse une case avec l'outil actuel
 */
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
    const tool = getToolConfig(toolType)
    if (!tool) {
      return res.status(400).json({ error: 'Outil invalide' })
    }

    // Déterminer les modificateurs d'artefacts pour cette partie
    const artifactMods = user.miningGame?.artifactModifiers || { toolDamageAdd: 0, rewardAmountPercent: 0 }

    // Calculer les cases affectées selon le pattern de l'outil
    const affectedCells = calculateAffectedCells(tool, row, col, artifactMods.toolDamageAdd || 0)

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
      applyRewardsToResources(user.resources, user.miningGame.rewards)

      // Terminer la partie
      user.miningGame.active = false
      
      // Compter les tomates pourries obtenues pour les succès
      const rottenTomatoesCount = countRottenTomatoes(user.miningGame.rewards)
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
      const totalCells = user.miningGame.gridSize * user.miningGame.gridSize
      if (totalCellsBroken === totalCells) {
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

/**
 * POST /api/mining/finish - Clôture une partie si tous les outils ont été utilisés
 */
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
    applyRewardsToResources(user.resources, user.miningGame.rewards || [])

    // Marquer la partie terminée
    user.miningGame.active = false
    
    // Compter les tomates pourries obtenues pour les succès
    const rottenTomatoesCount = countRottenTomatoes(user.miningGame.rewards)
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
