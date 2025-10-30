// controllers/chest.controller.js
// Contrôleur pour l'ouverture des coffres et l'obtention d'artéfacts

import User from '../models/User.js'
import { artifactsData } from '../data/sharedGameData.js'
import { updateAchievementProgress } from './achievements.controller.js'
import { updateQuestProgress } from './quests.controller.js'

// POST /api/chest/open - Ouvre un coffre avec une clé
export async function openChest(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    // Vérifier que l'utilisateur a une clé de coffre
    if ((user.resources.chest_key || 0) < 1) {
      return res.status(400).json({ error: 'Pas assez de clés de coffre' })
    }

    // Consommer une clé
    user.resources.chest_key -= 1

    // Sélectionner un artéfact aléatoire pondéré par rareté
    const artifactPool = Object.values(artifactsData)
    const totalWeight = artifactPool.reduce((sum, artifact) => {
      switch (artifact.rarete) {
        case 'commune': return sum + 50
        case 'rare': return sum + 25
        case 'epique': return sum + 10
        case 'legendaire': return sum + 1
        default: return sum + 25
      }
    }, 0)

    let random = Math.random() * totalWeight
    let selectedArtifact = null

    for (const artifact of artifactPool) {
      let weight = 25 // poids par défaut
      switch (artifact.rarete) {
        case 'commune': weight = 50; break
        case 'rare': weight = 25; break
        case 'epique': weight = 10; break
        case 'legendaire': weight = 1; break
      }

      random -= weight
      if (random <= 0) {
        selectedArtifact = artifact
        break
      }
    }

    if (!selectedArtifact) {
      // Fallback au premier artéfact
      selectedArtifact = artifactPool[0]
    }

    // Vérifier si l'utilisateur a déjà cet artéfact
    const hasArtifact = user.artifacts.some(a => a.artifactId === selectedArtifact.id)

    if (!hasArtifact) {
      // Ajouter l'artéfact à la collection
      user.artifacts.push({ artifactId: selectedArtifact.id })
    }

    // Recalculer le nombre d'artéfacts uniques trouvés
    const uniqueArtifactsCount = user.artifacts.length

    // Mettre à jour la progression des achievements avec le nombre actuel d'artéfacts uniques
    await updateAchievementProgress(req.userId, 'max', { miningArtifactsFound: uniqueArtifactsCount })
    
    // Mettre à jour le progrès des quêtes
    await updateQuestProgress(req.userId, 'mining_artifacts_found', uniqueArtifactsCount)

    await user.save()

    res.json({
      success: true,
      artifact: selectedArtifact,
      alreadyOwned: hasArtifact,
      chestKeys: user.resources.chest_key
    })
  } catch (err) {
    console.error('Erreur openChest:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/chest/info - Informations sur les coffres
export async function getChestInfo(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    res.json({
      chestKeys: user.resources.chest_key || 0,
      ownedArtifacts: user.artifacts.map(a => a.artifactId),
      totalArtifacts: Object.keys(artifactsData).length
    })
  } catch (err) {
    console.error('Erreur getChestInfo:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}