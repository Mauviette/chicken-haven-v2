import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import PendingRegistration from '../models/PendingRegistration.js'
import { verifyToken } from '../middleware/auth.middleware.js'
import { containsForbiddenWords, getForbiddenWordsList } from '../utils/forbiddenWords.js'
import { sendVerificationEmail, generateVerificationCode } from '../utils/emailService.js'

const router = express.Router()
const SECRET_KEY = process.env.JWT_SECRET || 'dev-secret'
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET manquant. Utilisation d\'une clé par défaut pour le développement.')
}

router.post('/register', async (req, res) => {
  const { username, displayName, password, email, apocalypse } = req.body
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

    // Validation de l'email si fourni
    let trimmedEmail = null
    if (email) {
      trimmedEmail = email.trim().toLowerCase()
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Adresse email invalide' })
      }
    }

    // Vérifier les mots interdits
    if (containsForbiddenWords(trimmedUsername)) {
      return res.status(400).json({ error: 'Le nom d\'utilisateur contient des mots non autorisés' })
    }

    if (containsForbiddenWords(trimmedDisplayName)) {
      return res.status(400).json({ error: 'Le nom d\'affichage contient des mots non autorisés' })
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ username: trimmedUsername })
    if (existingUser) return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' })

    // Vérifier si l'email est déjà utilisé
    if (trimmedEmail) {
      const existingEmail = await User.findOne({ email: trimmedEmail })
      if (existingEmail) return res.status(400).json({ error: 'Cette adresse email est déjà utilisée' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Si un email est fourni, créer une inscription en attente
    if (trimmedEmail) {
      // Vérifier s'il y a déjà une inscription en attente pour cet email
      const existingPending = await PendingRegistration.findOne({ email: trimmedEmail })
      if (existingPending) {
        await PendingRegistration.findByIdAndDelete(existingPending._id)
      }

      // Générer un code de vérification
      const verificationCode = generateVerificationCode()

      // Créer l'inscription en attente
      const pendingRegistration = new PendingRegistration({
        username: trimmedUsername,
        displayName: trimmedDisplayName,
        password: hashedPassword,
        email: trimmedEmail,
        verificationCode,
        apocalypse: apocalypse || false
      })

      await pendingRegistration.save()

      // Envoyer l'email de vérification
      const emailSent = await sendVerificationEmail(trimmedEmail, verificationCode, trimmedUsername)

      if (!emailSent) {
        // Supprimer l'inscription en attente si l'email n'a pas pu être envoyé
        await PendingRegistration.findByIdAndDelete(pendingRegistration._id)
        return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email de vérification' })
      }

      return res.status(200).json({
        message: 'Un code de vérification a été envoyé à votre adresse email',
        requiresVerification: true,
        email: trimmedEmail
      })
    }

    // Inscription sans email (comportement classique)
    const newUser = new User({
      username: trimmedUsername,
      displayName: trimmedDisplayName,
      password: hashedPassword,
      apocalypse: apocalypse || false
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
      if (err.keyPattern?.username) {
        return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' })
      }
      if (err.keyPattern?.email) {
        return res.status(400).json({ error: 'Cette adresse email est déjà utilisée' })
      }
    }
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' })
  }
})

// Vérification du code email pour finaliser l'inscription
router.post('/verify-email', async (req, res) => {
  const { email, verificationCode } = req.body

  try {
    if (!email || !verificationCode) {
      return res.status(400).json({ error: 'Email et code de vérification requis' })
    }

    const trimmedEmail = email.trim().toLowerCase()

    // Trouver l'inscription en attente
    const pendingRegistration = await PendingRegistration.findOne({
      email: trimmedEmail,
      verificationCode: verificationCode
    })

    if (!pendingRegistration) {
      return res.status(400).json({ error: 'Code de vérification invalide ou expiré' })
    }

    // Vérifier si l'utilisateur n'a pas déjà été créé (double vérification)
    const existingUser = await User.findOne({ username: pendingRegistration.username })
    if (existingUser) {
      await PendingRegistration.findByIdAndDelete(pendingRegistration._id)
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' })
    }

    // Créer l'utilisateur
    const newUser = new User({
      username: pendingRegistration.username,
      displayName: pendingRegistration.displayName,
      password: pendingRegistration.password,
      email: pendingRegistration.email,
      apocalypse: pendingRegistration.apocalypse
    })

    await newUser.save()

    // Supprimer l'inscription en attente
    await PendingRegistration.findByIdAndDelete(pendingRegistration._id)

    // Générer un token pour connecter automatiquement l'utilisateur
    const token = jwt.sign({ userId: newUser._id }, SECRET_KEY, { expiresIn: '7d' })

    console.log(`✅ Inscription vérifiée pour ${newUser.username} (${newUser.email})`)

    res.status(201).json({
      message: 'Inscription vérifiée avec succès',
      token: token,
      user: {
        username: newUser.username,
        displayName: newUser.displayName
      }
    })
  } catch (err) {
    console.error('Email verification error:', err)
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur est déjà pris' })
    }
    res.status(500).json({ error: 'Erreur serveur lors de la vérification' })
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
    const inputSettings = req.body.settings
    if (!inputSettings || typeof inputSettings !== 'object') {
      return res.status(400).json({ error: 'Paramètres invalides' })
    }

    // Liste blanche des propriétés autorisées
    const allowedKeys = ['sound', 'animations', 'volume', 'buffsEverywhere', 'darkMode', 'emailNotifications', 'collectionSort']
    const sanitizedSettings = {}

    for (const key of allowedKeys) {
      if (key in inputSettings) {
        // Validation des types
        if (key === 'volume') {
          const vol = Number(inputSettings[key])
          if (!isNaN(vol) && vol >= 0 && vol <= 100) {
            sanitizedSettings[`settings.${key}`] = vol
          }
        } else if (key === 'collectionSort') {
          const sort = inputSettings[key]
          if (sort && typeof sort === 'object') {
            const validKeys = ['quantite', 'nom', 'rarete', 'date']
            const validOrders = ['asc', 'desc']
            if (validKeys.includes(sort.key) && validOrders.includes(sort.order)) {
              sanitizedSettings['settings.collectionSort'] = { key: sort.key, order: sort.order }
            }
          }
        } else if (typeof inputSettings[key] === 'boolean') {
          sanitizedSettings[`settings.${key}`] = inputSettings[key]
        }
      }
    }

    if (Object.keys(sanitizedSettings).length === 0) {
      return res.status(400).json({ error: 'Aucun paramètre valide fourni' })
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: sanitizedSettings },
      { new: true }
    ).select('settings')

    if (!updatedUser) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    res.json({ message: 'Paramètres mis à jour', settings: updatedUser.settings })
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' })
  }
})

// Endpoint pour récupérer la liste des mots interdits
router.get('/forbidden-words', (req, res) => {
  try {
    const words = getForbiddenWordsList()
    res.json({ forbiddenWords: words })
  } catch (err) {
    console.error('Error loading forbidden words:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// Routes pour la gestion de l'email utilisateur
import { addEmail, verifyEmailChange } from '../controllers/user.controller.js'

router.post('/user/add-email', verifyToken, addEmail)
router.post('/user/verify-email-change', verifyToken, verifyEmailChange)

// Routes pour la réinitialisation de mot de passe
import { initiatePasswordReset, confirmPasswordReset } from '../controllers/user.controller.js'

router.post('/forgot-password', initiatePasswordReset)
router.post('/reset-password', confirmPasswordReset)

export default router
