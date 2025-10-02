// routes/social.routes.js
import express from 'express'
import { 
  getLeaderboards,
  getPlayerProfile
} from '../controllers/social.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = express.Router()

// GET /api/social/leaderboards - Récupère tous les leaderboards
router.get('/leaderboards', verifyToken, getLeaderboards)

// GET /api/social/player/:profileId - Récupère le profil public d'un joueur
router.get('/player/:profileId', verifyToken, getPlayerProfile)

export default router