import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { getTeam, updateTeam, updateTeamSlot } from '../controllers/team.controller.js'

const router = express.Router()

router.get('/', verifyToken, getTeam)
router.put('/', verifyToken, updateTeam)
router.patch('/slot/:index', verifyToken, updateTeamSlot)

export default router
