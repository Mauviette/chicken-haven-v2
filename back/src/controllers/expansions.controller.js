import User from '../models/User.js'
import { expansionsData as SERVER_EXPANSIONS } from '../data/sharedGameData.js'

function getServerExpansion(id) {
  return SERVER_EXPANSIONS.find(e => e.id === id) || null
}

function canAffordExpansion(user, expansion, level) {
  const resources = user.resources || {}

  // Calculer le coût pour ce niveau
  const costIndex = level - 1
  if (costIndex < 0 || costIndex >= expansion.costs.length) {
    return false
  }

  const costs = expansion.costs[costIndex]

  for (const cost of costs) {
    const balance = Number(resources[cost.type] || 0)
    if (balance < cost.count) {
      return false
    }
  }

  return true
}

function deductExpansionCost(user, expansion, level) {
  const resources = user.resources || {}

  // Calculer le coût pour ce niveau
  const costIndex = level - 1
  const costs = expansion.costs[costIndex]

  for (const cost of costs) {
    resources[cost.type] = Number(resources[cost.type] || 0) - cost.count
  }

  user.resources = resources
}

function applyExpansionEffect(user, expansion, level) {
  // Calculer la récompense pour ce niveau
  const rewardIndex = level - 1
  const reward = expansion.rewards[rewardIndex]

  if (expansion.category === 'team') {
    user.team = user.team || { maxSlots: 1, slots: [] }
    user.team.maxSlots = reward

    // Étendre le tableau slots si nécessaire
    while (user.team.slots.length < reward) {
      user.team.slots.push({ especeId: null })
    }
  } else if (expansion.category === 'artifacts') {
    user.artifactSlots = user.artifactSlots || { slotsCount: 1, equipped: [] }
    user.artifactSlots.slotsCount = reward

    // Étendre le tableau equipped si nécessaire
    while (user.artifactSlots.equipped.length < reward) {
      user.artifactSlots.equipped.push(null)
    }
  }
}

export async function getExpansionLevels(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Les expansions sont stockées dans un champ séparé avec les niveaux
    const expansions = user.expansions || {}
    res.json({ success: true, expansions })
  } catch (err) {
    console.error('getExpansionLevels error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

export async function buyExpansion(req, res) {
  try {
    const { expansionId } = req.body || {}
    if (!expansionId || typeof expansionId !== 'string') {
      return res.status(400).json({ error: 'expansionId invalide' })
    }

    const serverExpansion = getServerExpansion(expansionId)
    if (!serverExpansion) {
      return res.status(404).json({ error: 'Expansion inconnue' })
    }

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Vérifier le niveau requis
    const playerLevel = user.experience?.level || 1
    if (playerLevel < (serverExpansion.unlock_level || 1)) {
      return res.status(400).json({ error: 'Niveau insuffisant' })
    }

    // Initialiser le champ expansions si nécessaire
    user.expansions = user.expansions || {}

    // Obtenir le niveau actuel (commence à 0 si pas acheté)
    const currentLevel = user.expansions[expansionId] || 0
    const nextLevel = currentLevel + 1

    // Vérifier si on peut encore améliorer (pas dépassé le nombre de niveaux disponibles)
    if (nextLevel > serverExpansion.costs.length) {
      return res.status(400).json({ error: 'Niveau maximum atteint' })
    }

    // Vérifier si on peut payer
    if (!canAffordExpansion(user, serverExpansion, nextLevel)) {
      return res.status(400).json({ error: 'Ressources insuffisantes' })
    }

    // Débiter le coût
    deductExpansionCost(user, serverExpansion, nextLevel)

    // Mettre à jour le niveau
    user.expansions[expansionId] = nextLevel
    try { user.markModified && user.markModified('expansions') } catch (_) {}

    // Appliquer l'effet
    applyExpansionEffect(user, serverExpansion, nextLevel)

    await user.save()

    res.json({
      success: true,
      expansionId,
      level: nextLevel,
      resources: user.resources,
      expansions: user.expansions,
      team: user.team,
      artifactSlots: user.artifactSlots
    })
  } catch (err) {
    console.error('buyExpansion error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}