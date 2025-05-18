import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { startProduction } from '../controllers/production.controller.js'

const router = express.Router()

router.post('/start', verifyToken, startProduction)

export default router
