// routes/chest.routes.js
// Routes pour l'ouverture des coffres

import express from 'express'
import { openChest, getChestInfo } from '../controllers/chest.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(verifyToken)

// Ouvrir un coffre
router.post('/open', openChest)

// Informations sur les coffres
router.get('/info', getChestInfo)

export default router