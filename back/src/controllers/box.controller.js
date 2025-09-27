// controllers/box.controller.js
import User from '../models/User.js'
import { especeData, groupes, boxesData } from '../data/gameData.js'
import { updateAchievementProgress } from './achievements.controller.js'

// GET /api/boxes - Récupérer les boîtes disponibles
export async function getBoxes(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Filtrer les boîtes selon le niveau du joueur
    const playerLevel = user.experience?.level || 1
    const availableBoxes = boxesData.filter(box => (box.unlock_level || 1) <= playerLevel)

    res.json(availableBoxes)
  } catch (err) {
    console.error('Erreur getBoxes:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/boxes/:boxId/open - Ouvrir une boîte
export async function openBox(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const boxId = parseInt(req.params.boxId)
    const box = boxesData.find(b => b.id === boxId)
    
    if (!box) return res.status(404).json({ error: 'Boîte introuvable' })

    // Vérifier le niveau requis
    const playerLevel = user.experience?.level || 1
    if ((box.unlock_level || 1) > playerLevel) {
      return res.status(403).json({ error: 'Niveau insuffisant pour cette boîte' })
    }

    // Vérifier si le joueur a assez de ressources
    const resourceType = box.price.type === 'eggs' ? 'eggs' : 
                        box.price.type === 'stock_token' ? 'stock_token' : 
                        box.price.type === 'production_token' ? 'production_token' : null

    if (!resourceType) {
      return res.status(400).json({ error: 'Type de ressource invalide' })
    }

    const playerResources = user.resources || {}
    const currentAmount = playerResources[resourceType] || 0

    if (currentAmount < box.price.count) {
      return res.status(400).json({ 
        error: 'Ressources insuffisantes',
        required: box.price.count,
        current: currentAmount
      })
    }

    // Déduire le coût
    playerResources[resourceType] = currentAmount - box.price.count
    user.resources = playerResources

    // Calculer les poules déjà possédées
    const ownedChickens = (user.poulesPossedees || [])
      .filter(poule => poule.quantite > 0)
      .map(poule => poule.especeId)

    // Simuler l'ouverture de boîte
    const results = simulateBoxOpening(box, ownedChickens)

    // Ajouter les poules obtenues au joueur
    const addedChickens = []
    for (const result of results) {
      const existingPoule = user.poulesPossedees.find(p => p.especeId === result.chickenId)
      
      if (existingPoule) {
        // Augmenter la quantité sans marquer comme "new" si déjà possédée
        existingPoule.quantite += 1
        // Ne pas toucher à existingPoule.new ici
      } else {
        // Ajouter nouvelle poule (marquée comme nouvelle)
        user.poulesPossedees.push({
          especeId: result.chickenId,
          quantite: 1,
          niveauTalent: 1,
          new: true
        })
      }

      // Préparer les données de réponse
      const chickenData = especeData[result.chickenId]
      addedChickens.push({
        especeId: result.chickenId,
        nom: chickenData?.nom || result.chickenId,
        rarete: chickenData?.rarete || 'commune',
        groupe: result.groupName,
        isNew: !ownedChickens.includes(result.chickenId)
      })
    }

    // Sauvegarder les changements
    await user.save()

    // Mettre à jour le progrès des succès
    await updateAchievementProgress(req.userId, 'increment', {
      totalBoxesOpened: 1
    })
    await updateAchievementProgress(req.userId, 'max', {
      totalChickensOwned: user.poulesPossedees.length
    })

    res.json({
      success: true,
      box: {
        id: box.id,
        name: box.name,
        cost: box.price
      },
      results: addedChickens,
      newBalance: {
        [resourceType]: playerResources[resourceType]
      }
    })

  } catch (err) {
    console.error('Erreur openBox:', err)
    res.status(500).json({ error: 'Erreur serveur lors de l\'ouverture de la boîte' })
  }
}

// Fonction pour simuler l'ouverture d'une boîte avec probabilités
function simulateBoxOpening(box, ownedChickens) {
  const groups = Array.isArray(box.dropGroups) ? box.dropGroups : []
  if (!groups.length) return []

  // Sélectionner UN SEUL groupe en fonction des probabilités (chance)
  const candidates = groups.filter(g => Number(g.chance) > 0)
  const totalChance = candidates.reduce((sum, g) => sum + Number(g.chance || 0), 0)
  if (totalChance <= 0) return []

  function availableForGroup(groupName) {
    return Object.keys(especeData)
      .filter(id => especeData[id].groupe === groupName)
      .filter(id => {
        // Les poules fondamentales sont toujours disponibles
        if (especeData[id].groupe === 'fondamental') return true
        // Les autres groupes nécessitent d'avoir débloqué au moins une poule
        return ownedChickens.includes(id) || hasUnlockedGroup(groupName, ownedChickens)
      })
  }

  let selectedGroup = null
  let r = Math.random() * totalChance
  let acc = 0
  for (const g of candidates) {
    acc += Number(g.chance || 0)
    if (r <= acc) { selectedGroup = g; break }
  }
  if (!selectedGroup) selectedGroup = candidates[0]

  // Vérifier la disponibilité pour le groupe choisi, sinon fallback vers un autre groupe disponible
  let availableChickens = availableForGroup(selectedGroup.name)
  if (!availableChickens.length) {
    const sorted = [...candidates].sort((a, b) => Number(b.chance || 0) - Number(a.chance || 0))
    for (const g of sorted) {
      if (g === selectedGroup) continue
      const cand = availableForGroup(g.name)
      if (cand.length) { selectedGroup = g; availableChickens = cand; break }
    }
  }

  // Fallback ultime: agréger toutes les dispos si aucune pour les groupes (devrait être rare)
  if (!availableChickens.length) {
    const all = []
    for (const g of candidates) all.push(...availableForGroup(g.name))
    if (!all.length) return []
    availableChickens = all
  }

  const groupData = groupes.find(g => g.name === selectedGroup.name)
  const rarityChances = groupData?.rarityDropChance || [100, 0, 0, 0]
  const quantity = Math.max(1, Number(selectedGroup.quantity) || 1)
  const results = []
  for (let i = 0; i < quantity; i++) {
    const selectedChicken = selectChickenByRarity(availableChickens, rarityChances)
    if (selectedChicken) {
      results.push({
        chickenId: selectedChicken,
        groupName: selectedGroup.name,
        rarity: especeData[selectedChicken]?.rarete || 'commune'
      })
    }
  }

  return results
}

// Fonction pour vérifier si un groupe est débloqué
function hasUnlockedGroup(groupName, ownedChickens) {
  // Pour simplifier, on considère qu'un groupe est débloqué si le joueur possède au moins une poule
  // ou si c'est le groupe fondamental
  if (groupName === 'fondamental') return true
  
  // Vérifier si le joueur a au moins une poule de ce groupe ou d'un groupe précédent
  const groupOrder = ['fondamental', 'brillant', 'discret', 'chic', 'secret']
  const targetIndex = groupOrder.indexOf(groupName)
  
  if (targetIndex === -1) return false
  
  // Vérifier les groupes précédents
  for (let i = 0; i <= targetIndex; i++) {
    const hasChickenInGroup = ownedChickens.some(chickenId => 
      especeData[chickenId]?.groupe === groupOrder[i]
    )
    if (hasChickenInGroup) return true
  }
  
  return false
}

// Fonction pour sélectionner une poule basée sur les probabilités de rareté
function selectChickenByRarity(availableChickens, rarityChances) {
  // Créer un tableau pondéré par rareté
  const rarityOrder = ['commune', 'rare', 'epique', 'legendaire']
  const weightedChickens = []

  for (const chickenId of availableChickens) {
    const chicken = especeData[chickenId]
    const rarityIndex = rarityOrder.indexOf(chicken?.rarete || 'commune')
    const weight = rarityChances[rarityIndex] || 0

    // Ajouter la poule autant de fois que son poids
    for (let i = 0; i < weight; i++) {
      weightedChickens.push(chickenId)
    }
  }

  if (weightedChickens.length === 0) {
    // Fallback: sélection aléatoire simple
    return availableChickens[Math.floor(Math.random() * availableChickens.length)]
  }

  // Sélection aléatoire pondérée
  return weightedChickens[Math.floor(Math.random() * weightedChickens.length)]
}