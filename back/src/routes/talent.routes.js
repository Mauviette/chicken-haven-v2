import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { upgradeTalent } from '../controllers/talent.controller.js'
import { activateTalent } from '../controllers/activeTalents.controller.js'

const router = express.Router()

router.post('/upgrade', verifyToken, upgradeTalent)
router.post('/activate', verifyToken, activateTalent)

export default router
