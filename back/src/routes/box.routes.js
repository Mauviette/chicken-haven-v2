// routes/box.routes.js
import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { getBoxes, openBox, openBoxMultiple } from '../controllers/box.controller.js'

const router = express.Router()

// GET /api/boxes - Récupérer les boîtes disponibles
router.get('/', verifyToken, getBoxes)

// POST /api/boxes/:boxId/open - Ouvrir une boîte
router.post('/:boxId/open', verifyToken, openBox)

// POST /api/boxes/:boxId/open-multiple - Ouvrir plusieurs boîtes à la fois
router.post('/:boxId/open-multiple', verifyToken, openBoxMultiple)

export default router