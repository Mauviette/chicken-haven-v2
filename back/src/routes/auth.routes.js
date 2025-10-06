import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = express.Router()
const SECRET_KEY = process.env.JWT_SECRET || 'dev-secret'
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET manquant. Utilisation d\'une clé par défaut pour le développement.')
}

router.post('/register', async (req, res) => {
  const { username, displayName, password } = req.body
  try {
    // Validation des champs requis
    if (!username || !displayName || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur, nom d\'affichage et mot de passe requis' })
    }
    
    // Validation du nom d'utilisateur
    const trimmedUsername = username.trim()
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return res.status(400).json({ error: 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères' })
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return res.status(400).json({ error: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, _ et -' })
    }
    
    // Validation du nom d'affichage
    const trimmedDisplayName = displayName.trim()
    if (trimmedDisplayName.length < 2 || trimmedDisplayName.length > 30) {
      return res.status(400).json({ error: 'Le nom d\'affichage doit contenir entre 2 et 30 caractères' })
    }
    
    if (!/^[a-zA-Z0-9À-ÿ\s_-]+$/.test(trimmedDisplayName)) {
      return res.status(400).json({ error: 'Le nom d\'affichage contient des caractères non autorisés' })
    }
    
    // Validation du mot de passe
    if (password.length < 6 || password.length > 50) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir entre 6 et 50 caractères' })
    }
    
    
    // Mots interdits
    const forbiddenWords = [
      'admin', 'moderator', 'mod', 'bot', 'system', 'null', 'undefined', 'test',
      'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell', 'sex', 'porn',
      'nazi', 'hitler', 'terrorist', 'suicide', 'kill', 'death', 'murder'
    ]
    
    const containsForbiddenWord = (text) => {
      return forbiddenWords.some(word => text.toLowerCase().includes(word))
    }
    
    if (containsForbiddenWord(trimmedUsername)) {
      return res.status(400).json({ error: 'Le nom d\'utilisateur contient des mots non autorisés' })
    }
    
    if (containsForbiddenWord(trimmedDisplayName)) {
      return res.status(400).json({ error: 'Le nom d\'affichage contient des mots non autorisés' })
    }
    
    const existing = await User.findOne({ username: trimmedUsername })
    if (existing) return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' })

    const hashed = await bcrypt.hash(password, 10)
    const newUser = new User({ 
      username: trimmedUsername, 
      displayName: trimmedDisplayName,
      password: hashed
    })
    await newUser.save()
    
    // Générer un token pour connecter automatiquement l'utilisateur
    const token = jwt.sign({ userId: newUser._id }, SECRET_KEY, { expiresIn: '7d' })
    
    res.status(201).json({ 
      message: 'Inscription réussie', 
      token: token,
      user: {
        username: newUser.username,
        displayName: newUser.displayName
      }
    })
  } catch (err) {
    console.error('Registration error:', err)
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' })
    }
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' })
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
