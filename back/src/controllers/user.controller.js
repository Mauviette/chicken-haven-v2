import User from '../models/User.js'

// GET /api/user/me - Récupère les informations essentielles de l'utilisateur (XP / niveau)
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { experience, username, resources } = user
    res.json({
      username,
      experience: {
        level: experience?.level ?? 1,
        points: experience?.points ?? 0,
        required_points: experience?.required_points ?? 2,
      },
      resources: {
        eggs: resources?.eggs ?? 0,
        stock_token: resources?.stock_token ?? 0,
        production_token: resources?.production_token ?? 0,
        wild_token: resources?.wild_token ?? 0,
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
