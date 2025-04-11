import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = express.Router()
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey'

// 🐣 Enregistrement
router.post('/register', async (req, res) => {
  const { username, password } = req.body
  try {
    const existing = await User.findOne({ username })
    if (existing) return res.status(400).json({ error: 'Utilisateur déjà existant' })

    const hashed = await bcrypt.hash(password, 10)
    const newUser = new User({ username, password: hashed, settings: { sound: true, animations: true } })
    await newUser.save()
    res.status(201).json({ message: 'Inscription réussie' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// 🐓 Connexion
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const user = await User.findOne({ username })
    if (!user) return res.status(400).json({ error: 'Utilisateur non trouvé' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(400).json({ error: 'Mot de passe incorrect' })

    const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '7d' })
    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// 👤 Récupérer les infos utilisateur
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username settings')
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// ⚙️ Modifier les paramètres utilisateur
router.patch('/settings', verifyToken, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { settings: req.body.settings },
      { new: true }
    ).select('settings')

    if (!updatedUser) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    res.json({ message: 'Paramètres mis à jour', settings: updatedUser.settings })
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' })
  }
})

export default router
