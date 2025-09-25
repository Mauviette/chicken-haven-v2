// routes/gameData.routes.js
import express from 'express'
import { 
  getGameData, 
  getGameDataVersion, 
  getGameDataCategory 
} from '../controllers/gameData.controller.js'

const router = express.Router()

// Routes publiques (pas besoin d'authentification car ce sont des données statiques)
router.get('/', getGameData)
router.get('/version', getGameDataVersion)
router.get('/:category', getGameDataCategory)

export default router