import User from '../models/User.js'
import { triggerAchievementCheck } from './achievements.controller.js'

// GET /api/poules — déjà existant
export async function getPoulesPossedees(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    res.json(user.poulesPossedees || [])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/poules
export async function upsertPoule(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { especeId, quantite, niveauTalent } = req.body
    if (!especeId) return res.status(400).json({ error: 'especeId requis' })

    const poules = user.poulesPossedees || []

    const existing = poules.find(p => p.especeId === especeId)
    if (existing) {
      // Mettre à jour
      existing.quantite = quantite ?? existing.quantite
      existing.niveauTalent = niveauTalent ?? existing.niveauTalent
    } else {
      // Ajouter
      poules.push({
        especeId,
        quantite: quantite ?? 1,
        niveauTalent: niveauTalent ?? 1
      })
    }

    user.poulesPossedees = poules
    await user.save()

    res.json({ message: 'Poule mise à jour avec succès', poulesPossedees: user.poulesPossedees })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

export async function updatePoule(req, res) {
  const userId = req.userId
  const { especeId } = req.params
  const updateData = req.body

  try {
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })

    const pouleIndex = user.poulesPossedees.findIndex(p => p.especeId === especeId)
    if (pouleIndex === -1) return res.status(404).json({ error: 'Poule non trouvée' })

      const current = user.poulesPossedees[pouleIndex]

      // Mise à jour manuelle de chaque champ si fourni
      if (updateData.quantite !== undefined) current.quantite = updateData.quantite
      if (updateData.niveauTalent !== undefined) current.niveauTalent = updateData.niveauTalent
  if (updateData.posteOccupe !== undefined) current.posteOccupe = updateData.posteOccupe
  if (updateData.new !== undefined) current.new = updateData.new

      // Fusion profonde pour statutEnergie si défini
      if (updateData.statutEnergie) {
        current.statutEnergie = {
          ...current.statutEnergie,
          ...updateData.statutEnergie
        }
      }

    await user.save()
    
    // Déclencher la vérification des succès après mise à jour des poules
    await triggerAchievementCheck(userId)
    
    res.json(current)
  } catch (err) {
    console.error('Erreur updatePoule :', err)
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' })
  }
}

// POST /api/poules/add - Ajouter une poule (utilisé par le système de boîtes)
export async function addPoule(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { especeId, quantite = 1 } = req.body
    if (!especeId) return res.status(400).json({ error: 'especeId requis' })

    // Mode Apocalypse : 50% de chance de perdre la récompense
    if (user.apocalypse && Math.random() < 0.5) {
      await user.save()
      return res.json({
        message: 'Récompense perdue (mode Apocalypse)',
        trigger: { achievementsRefresh: true }
      })
    }

    const poules = user.poulesPossedees || []

    const existing = poules.find(p => p.especeId === especeId)
    if (existing) {
      // Déjà possédée: on incrémente uniquement la quantité
      // Ne pas modifier le flag 'new' (reste à sa valeur actuelle)
      existing.quantite += quantite
    } else {
      // Ajouter nouvelle poule
      poules.push({
        especeId,
        quantite,
        niveauTalent: 1,
        new: true
      })
    }

    user.poulesPossedees = poules
    await user.save()

    res.json({ 
      message: 'Poule ajoutée avec succès', 
      poulesPossedees: user.poulesPossedees,
      added: { especeId, quantite },
      trigger: { achievementsRefresh: true }
    })
  } catch (err) {
    console.error('Erreur addPoule:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}