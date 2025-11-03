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
      
      // Restaurer seulement l'étape actuelle, en recréant initialValues par step
      user.quests.questProgress = user.quests.questProgress || {}
      user.quests.initialValues = user.quests.initialValues || {}
      user.quests.questProgress[questId] = {}
      
      // Importer utilitaires pour conditions/production (comme ailleurs)
      const { computeTeamCharisme, runTalentIncome, computeActiveBuffMultipliers, runTalentStorage } = await import('./egg.controller.js')
      
      // Construire initialValues par step id et initialiser questProgress par clés normalisées
      const initialValuesPerStep = {}
      quest.steps.forEach(step => {
        const stepInit = {}
        step.challenges.forEach(challenge => {
          if (challenge.type === 'chicken_rarity_found' && challenge.rarity) {
            const rarityKey = `chicken_rarity_found_${challenge.rarity}`
            const chickensFound = (user.poulesPossedees || [])
              .filter(p => {
                const chickenData = especeData[p.especeId]
                return chickenData && chickenData.rarete === challenge.rarity
              })
              .reduce((s, p) => s + (p.quantite || 0), 0)
            stepInit[rarityKey] = chickensFound
          } else {
            // mêmes sources que dans check/update pour cohérence
            switch (challenge.type) {
              case 'eggs_collected':
                // Utiliser le compteur d'achievements si disponible (mis à jour atomiquement),
                // sinon tomber en retour sur resources.eggs.
                stepInit[challenge.type] = (user.achievements?.progress?.totalEggsCollected != null)
                  ? user.achievements.progress.totalEggsCollected
                  : (user.resources?.eggs || 0)
                break
              case 'chickens_owned':
                stepInit[challenge.type] = (user.poulesPossedees || []).reduce((s, p) => s + (p.quantite || 0), 0)
                break
              case 'boxes_opened':
                stepInit[challenge.type] = user.achievements?.progress?.totalBoxesOpened || 0
                break
              case 'talent_level_reached':
                stepInit[challenge.type] = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
                break
              case 'mining_games_played':
                stepInit[challenge.type] = user.achievements?.progress?.miningGamesPlayed || 0
                break
              case 'mining_cells_broken':
                stepInit[challenge.type] = user.achievements?.progress?.miningCellsBroken || 0
                break
              case 'mining_artifacts_found':
                stepInit[challenge.type] = user.achievements?.progress?.miningArtifactsFound || 0
                break
              case 'max_eggs_in_click':
                stepInit[challenge.type] = user.achievements?.progress?.maxEggsInOneClick || 0
                break
              case 'spawnables_clicked':
                stepInit[challenge.type] = user.achievements?.progress?.spawnablesClicked || 0
                break
              case 'chicken_abilities_used':
                stepInit[challenge.type] = user.achievements?.progress?.chickenAbilitiesUsed || 0
                break
              case 'chicken_gifts_collected':
                stepInit[challenge.type] = user.achievements?.progress?.chickenGiftsCollected || 0
                break
              case 'team_stat_req':
                {
                  const statVal = computeTeamCharisme(user)
                  const { req, num } = challenge
                  let cond = false
                  if (req === 'below') cond = statVal < num
                  else if (req === 'above') cond = statVal > num
                  else if (req === 'equals') cond = statVal === num
                  stepInit[challenge.type] = cond ? 1 : 0
                }
                break
              case 'production_req':
                {
                  // Calcule la production exactement comme dans egg.controller :
                  // effectiveMaxIncome = (clickableEgg.maxIncome + storageBonus) * storageMultiplier * buff.storage
                  const storageBonus = runTalentStorage(user)
                  const buffMultipliers = computeActiveBuffMultipliers(user)
                  const baseMaxIncome = Number(user.clickableEgg?.maxIncome || 0) + Number(storageBonus.storageBonus || 0)
                  const effectiveMaxIncome = Math.max(0, baseMaxIncome * (storageBonus.storageMultiplier || 1) * (buffMultipliers.storage || 1))
                  const incomeResult = runTalentIncome(user, effectiveMaxIncome)
                  const baseIncome = Number(user.clickableEgg?.income || 0)
                  const effectiveProduction = (baseIncome + Number(incomeResult.bonusPerSecond || 0)) * (buffMultipliers.income || 1)
                  const { req, num } = challenge
                  let cond = false
                  if (req === 'below') cond = effectiveProduction < num
                  else if (req === 'above') cond = effectiveProduction > num
                  else if (req === 'equals') cond = effectiveProduction === num
                  stepInit[challenge.type] = cond ? 1 : 0
                }
                break
              default:
                stepInit[challenge.type] = 0
            }
          }
        })
        initialValuesPerStep[step.id] = stepInit
      })
      
      user.quests.initialValues[questId] = initialValuesPerStep
      
      // Initialiser le progrès pour chaque étape avec les mêmes clés (et marquer rewardClaimed pour étapes précédentes)
      const startStepIndex = abandonedData.currentStepIndex || 0
      quest.steps.forEach((step, index) => {
        user.quests.questProgress[questId][step.id] = {}
        step.challenges.forEach(challenge => {
          const key = (challenge.type === 'chicken_rarity_found' && challenge.rarity) ? `chicken_rarity_found_${challenge.rarity}` : challenge.type
          user.quests.questProgress[questId][step.id][key] = 0
        })
        if (index < startStepIndex) {
          user.quests.questProgress[questId][step.id].rewardClaimed = true
        } else {
          user.quests.questProgress[questId][step.id].rewardClaimed = false
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
    // Importer une seule fois les utilitaires requis pour évaluer certaines conditions
    const { computeTeamCharisme, runTalentIncome, computeActiveBuffMultipliers, runTalentStorage } = await import('./egg.controller.js')
    // Construire des valeurs initiales basées sur l'état actuel du joueur afin que
    // le progrès affiché au démarrage de l'étape soit 0 (current - initial = 0).
    firstStep.challenges.forEach(challenge => {
      if (challenge.type === 'chicken_rarity_found' && challenge.rarity) {
        const key = `chicken_rarity_found_${challenge.rarity}`
        const count = (user.poulesPossedees || [])
          .filter(p => {
            const cd = especeData[p.especeId]
            return cd && cd.rarete === challenge.rarity
          })
          .reduce((s, p) => s + (p.quantite || 0), 0)
        initialValues[key] = count
      } else {
        switch (challenge.type) {
          case 'eggs_collected':
            initialValues[challenge.type] = (user.achievements?.progress?.totalEggsCollected != null)
              ? user.achievements.progress.totalEggsCollected
              : (user.resources?.eggs || 0)
            break
          case 'chickens_owned':
            initialValues[challenge.type] = (user.poulesPossedees || []).reduce((s, p) => s + (p.quantite || 0), 0)
            break
          case 'boxes_opened':
            initialValues[challenge.type] = user.achievements?.progress?.totalBoxesOpened || 0
            break
          case 'talent_level_reached':
            initialValues[challenge.type] = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
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
          case 'team_stat_req': {
            const statVal = computeTeamCharisme(user)
            const { req, num } = challenge
            let cond = false
            if (req === 'below') cond = statVal < num
            else if (req === 'above') cond = statVal > num
            else if (req === 'equals') cond = statVal === num
            initialValues[challenge.type] = cond ? 1 : 0
            break
          }
          case 'production_req': {
            // Calcule la production exactement comme dans egg.controller :
            // effectiveMaxIncome = (clickableEgg.maxIncome + storageBonus) * storageMultiplier * buff.storage
            const storageBonus = runTalentStorage(user)
            const buffMultipliers = computeActiveBuffMultipliers(user)
            const baseMaxIncome = Number(user.clickableEgg?.maxIncome || 0) + Number(storageBonus.storageBonus || 0)
            const effectiveMaxIncome = Math.max(0, baseMaxIncome * (storageBonus.storageMultiplier || 1) * (buffMultipliers.storage || 1))
            const incomeResult = runTalentIncome(user, effectiveMaxIncome)
            const baseIncome = Number(user.clickableEgg?.income || 0)
            const effectiveProduction = (baseIncome + Number(incomeResult.bonusPerSecond || 0)) * (buffMultipliers.income || 1)
            const { req, num } = challenge
            let cond = false
            if (req === 'below') cond = effectiveProduction < num
            else if (req === 'above') cond = effectiveProduction > num
            else if (req === 'equals') cond = effectiveProduction === num
            initialValues[challenge.type] = cond ? 1 : 0
            break
          }
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
          case 'team_stat_req':
            // Les challenges de condition n'ont pas de compteurs à remettre à zéro
            break
          case 'production_req':
            // Les challenges de condition n'ont pas de compteurs à remettre à zéro
            break
        }
      })
    })

    // --- NOUVELLE LOGIQUE : réinitialiser les avancées des étapes pour cette quête ---
    // Créer un objet de progrès propre pour la quête, remettant tous les compteurs à 0.
    user.quests.questProgress = user.quests.questProgress || {}
    const newQuestProgress = {}
    quest.steps.forEach((step, index) => {
      const stepProgress = {}
      step.challenges.forEach(challenge => {
        // Utiliser une clé unique pour les raretés comme partout ailleurs
        if (challenge.type === 'chicken_rarity_found' && challenge.rarity) {
          const rarityKey = `chicken_rarity_found_${challenge.rarity}`
          stepProgress[rarityKey] = 0
        } else {
          stepProgress[challenge.type] = 0
        }
      })
      // Marquer les étapes précédentes comme réclamées pour préserver l'état des récompenses précédentes
      if (index < currentStepIndex) {
        stepProgress.rewardClaimed = true
      } else {
        stepProgress.rewardClaimed = false
      }
      newQuestProgress[step.id] = stepProgress
    })
    user.quests.questProgress[questId] = newQuestProgress

    // Calculer et sauvegarder les valeurs initiales actuelles pour cette quête
    // afin que le progrès futur soit calculé depuis zéro après l'abandon.
    user.quests.initialValues = user.quests.initialValues || {}
    const initialValuesPerStep = {}

    // Importer les utilitaires nécessaires pour calculer conditions/production
    const { computeTeamCharisme, runTalentIncome, computeActiveBuffMultipliers, runTalentStorage } = await import('./egg.controller.js')

    quest.steps.forEach(step => {
      const stepInit = {}
      step.challenges.forEach(challenge => {
        switch (challenge.type) {
          case 'eggs_collected':
            // Utiliser le compteur d'achievements si disponible (mis à jour atomiquement),
            // sinon tomber en retour sur resources.eggs.
            stepInit[challenge.type] = (user.achievements?.progress?.totalEggsCollected != null)
              ? user.achievements.progress.totalEggsCollected
              : (user.resources?.eggs || 0)
            break
          case 'chickens_owned':
            stepInit[challenge.type] = (user.poulesPossedees || []).reduce((s, p) => s + (p.quantite || 0), 0)
            break
          case 'boxes_opened':
            stepInit[challenge.type] = user.achievements?.progress?.totalBoxesOpened || 0
            break
          case 'talent_level_reached':
            stepInit[challenge.type] = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
            break
          case 'mining_games_played':
            stepInit[challenge.type] = user.achievements?.progress?.miningGamesPlayed || 0
            break
          case 'mining_cells_broken':
            stepInit[challenge.type] = user.achievements?.progress?.miningCellsBroken || 0
            break
          case 'mining_artifacts_found':
            stepInit[challenge.type] = user.achievements?.progress?.miningArtifactsFound || 0
            break
          case 'max_eggs_in_click':
            stepInit[challenge.type] = user.achievements?.progress?.maxEggsInOneClick || 0
            break
          case 'spawnables_clicked':
            stepInit[challenge.type] = user.achievements?.progress?.spawnablesClicked || 0
            break
          case 'chicken_abilities_used':
            stepInit[challenge.type] = user.achievements?.progress?.chickenAbilitiesUsed || 0
            break
          case 'chicken_gifts_collected':
            stepInit[challenge.type] = user.achievements?.progress?.chickenGiftsCollected || 0
            break
          case 'team_stat_req': {
            const statVal = computeTeamCharisme(user)
            const { req, num } = challenge
            let cond = false
            if (req === 'below') cond = statVal < num
            else if (req === 'above') cond = statVal > num
            else if (req === 'equals') cond = statVal === num
            stepInit[challenge.type] = cond ? 1 : 0
            break
          }
          case 'production_req': {
            // Calcule la production exactement comme dans egg.controller :
            // effectiveMaxIncome = (clickableEgg.maxIncome + storageBonus) * storageMultiplier * buff.storage
            const storageBonus = runTalentStorage(user)
            const buffMultipliers = computeActiveBuffMultipliers(user)
            const baseMaxIncome = Number(user.clickableEgg?.maxIncome || 0) + Number(storageBonus.storageBonus || 0)
            const effectiveMaxIncome = Math.max(0, baseMaxIncome * (storageBonus.storageMultiplier || 1) * (buffMultipliers.storage || 1))
            const incomeResult = runTalentIncome(user, effectiveMaxIncome)
            const baseIncome = Number(user.clickableEgg?.income || 0)
            const effectiveProduction = (baseIncome + Number(incomeResult.bonusPerSecond || 0)) * (buffMultipliers.income || 1)
            const { req, num } = challenge
            let cond = false
            if (req === 'below') cond = effectiveProduction < num
            else if (req === 'above') cond = effectiveProduction > num
            else if (req === 'equals') cond = effectiveProduction === num
            stepInit[challenge.type] = cond ? 1 : 0
            break
          }
          default:
            stepInit[challenge.type] = 0
        }
      })
      initialValuesPerStep[step.id] = stepInit
    })

    user.quests.initialValues[questId] = initialValuesPerStep

    user.quests.activeQuest = null
    user.markModified('quests')
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
        // Construire initialValues courantes pour l'étape suivante afin d'afficher 0 au départ
        nextStep.challenges.forEach(challenge => {
          if (challenge.type === 'chicken_rarity_found' && challenge.rarity) {
            const rk = `chicken_rarity_found_${challenge.rarity}`
            const cnt = (user.poulesPossedees || [])
              .filter(p => {
                const cd = especeData[p.especeId]
                return cd && cd.rarete === challenge.rarity
              })
              .reduce((s, p) => s + (p.quantite || 0), 0)
            nextStepInitialValues[rk] = cnt
          } else {
            switch (challenge.type) {
              case 'eggs_collected':
                nextStepInitialValues[challenge.type] = (user.achievements?.progress?.totalEggsCollected != null)
                  ? user.achievements.progress.totalEggsCollected
                  : (user.resources?.eggs || 0)
                break
              case 'chickens_owned':
                nextStepInitialValues[challenge.type] = (user.poulesPossedees || []).reduce((s, p) => s + (p.quantite || 0), 0)
                break
              case 'boxes_opened':
                nextStepInitialValues[challenge.type] = user.achievements?.progress?.totalBoxesOpened || 0
                break
              case 'talent_level_reached':
                nextStepInitialValues[challenge.type] = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
                break
              case 'mining_games_played':
                nextStepInitialValues[challenge.type] = user.achievements?.progress?.miningGamesPlayed || 0
                break
              case 'mining_cells_broken':
                nextStepInitialValues[challenge.type] = user.achievements?.progress?.miningCellsBroken || 0
                break
              case 'mining_artifacts_found':
                nextStepInitialValues[challenge.type] = user.achievements?.progress?.miningArtifactsFound || 0
                break
              case 'max_eggs_in_click':
                nextStepInitialValues[challenge.type] = user.achievements?.progress?.maxEggsInOneClick || 0
                break
              case 'spawnables_clicked':
                nextStepInitialValues[challenge.type] = user.achievements?.progress?.spawnablesClicked || 0
                break
              case 'chicken_abilities_used':
                nextStepInitialValues[challenge.type] = user.achievements?.progress?.chickenAbilitiesUsed || 0
                break
              case 'chicken_gifts_collected':
                nextStepInitialValues[challenge.type] = user.achievements?.progress?.chickenGiftsCollected || 0
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
      // Nettoyer la quête invalide au lieu de retourner une erreur
      console.log(`Quête invalide détectée: ${questId}. Nettoyage automatique.`)
      user.quests.activeQuest = null
      if (user.quests.questProgress && user.quests.questProgress[questId]) {
        delete user.quests.questProgress[questId]
      }
      if (user.quests.initialValues && user.quests.initialValues[questId]) {
        delete user.quests.initialValues[questId]
      }
      user.markModified('quests')
      await user.save()
      return res.json({ updated: false, message: 'Quête invalide nettoyée' })
    }

    console.log('checkQuestProgress called for quest:', questId)
    let progressUpdated = false
    const questProgress = user.quests.questProgress?.[questId] || {}
    const questInitialValues = user.quests.initialValues?.[questId] || {}
    console.log('initial questProgress:', questProgress)
    console.log('questInitialValues:', questInitialValues)

    // Importer les fonctions nécessaires une seule fois
    const { computeTeamCharisme, runTalentIncome, computeActiveBuffMultipliers, runTalentStorage } = await import('./egg.controller.js')

    // Mettre à jour uniquement l'étape active : la première étape dont rewardClaimed !== true
    const activeStep = quest.steps.find(s => {
      const sp = questProgress[s.id] || {}
      return sp.rewardClaimed !== true
    })
    if (activeStep) {
      const step = activeStep
      const stepProgress = questProgress[step.id] || {}
      const initialValues = questInitialValues[step.id] || {}

      // traiter uniquement les challenges de cette étape
      step.challenges.forEach(challenge => {
        const isConditionChallenge = ['team_stat_req', 'production_req'].includes(challenge.type)
        let currentTotalValue = 0
        // (les mêmes sources que précédemment)
        switch (challenge.type) {
          case 'eggs_collected':
            currentTotalValue = (user.achievements?.progress?.totalEggsCollected != null)
              ? user.achievements.progress.totalEggsCollected
              : (user.resources?.eggs || 0)
            break
          case 'chickens_owned':
            currentTotalValue = (user.poulesPossedees || []).reduce((sum, p) => sum + (p.quantite || 0), 0)
            break
          case 'boxes_opened':
            currentTotalValue = user.achievements?.progress?.totalBoxesOpened || 0
            break
          case 'talent_level_reached':
            currentTotalValue = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
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
          case 'chicken_rarity_found': {
            const targetRarity = challenge.rarity
            const chickensFound = (user.poulesPossedees || [])
              .filter(p => {
                const chickenData = especeData[p.especeId]
                return chickenData && chickenData.rarete === targetRarity
              })
              .reduce((s, p) => s + (p.quantite || 0), 0)
            currentTotalValue = chickensFound
            break
          }
          case 'team_stat_req': {
            const statValue = computeTeamCharisme(user)
            const { req, num } = challenge
            let conditionMet = false
            if (req === 'below') conditionMet = statValue < num
            else if (req === 'above') conditionMet = statValue > num
            else if (req === 'equals') conditionMet = statValue === num
            currentTotalValue = conditionMet ? 1 : 0
            break
          }
          case 'production_req': {
            const storageBonus = runTalentStorage(user)
            const buffMultipliers = computeActiveBuffMultipliers(user)
            const baseMaxIncome = Number(user.clickableEgg?.maxIncome || 0) + Number(storageBonus.storageBonus || 0)
            const effectiveMaxIncome = Math.max(0, baseMaxIncome * (storageBonus.storageMultiplier || 1) * (buffMultipliers.storage || 1))
            const incomeResult = runTalentIncome(user, effectiveMaxIncome)
            const baseIncome = Number(user.clickableEgg?.income || 0)
            const effectiveProduction = (baseIncome + Number(incomeResult.bonusPerSecond || 0)) * (buffMultipliers.income || 1)
            const { req: prodReq, num: prodNum } = challenge
            let prodConditionMet = false
            if (prodReq === 'below') prodConditionMet = effectiveProduction < prodNum
            else if (prodReq === 'above') prodConditionMet = effectiveProduction > prodNum
            else if (prodReq === 'equals') prodConditionMet = effectiveProduction === prodNum
            currentTotalValue = prodConditionMet ? 1 : 0
            break
          }
          default:
            currentTotalValue = 0
        }

        // Calculer le progrès depuis l'acceptation de l'étape
        // Pour les challenges de condition (0/1), utiliser directement la valeur actuelle
        if (challenge.type === 'chicken_rarity_found') {
          // reconstruire la clé unique pour la rareté et l'utiliser pour lire/écrire
          const rarityKey = `chicken_rarity_found_${challenge.rarity}`
          const initVal = initialValues[rarityKey] || 0
          const computed = Math.max(0, currentTotalValue - initVal)
          const prev = stepProgress[rarityKey] || 0
          const newVal = Math.max(prev, computed)
          if (newVal !== prev) {
            stepProgress[rarityKey] = newVal
            progressUpdated = true
          }
        } else {
          const computed = isConditionChallenge ? currentTotalValue : Math.max(0, currentTotalValue - (initialValues[challenge.type] || 0))
          const prev = stepProgress[challenge.type] || 0
          const newVal = Math.max(prev, computed)
          if (newVal !== prev) {
            stepProgress[challenge.type] = newVal
            progressUpdated = true
          }
        }
      })

      questProgress[step.id] = stepProgress
    }

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
async function updateQuestProgress(userId, progressType, value) {
  try {
    const user = await User.findById(userId)
    if (!user || !user.quests?.activeQuest) return

    const questId = user.quests.activeQuest
    const quest = questsData[questId]
    if (!quest) {
      // Nettoyage si quête invalide
      console.log(`Quête invalide détectée dans updateQuestProgress: ${questId}. Nettoyage automatique.`)
      user.quests.activeQuest = null
      if (user.quests.questProgress && user.quests.questProgress[questId]) {
        delete user.quests.questProgress[questId]
      }
      if (user.quests.initialValues && user.quests.initialValues[questId]) {
        delete user.quests.initialValues[questId]
      }
      user.markModified('quests')
      await user.save()
      return
    }

    let progressUpdated = false
    const questProgress = user.quests.questProgress?.[questId] || {}
    const questInitialValues = user.quests.initialValues?.[questId] || {}

    // Importer les fonctions nécessaires une seule fois
    const { computeTeamCharisme, runTalentIncome, computeActiveBuffMultipliers, runTalentStorage } = await import('./egg.controller.js')

    // Mettre à jour UNIQUEMENT l'étape active (première étape non rewardClaimed)
    const activeStep = quest.steps.find(s => {
      const sp = questProgress[s.id] || {}
      return sp.rewardClaimed !== true
    })
    if (activeStep) {
      const step = activeStep
      const stepProgress = questProgress[step.id] || {}
      const initialValues = questInitialValues[step.id] || {}

      step.challenges.forEach(challenge => {
        const isConditionChallenge = ['team_stat_req', 'production_req'].includes(challenge.type)
        let currentTotalValue = 0

        switch (challenge.type) {
          case 'eggs_collected':
            currentTotalValue = (user.achievements?.progress?.totalEggsCollected != null)
              ? user.achievements.progress.totalEggsCollected
              : (user.resources?.eggs || 0)
            break
          case 'chickens_owned':
            currentTotalValue = (user.poulesPossedees || []).reduce((sum, p) => sum + (p.quantite || 0), 0)
            break
          case 'boxes_opened':
            currentTotalValue = user.achievements?.progress?.totalBoxesOpened || 0
            break
          case 'talent_level_reached':
            currentTotalValue = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
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
          case 'chicken_rarity_found': {
            const targetRarity = challenge.rarity
            const chickensFound = (user.poulesPossedees || [])
              .filter(p => {
                const chickenData = especeData[p.especeId]
                return chickenData && chickenData.rarete === targetRarity
              })
              .reduce((s, p) => s + (p.quantite || 0), 0)
            currentTotalValue = chickensFound
            break
          }
          case 'team_stat_req': {
            const statValue = computeTeamCharisme(user)
            const { req, num } = challenge
            let conditionMet = false
            if (req === 'below') conditionMet = statValue < num
            else if (req === 'above') conditionMet = statValue > num
            else if (req === 'equals') conditionMet = statValue === num
            currentTotalValue = conditionMet ? 1 : 0
            break
          }
          case 'production_req': {
            const storageBonus = runTalentStorage(user)
            const buffMultipliers = computeActiveBuffMultipliers(user)
            const baseMaxIncome = Number(user.clickableEgg?.maxIncome || 0) + Number(storageBonus.storageBonus || 0)
            const effectiveMaxIncome = Math.max(0, baseMaxIncome * (storageBonus.storageMultiplier || 1) * (buffMultipliers.storage || 1))
            const incomeResult = runTalentIncome(user, effectiveMaxIncome)
            const baseIncome = Number(user.clickableEgg?.income || 0)
            const effectiveProduction = (baseIncome + Number(incomeResult.bonusPerSecond || 0)) * (buffMultipliers.income || 1)
            const { req: prodReq, num: prodNum } = challenge
            let prodConditionMet = false
            if (prodReq === 'below') prodConditionMet = effectiveProduction < prodNum
            else if (prodReq === 'above') prodConditionMet = effectiveProduction > prodNum
            else if (prodReq === 'equals') prodConditionMet = effectiveProduction === prodNum
            currentTotalValue = prodConditionMet ? 1 : 0
            break
          }
          default:
            currentTotalValue = 0
        }

        if (challenge.type === 'chicken_rarity_found') {
          const rarityKey = `chicken_rarity_found_${challenge.rarity}`
          const initVal = initialValues[rarityKey] || 0
          const computed = Math.max(0, currentTotalValue - initVal)
          const prev = stepProgress[rarityKey] || 0
          const newVal = Math.max(prev, computed)
          if (newVal !== prev) {
            stepProgress[rarityKey] = newVal
            progressUpdated = true
          }
        } else {
          const key = challenge.type
          const computed = isConditionChallenge ? currentTotalValue : Math.max(0, currentTotalValue - (initialValues[key] || 0))
          const prev = stepProgress[key] || 0
          const newVal = Math.max(prev, computed)
          if (newVal !== prev) {
            stepProgress[key] = newVal
            progressUpdated = true
          }
        }
      })

      questProgress[step.id] = stepProgress
    }

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
              if (user.achievements?.progress) user.achievements.progress.totalBoxesOpened = 0
              break
            case 'talent_level_reached': break
            case 'mining_games_played':
              if (user.achievements?.progress) user.achievements.progress.miningGamesPlayed = 0
              break
            case 'mining_cells_broken':
              if (user.achievements?.progress) user.achievements.progress.miningCellsBroken = 0
              break
            case 'mining_artifacts_found':
              if (user.achievements?.progress) user.achievements.progress.miningArtifactsFound = 0
              break
            case 'max_eggs_in_click':
              if (user.achievements?.progress) user.achievements.progress.maxEggsInOneClick = 0
              break
            case 'spawnables_clicked':
              if (user.achievements?.progress) user.achievements.progress.spawnablesClicked = 0
              break
            case 'chicken_abilities_used':
              if (user.achievements?.progress) user.achievements.progress.chickenAbilitiesUsed = 0
              break
            case 'chicken_gifts_collected':
              if (user.achievements?.progress) user.achievements.progress.chickenGiftsCollected = 0
              break
            case 'chicken_rarity_found': break
          }
        })
      })

      user.quests.completedQuests = user.quests.completedQuests || []
      if (!user.quests.completedQuests.includes(questId)) user.quests.completedQuests.push(questId)
      user.quests.activeQuest = null

      if (user.quests.questProgress && user.quests.questProgress[questId]) delete user.quests.questProgress[questId]
      if (user.quests.initialValues && user.quests.initialValues[questId]) delete user.quests.initialValues[questId]
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
async function updateAllQuestProgress(userId) {
  try {
    const user = await User.findById(userId)
    if (!user || !user.quests?.activeQuest) return

    const questId = user.quests.activeQuest
    const quest = questsData[questId]
    if (!quest) {
      // Nettoyage si quête invalide
      console.log(`Quête invalide détectée dans updateAllQuestProgress: ${questId}. Nettoyage automatique.`)
      user.quests.activeQuest = null
      if (user.quests.questProgress && user.quests.questProgress[questId]) {
        delete user.quests.questProgress[questId]
      }
      if (user.quests.initialValues && user.quests.initialValues[questId]) {
        delete user.quests.initialValues[questId]
      }
      user.markModified('quests')
      await user.save()
      return
    }

    let progressUpdated = false
    const questProgress = user.quests.questProgress?.[questId] || {}
    const questInitialValues = user.quests.initialValues?.[questId] || {}

    // Importer les fonctions nécessaires une seule fois
    const { computeTeamCharisme, runTalentIncome, computeActiveBuffMultipliers, runTalentStorage } = await import('./egg.controller.js')

    // Mettre à jour uniquement l'étape active
    const activeStep = quest.steps.find(s => {
      const sp = questProgress[s.id] || {}
      return sp.rewardClaimed !== true
    })
    if (activeStep) {
      const step = activeStep
      const stepProgress = questProgress[step.id] || {}
      const initialValues = questInitialValues[step.id] || {}

      step.challenges.forEach(challenge => {
        const isConditionChallenge = ['team_stat_req', 'production_req'].includes(challenge.type)
        let currentTotalValue = 0
        switch (challenge.type) {
          case 'eggs_collected':
            currentTotalValue = (user.achievements?.progress?.totalEggsCollected != null)
              ? user.achievements.progress.totalEggsCollected
              : (user.resources?.eggs || 0)
            break
          case 'chickens_owned':
            currentTotalValue = (user.poulesPossedees || []).reduce((sum, p) => sum + (p.quantite || 0), 0)
            break
          case 'boxes_opened':
            currentTotalValue = user.achievements?.progress?.totalBoxesOpened || 0
            break
          case 'talent_level_reached':
            currentTotalValue = Math.max(...(user.poulesPossedees?.map(p => p.niveauTalent || 1) || [1]))
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
          case 'chicken_rarity_found': {
            const targetRarity = challenge.rarity
            const chickensFound = (user.poulesPossedees || [])
              .filter(p => {
                const chickenData = especeData[p.especeId]
                return chickenData && chickenData.rarete === targetRarity
              })
              .reduce((s, p) => s + (p.quantite || 0), 0)
            currentTotalValue = chickensFound
            break
          }
          case 'team_stat_req': {
            const statValue = computeTeamCharisme(user)
            const { req, num } = challenge
            let conditionMet = false
            if (req === 'below') conditionMet = statValue < num
            else if (req === 'above') conditionMet = statValue > num
            else if (req === 'equals') conditionMet = statValue === num
            currentTotalValue = conditionMet ? 1 : 0
            break
          }
          case 'production_req': {
            const storageBonus = runTalentStorage(user)
            const buffMultipliers = computeActiveBuffMultipliers(user)
            const baseMaxIncome = Number(user.clickableEgg?.maxIncome || 0) + Number(storageBonus.storageBonus || 0)
            const effectiveMaxIncome = Math.max(0, baseMaxIncome * (storageBonus.storageMultiplier || 1) * (buffMultipliers.storage || 1))
            const incomeResult = runTalentIncome(user, effectiveMaxIncome)
            const baseIncome = Number(user.clickableEgg?.income || 0)
            const effectiveProduction = (baseIncome + Number(incomeResult.bonusPerSecond || 0)) * (buffMultipliers.income || 1)
            const { req: prodReq, num: prodNum } = challenge
            let prodConditionMet = false
            if (prodReq === 'below') prodConditionMet = effectiveProduction < prodNum
            else if (prodReq === 'above') prodConditionMet = effectiveProduction > prodNum
            else if (prodReq === 'equals') prodConditionMet = effectiveProduction === prodNum
            currentTotalValue = prodConditionMet ? 1 : 0
            break
          }
          default:
            currentTotalValue = 0
        }

        if (challenge.type === 'chicken_rarity_found') {
          const rarityKey = `chicken_rarity_found_${challenge.rarity}`
          const initVal = initialValues[rarityKey] || 0
          const computed = Math.max(0, currentTotalValue - initVal)
          const prev = stepProgress[rarityKey] || 0
          const newVal = Math.max(prev, computed)
          if (newVal !== prev) {
            stepProgress[rarityKey] = newVal
            progressUpdated = true
          }
        } else {
          const key = challenge.type
          const computed = isConditionChallenge ? currentTotalValue : Math.max(0, currentTotalValue - (initialValues[key] || 0))
          const prev = stepProgress[key] || 0
          const newVal = Math.max(prev, computed)
          if (newVal !== prev) {
            stepProgress[key] = newVal
            progressUpdated = true
          }
        }
      })

      questProgress[step.id] = stepProgress
    }

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
              if (user.achievements?.progress) user.achievements.progress.totalBoxesOpened = 0
              break
            case 'talent_level_reached': break
            case 'mining_games_played':
              if (user.achievements?.progress) user.achievements.progress.miningGamesPlayed = 0
              break
            case 'mining_cells_broken':
              if (user.achievements?.progress) user.achievements.progress.miningCellsBroken = 0
              break
            case 'mining_artifacts_found':
              if (user.achievements?.progress) user.achievements.progress.miningArtifactsFound = 0
              break
            case 'max_eggs_in_click':
              if (user.achievements?.progress) user.achievements.progress.maxEggsInOneClick = 0
              break
            case 'spawnables_clicked':
              if (user.achievements?.progress) user.achievements.progress.spawnablesClicked = 0
              break
            case 'chicken_abilities_used':
              if (user.achievements?.progress) user.achievements.progress.chickenAbilitiesUsed = 0
              break
            case 'chicken_gifts_collected':
              if (user.achievements?.progress) user.achievements.progress.chickenGiftsCollected = 0
              break
            case 'chicken_rarity_found': break
          }
        })
      })

      user.quests.completedQuests = user.quests.completedQuests || []
      if (!user.quests.completedQuests.includes(questId)) user.quests.completedQuests.push(questId)
      user.quests.activeQuest = null

      if (user.quests.questProgress && user.quests.questProgress[questId]) delete user.quests.questProgress[questId]
      if (user.quests.initialValues && user.quests.initialValues[questId]) delete user.quests.initialValues[questId]
    }

    if (progressUpdated || questCompleted) {
      user.quests.questProgress = user.quests.questProgress || {}
      user.quests.questProgress[questId] = questProgress
      user.markModified('quests')
      user.markModified('achievements')
      await user.save()
    }
  } catch (error) {
    console.error('Erreur updateAllQuestProgress:', error)
  }
}

// --- NOUVEAU: exporter explicitement les utilitaires pour assurer la visibilité aux imports ---
export {
  updateQuestProgress,
  updateAllQuestProgress
}