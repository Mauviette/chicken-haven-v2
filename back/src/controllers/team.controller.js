import User from '../models/User.js'
import { especeData } from '../data/sharedGameData.js'

// GET /api/team
export async function getTeam(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const { team } = user
    // Normaliser structure
    const maxSlots = team?.maxSlots ?? 3
    const slots = Array.isArray(team?.slots) ? team.slots : []
    return res.json({ maxSlots, slots })
  } catch (err) {
    console.error('Erreur getTeam:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// PUT /api/team
// Body: { slots: [{especeId|null}] }
export async function updateTeam(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const incoming = req.body?.slots
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ error: 'slots doit être un tableau' })
    }

    const maxSlots = user.team?.maxSlots ?? 3
    if (incoming.length > maxSlots) {
      return res.status(400).json({ error: `Taille maximale ${maxSlots} dépassée` })
    }

    // Nettoyage: tronquer à maxSlots, normaliser shape, autoriser null ou string
    const clean = incoming
      .slice(0, maxSlots)
      .map((s) => ({ especeId: (s?.especeId ?? (typeof s === 'string' ? s : null)) || null }))

    // Vérification mode apocalypse: empêcher modification de slots avec cooldown actif
    if (user.apocalypse) {
      const currentSlots = user.team?.slots || []
      const activableTalents = ['Maligne', 'Joyeuse', 'Rapide']
      
      for (let i = 0; i < maxSlots; i++) {
        const currentEspeceId = currentSlots[i]?.especeId
        const newEspeceId = clean[i]?.especeId
        
        // Si on retire ou remplace une poule qui était dans le slot
        if (currentEspeceId && currentEspeceId !== newEspeceId) {
          const talentName = especeData[currentEspeceId]?.talent
          if (talentName && activableTalents.includes(talentName)) {
            const cooldownKey = `talent_${talentName}`
            const cooldownEnd = user.cooldowns?.[cooldownKey]
            if (cooldownEnd) {
              const now = new Date()
              const endTime = new Date(cooldownEnd)
              if (endTime > now) {
                return res.status(400).json({ error: 'Impossible de modifier cette poule - capacité en recharge (mode Apocalypse)' })
              }
            }
          }
        }
      }
    }

    user.team = user.team || { maxSlots, slots: [] }
    user.team.maxSlots = maxSlots // ne change pas ici
    user.team.slots = clean
    await user.save()

    return res.json({ maxSlots: user.team.maxSlots, slots: user.team.slots })
  } catch (err) {
    console.error('Erreur updateTeam:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}

// PATCH /api/team/slot/:index
export async function updateTeamSlot(req, res) {
  try {
    const index = Number(req.params.index)
    if (!Number.isInteger(index) || index < 0) {
      return res.status(400).json({ error: 'Index invalide' })
    }

    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' })

    const maxSlots = user.team?.maxSlots ?? 3
    if (index >= maxSlots) {
      return res.status(400).json({ error: `Index >= maxSlots (${maxSlots})` })
    }

    const especeId = req.body?.especeId ?? null
    user.team = user.team || { maxSlots, slots: [] }

    // Assurer la taille du tableau
    if (!Array.isArray(user.team.slots)) user.team.slots = []
    while (user.team.slots.length < maxSlots) user.team.slots.push({ especeId: null })

    // Vérification mode apocalypse: empêcher modification de slot avec cooldown actif
    if (user.apocalypse) {
      const currentEspeceId = user.team.slots[index]?.especeId
      const activableTalents = ['Maligne', 'Joyeuse', 'Rapide']
      
      // Si on retire ou remplace une poule qui était dans le slot
      if (currentEspeceId && currentEspeceId !== especeId) {
        const talentName = especeData[currentEspeceId]?.talent
        if (talentName && activableTalents.includes(talentName)) {
          const cooldownKey = `talent_${talentName}`
          const cooldownEnd = user.cooldowns?.[cooldownKey]
          if (cooldownEnd) {
            const now = new Date()
            const endTime = new Date(cooldownEnd)
            if (endTime > now) {
              return res.status(400).json({ error: 'Impossible de modifier cette poule - capacité en recharge (mode Apocalypse)' })
            }
          }
        }
      }
    }

    user.team.slots[index] = { especeId }
    await user.save()
    return res.json({ maxSlots: user.team.maxSlots, slots: user.team.slots })
  } catch (err) {
    console.error('Erreur updateTeamSlot:', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
