import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { getEggStatus, clickEgg } from '../controllers/egg.controller.js'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(verifyToken)

// GET /api/egg/status - Récupère le statut de l'œuf
router.get('/status', getEggStatus)

// POST /api/egg/click - Clique sur l'œuf
router.post('/click', clickEgg)

export default router