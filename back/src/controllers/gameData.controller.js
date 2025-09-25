// controllers/gameData.controller.js
// Contrôleur pour servir les données de jeu synchronisées

import { getAllGameData } from '../data/sharedGameData.js'

// GET /api/game-data - Récupère toutes les données de jeu
export async function getGameData(req, res) {
  try {
    const gameData = getAllGameData()
    
    res.json({
      success: true,
      data: gameData
    })
  } catch (error) {
    console.error('Erreur getGameData:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération des données de jeu' 
    })
  }
}

// GET /api/game-data/version - Récupère uniquement la version des données
export async function getGameDataVersion(req, res) {
  try {
    const gameData = getAllGameData()
    
    res.json({
      version: gameData.version,
      lastUpdated: gameData.lastUpdated
    })
  } catch (error) {
    console.error('Erreur getGameDataVersion:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de la version' 
    })
  }
}

// GET /api/game-data/:category - Récupère une catégorie spécifique
export async function getGameDataCategory(req, res) {
  try {
    const { category } = req.params
    const gameData = getAllGameData()
    
    if (!gameData[category]) {
      return res.status(404).json({
        success: false,
        error: `Catégorie '${category}' introuvable`
      })
    }
    
    res.json({
      success: true,
      category,
      data: gameData[category],
      version: gameData.version
    })
  } catch (error) {
    console.error('Erreur getGameDataCategory:', error)
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la récupération de la catégorie' 
    })
  }
}