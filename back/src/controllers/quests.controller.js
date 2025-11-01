import User from '../models/User.js'
import { questsData, especeData } from '../data/sharedGameData.js'

// GET /api/quests/status - Récupère le statut des quêtes du joueur
export async function getQuestsStatus(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    // Initialiser les quêtes si nécessaire
    if (!user.quests || typeof user.quests !== 'object') {
      user.quests = {
        activeQuest: null,
        completedQuests: [],
        questProgress: {}
      }
      await user.save()
    }

    // Filtrer les quêtes disponibles selon le niveau du joueur
    const availableQuests = Object.values(questsData).filter(quest =>
      user.experience?.level >= quest.unlock_level
    ).map(quest => ({
      id: quest.id,
      nom: quest.nom,
      description: quest.description,
      icon: quest.icon,
      unlock_level: quest.unlock_level,
      steps: quest.steps.map(step => ({
        id: step.id,
        description: step.description,
        challenges: step.challenges,
        reward: step.reward.type === 'chicken' && !user.poulesPossedees?.some(p => p.especeId === step.reward.especeId)
          ? { ...step.reward, secret: true }
          : step.reward
      }))
    }))

    res.json({
      availableQuests,
      activeQuest: user.quests.activeQuest,
      completedQuests: user.quests.completedQuests || [],
      questProgress: user.quests.questProgress || {}
    })
  } catch (error) {
    console.error('Erreur getQuestsStatus:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/quests/accept/:questId - Accepter une quête
export async function acceptQuest(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { questId } = req.params
    const quest = questsData[questId]

    if (!quest) {
      return res.status(400).json({ error: 'Quête inexistante' })
    }

    // Vérifier le niveau requis
    if (user.experience?.level < quest.unlock_level) {
      return res.status(400).json({ error: 'Niveau insuffisant pour cette quête' })
    }

    // Vérifier qu'aucune quête n'est active
    if (user.quests?.activeQuest) {
      return res.status(400).json({ error: 'Une quête est déjà en cours' })
    }

    // Vérifier que la quête n'est pas déjà complétée
    if (user.quests?.completedQuests?.includes(questId)) {
      return res.status(400).json({ error: 'Quête déjà complétée' })
    }

    // Vérifier si la quête a été abandonnée précédemment et restaurer l'étape
    if (user.quests?.abandonedQuests?.[questId]) {
      const abandonedData = user.quests.abandonedQuests[questId]
      
      // Restaurer seulement l'étape actuelle, pas la progression des objectifs
      user.quests.questProgress = user.quests.questProgress || {}
      user.quests.initialValues = user.quests.initialValues || {}
      user.quests.questProgress[questId] = {}
      
      // Recalculer les valeurs initiales pour la reprise
      const initialValues = {}
      quest.steps.forEach(step => {
        step.challenges.forEach(challenge => {
          if (!initialValues[challenge.type]) {
            // Calculer la valeur initiale selon le type de défi
            switch (challenge.type) {
              case 'eggs_collected':
                initialValues[challenge.type] = user.resources?.eggs || 0
                break
              case 'chickens_owned':
                const totalChickens = user.poulesPossedees?.reduce((sum, p) => sum + (p.quantite || 0), 0) || 0
                initialValues[challenge.type] = totalChickens
                break
              case 'boxes_opened':
                initialValues[challenge.type] = user.achievements?.progress?.totalBoxesOpened || 0
                break
              case 'talent_level_reached':
                const maxTalentLevel = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
                initialValues[challenge.type] = maxTalentLevel
                break
              case 'mining_games_played':
                initialValues[challenge.type] = user.achievements?.progress?.miningGamesPlayed || 0
                break
              case 'mining_cells_broken':
                initialValues[challenge.type] = user.achievements?.progress?.miningCellsBroken || 0
                break
              case 'mining_artifacts_found':
                initialValues[challenge.type] = user.achievements?.progress?.miningArtifactsFound || 0
                break
              case 'max_eggs_in_click':
                initialValues[challenge.type] = user.achievements?.progress?.maxEggsInOneClick || 0
                break
              case 'spawnables_clicked':
                initialValues[challenge.type] = user.achievements?.progress?.spawnablesClicked || 0
                break
              case 'chicken_abilities_used':
                initialValues[challenge.type] = user.achievements?.progress?.chickenAbilitiesUsed || 0
                break
              case 'chicken_gifts_collected':
                initialValues[challenge.type] = user.achievements?.progress?.chickenGiftsCollected || 0
                break
              case 'chicken_rarity_found':
                // Pour les challenges de rareté, calculer le nombre initial de poules de cette rareté
                const targetRarity = challenge.rarity
                const initialRarityKey = `chicken_rarity_found_${targetRarity}`
                const initialChickensFound = (user.poulesPossedees || [])
                  .filter(poule => {
                    const chickenData = especeData[poule.especeId]
                    return chickenData && chickenData.rarete === targetRarity
                  })
                  .reduce((sum, poule) => sum + (poule.quantite || 0), 0)
                initialValues[initialRarityKey] = initialChickensFound
                break
              default:
                initialValues[challenge.type] = 0
            }
          }
        })
      })
      
      user.quests.initialValues[questId] = initialValues
      
      // Initialiser le progrès pour chaque étape, en marquant comme réclamées les étapes précédentes
      const startStepIndex = abandonedData.currentStepIndex || 0
      quest.steps.forEach((step, index) => {
        user.quests.questProgress[questId][step.id] = {}
        step.challenges.forEach(challenge => {
          user.quests.questProgress[questId][step.id][challenge.type] = 0
        })
        
        // Marquer les étapes précédentes comme réclamées
        if (index < startStepIndex) {
          user.quests.questProgress[questId][step.id].rewardClaimed = true
        }
      })
      
      // Supprimer de la liste des quêtes abandonnées
      delete user.quests.abandonedQuests[questId]
      
      // Définir comme quête active
      user.quests.activeQuest = questId
      
      user.markModified('quests')
      await user.save()

      return res.json({
        success: true,
        activeQuest: questId,
        questProgress: user.quests.questProgress[questId],
        resumed: true,
        resumedFromStep: startStepIndex + 1
      })
    }

    // Initialiser les quêtes si nécessaire
    if (!user.quests || typeof user.quests !== 'object') {
      user.quests = {
        activeQuest: null,
        completedQuests: [],
        questProgress: {}
      }
    }

    // Initialiser le progrès de la quête
    user.quests.activeQuest = questId
    user.quests.questProgress = user.quests.questProgress || {}
    user.quests.initialValues = user.quests.initialValues || {}
    user.quests.questProgress[questId] = {}

    // Calculer les valeurs initiales pour la première étape seulement
    const firstStep = quest.steps[0]
    const initialValues = {}
    firstStep.challenges.forEach(challenge => {
      if (!initialValues[challenge.type]) {
        // Les valeurs initiales sont toujours 0 pour commencer à compter depuis l'acceptation
        switch (challenge.type) {
          case 'chicken_rarity_found':
            // Pour les challenges de rareté, utiliser une clé unique
            const targetRarity = challenge.rarity
            const initialRarityKey = `chicken_rarity_found_${targetRarity}`
            initialValues[initialRarityKey] = 0
            break
          default:
            initialValues[challenge.type] = 0
        }
      }
    })

    if (!user.quests.initialValues[questId]) {
      user.quests.initialValues[questId] = {}
    }
    user.quests.initialValues[questId][firstStep.id] = initialValues

    user.markModified('quests')
    await user.save()

    res.json({
      success: true,
      activeQuest: questId,
      questProgress: user.quests.questProgress[questId]
    })
  } catch (error) {
    console.error('Erreur acceptQuest:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/quests/abandon - Abandonner la quête active
export async function abandonQuest(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (!user.quests?.activeQuest) {
      return res.status(400).json({ error: 'Aucune quête active' })
    }

    const questId = user.quests.activeQuest
    const quest = questsData[questId]

    // Initialiser abandonedQuests si nécessaire
    if (!user.quests.abandonedQuests) {
      user.quests.abandonedQuests = {}
    }

    // Trouver l'étape actuelle (la première qui n'a pas eu sa récompense réclamée)
    let currentStepIndex = 0
    if (user.quests.questProgress?.[questId]) {
      for (let i = 0; i < quest.steps.length; i++) {
        const stepProgress = user.quests.questProgress[questId][quest.steps[i].id]
        if (!stepProgress?.rewardClaimed) {
          currentStepIndex = i
          break
        }
      }
    }

    // Sauvegarder seulement l'étape actuelle, pas la progression des objectifs
    user.quests.abandonedQuests[questId] = {
      currentStepIndex: currentStepIndex,
      lastAbandoned: new Date()
    }

    // Remettre à zéro tous les compteurs d'achievements utilisés dans la quête
    quest.steps.forEach(step => {
      step.challenges.forEach(challenge => {
        switch (challenge.type) {
          case 'eggs_collected':
            // Les œufs ne sont pas remis à zéro car c'est une ressource du joueur
            break
          case 'chickens_owned':
            // Les poules possédées ne sont pas remises à zéro
            break
          case 'boxes_opened':
            if (user.achievements?.progress) {
              user.achievements.progress.totalBoxesOpened = 0
            }
            break
          case 'talent_level_reached':
            // Le niveau de talent max ne peut pas être remis à zéro
            break
          case 'mining_games_played':
            if (user.achievements?.progress) {
              user.achievements.progress.miningGamesPlayed = 0
            }
            break
          case 'mining_cells_broken':
            if (user.achievements?.progress) {
              user.achievements.progress.miningCellsBroken = 0
            }
            break
          case 'mining_artifacts_found':
            if (user.achievements?.progress) {
              user.achievements.progress.miningArtifactsFound = 0
            }
            break
          case 'max_eggs_in_click':
            if (user.achievements?.progress) {
              user.achievements.progress.maxEggsInOneClick = 0
            }
            break
          case 'spawnables_clicked':
            if (user.achievements?.progress) {
              user.achievements.progress.spawnablesClicked = 0
            }
            break
          case 'chicken_abilities_used':
            if (user.achievements?.progress) {
              user.achievements.progress.chickenAbilitiesUsed = 0
            }
            break
          case 'chicken_gifts_collected':
            if (user.achievements?.progress) {
              user.achievements.progress.chickenGiftsCollected = 0
            }
            break
          case 'chicken_rarity_found':
            // Pour les raretés, on ne remet pas à zéro car c'est le nombre de poules possédées
            break
        }
      })
    })

    // Supprimer complètement le progrès actif
    if (user.quests.questProgress && user.quests.questProgress[questId]) {
      delete user.quests.questProgress[questId]
    }

    // Supprimer les valeurs initiales actives
    if (user.quests.initialValues && user.quests.initialValues[questId]) {
      delete user.quests.initialValues[questId]
    }

    user.quests.activeQuest = null
    user.markModified('quests')
    user.markModified('achievements')
    await user.save()

    res.json({
      success: true,
      abandonedQuest: questId,
      currentStepIndex: currentStepIndex,
      progressSaved: true
    })
  } catch (error) {
    console.error('Erreur abandonQuest:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/quests/claim-step/:stepId - Réclamer la récompense d'une étape
export async function claimStepReward(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { stepId } = req.params

    if (!user.quests?.activeQuest) {
      return res.status(400).json({ error: 'Aucune quête active' })
    }

    const questId = user.quests.activeQuest
    const quest = questsData[questId]

    if (!quest) {
      return res.status(400).json({ error: 'Quête invalide' })
    }

    const step = quest.steps.find(s => s.id === stepId)
    if (!step) {
      return res.status(400).json({ error: 'Étape inexistante' })
    }

    // Vérifier que l'étape est complétée
    const stepProgress = user.quests.questProgress?.[questId]?.[stepId]
    if (!stepProgress) {
      return res.status(400).json({ error: 'Étape non trouvée dans le progrès' })
    }

    const isCompleted = step.challenges.every(challenge => {
      let progressKey = challenge.type
      if (challenge.type === 'chicken_rarity_found' && challenge.rarity) {
        progressKey = `chicken_rarity_found_${challenge.rarity}`
      }
      const currentValue = stepProgress[progressKey] || 0
      return currentValue >= challenge.objectif
    })

    if (!isCompleted) {
      return res.status(400).json({ error: 'Étape non complétée' })
    }

    // Vérifier que la récompense n'a pas déjà été réclamée
    if (stepProgress.rewardClaimed) {
      return res.status(400).json({ error: 'Récompense déjà réclamée' })
    }

    // VÉRIFICATION DE L'ORDRE : S'assurer que toutes les étapes précédentes ont été réclamées
    const stepIndex = quest.steps.findIndex(s => s.id === stepId)
    for (let i = 0; i < stepIndex; i++) {
      const prevStep = quest.steps[i]
      const prevStepProgress = user.quests.questProgress?.[questId]?.[prevStep.id]
      if (!prevStepProgress?.rewardClaimed) {
        return res.status(400).json({ 
          error: `Vous devez d'abord réclamer la récompense de l'étape ${i + 1} avant de pouvoir réclamer celle-ci.` 
        })
      }
    }

    // Appliquer la récompense
    const reward = step.reward
    if (reward.type === 'eggs') {
      user.resources.eggs = (user.resources.eggs || 0) + reward.quantite
    } else if (reward.type === 'stock_token') {
      user.resources.stock_token = (user.resources.stock_token || 0) + reward.quantite
    } else if (reward.type === 'production_token') {
      user.resources.production_token = (user.resources.production_token || 0) + reward.quantite
    } else if (reward.type === 'mining_token') {
      user.resources.mining_token = (user.resources.mining_token || 0) + reward.quantite
    } else if (reward.type === 'chest_key') {
      user.resources.chest_key = (user.resources.chest_key || 0) + reward.quantite
    } else if (reward.type === 'precious_stone') {
      user.resources.precious_stone = (user.resources.precious_stone || 0) + reward.quantite
    } else if (reward.type === 'blueberry') {
      // Les myrtilles donnent de l'XP
      user.experience = user.experience || { level: 1, points: 0, required_points: 2 }
      user.experience.points = (user.experience.points || 0) + reward.quantite

      // Calcul du level-up
      let lvl = user.experience.level || 1
      let pts = user.experience.points || 0
      while (pts >= lvl * 2) {
        pts -= lvl * 2
        lvl += 1
      }
      user.experience.level = lvl
      user.experience.points = pts
      user.experience.required_points = lvl * 2
    } else if (reward.type === 'chicken') {
      // Récompense de poule
      const poules = user.poulesPossedees || []
      const existing = poules.find(p => p.especeId === reward.especeId)
      if (existing) {
        existing.quantite += reward.quantite
      } else {
        poules.push({
          especeId: reward.especeId,
          quantite: reward.quantite,
          niveauTalent: 1,
          new: true
        })
      }
      user.poulesPossedees = poules
    }

    // Marquer la récompense comme réclamée
    stepProgress.rewardClaimed = true
    user.markModified('quests')
    await user.save()

    // Vérifier automatiquement si la quête est maintenant terminée
    const allStepsClaimed = quest.steps.every(step => {
      const stepProgressCheck = user.quests.questProgress?.[questId]?.[step.id]
      return stepProgressCheck?.rewardClaimed === true
    })

    let questCompleted = false
    if (allStepsClaimed) {
      questCompleted = true

      // Remettre à zéro tous les compteurs d'achievements utilisés dans la quête
      quest.steps.forEach(step => {
        step.challenges.forEach(challenge => {
          switch (challenge.type) {
            case 'eggs_collected':
              // Les œufs ne sont pas remis à zéro car c'est une ressource du joueur
              break
            case 'chickens_owned':
              // Les poules possédées ne sont pas remises à zéro
              break
            case 'boxes_opened':
              if (user.achievements?.progress) {
                user.achievements.progress.totalBoxesOpened = 0
              }
              break
            case 'talent_level_reached':
              // Le niveau de talent max ne peut pas être remis à zéro
              break
            case 'mining_games_played':
              if (user.achievements?.progress) {
                user.achievements.progress.miningGamesPlayed = 0
              }
              break
            case 'mining_cells_broken':
              if (user.achievements?.progress) {
                user.achievements.progress.miningCellsBroken = 0
              }
              break
            case 'mining_artifacts_found':
              if (user.achievements?.progress) {
                user.achievements.progress.miningArtifactsFound = 0
              }
              break
            case 'max_eggs_in_click':
              if (user.achievements?.progress) {
                user.achievements.progress.maxEggsInOneClick = 0
              }
              break
            case 'spawnables_clicked':
              if (user.achievements?.progress) {
                user.achievements.progress.spawnablesClicked = 0
              }
              break
            case 'chicken_abilities_used':
              if (user.achievements?.progress) {
                user.achievements.progress.chickenAbilitiesUsed = 0
              }
              break
            case 'chicken_gifts_collected':
              if (user.achievements?.progress) {
                user.achievements.progress.chickenGiftsCollected = 0
              }
              break
            case 'chicken_rarity_found':
              // Pour les raretés, on ne remet pas à zéro car c'est le nombre de poules possédées
              break
          }
        })
      })

      user.quests.completedQuests = user.quests.completedQuests || []
      if (!user.quests.completedQuests.includes(questId)) {
        user.quests.completedQuests.push(questId)
      }
      user.quests.activeQuest = null

      // Nettoyer le progrès
      if (user.quests.questProgress && user.quests.questProgress[questId]) {
        delete user.quests.questProgress[questId]
      }

      user.markModified('quests')
      user.markModified('achievements')
      await user.save()
    } else {
      // Calculer les valeurs initiales pour l'étape suivante
      const currentStepIndex = quest.steps.findIndex(s => s.id === stepId)
      const nextStepIndex = currentStepIndex + 1
      if (nextStepIndex < quest.steps.length) {
        const nextStep = quest.steps[nextStepIndex]
        const nextStepInitialValues = {}

        nextStep.challenges.forEach(challenge => {
          if (!nextStepInitialValues[challenge.type]) {
            // Les valeurs initiales sont toujours 0 pour commencer à compter depuis le début de l'étape
            switch (challenge.type) {
              case 'chicken_rarity_found':
                // Pour les challenges de rareté, utiliser une clé unique
                const targetRarity = challenge.rarity
                const initialRarityKey = `chicken_rarity_found_${targetRarity}`
                nextStepInitialValues[initialRarityKey] = 0
                break
              default:
                nextStepInitialValues[challenge.type] = 0
            }
          }
        })

        if (!user.quests.initialValues[questId]) {
          user.quests.initialValues[questId] = {}
        }
        user.quests.initialValues[questId][nextStep.id] = nextStepInitialValues

        // Initialiser le progrès pour l'étape suivante
        if (!user.quests.questProgress[questId][nextStep.id]) {
          user.quests.questProgress[questId][nextStep.id] = {}
          nextStep.challenges.forEach(challenge => {
            user.quests.questProgress[questId][nextStep.id][challenge.type] = 0
          })
        }
        user.markModified('quests')
        await user.save()
      }
    }

    res.json({
      success: true,
      reward,
      newResources: user.resources,
      experience: user.experience,
      questCompleted,
      completedQuest: questCompleted ? questId : null
    })
  } catch (error) {
    console.error('Erreur claimStepReward:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// POST /api/quests/check-progress - Vérifier et mettre à jour le progrès des quêtes
export async function checkQuestProgress(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    if (!user.quests?.activeQuest) {
      return res.json({ updated: false, message: 'Aucune quête active' })
    }

    const questId = user.quests.activeQuest
    const quest = questsData[questId]

    if (!quest) {
      return res.status(400).json({ error: 'Quête invalide' })
    }

    console.log('checkQuestProgress called for quest:', questId)
    let progressUpdated = false
    const questProgress = user.quests.questProgress?.[questId] || {}
    const questInitialValues = user.quests.initialValues?.[questId] || {}
    console.log('initial questProgress:', questProgress)
    console.log('questInitialValues:', questInitialValues)

    // Mettre à jour le progrès pour chaque étape
    quest.steps.forEach(step => {
      const stepProgress = questProgress[step.id] || {}
      const initialValues = questInitialValues[step.id] || {}

      step.challenges.forEach(challenge => {
        let currentTotalValue = 0

        // Obtenir la valeur totale actuelle selon le type de défi
        switch (challenge.type) {
          case 'eggs_collected':
            currentTotalValue = user.resources?.eggs || 0
            break
          case 'chickens_owned':
            const totalChickens = user.poulesPossedees?.reduce((sum, p) => sum + (p.quantite || 0), 0) || 0
            currentTotalValue = totalChickens
            break
          case 'boxes_opened':
            currentTotalValue = user.achievements?.progress?.totalBoxesOpened || 0
            break
          case 'talent_level_reached':
            const maxTalentLevel = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
            currentTotalValue = maxTalentLevel
            break
          case 'mining_games_played':
            currentTotalValue = user.achievements?.progress?.miningGamesPlayed || 0
            break
          case 'mining_cells_broken':
            currentTotalValue = user.achievements?.progress?.miningCellsBroken || 0
            break
          case 'mining_artifacts_found':
            currentTotalValue = user.achievements?.progress?.miningArtifactsFound || 0
            break
          case 'max_eggs_in_click':
            currentTotalValue = user.achievements?.progress?.maxEggsInOneClick || 0
            break
          case 'spawnables_clicked':
            currentTotalValue = user.achievements?.progress?.spawnablesClicked || 0
            break
          case 'chicken_abilities_used':
            currentTotalValue = user.achievements?.progress?.chickenAbilitiesUsed || 0
            break
          case 'chicken_gifts_collected':
            currentTotalValue = user.achievements?.progress?.chickenGiftsCollected || 0
            break
          case 'chicken_rarity_found':
            // Pour les challenges de rareté, compter toutes les poules possédées
            const targetRarity = challenge.rarity
            const chickensFound = (user.poulesPossedees || [])
              .filter(poule => {
                const chickenData = especeData[poule.especeId]
                return chickenData && chickenData.rarete === targetRarity
              })
              .reduce((sum, poule) => sum + (poule.quantite || 0), 0)
            currentTotalValue = chickensFound
            break
        }

        // Calculer le progrès depuis l'acceptation de l'étape
        const initialValue = initialValues[challenge.type] || 0
        const progressValue = Math.max(0, currentTotalValue - initialValue)

        // Mettre à jour si la valeur a changé
        if (stepProgress[challenge.type] !== progressValue) {
          stepProgress[challenge.type] = progressValue
          progressUpdated = true
        }
      })

      questProgress[step.id] = stepProgress
    })

    // Vérifier si la quête est terminée
    let questCompleted = false
    const allStepsClaimed = quest.steps.every(step => {
      const stepProgress = questProgress[step.id]
      return stepProgress?.rewardClaimed === true
    })

    if (allStepsClaimed) {
      questCompleted = true

      // Remettre à zéro tous les compteurs d'achievements utilisés dans la quête
      quest.steps.forEach(step => {
        step.challenges.forEach(challenge => {
          switch (challenge.type) {
            case 'eggs_collected':
              // Les œufs ne sont pas remis à zéro car c'est une ressource du joueur
              break
            case 'chickens_owned':
              // Les poules possédées ne sont pas remises à zéro
              break
            case 'boxes_opened':
              if (user.achievements?.progress) {
                user.achievements.progress.totalBoxesOpened = 0
              }
              break
            case 'talent_level_reached':
              // Le niveau de talent max ne peut pas être remis à zéro
              break
            case 'mining_games_played':
              if (user.achievements?.progress) {
                user.achievements.progress.miningGamesPlayed = 0
              }
              break
            case 'mining_cells_broken':
              if (user.achievements?.progress) {
                user.achievements.progress.miningCellsBroken = 0
              }
              break
            case 'mining_artifacts_found':
              if (user.achievements?.progress) {
                user.achievements.progress.miningArtifactsFound = 0
              }
              break
            case 'max_eggs_in_click':
              if (user.achievements?.progress) {
                user.achievements.progress.maxEggsInOneClick = 0
              }
              break
            case 'spawnables_clicked':
              if (user.achievements?.progress) {
                user.achievements.progress.spawnablesClicked = 0
              }
              break
            case 'chicken_abilities_used':
              if (user.achievements?.progress) {
                user.achievements.progress.chickenAbilitiesUsed = 0
              }
              break
            case 'chicken_gifts_collected':
              if (user.achievements?.progress) {
                user.achievements.progress.chickenGiftsCollected = 0
              }
              break
            case 'chicken_rarity_found':
              // Pour les raretés, on ne remet pas à zéro car c'est le nombre de poules possédées
              break
          }
        })
      })

      user.quests.completedQuests = user.quests.completedQuests || []
      if (!user.quests.completedQuests.includes(questId)) {
        user.quests.completedQuests.push(questId)
      }
      user.quests.activeQuest = null

      // Nettoyer le progrès
      if (user.quests.questProgress && user.quests.questProgress[questId]) {
        delete user.quests.questProgress[questId]
      }

      // Nettoyer les valeurs initiales
      if (user.quests.initialValues && user.quests.initialValues[questId]) {
        delete user.quests.initialValues[questId]
      }
    }

    console.log('progressUpdated:', progressUpdated, 'questCompleted:', questCompleted)

    if (progressUpdated || questCompleted) {
      user.quests.questProgress = user.quests.questProgress || {}
      user.quests.questProgress[questId] = questProgress
      user.markModified('quests')
      await user.save()
      console.log('quest progress saved, final questProgress:', questProgress)
    }

    res.json({
      updated: progressUpdated || questCompleted,
      questProgress: questCompleted ? null : questProgress,
      questCompleted,
      completedQuest: questCompleted ? questId : null
    })
  } catch (error) {
    console.error('Erreur checkQuestProgress:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

// Utilitaire pour mettre à jour le progrès des quêtes depuis d'autres contrôleurs
export async function updateQuestProgress(userId, progressType, value) {
  try {
    const user = await User.findById(userId)
    if (!user || !user.quests?.activeQuest) return

    const questId = user.quests.activeQuest
    const quest = questsData[questId]
    if (!quest) return

    let progressUpdated = false
    const questProgress = user.quests.questProgress?.[questId] || {}
    const questInitialValues = user.quests.initialValues?.[questId] || {}

    // Mettre à jour le progrès pour chaque étape
    quest.steps.forEach(step => {
      const stepProgress = questProgress[step.id] || {}
      const initialValues = questInitialValues[step.id] || {}

      step.challenges.forEach(challenge => {
        let currentTotalValue = 0

        // Obtenir la valeur totale actuelle selon le type de défi
        switch (challenge.type) {
          case 'eggs_collected':
            currentTotalValue = user.resources?.eggs || 0
            break
          case 'chickens_owned':
            const totalChickens = user.poulesPossedees?.reduce((sum, p) => sum + (p.quantite || 0), 0) || 0
            currentTotalValue = totalChickens
            break
          case 'boxes_opened':
            currentTotalValue = user.achievements?.progress?.totalBoxesOpened || 0
            break
          case 'talent_level_reached':
            const maxTalentLevel = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
            currentTotalValue = maxTalentLevel
            break
          case 'mining_games_played':
            currentTotalValue = user.achievements?.progress?.miningGamesPlayed || 0
            break
          case 'mining_cells_broken':
            currentTotalValue = user.achievements?.progress?.miningCellsBroken || 0
            break
          case 'mining_artifacts_found':
            currentTotalValue = user.achievements?.progress?.miningArtifactsFound || 0
            break
          case 'max_eggs_in_click':
            currentTotalValue = user.achievements?.progress?.maxEggsInOneClick || 0
            break
          case 'spawnables_clicked':
            currentTotalValue = user.achievements?.progress?.spawnablesClicked || 0
            break
          case 'chicken_abilities_used':
            currentTotalValue = user.achievements?.progress?.chickenAbilitiesUsed || 0
            break
          case 'chicken_gifts_collected':
            currentTotalValue = user.achievements?.progress?.chickenGiftsCollected || 0
            break
          case 'chicken_rarity_found':
            // Pour les challenges de rareté, on utilise une clé unique par rareté
            const targetRarity = challenge.rarity
            const rarityKey = `chicken_rarity_found_${targetRarity}`
            const chickensFound = (user.poulesPossedees || [])
              .filter(poule => {
                const chickenData = especeData[poule.especeId]
                return chickenData && chickenData.rarete === targetRarity
              })
              .reduce((sum, poule) => sum + (poule.quantite || 0), 0)
            currentTotalValue = chickensFound
            // Calculer le progrès depuis l'acceptation de la quête
            const initialValue = initialValues[rarityKey] || 0
            const progressValue = Math.max(0, currentTotalValue - initialValue)
            // Mettre à jour si la valeur a changé
            if (stepProgress[rarityKey] !== progressValue) {
              stepProgress[rarityKey] = progressValue
              progressUpdated = true
            }
            break
        }

        // Pour les challenges qui n'ont pas de logique spécifique, appliquer la logique générale
        if (challenge.type !== 'chicken_rarity_found') {
          // Calculer le progrès depuis l'acceptation de la quête
          const initialValue = initialValues[challenge.type] || 0
          const progressValue = Math.max(0, currentTotalValue - initialValue)

          // Mettre à jour si la valeur a changé
          if (stepProgress[challenge.type] !== progressValue) {
            stepProgress[challenge.type] = progressValue
            progressUpdated = true
          }
        }
      })

      questProgress[step.id] = stepProgress
    })

    // Vérifier si la quête est terminée
    let questCompleted = false
    const allStepsClaimed = quest.steps.every(step => {
      const stepProgress = questProgress[step.id]
      return stepProgress?.rewardClaimed === true
    })

    if (allStepsClaimed) {
      questCompleted = true

      // Remettre à zéro tous les compteurs d'achievements utilisés dans la quête
      quest.steps.forEach(step => {
        step.challenges.forEach(challenge => {
          switch (challenge.type) {
            case 'eggs_collected':
              // Les œufs ne sont pas remis à zéro car c'est une ressource du joueur
              break
            case 'chickens_owned':
              // Les poules possédées ne sont pas remises à zéro
              break
            case 'boxes_opened':
              if (user.achievements?.progress) {
                user.achievements.progress.totalBoxesOpened = 0
              }
              break
            case 'talent_level_reached':
              // Le niveau de talent max ne peut pas être remis à zéro
              break
            case 'mining_games_played':
              if (user.achievements?.progress) {
                user.achievements.progress.miningGamesPlayed = 0
              }
              break
            case 'mining_cells_broken':
              if (user.achievements?.progress) {
                user.achievements.progress.miningCellsBroken = 0
              }
              break
            case 'mining_artifacts_found':
              if (user.achievements?.progress) {
                user.achievements.progress.miningArtifactsFound = 0
              }
              break
            case 'max_eggs_in_click':
              if (user.achievements?.progress) {
                user.achievements.progress.maxEggsInOneClick = 0
              }
              break
            case 'spawnables_clicked':
              if (user.achievements?.progress) {
                user.achievements.progress.spawnablesClicked = 0
              }
              break
            case 'chicken_abilities_used':
              if (user.achievements?.progress) {
                user.achievements.progress.chickenAbilitiesUsed = 0
              }
              break
            case 'chicken_gifts_collected':
              if (user.achievements?.progress) {
                user.achievements.progress.chickenGiftsCollected = 0
              }
              break
            case 'chicken_rarity_found':
              // Pour les raretés, on ne remet pas à zéro car c'est le nombre de poules possédées
              break
          }
        })
      })

      user.quests.completedQuests = user.quests.completedQuests || []
      if (!user.quests.completedQuests.includes(questId)) {
        user.quests.completedQuests.push(questId)
      }
      user.quests.activeQuest = null

      // Nettoyer le progrès
      if (user.quests.questProgress && user.quests.questProgress[questId]) {
        delete user.quests.questProgress[questId]
      }

      // Nettoyer les valeurs initiales
      if (user.quests.initialValues && user.quests.initialValues[questId]) {
        delete user.quests.initialValues[questId]
      }
    }

    if (progressUpdated || questCompleted) {
      user.quests.questProgress = user.quests.questProgress || {}
      user.quests.questProgress[questId] = questProgress
      user.markModified('quests')
      user.markModified('achievements')
      await user.save()
    }
  } catch (error) {
    console.error('Erreur updateQuestProgress:', error)
  }
}

// Utilitaire pour mettre à jour automatiquement tous les progrès de quête
export async function updateAllQuestProgress(userId) {
  try {
    const user = await User.findById(userId)
    if (!user || !user.quests?.activeQuest) return

    const questId = user.quests.activeQuest
    const quest = questsData[questId]
    if (!quest) return

    let progressUpdated = false
    const questProgress = user.quests.questProgress?.[questId] || {}
    const questInitialValues = user.quests.initialValues?.[questId] || {}

    // Mettre à jour le progrès pour chaque étape
    quest.steps.forEach(step => {
      const stepProgress = questProgress[step.id] || {}
      const initialValues = questInitialValues[step.id] || {}

      step.challenges.forEach(challenge => {
        let currentTotalValue = 0

        // Obtenir la valeur totale actuelle selon le type de défi
        switch (challenge.type) {
          case 'eggs_collected':
            currentTotalValue = user.resources?.eggs || 0
            break
          case 'chickens_owned':
            const totalChickens = user.poulesPossedees?.reduce((sum, p) => sum + (p.quantite || 0), 0) || 0
            currentTotalValue = totalChickens
            break
          case 'boxes_opened':
            currentTotalValue = user.achievements?.progress?.totalBoxesOpened || 0
            break
          case 'talent_level_reached':
            const maxTalentLevel = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
            currentTotalValue = maxTalentLevel
            break
          case 'mining_games_played':
            currentTotalValue = user.achievements?.progress?.miningGamesPlayed || 0
            break
          case 'mining_cells_broken':
            currentTotalValue = user.achievements?.progress?.miningCellsBroken || 0
            break
          case 'mining_artifacts_found':
            currentTotalValue = user.achievements?.progress?.miningArtifactsFound || 0
            break
          case 'max_eggs_in_click':
            currentTotalValue = user.achievements?.progress?.maxEggsInOneClick || 0
            break
          case 'spawnables_clicked':
            currentTotalValue = user.achievements?.progress?.spawnablesClicked || 0
            break
          case 'chicken_abilities_used':
            currentTotalValue = user.achievements?.progress?.chickenAbilitiesUsed || 0
            break
          case 'chicken_gifts_collected':
            currentTotalValue = user.achievements?.progress?.chickenGiftsCollected || 0
            break
          case 'chicken_rarity_found':
            // Pour les challenges de rareté, on utilise une clé unique par rareté
            const targetRarity = challenge.rarity
            const rarityKey = `chicken_rarity_found_${targetRarity}`
            const chickensFound = (user.poulesPossedees || [])
              .filter(poule => {
                const chickenData = especeData[poule.especeId]
                return chickenData && chickenData.rarete === targetRarity
              })
              .reduce((sum, poule) => sum + (poule.quantite || 0), 0)
            currentTotalValue = chickensFound
            // Calculer le progrès depuis l'acceptation de la quête
            const initialValue = initialValues[rarityKey] || 0
            const progressValue = Math.max(0, currentTotalValue - initialValue)
            // Mettre à jour si la valeur a changé
            if (stepProgress[rarityKey] !== progressValue) {
              stepProgress[rarityKey] = progressValue
              progressUpdated = true
            }
            break
        }

        // Pour les challenges qui n'ont pas de logique spécifique, appliquer la logique générale
        if (challenge.type !== 'chicken_rarity_found') {
          // Calculer le progrès depuis l'acceptation de la quête
          const initialValue = initialValues[challenge.type] || 0
          const progressValue = Math.max(0, currentTotalValue - initialValue)

          // Mettre à jour si la valeur a changé
          if (stepProgress[challenge.type] !== progressValue) {
            stepProgress[challenge.type] = progressValue
            progressUpdated = true
          }
        }
      })

      questProgress[step.id] = stepProgress
    })

    // Vérifier si la quête est terminée
    let questCompleted = false
    const allStepsClaimed = quest.steps.every(step => {
      const stepProgress = questProgress[step.id]
      return stepProgress?.rewardClaimed === true
    })

    if (allStepsClaimed) {
      questCompleted = true

      // Remettre à zéro tous les compteurs d'achievements utilisés dans la quête
      quest.steps.forEach(step => {
        step.challenges.forEach(challenge => {
          switch (challenge.type) {
            case 'eggs_collected':
              // Les œufs ne sont pas remis à zéro car c'est une ressource du joueur
              break
            case 'chickens_owned':
              // Les poules possédées ne sont pas remises à zéro
              break
            case 'boxes_opened':
              if (user.achievements?.progress) {
                user.achievements.progress.totalBoxesOpened = 0
              }
              break
            case 'talent_level_reached':
              // Le niveau de talent max ne peut pas être remis à zéro
              break
            case 'mining_games_played':
              if (user.achievements?.progress) {
                user.achievements.progress.miningGamesPlayed = 0
              }
              break
            case 'mining_cells_broken':
              if (user.achievements?.progress) {
                user.achievements.progress.miningCellsBroken = 0
              }
              break
            case 'mining_artifacts_found':
              if (user.achievements?.progress) {
                user.achievements.progress.miningArtifactsFound = 0
              }
              break
            case 'max_eggs_in_click':
              if (user.achievements?.progress) {
                user.achievements.progress.maxEggsInOneClick = 0
              }
              break
            case 'spawnables_clicked':
              if (user.achievements?.progress) {
                user.achievements.progress.spawnablesClicked = 0
              }
              break
            case 'chicken_abilities_used':
              if (user.achievements?.progress) {
                user.achievements.progress.chickenAbilitiesUsed = 0
              }
              break
            case 'chicken_gifts_collected':
              if (user.achievements?.progress) {
                user.achievements.progress.chickenGiftsCollected = 0
              }
              break
            case 'chicken_rarity_found':
              // Pour les raretés, on ne remet pas à zéro car c'est le nombre de poules possédées
              break
          }
        })
      })

      user.quests.completedQuests = user.quests.completedQuests || []
      if (!user.quests.completedQuests.includes(questId)) {
        user.quests.completedQuests.push(questId)
      }
      user.quests.activeQuest = null

      // Nettoyer le progrès
      if (user.quests.questProgress && user.quests.questProgress[questId]) {
        delete user.quests.questProgress[questId]
      }

      // Nettoyer les valeurs initiales
      if (user.quests.initialValues && user.quests.initialValues[questId]) {
        delete user.quests.initialValues[questId]
      }
    }

    if (progressUpdated || questCompleted) {
      user.quests.questProgress = user.quests.questProgress || {}
      user.quests.questProgress[questId] = questProgress
      user.markModified('quests')
      user.markModified('achievements')
      await user.save()
    }

    return { updated: progressUpdated || questCompleted, questCompleted }
  } catch (error) {
    console.error('Erreur updateAllQuestProgress:', error)
  }
}