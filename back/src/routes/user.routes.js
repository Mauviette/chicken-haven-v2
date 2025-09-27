import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { getMe, getPublicProfile, updateAvatar } from '../controllers/user.controller.js'

const router = express.Router()

router.get('/me', verifyToken, getMe)
// Public profile route
router.get('/profile/:profileId', getPublicProfile)
// Patch avatar (connected user)
router.patch('/me/avatar', verifyToken, updateAvatar)

export default router
