// routes/box.routes.js
import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { getBoxes, openBox } from '../controllers/box.controller.js'

const router = express.Router()

// GET /api/boxes - Récupérer les boîtes disponibles
router.get('/', verifyToken, getBoxes)

// POST /api/boxes/:boxId/open - Ouvrir une boîte
router.post('/:boxId/open', verifyToken, openBox)

export default router