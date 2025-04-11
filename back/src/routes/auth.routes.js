import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = express.Router()
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey' // utilise une variable d'env si possible

// 🐣 Enregistrement
router.post('/register', async (req, res) => {
  const { username, password } = req.body
  try {
    const existing = await User.findOne({ username })
    if (existing) return res.status(400).json({ error: 'Utilisateur déjà existant' })

    const hashed = await bcrypt.hash(password, 10)
    const newUser = new User({ username, password: hashed })
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

export default router
