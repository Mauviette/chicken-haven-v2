import Poule from '../models/Poule.js';

export async function getAllPoules(req, res) {
  try {
    const poules = await Poule.find();
    res.json(poules);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
}
