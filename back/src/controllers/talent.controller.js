import User from '../models/User.js'
import { especeData, talentsData, talentLevelUpgradeCost } from '../data/sharedGameData.js'
import { updateAchievementProgress, triggerAchievementCheck } from './achievements.controller.js'
import { updateQuestProgress } from './quests.controller.js'

function getTalentForEspece(especeId) {
  const e = especeData[especeId]
  return e?.talent || null
}

function getCostForNextLevel(poule) {
  const talentName = getTalentForEspece(poule.especeId)
  if (!talentName) return null
  const tInfo = talentsData[talentName] || {}
  // Utiliser la rareté de la poule au lieu de nivType
  const rarete = especeData[poule.especeId]?.rarete || 'commune'
  const rules = talentLevelUpgradeCost[rarete]
  if (!rules) return null
  const current = Number(poule.niveauTalent || 1)
  const nextLevel = current + 1
  if (rules.limit && nextLevel > rules.limit) return { maxed: true }
  const egg = rules.egg_cost?.[current - 1] ?? null
  const chicken = rules.chicken_cost?.[current - 1] ?? null
  if (egg == null || chicken == null) return null
  return { egg_cost: Number(egg), chicken_cost: Number(chicken) }
}

export async function upgradeTalent(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { especeId } = req.body || {}
    if (!especeId) return res.status(400).json({ error: 'especeId requis' })

    const poule = (user.poulesPossedees || []).find(p => p.especeId === especeId)
    if (!poule) return res.status(404).json({ error: 'Poule non trouvée' })

    // Règles de coûts selon le type de talent
    const cost = getCostForNextLevel(poule)
    if (!cost) return res.status(400).json({ error: 'Coût indisponible' })
    if (cost.maxed) return res.status(400).json({ error: 'Niveau de talent maximum atteint' })

    // Vérifs ressources: oeufs et poules
    const eggs = Number(user.resources?.eggs || 0)
    const qty = Number(poule.quantite || 0)
    const neededChickens = Number(cost.chicken_cost || 0)
    if (eggs < cost.egg_cost) return res.status(400).json({ error: 'Œufs insuffisants' })
    if (qty < neededChickens) return res.status(400).json({ error: 'Poules insuffisantes' })

    // Déductions et upgrade
    user.resources.eggs = eggs - Number(cost.egg_cost)
    poule.quantite = Math.max(0, qty - neededChickens) // Garder la poule même si quantité = 0
    poule.niveauTalent = Number(poule.niveauTalent || 1) + 1

    await user.save()

    // Mettre à jour les succès pour le niveau de talent atteint
    const newLevel = poule.niveauTalent
    try {
      // Déclencher une vérification complète des succès (inclut talent_level)
      await triggerAchievementCheck(req.userId)
      
      // Mettre à jour le progrès des quêtes
      await updateQuestProgress(req.userId, 'talent_level_reached', newLevel)
    } catch (achievementError) {
      console.warn('Erreur mise à jour succès talent:', achievementError)
    }

    // Calculer prochain coût pour l'UI
    const nextCost = getCostForNextLevel(poule)

    return res.json({
      success: true,
      poule: { especeId: poule.especeId, quantite: poule.quantite, niveauTalent: poule.niveauTalent },
      resources: user.resources,
      nextCost: nextCost && !nextCost.maxed ? nextCost : null,
      maxed: !!(nextCost && nextCost.maxed)
    })
  } catch (err) {
    console.error('upgradeTalent error:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
