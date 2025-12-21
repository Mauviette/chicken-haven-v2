/**
 * Contrôleur du farming
 * Gère les endpoints HTTP pour le système de mini-jeu de ferme
 */
import User from '../models/User.js'
import { farmingData } from '../data/sharedGameData.js'

// ========================
// MÉTÉO GLOBALE
// ========================

// Timestamp de référence pour calculer le cycle météo (epoch fixe pour tous les joueurs)
const WEATHER_EPOCH = new Date('2024-01-01T00:00:00Z').getTime()
const WEATHER_CYCLE = farmingData.weatherCycleDuration // 12h

// Ordre des météos dans le cycle
const WEATHER_ORDER = ['sunny', 'cloudy', 'rainy']

/**
 * Calcule la météo actuelle et la prochaine basée sur le temps universel
 */
export function getGlobalWeather() {
  const now = Date.now()
  const elapsed = now - WEATHER_EPOCH
  const cycleIndex = Math.floor(elapsed / WEATHER_CYCLE)
  const weatherIndex = cycleIndex % WEATHER_ORDER.length
  const currentWeatherId = WEATHER_ORDER[weatherIndex]
  const nextWeatherId = WEATHER_ORDER[(weatherIndex + 1) % WEATHER_ORDER.length]
  
  // Temps restant avant le changement
  const cycleStart = WEATHER_EPOCH + (cycleIndex * WEATHER_CYCLE)
  const cycleEnd = cycleStart + WEATHER_CYCLE
  const remainingMs = cycleEnd - now
  
  return {
    current: {
      ...farmingData.weatherTypes[currentWeatherId],
      remainingMs
    },
    next: farmingData.weatherTypes[nextWeatherId]
  }
}

/**
 * Calcule le temps de croissance effectif pour un légume selon la météo
 */
export function getEffectiveGrowthTime(vegetableType) {
  const vegetable = farmingData.vegetables[vegetableType]
  if (!vegetable) return null
  
  const weather = getGlobalWeather()
  const effect = weather.current.effects[vegetableType] || 0
  
  // Un bonus positif = pousse plus vite = temps réduit
  const multiplier = 1 - effect
  return Math.round(vegetable.growthTime * multiplier)
}

// ========================
// ENDPOINTS
// ========================

/**
 * GET /api/farming/state - Récupère l'état actuel de la ferme du joueur
 */
export async function getFarmingState(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    // Vérifier le niveau requis
    const playerLevel = user.experience?.level || 1
    if (playerLevel < farmingData.requiredLevel) {
      return res.status(403).json({ 
        error: `Niveau ${farmingData.requiredLevel} requis pour accéder à la ferme`,
        requiredLevel: farmingData.requiredLevel,
        currentLevel: playerLevel
      })
    }
    
    // Initialiser farming si nécessaire
    if (!user.farming) {
      user.farming = {
        level: 1,
        seeds: { potato: 0, carrot: 0, corn: 0 },
        vegetables: { potato: 0, carrot: 0, corn: 0 },
        unlockedSlots: [4],
        plantations: []
      }
      await user.save()
    }
    
    // Récupérer la météo globale
    const weather = getGlobalWeather()
    
    res.json({
      level: user.farming.level,
      seeds: user.farming.seeds,
      vegetables: user.farming.vegetables,
      unlockedSlots: user.farming.unlockedSlots,
      plantations: user.farming.plantations.map(p => ({
        slotIndex: p.slotIndex,
        vegetableType: p.vegetableType,
        plantedAt: p.plantedAt,
        readyAt: p.readyAt,
        isReady: new Date(p.readyAt) <= new Date()
      })),
      strangeRoots: user.resources?.strange_root || 0,
      weather
    })
  } catch (err) {
    console.error('[farming] getFarmingState error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * GET /api/farming/weather - Récupère uniquement la météo actuelle (public)
 */
export async function getWeather(req, res) {
  try {
    const weather = getGlobalWeather()
    res.json(weather)
  } catch (err) {
    console.error('[farming] getWeather error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/farming/buy-seeds - Achète des graines avec des racines bizarres
 */
export async function buySeeds(req, res) {
  try {
    const { vegetableType } = req.body
    
    if (!vegetableType || !farmingData.vegetables[vegetableType]) {
      return res.status(400).json({ error: 'Type de légume invalide' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    // Vérifier le niveau
    const playerLevel = user.experience?.level || 1
    if (playerLevel < farmingData.requiredLevel) {
      return res.status(403).json({ error: `Niveau ${farmingData.requiredLevel} requis` })
    }
    
    // Initialiser farming si nécessaire
    if (!user.farming) {
      user.farming = {
        level: 1,
        seeds: { potato: 0, carrot: 0, corn: 0 },
        vegetables: { potato: 0, carrot: 0, corn: 0 },
        unlockedSlots: [4],
        plantations: []
      }
    }
    
    const price = farmingData.seedPrices[vegetableType]
    const cost = price.count
    const seedsGiven = price.seedsGiven
    
    // Vérifier les ressources
    if ((user.resources?.strange_root || 0) < cost) {
      return res.status(400).json({ error: 'Pas assez de racines bizarres' })
    }
    
    // Déduire le coût et ajouter les graines
    user.resources.strange_root -= cost
    user.farming.seeds[vegetableType] = (user.farming.seeds[vegetableType] || 0) + seedsGiven
    
    await user.save()
    
    res.json({
      success: true,
      seeds: user.farming.seeds,
      strangeRoots: user.resources.strange_root
    })
  } catch (err) {
    console.error('[farming] buySeeds error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/farming/plant - Plante une graine sur une case
 */
export async function plantSeed(req, res) {
  try {
    const { slotIndex, vegetableType } = req.body
    
    if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex > 8) {
      return res.status(400).json({ error: 'Index de case invalide' })
    }
    
    if (!vegetableType || !farmingData.vegetables[vegetableType]) {
      return res.status(400).json({ error: 'Type de légume invalide' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    // Vérifier le niveau
    const playerLevel = user.experience?.level || 1
    if (playerLevel < farmingData.requiredLevel) {
      return res.status(403).json({ error: `Niveau ${farmingData.requiredLevel} requis` })
    }
    
    // Initialiser farming si nécessaire
    if (!user.farming) {
      user.farming = {
        level: 1,
        seeds: { potato: 0, carrot: 0, corn: 0 },
        vegetables: { potato: 0, carrot: 0, corn: 0 },
        unlockedSlots: [4],
        plantations: []
      }
    }
    
    // Vérifier que la case est débloquée
    if (!user.farming.unlockedSlots.includes(slotIndex)) {
      return res.status(400).json({ error: 'Cette case n\'est pas débloquée' })
    }
    
    // Vérifier qu'il n'y a pas déjà une plantation sur cette case
    const existingPlantation = user.farming.plantations.find(p => p.slotIndex === slotIndex)
    if (existingPlantation) {
      return res.status(400).json({ error: 'Une plante pousse déjà sur cette case' })
    }
    
    // Vérifier que le joueur a des graines
    if ((user.farming.seeds[vegetableType] || 0) < 1) {
      return res.status(400).json({ error: 'Pas assez de graines' })
    }
    
    // Calculer le temps de croissance effectif selon la météo
    const growthTime = getEffectiveGrowthTime(vegetableType)
    const now = new Date()
    const readyAt = new Date(now.getTime() + growthTime)
    
    // Consommer la graine et créer la plantation
    user.farming.seeds[vegetableType] -= 1
    user.farming.plantations.push({
      slotIndex,
      vegetableType,
      plantedAt: now,
      readyAt
    })
    
    await user.save()
    
    res.json({
      success: true,
      seeds: user.farming.seeds,
      plantation: {
        slotIndex,
        vegetableType,
        plantedAt: now,
        readyAt,
        isReady: false
      }
    })
  } catch (err) {
    console.error('[farming] plantSeed error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/farming/harvest - Récolte une plante prête (démarre le mini-jeu)
 */
export async function harvestPlant(req, res) {
  try {
    const { slotIndex } = req.body
    
    if (typeof slotIndex !== 'number') {
      return res.status(400).json({ error: 'Index de case invalide' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    // Trouver la plantation
    const plantationIndex = user.farming.plantations.findIndex(p => p.slotIndex === slotIndex)
    if (plantationIndex === -1) {
      return res.status(400).json({ error: 'Aucune plantation sur cette case' })
    }
    
    const plantation = user.farming.plantations[plantationIndex]
    
    // Vérifier que la plante est prête
    if (new Date(plantation.readyAt) > new Date()) {
      return res.status(400).json({ error: 'La plante n\'est pas encore prête' })
    }
    
    // Retourner les infos pour lancer le mini-jeu côté client
    // La plantation reste jusqu'à ce que le mini-jeu soit terminé
    const vegetable = farmingData.vegetables[plantation.vegetableType]
    const minigameConfig = farmingData.minigames[vegetable.minigame]
    
    res.json({
      success: true,
      slotIndex,
      vegetableType: plantation.vegetableType,
      minigame: vegetable.minigame,
      minigameConfig,
      vegetableData: vegetable
    })
  } catch (err) {
    console.error('[farming] harvestPlant error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/farming/complete-harvest - Termine la récolte après le mini-jeu
 */
export async function completeHarvest(req, res) {
  try {
    const { slotIndex, reward } = req.body
    
    if (typeof slotIndex !== 'number') {
      return res.status(400).json({ error: 'Index de case invalide' })
    }
    
    if (typeof reward !== 'number' || reward < 0) {
      return res.status(400).json({ error: 'Récompense invalide' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    // Trouver et supprimer la plantation
    const plantationIndex = user.farming.plantations.findIndex(p => p.slotIndex === slotIndex)
    if (plantationIndex === -1) {
      return res.status(400).json({ error: 'Aucune plantation sur cette case' })
    }
    
    const plantation = user.farming.plantations[plantationIndex]
    const vegetable = farmingData.vegetables[plantation.vegetableType]
    
    // Valider la récompense (ne pas dépasser le max possible)
    const clampedReward = Math.min(Math.max(0, Math.round(reward)), vegetable.maxReward)
    
    // Supprimer la plantation
    user.farming.plantations.splice(plantationIndex, 1)
    
    // Ajouter les légumes récoltés
    if (clampedReward > 0) {
      user.farming.vegetables[plantation.vegetableType] = 
        (user.farming.vegetables[plantation.vegetableType] || 0) + clampedReward
    }
    
    await user.save()
    
    res.json({
      success: true,
      vegetableType: plantation.vegetableType,
      harvested: clampedReward,
      vegetables: user.farming.vegetables
    })
  } catch (err) {
    console.error('[farming] completeHarvest error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/farming/unlock-slot - Débloque une nouvelle case
 */
export async function unlockSlot(req, res) {
  try {
    const { slotIndex } = req.body
    
    if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex > 8) {
      return res.status(400).json({ error: 'Index de case invalide' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    // Vérifier le niveau
    const playerLevel = user.experience?.level || 1
    if (playerLevel < farmingData.requiredLevel) {
      return res.status(403).json({ error: `Niveau ${farmingData.requiredLevel} requis` })
    }
    
    // Initialiser farming si nécessaire
    if (!user.farming) {
      user.farming = {
        level: 1,
        seeds: { potato: 0, carrot: 0, corn: 0 },
        vegetables: { potato: 0, carrot: 0, corn: 0 },
        unlockedSlots: [4],
        plantations: []
      }
    }
    
    // Vérifier que la case n'est pas déjà débloquée
    if (user.farming.unlockedSlots.includes(slotIndex)) {
      return res.status(400).json({ error: 'Cette case est déjà débloquée' })
    }
    
    // Vérifier le prix
    const price = farmingData.slotUnlockPrice
    if (price.type === 'eggs') {
      if ((user.resources?.eggs || 0) < price.count) {
        return res.status(400).json({ error: 'Pas assez d\'œufs' })
      }
      user.resources.eggs -= price.count
    }
    
    // Débloquer la case
    user.farming.unlockedSlots.push(slotIndex)
    
    await user.save()
    
    res.json({
      success: true,
      unlockedSlots: user.farming.unlockedSlots
    })
  } catch (err) {
    console.error('[farming] unlockSlot error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
