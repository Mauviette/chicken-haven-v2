/**
 * Utilitaires pour le groupage et le traitement des résultats de boîtes
 */
import User from '../../models/User.js'
import { especeData, artifactsData } from '../../data/sharedGameData.js'

/**
 * Groupe les résultats par type et identifiant
 * @param {Array} results - Liste des résultats bruts
 * @returns {Object} Résultats groupés { chickens, artifacts, items }
 */
export function groupResults(results) {
  const grouped = {
    chickens: new Map(),
    artifacts: new Set(),
    items: new Map()
  }

  for (const result of results) {
    if (result.type === 'chicken') {
      const key = result.chickenId
      if (!grouped.chickens.has(key)) {
        grouped.chickens.set(key, {
          count: 0,
          groupName: result.groupName,
          rarity: result.rarity
        })
      }
      grouped.chickens.get(key).count++
    } else if (result.type === 'artifact') {
      grouped.artifacts.add(result.artifactId)
    } else if (result.type === 'item') {
      const key = result.itemId
      grouped.items.set(key, (grouped.items.get(key) || 0) + result.amount)
    }
  }

  return grouped
}

/**
 * Traite tous les résultats en opérations bulk optimisées
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} groupedResults - Résultats groupés
 */
export async function processBulkResults(userId, groupedResults) {
  const bulkOps = []

  // Traiter les poules
  if (groupedResults.chickens.size > 0) {
    const user = await User.findById(userId)
    const existingChickens = new Map(
      (user.poulesPossedees || []).map(p => [p.especeId, p])
    )

    const chickensToIncrement = []
    const chickensToAdd = []

    for (const [especeId, data] of groupedResults.chickens) {
      if (existingChickens.has(especeId)) {
        chickensToIncrement.push({ especeId, increment: data.count })
      } else {
        chickensToAdd.push({
          especeId,
          quantite: data.count,
          niveauTalent: 1,
          new: true
        })
      }
    }

    for (const { especeId, increment } of chickensToIncrement) {
      bulkOps.push({
        updateOne: {
          filter: { _id: userId, 'poulesPossedees.especeId': especeId },
          update: { $inc: { 'poulesPossedees.$.quantite': increment } }
        }
      })
    }

    if (chickensToAdd.length > 0) {
      bulkOps.push({
        updateOne: {
          filter: { _id: userId },
          update: { $push: { poulesPossedees: { $each: chickensToAdd } } }
        }
      })
    }
  }

  // Traiter les artefacts
  if (groupedResults.artifacts.size > 0) {
    const artifactsToAdd = Array.from(groupedResults.artifacts).map(artifactId => ({ artifactId }))
    bulkOps.push({
      updateOne: {
        filter: { _id: userId },
        update: { $addToSet: { artifacts: { $each: artifactsToAdd } } }
      }
    })
  }

  // Traiter les items
  for (const [itemId, amount] of groupedResults.items) {
    bulkOps.push({
      updateOne: {
        filter: { _id: userId },
        update: { $inc: { [`resources.${itemId}`]: amount } }
      }
    })
  }

  if (bulkOps.length > 0) {
    await User.bulkWrite(bulkOps, { ordered: true })
  }
}

/**
 * Construit les résultats de réponse groupés pour le frontend
 * @param {Object} groupedResults - Résultats groupés
 * @param {Array} ownedChickens - IDs des poules déjà possédées
 * @param {Array} ownedArtifacts - IDs des artefacts déjà possédés
 * @returns {Array} Résultats formatés pour la réponse
 */
export function buildGroupedResponseResults(groupedResults, ownedChickens, ownedArtifacts) {
  const responseResults = []

  // Poules groupées
  for (const [especeId, data] of groupedResults.chickens) {
    const chickenData = especeData[especeId]
    responseResults.push({
      type: 'chicken',
      especeId: especeId,
      nom: chickenData?.nom || especeId,
      rarete: chickenData?.rarete || 'commune',
      groupe: data.groupName,
      count: data.count,
      isNew: !ownedChickens.includes(especeId)
    })
  }

  // Artefacts
  for (const artifactId of groupedResults.artifacts) {
    const artifactData = artifactsData[artifactId]
    responseResults.push({
      type: 'artifact',
      artifactId: artifactId,
      name: artifactData?.name || artifactId,
      icon: artifactData?.icon || '❖',
      rarete: artifactData?.rarete || 'commune',
      description: artifactData?.description || '',
      count: 1,
      isNew: !ownedArtifacts.includes(artifactId)
    })
  }

  // Items groupés
  for (const [itemId, amount] of groupedResults.items) {
    responseResults.push({
      type: 'item',
      itemId: itemId,
      amount: amount,
      count: 1
    })
  }

  return responseResults
}
