import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { getPoulesPossedees, upsertPoule, updatePoule } from '../controllers/poules.controller.js'

const router = express.Router()

router.get('/', verifyToken, getPoulesPossedees)
router.post('/', verifyToken, upsertPoule)
router.put('/:especeId', verifyToken, updatePoule)

export default router
