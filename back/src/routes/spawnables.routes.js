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

// Test de synchronisation - endpoint temporaire
router.get('/test-sync', verifyToken, (req, res) => {
  res.json({
    success: true,
    synchronization: {
      spawnerIdMapping: {
        'white_egg': 'white_egg',
        'chocolate': 'chocolate'
      },
      supportedTypes: ['white_egg', 'white_egg', 'chocolate'],
      buffTypes: ['income_storage_multiplier', 'income', 'storage'],
      cssClasses: ['spawnable-white_egg', 'spawnable-white_egg', 'spawnable-chocolate'],
      icons: {
        'white_egg': '🥚',
        'chocolate': '🍫'
      },
      timings: {
        backend_lifetime: 15000, // 15s
        frontend_lifetime: 15000, // 15s (maintenant synchronisé)
        frontend_polling: 500, // 500ms
        backend_cooldown: 3000 // 3s
      }
    }
  })
})

export default router