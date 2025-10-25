import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Chemin vers le dossier des annonces
const announcementsDir = path.join(__dirname, '../../announcements')

// GET /api/announcements - Liste toutes les annonces
router.get('/', async (req, res) => {
  try {
    const announcements = []

    // Lire tous les dossiers d'annonces
    const dirs = fs.readdirSync(announcementsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const dir of dirs) {
      const metaPath = path.join(announcementsDir, dir, 'meta.json')
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        announcements.push(meta)
      }
    }

    // Trier par date décroissante (plus récentes en premier)
    announcements.sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json(announcements)
  } catch (error) {
    console.error('Erreur lors de la récupération des annonces:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/announcements/:slug - Détails d'une annonce spécifique
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const announcementDir = path.join(announcementsDir, slug)

    // Vérifier que le dossier existe
    if (!fs.existsSync(announcementDir)) {
      return res.status(404).json({ error: 'Annonce non trouvée' })
    }

    const metaPath = path.join(announcementDir, 'meta.json')
    const contentPath = path.join(announcementDir, 'content.md')

    if (!fs.existsSync(metaPath) || !fs.existsSync(contentPath)) {
      return res.status(404).json({ error: 'Annonce incomplète' })
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    const content = fs.readFileSync(contentPath, 'utf8')

    res.json({
      ...meta,
      content
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'annonce:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// GET /api/announcements/images/:imageName - Servir les images des annonces
router.get('/images/:imageName', async (req, res) => {
  try {
    const { imageName } = req.params

    // Chercher l'image dans tous les dossiers d'annonces
    const dirs = fs.readdirSync(announcementsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const dir of dirs) {
      const imagePath = path.join(announcementsDir, dir, imageName)
      if (fs.existsSync(imagePath)) {
        return res.sendFile(imagePath)
      }
    }

    res.status(404).json({ error: 'Image non trouvée' })
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

export default router