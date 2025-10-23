// routes/chickenGifts.routes.js
import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import {
  checkAvailableChickenGifts,
  collectChickenGift,
  getChickenGiftConfig
} from '../controllers/chickenGifts.controller.js'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(verifyToken)

// Vérifier les cadeaux disponibles
router.get('/check', checkAvailableChickenGifts)

// Collecter un cadeau
router.post('/collect', collectChickenGift)

// Obtenir la configuration
router.get('/config', getChickenGiftConfig)

export default router