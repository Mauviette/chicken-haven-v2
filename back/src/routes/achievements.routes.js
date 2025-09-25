import express from 'express'
import { getAchievementsStatus, checkAchievements, claimReward } from '../controllers/achievements.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(verifyToken)

// GET /api/achievements/status - Récupère le statut des succès
router.get('/status', getAchievementsStatus)

// POST /api/achievements/check - Vérifie et met à jour les succès
router.post('/check', checkAchievements)

// POST /api/achievements/claim/:achievementId - Réclamer une récompense
router.post('/claim/:achievementId', claimReward)

export default router