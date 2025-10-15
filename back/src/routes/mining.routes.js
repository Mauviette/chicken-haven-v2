import express from 'express'
import { getMiningState, startMining, digCell } from '../controllers/mining.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/state', verifyToken, getMiningState)
router.post('/start', verifyToken, startMining)
router.post('/dig', verifyToken, digCell)

export default router
