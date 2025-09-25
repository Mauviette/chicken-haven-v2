import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { getMe } from '../controllers/user.controller.js'

const router = express.Router()

router.get('/me', verifyToken, getMe)

export default router
