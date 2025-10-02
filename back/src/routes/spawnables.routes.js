// routes/spawnables.routes.js
import { Router } from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { clickSpawnableObject, checkAvailableSpawnables, getSpawnableConfig } from '../controllers/spawnables.controller.js'

const router = Router()

// Vérifier les spawnables disponibles
router.get('/check', verifyToken, checkAvailableSpawnables)

// Cliquer sur un objet spawnable
router.post('/click', verifyToken, clickSpawnableObject)

// Obtenir la configuration des spawnables
router.get('/config', verifyToken, getSpawnableConfig)

export default router