/**
 * Contrôleur des boîtes (box)
 * Gère les endpoints HTTP pour le système de boîtes et tirages
 */
import User from '../models/User.js'
import { boxesData } from '../data/sharedGameData.js'
import { updateAchievementProgress } from './achievements.controller.js'
import { updateQuestProgress, updateAllQuestProgress } from './quests.controller.js'

// Imports des utilitaires
import { executeAtomicBoxOperation } from './box/boxAtomic.utils.js'
import { 
  simulateBoxOpening, 
  calculateAdjustedArtifactChances, 
  calculateAdjustedBoxChances 
} from './box/boxSimulation.utils.js'
import { 
  groupResults, 
  processBulkResults, 
  buildGroupedResponseResults 
} from './box/boxResults.utils.js'

/**
 * GET /api/boxes - Récupérer les boîtes disponibles
 */
export async function getBoxes(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const playerLevel = user.experience?.level || 1
    const availableBoxes = boxesData.filter(box => (box.unlock_level || 1) <= playerLevel)

    const ownedArtifacts = (user.artifacts || []).map(a => a.artifactId)
    
    const enrichedBoxes = availableBoxes.map(box => {
      if (box.category === 'artifacts') {
        const adjustedChances = calculateAdjustedArtifactChances(ownedArtifacts)
        const adjustedBox = calculateAdjustedBoxChances(box, ownedArtifacts)
        return {
          ...adjustedBox,
          adjustedRarityChances: adjustedChances
        }
      }
      return box
    })

    res.json(enrichedBoxes)
  } catch (err) {
    console.error('Erreur getBoxes:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/boxes/:boxId/open - Ouvrir une boîte
 */
export async function openBox(req, res) {
  try {
    const boxId = parseInt(req.params.boxId)
    
    const result = await executeAtomicBoxOperation(req.userId, boxId)

    // Mettre à jour les succès (en dehors de l'opération atomique)
    try {
      await updateAchievementProgress(req.userId, 'increment', { totalBoxesOpened: 1 })
      await updateQuestProgress(req.userId, 'boxes_opened', 1)
      
      const userForAchievements = await User.findById(req.userId)
      if (userForAchievements) {
        await updateAchievementProgress(req.userId, 'max', {
          totalChickensOwned: userForAchievements.poulesPossedees.length
        })
        
        const totalChickens = userForAchievements.poulesPossedees.reduce((sum, p) => sum + p.quantite, 0)
        await updateQuestProgress(req.userId, 'chickens_owned', totalChickens)
        await updateAllQuestProgress(req.userId)
      }
    } catch (achievementError) {
      console.warn('Erreur lors de la mise à jour des succès:', achievementError)
    }

    res.json({ success: true, ...result })

  } catch (err) {
    console.error('Erreur openBox:', err)
    
    if (err.message.includes('Ressources insuffisantes')) {
      return res.status(400).json({ error: err.message })
    }
    if (err.message.includes('Niveau insuffisant')) {
      return res.status(403).json({ error: err.message })
    }
    if (err.message.includes('introuvable')) {
      return res.status(404).json({ error: err.message })
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de l\'ouverture de la boîte' })
  }
}

/**
 * POST /api/boxes/:boxId/open-multiple - Ouvrir plusieurs boîtes à la fois
 */
export async function openBoxMultiple(req, res) {
  try {
    const boxId = parseInt(req.params.boxId)
    const { count = 1 } = req.body

    if (count < 1 || count > 100) {
      return res.status(400).json({ error: 'Le nombre de boîtes doit être entre 1 et 100' })
    }

    const box = boxesData.find(b => b.id === boxId)
    if (!box) {
      return res.status(404).json({ error: 'Boîte introuvable' })
    }

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const playerLevel = user.experience?.level || 1
    if ((box.unlock_level || 1) > playerLevel) {
      return res.status(403).json({ error: 'Niveau insuffisant pour cette boîte' })
    }

    if (box.category === 'artifacts' && playerLevel < 5) {
      return res.status(403).json({ error: 'Vous devez atteindre le niveau 5 pour ouvrir des boîtes d\'artefacts' })
    }

    // Vérifier les ressources
    const resourceType = getResourceType(box.price.type)
    if (!resourceType) {
      return res.status(400).json({ error: 'Type de ressource invalide' })
    }

    const playerResources = user.resources || {}
    const currentAmount = playerResources[resourceType] || 0
    const totalCost = box.price.count * count

    if (currentAmount < totalCost) {
      return res.status(400).json({ error: `Ressources insuffisantes (${currentAmount}/${totalCost})` })
    }

    const ownedChickens = (user.poulesPossedees || []).map(poule => poule.especeId)
    const ownedArtifacts = box.category === 'artifacts' 
      ? (user.artifacts || []).map(a => a.artifactId) 
      : []
    const isApocalypse = user.apocalypse || false

    // Ouvrir toutes les boîtes
    const allResults = []
    for (let i = 0; i < count; i++) {
      const results = simulateBoxOpening(box, ownedChickens, ownedArtifacts, isApocalypse)
      allResults.push(...results)
    }

    const groupedResults = groupResults(allResults)

    // Décrémenter le coût
    const costUpdate = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { [`resources.${resourceType}`]: -totalCost } },
      { new: true }
    )
    
    if (!costUpdate) {
      return res.status(500).json({ error: 'Échec de la déduction du coût' })
    }

    await processBulkResults(req.userId, groupedResults)

    const responseResults = buildGroupedResponseResults(groupedResults, ownedChickens, ownedArtifacts)

    const updatedUser = await User.findById(req.userId)
    const newBalance = updatedUser.resources[resourceType]

    // Mettre à jour les succès
    try {
      await updateAchievementProgress(req.userId, 'increment', { totalBoxesOpened: count })
      await updateQuestProgress(req.userId, 'boxes_opened', count)
      
      await updateAchievementProgress(req.userId, 'max', {
        totalChickensOwned: updatedUser.poulesPossedees.length
      })
      
      const totalChickens = updatedUser.poulesPossedees.reduce((sum, p) => sum + p.quantite, 0)
      await updateQuestProgress(req.userId, 'chickens_owned', totalChickens)
      await updateAllQuestProgress(req.userId)
    } catch (achievementError) {
      console.warn('Erreur lors de la mise à jour des succès:', achievementError)
    }

    res.json({
      success: true,
      box: { id: box.id, name: box.name, cost: box.price },
      count: count,
      results: responseResults,
      newBalance: { [resourceType]: newBalance }
    })

  } catch (err) {
    console.error('Erreur openBoxMultiple:', err)
    
    if (err.message.includes('Ressources insuffisantes')) {
      return res.status(400).json({ error: err.message })
    }
    if (err.message.includes('Niveau insuffisant')) {
      return res.status(403).json({ error: err.message })
    }
    if (err.message.includes('introuvable')) {
      return res.status(404).json({ error: err.message })
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de l\'ouverture des boîtes' })
  }
}

/**
 * Convertit un type de prix en clé de ressource
 */
function getResourceType(priceType) {
  const mapping = {
    'eggs': 'eggs',
    'stock_token': 'stock_token',
    'production_token': 'production_token',
    'chest_key': 'chest_key'
  }
  return mapping[priceType] || null
}
