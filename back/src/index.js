import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import pouleRoutes from './routes/poules.routes.js'
import authRoutes from './routes/auth.routes.js'
import productionRoutes from './routes/production.routes.js'
import eggRoutes from './routes/egg.routes.js'

dotenv.config()
const app = express()

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3002'],
  credentials: true
}))

app.use(express.json())

// Routes API
app.use('/api/poules', pouleRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/production', productionRoutes)
app.use('/api/egg', eggRoutes)

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
}).catch((err) => console.error('Erreur MongoDB :', err))

