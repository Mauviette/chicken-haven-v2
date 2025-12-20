// user/userArtifacts.controller.js
// Gestion des artefacts utilisateur
import User from '../../models/User.js'

const MIN_LEVEL_FOR_ARTIFACTS = 5

/**
 * Vérifie si l'utilisateur a le niveau requis pour les artefacts
 */
function checkArtifactLevel(user, res) {
  const playerLevel = user.experience?.level || 1
  if (playerLevel < MIN_LEVEL_FOR_ARTIFACTS) {
    res.status(403).json({ error: 'Vous devez atteindre le niveau 5 pour accéder aux artefacts' })
    return false
  }
  return true
}

// GET /api/user/artifacts - Récupère la liste des artefacts possédés
export async function getArtifacts(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (!checkArtifactLevel(user, res)) return

    const artifacts = user.artifacts || []
    res.json({ artifacts })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// GET /api/user/artifact-slots - Récupère les emplacements d'artefacts
export async function getArtifactSlots(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (!checkArtifactLevel(user, res)) return

    const artifactSlots = user.artifactSlots || { slotsCount: 2, equipped: [] }
    res.json(artifactSlots)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// PUT /api/user/artifact/equip/:artifactId - Équipe un artefact
export async function equipArtifact(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (!checkArtifactLevel(user, res)) return

    const { artifactId } = req.params
    if (!artifactId) {
      return res.status(400).json({ error: 'artifactId requis' })
    }

    // Vérifier que l'utilisateur possède cet artefact
    const hasArtifact = (user.artifacts || []).some(a => a.artifactId === artifactId)
    if (!hasArtifact) {
      return res.status(400).json({ error: 'Artefact non possédé' })
    }

    // Vérifier qu'il n'est pas déjà équipé
    const equipped = user.artifactSlots?.equipped || []
    if (equipped.includes(artifactId)) {
      return res.status(400).json({ error: 'Artefact déjà équipé' })
    }

    // Vérifier qu'il y a de la place
    const slotsCount = user.artifactSlots?.slotsCount || 2
    const usedSlots = equipped.filter(id => id !== null && id !== '').length
    if (usedSlots >= slotsCount) {
      return res.status(400).json({ error: 'Tous les emplacements sont occupés' })
    }

    // Équiper l'artefact
    if (!user.artifactSlots) {
      user.artifactSlots = { slotsCount: 2, equipped: [] }
    }
    
    // Trouver un emplacement vide
    let placed = false
    for (let i = 0; i < slotsCount; i++) {
      if (!user.artifactSlots.equipped[i]) {
        user.artifactSlots.equipped[i] = artifactId
        placed = true
        break
      }
    }

    if (!placed) {
      user.artifactSlots.equipped.push(artifactId)
    }

    await user.save()
    res.json({ success: true, artifactSlots: user.artifactSlots })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// PUT /api/user/artifact/unequip/:artifactId - Déséquipe un artefact
export async function unequipArtifact(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (!checkArtifactLevel(user, res)) return

    const { artifactId } = req.params
    if (!artifactId) {
      return res.status(400).json({ error: 'artifactId requis' })
    }

    if (!user.artifactSlots) {
      return res.status(400).json({ error: 'Aucun artefact équipé' })
    }

    const equipped = user.artifactSlots.equipped || []
    const index = equipped.indexOf(artifactId)
    if (index === -1) {
      return res.status(400).json({ error: 'Artefact non équipé' })
    }

    user.artifactSlots.equipped.splice(index, 1)
    await user.save()

    res.json({ success: true, artifactSlots: user.artifactSlots })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
