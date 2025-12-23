import express from 'express'
import { 
  getFarmingState, 
  getWeather, 
  buySeeds, 
  plantSeed, 
  harvestPlant, 
  completeHarvest,
  unlockSlot,
  openRequest,
  completeRequest,
  dismissRequest,
  upgradeInventory,
  discardVegetables,
  useWateringCan
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

// Routes pour les demandes
router.post('/open-request', verifyToken, openRequest)
router.post('/complete-request', verifyToken, completeRequest)
router.post('/dismiss-request', verifyToken, dismissRequest)
router.post('/upgrade-inventory', verifyToken, upgradeInventory)
router.post('/discard-vegetables', verifyToken, discardVegetables)
router.post('/use-watering-can', verifyToken, useWateringCan)

// Route publique pour la météo
router.get('/weather', getWeather)

export default router
