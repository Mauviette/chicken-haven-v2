import express from 'express'
import { 
  getFarmingState, 
  getWeather, 
  buySeeds, 
  plantSeed, 
  harvestPlant, 
  completeHarvest,
  unlockSlot 
} from '../controllers/farming.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = express.Router()

// Routes protégées (authentification requise)
router.get('/state', verifyToken, getFarmingState)
router.post('/buy-seeds', verifyToken, buySeeds)
router.post('/plant', verifyToken, plantSeed)
router.post('/harvest', verifyToken, harvestPlant)
router.post('/complete-harvest', verifyToken, completeHarvest)
router.post('/unlock-slot', verifyToken, unlockSlot)

// Route publique pour la météo
router.get('/weather', getWeather)

export default router
