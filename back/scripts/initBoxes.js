// scripts/initBoxes.js
// Script pour initialiser les boîtes dans la base de données MongoDB

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Box from '../src/models/Box.js'
import { boxesData } from '../src/data/gameData.js'

dotenv.config()

async function initBoxes() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('✅ Connecté à MongoDB')

    // Supprimer les boîtes existantes
    await Box.deleteMany({})
    console.log('🗑️ Boîtes existantes supprimées')

    // Insérer les nouvelles boîtes
    await Box.insertMany(boxesData)
    console.log('📦 Boîtes initialisées:', boxesData.length)

    // Afficher les boîtes créées
    const createdBoxes = await Box.find({})
    console.log('Boîtes dans la DB:', createdBoxes.map(b => ({ id: b.id, name: b.name })))

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des boîtes:', error)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Déconnecté de MongoDB')
    process.exit(0)
  }
}

initBoxes()