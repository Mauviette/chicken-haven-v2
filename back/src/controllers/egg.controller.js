import User from '../models/User.js'

// GET /api/egg/status - Récupère le statut actuel de l'œuf cliquable
export async function getEggStatus(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Initialiser clickableEgg si nécessaire
    if (!user.clickableEgg) {
      user.clickableEgg = {
        lastClick: new Date(),
        income: 1,
        maxIncome: 30,
        currentStocked: 0
      }
      await user.save()
    }

    // Si lastClick n'est pas défini ou est une fonction, l'initialiser
    if (!user.clickableEgg.lastClick || typeof user.clickableEgg.lastClick === 'function') {
      user.clickableEgg.lastClick = new Date()
      await user.save()
    }

    const now = new Date()
    const lastClick = user.clickableEgg.lastClick
    const income = user.clickableEgg.income || 1
    const maxIncome = user.clickableEgg.maxIncome || 30
    
    console.log('DEBUG - getEggStatus:')
    console.log('  now:', now)
    console.log('  lastClick:', lastClick)
    console.log('  income:', income)
    console.log('  maxIncome:', maxIncome)

    // Calculer les gains actuels basés sur le temps écoulé
    const timeDiffSeconds = Math.floor((now - lastClick) / 1000)
    const currentStocked = Math.min(timeDiffSeconds * income, maxIncome)
    
    console.log('  timeDiffSeconds:', timeDiffSeconds)
    console.log('  currentStocked:', currentStocked)

    res.json({
      income,
      maxIncome,
      currentStocked,
      lastClick,
      totalEggs: user.resources?.eggs || 0
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/egg/click - Gère le clic sur l'œuf
export async function clickEgg(req, res) {
  try {
    const user = await User.findById(req.userId) 
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const now = new Date()
    const lastClick = user.clickableEgg?.lastClick
    const income = user.clickableEgg?.income
    const maxIncome = user.clickableEgg?.maxIncome

    if (lastClick == null || income == null || maxIncome == null) return res.status(404).json({ error: 'Données incomplètes' })
    
    // Calculer les gains actuels
    const timeDiffSeconds = Math.floor((now - lastClick) / 1000)
    const currentStocked = Math.min(timeDiffSeconds * income, maxIncome)

    // Vérifier si l'œuf est cliquable (income >= 1)
    if (income < 1) {
      return res.status(400).json({ error: 'Income insuffisant pour cliquer' })
    }

    // Vérifier s'il y a des gains à collecter
    if (currentStocked < 1) {
      return res.status(400).json({ error: 'Pas assez de gains à collecter' })
    }

    // Mettre à jour les ressources et réinitialiser le timer
    const currentEggs = user.resources?.eggs || 0
    user.resources = user.resources || {}
    user.resources.eggs = currentEggs + Math.floor(currentStocked)
    
    user.clickableEgg = user.clickableEgg || {}
    user.clickableEgg.lastClick = now
    user.clickableEgg.income = income
    user.clickableEgg.maxIncome = maxIncome
    user.clickableEgg.currentStocked = 0

    await user.save()

    res.json({
      message: 'Œuf cliqué avec succès',
      eggsGained: Math.floor(currentStocked),
      totalEggs: user.resources.eggs,
      income,
      maxIncome,
      currentStocked: 0,
      lastClick: now
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}