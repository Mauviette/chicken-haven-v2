/**
 * Contrôleur du farming
 * Gère les endpoints HTTP pour le système de mini-jeu de ferme
 */
import User from '../models/User.js'
import { farmingData } from '../data/sharedGameData.js'
import { v4 as uuidv4 } from 'uuid'

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
// UTILITAIRES INVENTAIRE & DEMANDES
// ========================

/**
 * Calcule le total des légumes dans l'inventaire
 */
function getTotalVegetables(vegetables) {
  return (vegetables?.potato || 0) + (vegetables?.carrot || 0) + (vegetables?.corn || 0)
}

/**
 * Retourne le nombre max de demandes simultanées pour un niveau donné
 */
function getMaxRequestsForLevel(level) {
  const maxPerLevel = farmingData.requests?.maxRequestsPerLevel || farmingData.farmLevels?.maxRequestsPerLevel
  if (!maxPerLevel) return 1
  
  // Cherche la valeur pour le niveau, ou le niveau le plus proche inférieur
  let maxRequests = 1
  for (const [lvl, count] of Object.entries(maxPerLevel)) {
    if (parseInt(lvl) <= level) {
      maxRequests = count
    }
  }
  return maxRequests
}

/**
 * Génère une nouvelle demande aléatoire pour un joueur
 */
function getUnlockedVegetables(farmLevel) {
  const vegetables = farmingData.vegetables || {}
  const unlocked = []
  
  for (const [vegType, vegData] of Object.entries(vegetables)) {
    if (vegData.unlock_level <= farmLevel) {
      unlocked.push(vegType)
    }
  }
  
  return unlocked
}

function generateRequest(farmLevel, unlockedVegetables = ['potato', 'carrot', 'corn']) {
  const config = farmingData.requests
  
  // Déterminer la quantité de légumes pour cette demande
  const quantityRange = config.quantityRanges[farmLevel] || config.quantityRanges[5] || { min: 4, max: 8 }
  const totalQuantity = Math.floor(Math.random() * (quantityRange.max - quantityRange.min + 1)) + quantityRange.min
  
  // Répartir aléatoirement entre les légumes débloqués
  const requirements = {}
  let remaining = totalQuantity
  const shuffledVeggies = [...unlockedVegetables].sort(() => Math.random() - 0.5)
  
  for (let i = 0; i < shuffledVeggies.length; i++) {
    const vegType = shuffledVeggies[i]
    if (i === shuffledVeggies.length - 1) {
      // Dernier légume: prend le reste
      if (remaining > 0) requirements[vegType] = remaining
    } else {
      // Aléatoire entre 0 et remaining
      const amount = Math.floor(Math.random() * (remaining + 1))
      if (amount > 0) requirements[vegType] = amount
      remaining -= amount
    }
  }
  
  // S'assurer qu'il y a au moins 1 légume demandé
  if (Object.keys(requirements).length === 0) {
    const randomVeg = unlockedVeggies[Math.floor(Math.random() * unlockedVeggies.length)]
    requirements[randomVeg] = 1
  }
  
  // Calculer la difficulté totale
  let totalDifficulty = 0
  for (const [vegType, qty] of Object.entries(requirements)) {
    const diff = config.vegetableDifficulty[vegType] || 1
    totalDifficulty += qty * diff
  }
  
  // Calculer le temps disponible (minimum 4h)
  const calculatedTime = totalDifficulty * config.timePerDifficulty
  const completionTime = Math.max(calculatedTime, config.minCompletionTime)
  
  // Calculer les récompenses
  let potathune = 0
  let xp = 0
  for (const [vegType, qty] of Object.entries(requirements)) {
    const pReward = config.rewardsPerVegetable.potathune
    const xpReward = config.rewardsPerVegetable.xp
    
    // Potathune avec variance
    for (let i = 0; i < qty; i++) {
      const variance = (Math.random() * 2 - 1) * pReward.variance
      potathune += Math.round(pReward.base + variance)
    }
    
    // XP fixe
    xp += qty * xpReward.base
  }
  
  // Choisir un dialogue aléatoire
  const dialogue = config.dialogues[Math.floor(Math.random() * config.dialogues.length)]
  
  const now = new Date()
  return {
    id: uuidv4(),
    createdAt: now,
    expiresAt: new Date(now.getTime() + completionTime),
    firstOpenedAt: null,
    seen: false,
    dialogue,
    requirements,
    rewards: {
      potathune: Math.max(1, potathune),
      xp: Math.max(1, xp)
    }
  }
}

/**
 * Calcule l'XP nécessaire pour passer au niveau suivant
 */
function getXpForNextLevel(currentLevel) {
  const levels = farmingData.farmLevels
  if (currentLevel < levels.xpPerLevel.length) {
    return levels.xpPerLevel[currentLevel]
  }
  // Pour les niveaux au-delà du tableau, extrapoler
  const lastDefined = levels.xpPerLevel[levels.xpPerLevel.length - 1]
  const extraLevels = currentLevel - (levels.xpPerLevel.length - 1)
  return lastDefined + extraLevels * levels.xpBaseIncrement
}

/**
 * Ajoute de l'XP et gère le level up
 */
function addFarmXp(farming, xpToAdd) {
  farming.xp = (farming.xp || 0) + xpToAdd
  
  let leveledUp = false
  let xpRequired = getXpForNextLevel(farming.level)
  
  while (farming.xp >= xpRequired) {
    farming.xp -= xpRequired
    farming.level += 1
    leveledUp = true
    xpRequired = getXpForNextLevel(farming.level)
  }
  
  return { leveledUp, newLevel: farming.level, currentXp: farming.xp, xpRequired }
}

/**
 * Calcule le coût et le niveau requis pour débloquer un slot
 */
function getSlotUnlockCost(slotIndex) {
  // Cases des côtés (milieu des bords) : 1,3,5,7
  const sideSlots = [1, 3, 5, 7]
  // Cases des coins : 0,2,6,8
  const cornerSlots = [0, 2, 6, 8]
  
  if (sideSlots.includes(slotIndex)) {
    return {
      requiredLevel: 2,
      cost: { ancient_urn: 2, potathune: 25 }
    }
  } else if (cornerSlots.includes(slotIndex)) {
    return {
      requiredLevel: 5,
      cost: { ancient_urn: 3, potathune: 50 }
    }
  } else {
    // Slot invalide ou centre (déjà débloqué)
    return null
  }
}

/**
 * Initialise les données farming d'un utilisateur si nécessaire
 */
async function initializeFarming(user) {
  let needsSave = false
  if (!user.farming) {
    user.farming = {
      level: 1,
      xp: 0,
      potathune: 0,
      wateringCans: 1,
      inventoryLimit: farmingData.inventory?.defaultLimit || 10,
      seeds: { potato: 0, carrot: 0, corn: 0, tomato: 0, lettuce: 0, pumpkin: 0 },
      vegetables: { potato: 0, carrot: 0, corn: 0, tomato: 0, lettuce: 0, pumpkin: 0 },
      unlockedSlots: [4],
      plantations: [],
      activeRequests: [],
      nextRequestAt: null
    }
    needsSave = true
  } else {
    // S'assurer que les nouveaux champs existent
    if (user.farming.xp === undefined) { user.farming.xp = 0; needsSave = true }
    if (user.farming.potathune === undefined) { user.farming.potathune = 0; needsSave = true }
    if (user.farming.wateringCans === undefined || user.farming.wateringCans === null) { user.farming.wateringCans = 1; needsSave = true }
    if (user.farming.inventoryLimit === undefined) { user.farming.inventoryLimit = farmingData.inventory?.defaultLimit || 10; needsSave = true }
    if (!user.farming.activeRequests) { user.farming.activeRequests = []; needsSave = true }
    if (user.farming.nextRequestAt === undefined) { user.farming.nextRequestAt = null; needsSave = true }
  }
  if (needsSave) {
    await user.save()
  }
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
    await initializeFarming(user)
    
    const now = new Date()
    
    // Nettoyer les demandes expirées
    user.farming.activeRequests = user.farming.activeRequests.filter(
      req => new Date(req.expiresAt) > now
    )
    
    // Vérifier si une nouvelle demande peut apparaître
    const maxRequests = getMaxRequestsForLevel(user.farming.level)
    const currentRequests = user.farming.activeRequests.length
    
    if (currentRequests < maxRequests) {
      // Générer une nouvelle demande (pas de cooldown)
      const unlockedVegetables = getUnlockedVegetables(user.farming.level)
      const newRequest = generateRequest(user.farming.level, unlockedVegetables)
      user.farming.activeRequests.push(newRequest)
    }
    
    await user.save()
    
    // Récupérer la météo globale
    const weather = getGlobalWeather()
    
    // Calculer les infos d'inventaire
    const totalVegetables = getTotalVegetables(user.farming.vegetables)
    const inventoryLimit = user.farming.inventoryLimit || 10
    
    // Trouver le prochain upgrade d'inventaire disponible
    const inventoryConfig = farmingData.inventory || { defaultLimit: 10, upgrades: [] }
    const nextInventoryUpgrade = inventoryConfig.upgrades.find(u => u.from === inventoryLimit) || null
    
    res.json({
      level: user.farming.level,
      xp: user.farming.xp,
      xpRequired: getXpForNextLevel(user.farming.level),
      potathune: user.farming.potathune,
      wateringCans: user.farming.wateringCans,
      inventoryLimit,
      totalVegetables,
      inventoryFull: totalVegetables >= inventoryLimit,
      nextInventoryUpgrade,
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
      ancientUrns: user.resources?.ancient_urn || 0,
      weather,
      activeRequests: user.farming.activeRequests.map(r => ({
        id: r.id,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        firstOpenedAt: r.firstOpenedAt,
        seen: r.seen,
        dialogue: r.dialogue,
        // Convertir l'objet requirements en tableau pour le frontend
        requirements: Object.entries(r.requirements || {}).map(([vegetable, quantity]) => ({
          vegetable,
          quantity
        })),
        rewards: r.rewards
      })),
      nextRequestAt: user.farming.nextRequestAt
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
        seeds: { potato: 0, carrot: 0, corn: 0, tomato: 0, lettuce: 0, pumpkin: 0 },
        vegetables: { potato: 0, carrot: 0, corn: 0, tomato: 0, lettuce: 0, pumpkin: 0 },
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
        seeds: { potato: 0, carrot: 0, corn: 0, tomato: 0, lettuce: 0, pumpkin: 0 },
        vegetables: { potato: 0, carrot: 0, corn: 0, tomato: 0, lettuce: 0, pumpkin: 0 },
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
    
    // Initialiser farming si nécessaire
    await initializeFarming(user)
    
    // Vérifier la limite d'inventaire AVANT de lancer le mini-jeu
    const totalVegetables = getTotalVegetables(user.farming.vegetables)
    const inventoryLimit = user.farming.inventoryLimit || 10
    
    if (totalVegetables >= inventoryLimit) {
      return res.status(400).json({ 
        error: 'Inventaire plein ! Complétez des demandes pour libérer de l\'espace.',
        inventoryFull: true
      })
    }
    
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
    
    // Initialiser farming si nécessaire
    await initializeFarming(user)
    
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
    
    // Ajouter 1 XP de ferme par récolte
    const xpResult = addFarmXp(user.farming, 1)
    
    await user.save()
    
    res.json({
      success: true,
      vegetableType: plantation.vegetableType,
      harvested: clampedReward,
      vegetables: user.farming.vegetables,
      totalVegetables: getTotalVegetables(user.farming.vegetables),
      inventoryLimit: user.farming.inventoryLimit,
      xpGained: 1,
      leveledUp: xpResult.leveledUp,
      farmLevel: xpResult.newLevel,
      farmXp: xpResult.currentXp,
      farmXpRequired: xpResult.xpRequired
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
    
    // Initialiser farming si nécessaire
    await initializeFarming(user)
    
    // Vérifier que la case n'est pas déjà débloquée
    if (user.farming.unlockedSlots.includes(slotIndex)) {
      return res.status(400).json({ error: 'Cette case est déjà débloquée' })
    }
    
    // Obtenir le coût et le niveau requis pour ce slot
    const slotCost = getSlotUnlockCost(slotIndex)
    if (!slotCost) {
      return res.status(400).json({ error: 'Cette case ne peut pas être débloquée' })
    }
    
    // Vérifier le niveau de farming requis
    if (user.farming.level < slotCost.requiredLevel) {
      return res.status(403).json({ error: `Niveau de ferme ${slotCost.requiredLevel} requis` })
    }
    
    // Vérifier les ressources
    const { cost } = slotCost
    if ((user.resources?.ancient_urn || 0) < (cost.ancient_urn || 0)) {
      return res.status(400).json({ error: 'Pas assez d\'urnes antiques' })
    }
    if (user.farming.potathune < (cost.potathune || 0)) {
      return res.status(400).json({ error: 'Pas assez de potathune' })
    }
    
    // Déduire les ressources
    if (cost.ancient_urn) user.resources.ancient_urn -= cost.ancient_urn
    if (cost.potathune) user.farming.potathune -= cost.potathune
    
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

/**
 * POST /api/farming/open-request - Ouvre le dialogue d'une demande pour la première fois
 */
export async function openRequest(req, res) {
  try {
    const { requestId } = req.body
    
    if (!requestId) {
      return res.status(400).json({ error: 'ID de demande requis' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    await initializeFarming(user)
    
    // Trouver la demande
    const requestIndex = user.farming.activeRequests.findIndex(r => r.id === requestId)
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Demande non trouvée' })
    }
    
    const request = user.farming.activeRequests[requestIndex]
    
    // Marquer comme vue et enregistrer la première ouverture
    if (!request.firstOpenedAt) {
      request.firstOpenedAt = new Date()
    }
    request.seen = true
    
    await user.save()
    
    res.json({
      success: true,
      request: {
        ...request.toObject(),
        // Convertir l'objet requirements en tableau pour le frontend
        requirements: Object.entries(request.requirements || {}).map(([vegetable, quantity]) => ({
          vegetable,
          quantity
        }))
      }
    })
  } catch (err) {
    console.error('[farming] openRequest error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/farming/complete-request - Complète une demande
 */
export async function completeRequest(req, res) {
  try {
    const { requestId } = req.body
    
    if (!requestId) {
      return res.status(400).json({ error: 'ID de demande requis' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    await initializeFarming(user)
    
    // Trouver la demande
    const requestIndex = user.farming.activeRequests.findIndex(r => r.id === requestId)
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Demande non trouvée ou expirée' })
    }
    
    const request = user.farming.activeRequests[requestIndex]
    
    // Vérifier que le dialogue a été ouvert
    if (!request.firstOpenedAt) {
      return res.status(400).json({ error: 'Vous devez d\'abord parler au personnage' })
    }
    
    // Vérifier que le joueur a assez de légumes (requirements est un objet { potato: 3, carrot: 2 })
    for (const [vegetable, quantity] of Object.entries(request.requirements || {})) {
      const available = user.farming.vegetables[vegetable] || 0
      if (available < quantity) {
        return res.status(400).json({ 
          error: `Pas assez de ${vegetable}. Il faut ${quantity}, vous en avez ${available}.` 
        })
      }
    }
    
    // Déduire les légumes
    for (const [vegetable, quantity] of Object.entries(request.requirements || {})) {
      user.farming.vegetables[vegetable] -= quantity
    }
    
    // Ajouter les récompenses
    user.farming.potathune = (user.farming.potathune || 0) + request.rewards.potathune
    const xpResult = addFarmXp(user.farming, request.rewards.xp)
    
    // Supprimer la demande
    user.farming.activeRequests.splice(requestIndex, 1)
    
    await user.save()
    
    res.json({
      success: true,
      rewards: {
        potathune: request.rewards.potathune,
        xp: request.rewards.xp
      },
      farming: {
        vegetables: user.farming.vegetables,
        totalVegetables: getTotalVegetables(user.farming.vegetables),
        potathune: user.farming.potathune,
        xp: user.farming.xp,
        level: user.farming.level,
        leveledUp: xpResult.leveledUp,
        xpRequired: xpResult.xpRequired
      }
    })
  } catch (err) {
    console.error('[farming] completeRequest error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/farming/dismiss-request - Renvoie/ignore une demande
 */
export async function dismissRequest(req, res) {
  try {
    const { requestId } = req.body
    
    if (!requestId) {
      return res.status(400).json({ error: 'ID de demande requis' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    await initializeFarming(user)
    
    // Vérifier que le joueur a assez de potathune (2)
    const dismissCost = 2
    const currentPotathune = user.farming.potathune || 0
    
    if (currentPotathune < dismissCost) {
      return res.status(400).json({ 
        error: `Pas assez de potathune. Il faut ${dismissCost}💵, vous en avez ${currentPotathune}.` 
      })
    }
    
    // Trouver la demande
    const requestIndex = user.farming.activeRequests.findIndex(r => r.id === requestId)
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Demande non trouvée' })
    }
    
    // Déduire le coût
    user.farming.potathune -= dismissCost
    
    // Supprimer la demande
    user.farming.activeRequests.splice(requestIndex, 1)
    
    await user.save()
    
    res.json({
      success: true,
      farming: {
        potathune: user.farming.potathune,
        activeRequests: user.farming.activeRequests
      },
      activeRequests: user.farming.activeRequests
    })
  } catch (err) {
    console.error('[farming] dismissRequest error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/farming/upgrade-inventory - Améliore la limite d'inventaire
 */
export async function upgradeInventory(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    await initializeFarming(user)
    
    // Trouver le prochain upgrade disponible
    const currentLimit = user.farming.inventoryLimit || 10
    const inventoryConfig = farmingData.inventory || { defaultLimit: 10, upgrades: [] }
    
    // Trouver l'upgrade qui correspond à la limite actuelle
    const upgradeIndex = inventoryConfig.upgrades.findIndex(u => u.from === currentLimit)
    
    if (upgradeIndex === -1) {
      return res.status(400).json({ error: 'Aucune amélioration disponible' })
    }
    
    const upgrade = inventoryConfig.upgrades[upgradeIndex]
    
    // Vérifier les coûts
    const currentPotathune = user.farming.potathune || 0
    const currentUrns = user.resources?.ancient_urn || 0
    
    if (currentPotathune < upgrade.cost.potathune) {
      return res.status(400).json({ 
        error: `Pas assez de potathune. Il faut ${upgrade.cost.potathune}💵, vous en avez ${currentPotathune}.`
      })
    }
    
    if (currentUrns < upgrade.cost.ancient_urn) {
      return res.status(400).json({ 
        error: `Pas assez d'urnes anciennes. Il faut ${upgrade.cost.ancient_urn}, vous en avez ${currentUrns}.`
      })
    }
    
    // Déduire les coûts
    user.farming.potathune -= upgrade.cost.potathune
    user.resources.ancient_urn -= upgrade.cost.ancient_urn
    
    // Appliquer l'upgrade
    user.farming.inventoryLimit = upgrade.to
    
    await user.save()
    
    // Trouver le prochain upgrade s'il existe
    const nextUpgrade = inventoryConfig.upgrades.find(u => u.from === upgrade.to) || null
    
    res.json({
      success: true,
      newLimit: user.farming.inventoryLimit,
      potathune: user.farming.potathune,
      ancientUrns: user.resources.ancient_urn,
      nextUpgrade
    })
  } catch (err) {
    console.error('[farming] upgradeInventory error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/farming/discard-vegetables - Jette des légumes pour libérer de l'espace
 */
export async function discardVegetables(req, res) {
  try {
    const { vegetable, quantity } = req.body
    
    if (!vegetable || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Légume et quantité requis' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    await initializeFarming(user)
    
    const available = user.farming.vegetables[vegetable] || 0
    if (available < quantity) {
      return res.status(400).json({ error: `Pas assez de ${vegetable}` })
    }
    
    user.farming.vegetables[vegetable] -= quantity
    
    await user.save()
    
    res.json({
      success: true,
      vegetables: user.farming.vegetables
    })
  } catch (err) {
    console.error('[farming] discardVegetables error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/**
 * POST /api/farming/use-watering-can - Utilise un engrais sur une plantation
 */
export async function useWateringCan(req, res) {
  try {
    const { slotIndex } = req.body
    
    if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex > 8) {
      return res.status(400).json({ error: 'Index de case invalide' })
    }
    
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' })
    
    await initializeFarming(user)
    
    // Vérifier que le joueur a des engrais
    if ((user.farming.wateringCans || 0) <= 0) {
      return res.status(400).json({ error: 'Pas d\'engrais disponibles' })
    }
    
    // Trouver la plantation
    const plantationIndex = user.farming.plantations.findIndex(p => p.slotIndex === slotIndex)
    if (plantationIndex === -1) {
      return res.status(400).json({ error: 'Aucune plantation sur cette case' })
    }
    
    const plantation = user.farming.plantations[plantationIndex]
    
    // Vérifier que la plantation n'est pas déjà prête
    if (new Date(plantation.readyAt) <= new Date()) {
      return res.status(400).json({ error: 'Cette plantation est déjà prête' })
    }
    
    // Réduire le temps de 3 heures (3 * 60 * 60 * 1000 ms)
    const reductionMs = 3 * 60 * 60 * 1000
    const newReadyAt = new Date(plantation.readyAt.getTime() - reductionMs)
    
    // S'assurer qu'on ne va pas dans le passé
    plantation.readyAt = new Date(Math.max(newReadyAt.getTime(), plantation.plantedAt.getTime()))
    
    // Consommer un engrais
    user.farming.wateringCans -= 1
    
    await user.save()
    
    res.json({
      success: true,
      plantations: user.farming.plantations,
      wateringCans: user.farming.wateringCans
    })
  } catch (err) {
    console.error('[farming] useWateringCan error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

export { initializeFarming }
