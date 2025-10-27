import User from '../models/User.js'
import { upgradesData as SERVER_UPGRADES } from '../data/sharedGameData.js'

function getServerUpgrade(id) {
  return SERVER_UPGRADES.find(u => u.id === Number(id)) || null
}

function getCurrentCostForLevel(upgrade, currentLevel) {
  if (!upgrade) return Infinity
  const costs = Array.isArray(upgrade.costs) ? upgrade.costs : []
  if (costs.length === 0) return Infinity
  // Pour les améliorations infinies, toujours utiliser le prix le plus élevé
  return Math.max(...costs)
}

export async function getUpgradeLevels(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const levels = user.upgrades || {}
    res.json({ success: true, upgrades: levels })
  } catch (err) {
    console.error('getUpgradeLevels error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

export async function buyUpgrade(req, res) {
  try {
    const { upgradeId } = req.body || {}
    const uId = Number(upgradeId)
    if (!Number.isFinite(uId)) return res.status(400).json({ error: 'upgradeId invalide' })

    const serverUpgrade = getServerUpgrade(uId)
    if (!serverUpgrade) return res.status(404).json({ error: 'Amélioration inconnue' })

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    user.upgrades = user.upgrades || {}
    const currentLevel = Number(user.upgrades[uId] || 0)
    let price = getCurrentCostForLevel(serverUpgrade, currentLevel)

    // Mode Apocalypse : multiplier les prix par 2
    if (user.apocalypse) {
      price = Math.floor(price * 2)
    }

    // Vérifier solde
    const priceType = serverUpgrade.priceType
    const resources = user.resources || {}
    const balances = {
      stock_token: Number(resources.stock_token || 0),
      production_token: Number(resources.production_token || 0),
      wild_token: Number(resources.wild_token || 0),
      eggs: Number(resources.eggs || 0)
    }

    if (!['stock_token', 'production_token', 'wild_token', 'eggs'].includes(priceType)) {
      return res.status(400).json({ error: 'Type de prix non supporté' })
    }

    if (balances[priceType] < price) {
      return res.status(400).json({ error: 'Ressources insuffisantes' })
    }

    // Débiter
    balances[priceType] -= price
    user.resources.stock_token = balances.stock_token
    user.resources.production_token = balances.production_token
    user.resources.wild_token = balances.wild_token
    user.resources.eggs = balances.eggs

    // Incrémenter niveau
    const newLevel = currentLevel + 1
    user.upgrades[uId] = newLevel
  // Important: upgrades est de type Mixed -> il faut marquer le chemin comme modifié
  try { user.markModified && user.markModified('upgrades') } catch (_) {}

    // Appliquer l'effet associé à ce niveau (si défini)
    try {
      const rewardArray = Array.isArray(serverUpgrade.rewards) ? serverUpgrade.rewards : []
      const rewardVal = rewardArray.length
        ? (newLevel - 1 < rewardArray.length ? rewardArray[newLevel - 1] : rewardArray[rewardArray.length - 1])
        : 0
      const eff = serverUpgrade.effect || null
      if (eff && rewardVal) {
        if (eff.target === 'clickableEgg.maxIncome') {
          user.clickableEgg = user.clickableEgg || { income: 1, maxIncome: 10, currentStocked: 0 }
          user.clickableEgg.maxIncome = Number(user.clickableEgg.maxIncome || 0) + Number(rewardVal)
        } else if (eff.target === 'clickableEgg.income') {
          user.clickableEgg = user.clickableEgg || { income: 1, maxIncome: 10, currentStocked: 0 }
          user.clickableEgg.income = Number(user.clickableEgg.income || 0) + Number(rewardVal)
        }
      }
    } catch (e) {
      console.warn('apply upgrade effect failed:', e)
    }

    await user.save()

    res.json({
      success: true,
      upgradeId: uId,
      newLevel: user.upgrades[uId],
      resources: user.resources,
      upgrades: user.upgrades || {},
      clickableEgg: {
        income: user.clickableEgg?.income || 0,
        maxIncome: user.clickableEgg?.maxIncome || 0,
      }
    })
  } catch (err) {
    console.error('buyUpgrade error:', err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}
