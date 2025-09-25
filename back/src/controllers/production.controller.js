import Poule from '../models/Poule.js'

export const startProduction = async (req, res) => { //N'est plus utilisé
  const userId = req.userId
  const { especeId, posteId, dureeMinutes } = req.body

  if (!especeId || !posteId || !dureeMinutes)
    return res.status(400).json({ message: 'Paramètres manquants' })

  try {
    const poule = await Poule.findOne({ especeId, userId })

    if (!poule)
      return res.status(404).json({ message: 'Poule non trouvée' })

    if (poule.statutEnergie.etat !== 'disponible')
      return res.status(400).json({ message: 'Poule non disponible' })

    const now = new Date()
    const fin = new Date(now.getTime() + dureeMinutes * 60000)

    poule.statutEnergie = {
      etat: 'en mission',
      heureDisponible: fin
    }
    poule.posteOccupe = posteId

    await poule.save()

    res.status(200).json({ message: 'Mission lancée', poule })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}
