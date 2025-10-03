import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import pouleRoutes from './routes/poules.routes.js'
import authRoutes from './routes/auth.routes.js'
import productionRoutes from './routes/production.routes.js'
import eggRoutes from './routes/egg.routes.js'
import boxRoutes from './routes/box.routes.js'
import achievementsRoutes from './routes/achievements.routes.js'
import gameDataRoutes from './routes/gameData.routes.js'
import teamRoutes from './routes/team.routes.js'
import userRoutes from './routes/user.routes.js'
import upgradesRoutes from './routes/upgrades.routes.js'
import talentRoutes from './routes/talent.routes.js'
import spawnablesRoutes from './routes/spawnables.routes.js'
import socialRoutes from './routes/social.routes.js'

dotenv.config()
const app = express()

app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true)
    
    // En développement, autoriser toutes les origines locales/privées
    const isDevelopment = process.env.NODE_ENV !== 'production'
    
    if (isDevelopment) {
      // En mode développement, autoriser toutes les origines
      console.log(`✅ Origin autorisé (dev mode): ${origin}`)
      return callback(null, true)
    }
    
    // En production, utiliser la liste restrictive
    const allowedOrigins = [
      'https://chickenhaven.vercel.app'
    ]
    
    // Vérifier si l'origin est dans la liste ou si c'est un sous-domaine Vercel
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    
    console.log(`❌ Origin non autorisé (production): ${origin}`)
    callback(new Error('Non autorisé par CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}))

// Middleware pour logger les requêtes CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`)
  next()
})

// Supprimer la route OPTIONS générique qui cause l'erreur
// Le middleware CORS global gère déjà les requêtes preflight

app.use(express.json())

// Routes API
app.use('/api/poules', pouleRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/production', productionRoutes)
app.use('/api/egg', eggRoutes)
app.use('/api/boxes', boxRoutes)
app.use('/api/achievements', achievementsRoutes)
app.use('/api/game-data', gameDataRoutes)
app.use('/api/team', teamRoutes)
app.use('/api/user', userRoutes)
app.use('/api/upgrades', upgradesRoutes)
app.use('/api/talent', talentRoutes)
app.use('/api/spawnables', spawnablesRoutes)
app.use('/api/social', socialRoutes)

app.get('/', (req, res) => {
  res.json({ 
    message: 'API Chicken Haven OK 🐔',
    timestamp: new Date().toISOString(),
    cors: 'Configured for chickenhaven.vercel.app'
  })
})

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// Middleware de gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err)
  res.status(500).json({ error: 'Erreur interne du serveur' })
})

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connecté à MongoDB')
  const PORT = process.env.PORT || 3002
  app.listen(PORT, '::', () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT} (IPv4 + IPv6)`)
    console.log(`📡 CORS configuré pour: chickenhaven.vercel.app + réseaux locaux`)
  })
}).catch((err) => {
  console.error('❌ Erreur de connexion MongoDB :', err.message)
  console.log('🔄 Tentative de redémarrage dans 5 secondes...')
  setTimeout(() => {
    process.exit(1)
  }, 5000)
})

// Gestion des erreurs de connexion après l'initialisation
mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur MongoDB :', err.message)
})

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB déconnecté')
})

// Reconnexion automatique
mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnecté')
})

