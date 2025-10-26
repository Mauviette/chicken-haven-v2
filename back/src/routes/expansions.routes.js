import express from 'express'
import { getExpansionLevels, buyExpansion } from '../controllers/expansions.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = express.Router()

// GET /api/expansions - Récupère les niveaux d'expansions de l'utilisateur
router.get('/', verifyToken, getExpansionLevels)

// POST /api/expansions/buy - Achète une expansion
router.post('/buy', verifyToken, buyExpansion)

export default router