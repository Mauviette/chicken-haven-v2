import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { getMe, getPublicProfile, updateAvatar, getBuffs, updateDisplayName } from '../controllers/user.controller.js'

const router = express.Router()

router.get('/me', verifyToken, getMe)
router.get('/buffs', verifyToken, getBuffs)
// Public profile route
router.get('/profile/:profileId', getPublicProfile)
// Patch avatar (connected user)
router.patch('/me/avatar', verifyToken, updateAvatar)
// Patch displayName (connected user)
router.patch('/me/displayName', verifyToken, updateDisplayName)

export default router
