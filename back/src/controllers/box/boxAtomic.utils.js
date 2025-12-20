/**
 * Utilitaires pour les opérations atomiques sur les boîtes
 * Gère les retries et le traitement bulk des résultats
 */
import User from '../../models/User.js'
import { boxesData } from '../../data/sharedGameData.js'
import { simulateBoxOpening } from './boxSimulation.utils.js'
import { groupResults, processBulkResults, buildGroupedResponseResults } from './boxResults.utils.js'

/**
 * Exécute une opération atomique d'ouverture de boîte avec retry
 * @param {string} userId - ID de l'utilisateur
 * @param {number} boxId - ID de la boîte
 * @param {number} maxRetries - Nombre maximum de tentatives
 * @returns {Object} Résultat de l'ouverture
 */
export async function executeAtomicBoxOperation(userId, boxId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const user = await User.findById(userId)
      if (!user) throw new Error('Utilisateur introuvable')

      const box = boxesData.find(b => b.id === boxId)
      if (!box) throw new Error('Boîte introuvable')

      // Vérifier le niveau requis
      const playerLevel = user.experience?.level || 1
      if ((box.unlock_level || 1) > playerLevel) {
        throw new Error('Niveau insuffisant pour cette boîte')
      }

      // Vérification spéciale pour les boîtes d'artefacts
      if (box.category === 'artifacts' && playerLevel < 5) {
        throw new Error('Vous devez atteindre le niveau 5 pour ouvrir des boîtes d\'artefacts')
      }

      // Vérifier les ressources
      const resourceType = getResourceType(box.price.type)
      if (!resourceType) throw new Error('Type de ressource invalide')

      const playerResources = user.resources || {}
      const currentAmount = playerResources[resourceType] || 0

      if (currentAmount < box.price.count) {
        throw new Error(`Ressources insuffisantes (${currentAmount}/${box.price.count})`)
      }

      // Calculer les poules/artefacts déjà possédés
      const ownedChickens = (user.poulesPossedees || []).map(poule => poule.especeId)
      const ownedArtifacts = box.category === 'artifacts' 
        ? (user.artifacts || []).map(a => a.artifactId) 
        : []
      const isApocalypse = user.apocalypse || false

      // Simuler l'ouverture
      const results = simulateBoxOpening(box, ownedChickens, ownedArtifacts, isApocalypse)

      // Décrémenter le coût
      const costUpdate = await User.findByIdAndUpdate(
        userId,
        { $inc: { [`resources.${resourceType}`]: -box.price.count } },
        { new: true }
      )
      
      if (!costUpdate) throw new Error('Échec de la déduction du coût')

      // Traiter les résultats
      const groupedResults = groupResults(results)
      await processBulkResults(userId, groupedResults)

      // Préparer la réponse
      const responseResults = buildGroupedResponseResults(groupedResults, ownedChickens, ownedArtifacts)

      const updatedUser = await User.findById(userId)
      const newBalance = updatedUser.resources[resourceType]

      return {
        box: { id: box.id, name: box.name, cost: box.price },
        results: responseResults,
        newBalance: { [resourceType]: newBalance }
      }

    } catch (error) {
      if (error.name === 'VersionError' && attempt < maxRetries) {
        console.log(`⚠️ Conflit de version détecté lors de l'ouverture de boîte (tentative ${attempt}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, attempt * 100))
        continue
      }
      throw error
    }
  }
}

/**
 * Convertit un type de prix en clé de ressource
 */
function getResourceType(priceType) {
  const mapping = {
    'eggs': 'eggs',
    'stock_token': 'stock_token',
    'production_token': 'production_token',
    'chest_key': 'chest_key'
  }
  return mapping[priceType] || null
}
