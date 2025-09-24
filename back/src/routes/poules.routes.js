import express from 'express'
import { verifyToken } from '../middleware/auth.middleware.js'
import { getPoulesPossedees, upsertPoule, updatePoule, addPoule } from '../controllers/poules.controller.js'

const router = express.Router()

router.get('/', verifyToken, getPoulesPossedees)
router.post('/', verifyToken, upsertPoule)
router.post('/add', verifyToken, addPoule)
router.put('/:especeId', verifyToken, updatePoule)

export default router
