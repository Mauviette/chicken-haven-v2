// controllers/box.controller.js
import User from '../models/User.js'
import { especeData, groupes, boxesData, artifactsData } from '../data/sharedGameData.js'
import { updateAchievementProgress } from './achievements.controller.js'
import { executeWithRetry } from '../utils/mongoUtils.js'

// Fonction utilitaire pour effectuer une opération atomique avec retry
async function executeAtomicBoxOperation(userId, boxId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Recharger l'utilisateur à chaque tentative pour avoir la version la plus récente
      const user = await User.findById(userId)
      if (!user) throw new Error('Utilisateur introuvable')

      const box = boxesData.find(b => b.id === boxId)
      if (!box) throw new Error('Boîte introuvable')

      // Vérifier le niveau requis
      const playerLevel = user.experience?.level || 1
      if ((box.unlock_level || 1) > playerLevel) {
        throw new Error('Niveau insuffisant pour cette boîte')
      }

      // Vérification spéciale pour les boîtes d'artefacts (niveau 5 minimum)
      if (box.category === 'artifacts' && playerLevel < 5) {
        throw new Error('Vous devez atteindre le niveau 5 pour ouvrir des boîtes d\'artefacts')
      }

      // Vérifier les ressources
      const resourceType = box.price.type === 'eggs' ? 'eggs' : 
                          box.price.type === 'stock_token' ? 'stock_token' : 
                          box.price.type === 'production_token' ? 'production_token' :
                          box.price.type === 'chest_key' ? 'chest_key' : null

      if (!resourceType) throw new Error('Type de ressource invalide')

      const playerResources = user.resources || {}
      const currentAmount = playerResources[resourceType] || 0

      if (currentAmount < box.price.count) {
        throw new Error(`Ressources insuffisantes (${currentAmount}/${box.price.count})`)
      }

      // Calculer les poules déjà possédées
      const ownedChickens = (user.poulesPossedees || [])
        .filter(poule => poule.quantite > 0)
        .map(poule => poule.especeId)

      // Calculer les artefacts déjà possédés si c'est une boîte d'artefacts
      const ownedArtifacts = box.category === 'artifacts' ? 
        (user.artifacts || []).map(a => a.artifactId) : []
      


      // Simuler l'ouverture de boîte
      const results = simulateBoxOpening(box, ownedChickens, ownedArtifacts)

      // Décrémenter le coût d'abord
      const costUpdate = await User.findByIdAndUpdate(
        userId,
        { $inc: { [`resources.${resourceType}`]: -box.price.count } },
        { new: true }
      )
      
      if (!costUpdate) {
        throw new Error('Échec de la déduction du coût')
      }

      const responseResults = []
      
      // Traiter les résultats un par un de manière atomique
      for (const result of results) {
        if (result.type === 'chicken') {
          // Tenter d'incrémenter la quantité si la poule existe déjà
          // Vérifier l'existence de la poule avant d'ajouter
          const alreadyHasChicken = await User.findOne({
            _id: userId,
            'poulesPossedees.especeId': result.chickenId
          });

          // Logique classique : si la poule existe, on incrémente la quantité, sinon on ajoute
          const user = await User.findById(userId);
          const pouleIndex = user.poulesPossedees.findIndex(p => p.especeId === result.chickenId);
          if (pouleIndex !== -1) {
            await User.updateOne(
              { _id: userId, [`poulesPossedees.${pouleIndex}.especeId`]: result.chickenId },
              { $inc: { [`poulesPossedees.${pouleIndex}.quantite`]: 1 } }
            );
          } else {
            await User.updateOne(
              { _id: userId },
              {
                $push: {
                  poulesPossedees: {
                    especeId: result.chickenId,
                    quantite: 1,
                    niveauTalent: 1,
                    new: true
                  }
                }
              }
            );
          }

          // Préparer les données de réponse
          const chickenData = especeData[result.chickenId];
          responseResults.push({
            type: 'chicken',
            especeId: result.chickenId,
            nom: chickenData?.nom || result.chickenId,
            rarete: chickenData?.rarete || 'commune',
            groupe: result.groupName,
            isNew: !ownedChickens.includes(result.chickenId)
          });
        } else if (result.type === 'artifact') {
          // Utiliser $addToSet pour éviter les doublons d'artefacts
          await User.updateOne(
            { _id: userId },
            {
              $addToSet: {
                artifacts: { artifactId: result.artifactId }
              }
            }
          )

          // Préparer les données de réponse
          const artifactData = artifactsData[result.artifactId]
          responseResults.push({
            type: 'artifact',
            artifactId: result.artifactId,
            name: artifactData?.name || result.artifactId,
            icon: artifactData?.icon || '❖',
            rarete: artifactData?.rarete || 'commune',
            description: artifactData?.description || '',
            isNew: !ownedArtifacts.includes(result.artifactId)
          })
        } else if (result.type === 'item') {
          // Ajouter les ressources de manière atomique
          await User.updateOne(
            { _id: userId },
            { $inc: { [`resources.${result.itemId}`]: result.amount } }
          )

          responseResults.push({
            type: 'item',
            itemId: result.itemId,
            amount: result.amount
          })
        }
      }

      // Récupérer l'utilisateur mis à jour pour les nouvelles ressources
      const updatedUser = await User.findById(userId)
      const newBalance = updatedUser.resources[resourceType]

      // Retourner le résultat
      return {
        box: { id: box.id, name: box.name, cost: box.price },
        results: responseResults,
        newBalance: { [resourceType]: newBalance }
      }

    } catch (error) {
      // Si c'est un conflit de version et qu'il reste des tentatives
      if (error.name === 'VersionError' && attempt < maxRetries) {
        console.log(`⚠️ Conflit de version détecté lors de l'ouverture de boîte (tentative ${attempt}/${maxRetries})`)
        
        // Attendre un délai exponentiel avant de retenter
        await new Promise(resolve => setTimeout(resolve, attempt * 100))
        continue
      }
      
      // Relancer l'erreur si ce n'est pas un VersionError ou si on a épuisé les tentatives
      throw error
    }
  }
}

// GET /api/boxes - Récupérer les boîtes disponibles
export async function getBoxes(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Filtrer les boîtes selon le niveau du joueur
    const playerLevel = user.experience?.level || 1
    const availableBoxes = boxesData.filter(box => (box.unlock_level || 1) <= playerLevel)

    // Ajouter les chances ajustées pour les boîtes d'artefacts
    const ownedArtifacts = (user.artifacts || []).map(a => a.artifactId)
    
    const enrichedBoxes = availableBoxes.map(box => {
      if (box.category === 'artifacts') {
        const adjustedChances = calculateAdjustedArtifactChances(ownedArtifacts)
        const adjustedBox = calculateAdjustedBoxChances(box, ownedArtifacts)
        return {
          ...adjustedBox,
          adjustedRarityChances: adjustedChances
        }
      }
      return box
    })

    res.json(enrichedBoxes)
  } catch (err) {
    console.error('Erreur getBoxes:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Fonction pour calculer les chances ajustées des artefacts (UNIQUEMENT POUR L'AFFICHAGE)
// Cette fonction modifie les pourcentages affichés mais n'affecte pas la logique de sélection
function calculateAdjustedArtifactChances(ownedArtifacts) {
  const rarityOrder = ['commune', 'rare', 'epique', 'legendaire']
  const baseRarityWeights = [40, 35, 20, 5]

  // Grouper les artefacts par rareté
  const artifactsByRarity = {
    commune: [],
    rare: [],
    epique: [],
    legendaire: []
  }

  for (const [artifactId, data] of Object.entries(artifactsData)) {
    const rarity = data.rarete || 'commune'
    if (artifactsByRarity[rarity]) {
      artifactsByRarity[rarity].push(artifactId)
    }
  }

  // Calculer les artefacts disponibles par rareté
  const availableByRarity = {}
  for (const rarity of rarityOrder) {
    availableByRarity[rarity] = artifactsByRarity[rarity].filter(id => !ownedArtifacts.includes(id))
  }

  // Calculer les poids ajustés en excluant les raretés vides
  const adjustedWeights = baseRarityWeights.map((weight, index) => {
    const rarity = rarityOrder[index]
    return availableByRarity[rarity].length > 0 ? weight : 0
  })

  const totalWeight = adjustedWeights.reduce((sum, weight) => sum + weight, 0)
  
  // Convertir en pourcentages
  if (totalWeight === 0) return [0, 0, 0, 0]
  
  return adjustedWeights.map(weight => Math.round((weight / totalWeight) * 100))
}

// Fonction pour ajuster les chances des groupes d'une boîte
function calculateAdjustedBoxChances(box, ownedArtifacts) {
  // Trouver le groupe artifacts dans la boîte
  const artifactsGroupIndex = box.dropGroups.findIndex(group => group.name === 'artifacts')
  if (artifactsGroupIndex === -1) return box // Pas de groupe artifacts dans cette boîte

  // Calculer la probabilité réelle d'obtenir un artefact disponible
  const rarityOrder = ['commune', 'rare', 'epique', 'legendaire']
  const baseRarityWeights = [40, 35, 20, 5] // Poids du groupe artifacts

  // Grouper les artefacts par rareté
  const artifactsByRarity = {
    commune: [],
    rare: [],
    epique: [],
    legendaire: []
  }

  for (const [artifactId, data] of Object.entries(artifactsData)) {
    const rarity = data.rarete || 'commune'
    if (artifactsByRarity[rarity]) {
      artifactsByRarity[rarity].push(artifactId)
    }
  }

  // Calculer les artefacts disponibles par rareté
  const availableByRarity = {}
  for (const rarity of rarityOrder) {
    availableByRarity[rarity] = artifactsByRarity[rarity].filter(id => !ownedArtifacts.includes(id))
  }

  // Calculer la probabilité pondérée d'obtenir un artefact disponible
  let totalAvailableProbability = 0
  const totalRarityWeight = baseRarityWeights.reduce((sum, weight) => sum + weight, 0)

  for (let i = 0; i < rarityOrder.length; i++) {
    const rarity = rarityOrder[i]
    const weight = baseRarityWeights[i]
    const hasAvailable = availableByRarity[rarity].length > 0

    if (hasAvailable) {
      totalAvailableProbability += weight / totalRarityWeight
    }
  }

  // Ajuster les chances du groupe artifacts
  const originalArtifactsChance = box.dropGroups[artifactsGroupIndex].chance
  const adjustedArtifactsChance = originalArtifactsChance * totalAvailableProbability

  // Calculer les nouvelles chances pour tous les groupes
  const adjustedGroups = box.dropGroups.map((group, index) => {
    if (index === artifactsGroupIndex) {
      return { ...group, chance: adjustedArtifactsChance }
    } else if (group.name === 'eggs_bonus') {
      // Redistribuer la différence aux œufs
      const redistribution = originalArtifactsChance - adjustedArtifactsChance
      return { ...group, chance: group.chance + redistribution }
    }
    return group
  })

  return { ...box, dropGroups: adjustedGroups }
}

// POST /api/boxes/:boxId/open - Ouvrir une boîte
export async function openBox(req, res) {
  try {
    const boxId = parseInt(req.params.boxId)
    
    // Exécuter l'opération atomique avec retry automatique
    const result = await executeAtomicBoxOperation(req.userId, boxId)

    // Mettre à jour le progrès des succès (en dehors de l'opération atomique)
    try {
      await updateAchievementProgress(req.userId, 'increment', {
        totalBoxesOpened: 1
      })
      
      const userForAchievements = await User.findById(req.userId)
      if (userForAchievements) {
        await updateAchievementProgress(req.userId, 'max', {
          totalChickensOwned: userForAchievements.poulesPossedees.length
        })
      }
    } catch (achievementError) {
      // Les erreurs de succès ne doivent pas faire échouer l'ouverture de boîte
      console.warn('Erreur lors de la mise à jour des succès:', achievementError)
    }

    res.json({
      success: true,
      ...result
    })

  } catch (err) {
    console.error('Erreur openBox:', err)
    
    // Gestion d'erreurs spécifiques
    if (err.message.includes('Ressources insuffisantes')) {
      return res.status(400).json({ error: err.message })
    }
    if (err.message.includes('Niveau insuffisant')) {
      return res.status(403).json({ error: err.message })
    }
    if (err.message.includes('introuvable')) {
      return res.status(404).json({ error: err.message })
    }
    
    res.status(500).json({ error: 'Erreur serveur lors de l\'ouverture de la boîte' })
  }
}

// Fonction pour simuler l'ouverture d'une boîte avec probabilités
function simulateBoxOpening(box, ownedChickens, ownedArtifacts = []) {
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

  const groupData = groupes.find(g => g.name === selectedGroup.name)
  const quantity = Math.max(1, Number(selectedGroup.quantity) || 1)
  const results = []

  // Traitement selon le type de groupe
  if (selectedGroup.name === 'artifacts') {
    // Groupe des artefacts - sélection respectant les pourcentages de rareté originaux
    const artifactResult = selectArtifactRespectingRarity(ownedArtifacts, groupData?.rarityDropChance || [40, 35, 20, 5])
    
    if (artifactResult) {
      results.push({
        type: 'artifact',
        artifactId: artifactResult,
        rarity: artifactsData[artifactResult]?.rarete || 'commune'
      })
    } else {
      // Si aucun artefact disponible (tous obtenus), donner des œufs par défaut
      results.push({
        type: 'item',
        itemId: 'eggs',
        amount: 200
      })
    }
    
  } else if (selectedGroup.name === 'eggs_bonus') {
    // Groupe des œufs bonus - utiliser les items définis dans le groupe
    if (groupData && groupData.items) {
      const totalWeight = groupData.items.reduce((sum, item) => sum + (item.weight || 0), 0)
      if (totalWeight > 0) {
        let r = Math.random() * totalWeight
        let acc = 0
        for (const item of groupData.items) {
          acc += item.weight || 0
          if (r <= acc) {
            results.push({
              type: 'item',
              itemId: item.id,
              amount: item.amount
            })
            break
          }
        }
      }
    }
    
    // Fallback
    if (results.length === 0) {
      results.push({
        type: 'item',
        itemId: 'eggs',
        amount: 100
      })
    }
    
  } else {
    // Groupes de poules traditionnels
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

    const rarityChances = groupData?.rarityDropChance || [100, 0, 0, 0]
    for (let i = 0; i < quantity; i++) {
      const selectedChicken = selectChickenByRarity(availableChickens, rarityChances)
      if (selectedChicken) {
        results.push({
          type: 'chicken',
          chickenId: selectedChicken,
          groupName: selectedGroup.name,
          rarity: especeData[selectedChicken]?.rarete || 'commune'
        })
      }
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

// Fonction pour sélectionner un artefact en respectant les pourcentages de rareté originaux
function selectArtifactRespectingRarity(ownedArtifacts, rarityWeights = [40, 35, 20, 5]) {

  
  const rarityOrder = ['commune', 'rare', 'epique', 'legendaire']

  // Grouper les artefacts par rareté
  const artifactsByRarity = {
    commune: [],
    rare: [],
    epique: [],
    legendaire: []
  }

  for (const [artifactId, data] of Object.entries(artifactsData)) {
    const rarity = data.rarete || 'commune'
    if (artifactsByRarity[rarity]) {
      artifactsByRarity[rarity].push(artifactId)
    }
  }



  // Calculer les artefacts disponibles par rareté
  const availableByRarity = {}
  for (const rarity of rarityOrder) {
    availableByRarity[rarity] = artifactsByRarity[rarity].filter(id => !ownedArtifacts.includes(id))
  }
  


  // Utiliser les poids originaux (pas d'ajustement) pour respecter les pourcentages
  const totalWeight = rarityWeights.reduce((sum, weight) => sum + weight, 0)
  if (totalWeight === 0) return null

  // Roll pour déterminer la rareté avec les poids originaux
  let random = Math.random() * totalWeight
  let selectedRarityIndex = 0

  for (let i = 0; i < rarityWeights.length; i++) {
    random -= rarityWeights[i]
    if (random <= 0) {
      selectedRarityIndex = i
      break
    }
  }

  const selectedRarity = rarityOrder[selectedRarityIndex]
  const availableArtifacts = availableByRarity[selectedRarity]



  // Si aucun artefact disponible pour cette rareté, retourner null (donnera des œufs)
  if (availableArtifacts.length === 0) {
    return null
  }

  // Sélectionner un artefact aléatoire dans cette rareté
  const selectedArtifact = availableArtifacts[Math.floor(Math.random() * availableArtifacts.length)]
  
  return selectedArtifact
}