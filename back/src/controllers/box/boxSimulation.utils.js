/**
 * Utilitaires pour la simulation d'ouverture de boîtes
 * Gère la sélection aléatoire de poules, artefacts et items
 */
import { especeData, groupes, artifactsData } from '../../data/sharedGameData.js'

/**
 * Simule l'ouverture d'une boîte avec probabilités
 * @param {Object} box - Configuration de la boîte
 * @param {Array} ownedChickens - IDs des poules déjà possédées
 * @param {Array} ownedArtifacts - IDs des artefacts déjà possédés
 * @param {boolean} isApocalypse - Mode apocalypse actif
 * @returns {Array} Liste des résultats
 */
export function simulateBoxOpening(box, ownedChickens, ownedArtifacts = [], isApocalypse = false) {
  const groups = Array.isArray(box.dropGroups) ? box.dropGroups : []
  if (!groups.length) return []

  // Sélectionner UN SEUL groupe en fonction des probabilités
  const candidates = groups.filter(g => Number(g.chance) > 0)
  const totalChance = candidates.reduce((sum, g) => sum + Number(g.chance || 0), 0)
  if (totalChance <= 0) return []

  let selectedGroup = selectGroupByChance(candidates, totalChance)
  const groupData = groupes.find(g => g.name === selectedGroup.name)
  const quantity = Math.max(1, Number(selectedGroup.quantity) || 1)
  const results = []

  // Traitement selon le type de groupe
  if (selectedGroup.name === 'artifacts') {
    const artifactResult = selectArtifactRespectingRarity(
      ownedArtifacts, 
      groupData?.rarityDropChance || [40, 35, 20, 5]
    )
    
    if (artifactResult) {
      results.push({
        type: 'artifact',
        artifactId: artifactResult,
        rarity: artifactsData[artifactResult]?.rarete || 'commune'
      })
    } else {
      results.push({ type: 'item', itemId: 'eggs', amount: 200 })
    }
    
  } else if (selectedGroup.name === 'eggs_bonus') {
    const itemResult = selectItemFromGroup(groupData)
    if (itemResult) {
      results.push(itemResult)
    } else {
      results.push({ type: 'item', itemId: 'eggs', amount: 100 })
    }
    
  } else {
    // Groupes de poules traditionnels
    let availableChickens = getAvailableChickensForGroup(selectedGroup.name, ownedChickens)
    
    if (!availableChickens.length) {
      // Fallback vers un autre groupe
      for (const g of candidates.sort((a, b) => Number(b.chance || 0) - Number(a.chance || 0))) {
        if (g === selectedGroup) continue
        const cand = getAvailableChickensForGroup(g.name, ownedChickens)
        if (cand.length) {
          selectedGroup = g
          availableChickens = cand
          break
        }
      }
    }

    if (!availableChickens.length) {
      // Fallback ultime
      for (const g of candidates) {
        availableChickens.push(...getAvailableChickensForGroup(g.name, ownedChickens))
      }
      if (!availableChickens.length) return []
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

  // Malédiction apocalypse : 20% de chance de tomate pourrie
  if (isApocalypse) {
    for (let i = 0; i < results.length; i++) {
      if (Math.random() < 0.20) {
        results[i] = { type: 'item', itemId: 'rotten_tomato', amount: 1 }
      }
    }
  }

  return results
}

/**
 * Sélectionne un groupe basé sur les chances
 */
function selectGroupByChance(candidates, totalChance) {
  let r = Math.random() * totalChance
  let acc = 0
  for (const g of candidates) {
    acc += Number(g.chance || 0)
    if (r <= acc) return g
  }
  return candidates[0]
}

/**
 * Retourne les poules disponibles pour un groupe
 */
function getAvailableChickensForGroup(groupName, ownedChickens) {
  return Object.keys(especeData)
    .filter(id => especeData[id].groupe === groupName)
    .filter(id => {
      if (especeData[id].groupe === 'fondamental') return true
      return ownedChickens.includes(id) || hasUnlockedGroup(groupName, ownedChickens)
    })
}

/**
 * Vérifie si un groupe est débloqué
 */
function hasUnlockedGroup(groupName, ownedChickens) {
  if (groupName === 'fondamental') return true
  
  const groupOrder = ['fondamental', 'brillant', 'discret', 'chic', 'secret']
  const targetIndex = groupOrder.indexOf(groupName)
  
  if (targetIndex === -1) return false
  
  for (let i = 0; i <= targetIndex; i++) {
    const hasChickenInGroup = ownedChickens.some(chickenId => 
      especeData[chickenId]?.groupe === groupOrder[i]
    )
    if (hasChickenInGroup) return true
  }
  
  return false
}

/**
 * Sélectionne un item depuis un groupe
 */
function selectItemFromGroup(groupData) {
  if (!groupData?.items) return null
  
  const totalWeight = groupData.items.reduce((sum, item) => sum + (item.weight || 0), 0)
  if (totalWeight <= 0) return null
  
  let r = Math.random() * totalWeight
  let acc = 0
  for (const item of groupData.items) {
    acc += item.weight || 0
    if (r <= acc) {
      return { type: 'item', itemId: item.id, amount: item.amount }
    }
  }
  return null
}

/**
 * Sélectionne une poule basée sur les probabilités de rareté
 */
function selectChickenByRarity(availableChickens, rarityChances) {
  const rarityOrder = ['commune', 'rare', 'epique', 'legendaire']
  const weightedChickens = []

  for (const chickenId of availableChickens) {
    const chicken = especeData[chickenId]
    const rarityIndex = rarityOrder.indexOf(chicken?.rarete || 'commune')
    const weight = rarityChances[rarityIndex] || 0

    for (let i = 0; i < weight; i++) {
      weightedChickens.push(chickenId)
    }
  }

  if (weightedChickens.length === 0) {
    return availableChickens[Math.floor(Math.random() * availableChickens.length)]
  }

  return weightedChickens[Math.floor(Math.random() * weightedChickens.length)]
}

/**
 * Sélectionne un artefact en respectant les pourcentages de rareté
 */
function selectArtifactRespectingRarity(ownedArtifacts, rarityWeights = [40, 35, 20, 5]) {
  const rarityOrder = ['commune', 'rare', 'epique', 'legendaire']

  const artifactsByRarity = { commune: [], rare: [], epique: [], legendaire: [] }

  for (const [artifactId, data] of Object.entries(artifactsData)) {
    const rarity = data.rarete || 'commune'
    if (artifactsByRarity[rarity]) {
      artifactsByRarity[rarity].push(artifactId)
    }
  }

  const availableByRarity = {}
  for (const rarity of rarityOrder) {
    availableByRarity[rarity] = artifactsByRarity[rarity].filter(id => !ownedArtifacts.includes(id))
  }

  const totalWeight = rarityWeights.reduce((sum, weight) => sum + weight, 0)
  if (totalWeight === 0) return null

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

  if (availableArtifacts.length === 0) return null

  return availableArtifacts[Math.floor(Math.random() * availableArtifacts.length)]
}

/**
 * Calcule les chances ajustées des artefacts pour l'affichage
 */
export function calculateAdjustedArtifactChances(ownedArtifacts) {
  const rarityOrder = ['commune', 'rare', 'epique', 'legendaire']
  const baseRarityWeights = [40, 35, 20, 5]

  const artifactsByRarity = { commune: [], rare: [], epique: [], legendaire: [] }

  for (const [artifactId, data] of Object.entries(artifactsData)) {
    const rarity = data.rarete || 'commune'
    if (artifactsByRarity[rarity]) {
      artifactsByRarity[rarity].push(artifactId)
    }
  }

  const availableByRarity = {}
  for (const rarity of rarityOrder) {
    availableByRarity[rarity] = artifactsByRarity[rarity].filter(id => !ownedArtifacts.includes(id))
  }

  const adjustedWeights = baseRarityWeights.map((weight, index) => {
    const rarity = rarityOrder[index]
    return availableByRarity[rarity].length > 0 ? weight : 0
  })

  const totalWeight = adjustedWeights.reduce((sum, weight) => sum + weight, 0)
  
  if (totalWeight === 0) return [0, 0, 0, 0]
  
  return adjustedWeights.map(weight => Math.round((weight / totalWeight) * 100))
}

/**
 * Ajuste les chances des groupes d'une boîte pour l'affichage
 */
export function calculateAdjustedBoxChances(box, ownedArtifacts) {
  const artifactsGroupIndex = box.dropGroups.findIndex(group => group.name === 'artifacts')
  if (artifactsGroupIndex === -1) return box

  const rarityOrder = ['commune', 'rare', 'epique', 'legendaire']
  const baseRarityWeights = [40, 35, 20, 5]

  const artifactsByRarity = { commune: [], rare: [], epique: [], legendaire: [] }

  for (const [artifactId, data] of Object.entries(artifactsData)) {
    const rarity = data.rarete || 'commune'
    if (artifactsByRarity[rarity]) {
      artifactsByRarity[rarity].push(artifactId)
    }
  }

  const availableByRarity = {}
  for (const rarity of rarityOrder) {
    availableByRarity[rarity] = artifactsByRarity[rarity].filter(id => !ownedArtifacts.includes(id))
  }

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

  const originalArtifactsChance = box.dropGroups[artifactsGroupIndex].chance
  const adjustedArtifactsChance = originalArtifactsChance * totalAvailableProbability

  const adjustedGroups = box.dropGroups.map((group, index) => {
    if (index === artifactsGroupIndex) {
      return { ...group, chance: adjustedArtifactsChance }
    } else if (group.name === 'eggs_bonus') {
      const redistribution = originalArtifactsChance - adjustedArtifactsChance
      return { ...group, chance: group.chance + redistribution }
    }
    return group
  })

  return { ...box, dropGroups: adjustedGroups }
}
