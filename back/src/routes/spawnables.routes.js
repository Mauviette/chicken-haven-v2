// routes/spawnables.routes.js
import { Router } from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { clickSpawnableObject, checkAvailableSpawnables } from '../controllers/spawnables.controller.js'

const router = Router()

// Vérifier les spawnables disponibles
router.get('/check', verifyToken, checkAvailableSpawnables)

// Cliquer sur un objet spawnable
router.post('/click', verifyToken, clickSpawnableObject)

export default router