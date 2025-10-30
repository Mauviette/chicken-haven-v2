import express from 'express'
import {
  getQuestsStatus,
  acceptQuest,
  abandonQuest,
  claimStepReward,
  checkQuestProgress
} from '../controllers/quests.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = express.Router()

// Toutes les routes nécessitent une authentification
router.use(verifyToken)

// GET /api/quests/status - Récupère le statut des quêtes
router.get('/status', getQuestsStatus)

// POST /api/quests/accept/:questId - Accepter une quête
router.post('/accept/:questId', acceptQuest)

// POST /api/quests/abandon - Abandonner la quête active
router.post('/abandon', abandonQuest)

// POST /api/quests/claim-step/:stepId - Réclamer la récompense d'une étape
router.post('/claim-step/:stepId', claimStepReward)

// POST /api/quests/check-progress - Vérifier le progrès des quêtes
router.post('/check-progress', checkQuestProgress)

export default router