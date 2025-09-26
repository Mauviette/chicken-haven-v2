import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { upgradeTalent } from '../controllers/talent.controller.js'

const router = express.Router()

router.post('/upgrade', verifyToken, upgradeTalent)

export default router
