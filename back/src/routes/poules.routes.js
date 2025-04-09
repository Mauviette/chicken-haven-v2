import express from 'express'
import { getAllPoules } from '../controllers/poules.controller.js'

const router = express.Router()

router.get('/', getAllPoules)

export default router
