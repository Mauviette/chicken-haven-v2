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

dotenv.config()
const app = express()

app.use(cors({
  origin: ['https://chickenhaven.vercel.app', 'http://localhost:5173'],
  credentials: true
}))

app.options('*', cors({
  origin: ['https://chickenhaven.vercel.app', 'http://localhost:5173'],
  credentials: true
}));

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

app.get('/', (req, res) => {
  res.send('API Chicken Haven OK 🐔')
})

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connecté à MongoDB')
  app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur lancé sur le port ${process.env.PORT}`)
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

