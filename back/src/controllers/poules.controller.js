import User from '../models/User.js'

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

    const { especeId, quantite, niveauTalent, statutEnergie, posteOccupe } = req.body
    if (!especeId) return res.status(400).json({ error: 'especeId requis' })

    const poules = user.poulesPossedees || []

    const existing = poules.find(p => p.especeId === especeId)
    if (existing) {
      // Mettre à jour
      existing.quantite = quantite ?? existing.quantite
      existing.niveauTalent = niveauTalent ?? existing.niveauTalent
      existing.statutEnergie = statutEnergie ?? existing.statutEnergie
      existing.posteOccupe = posteOccupe ?? existing.posteOccupe
    } else {
      // Ajouter
      poules.push({
        especeId,
        quantite: quantite ?? 1,
        niveauTalent: niveauTalent ?? 0,
        statutEnergie: statutEnergie ?? { etat: 'disponible' },
        posteOccupe: posteOccupe ?? null
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

      // Fusion profonde pour statutEnergie si défini
      if (updateData.statutEnergie) {
        current.statutEnergie = {
          ...current.statutEnergie,
          ...updateData.statutEnergie
        }
      }

    await user.save()
    res.json(current)
  } catch (err) {
    console.error('Erreur updatePoule :', err)
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' })
  }
}