import express from 'express'
import { verifyToken as authMiddleware } from '../middleware/auth.middleware.js'
import { getUpgradeLevels, buyUpgrade } from '../controllers/upgrades.controller.js'

const router = express.Router()

// Récupérer les niveaux d'améliorations actuels
router.get('/', authMiddleware, getUpgradeLevels)

// Acheter une amélioration
router.post('/buy', authMiddleware, buyUpgrade)

export default router
