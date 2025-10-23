import { ref, onMounted, onBeforeUnmount } from 'vue'
import { apiGet, apiPut } from '@/utils/api'

const eggs = ref(0)
const stockTokens = ref(0)
const productionTokens = ref(0)
const wildTokens = ref(0)
const chestKeys = ref(0)
const team = ref({ maxSlots: 3, slots: [] })
const artifactSlots = ref({ slotsCount: 2, equipped: [] })
const level = ref(1)
const xp = ref(0)
const xpRequired = ref(2)
const player = ref(null)

// Fonction de nettoyage des données
function clearPlayerData() {
  eggs.value = 0
  stockTokens.value = 0
  productionTokens.value = 0
  wildTokens.value = 0
  chestKeys.value = 0
  player.value = null
  level.value = 1
  xp.value = 0
  xpRequired.value = 2
  team.value = { maxSlots: 3, slots: [] }
  artifactSlots.value = { slotsCount: 2, equipped: [] }
}

export function usePlayer() {
  // Écouter les événements de déconnexion pour nettoyer les données
  onMounted(() => {
    const handleLogout = () => {
      clearPlayerData()
    }
    
    const handleMiningGameOver = (event) => {
      const resources = event.detail?.resources
      if (resources) {
        if (resources.eggs !== undefined) eggs.value = resources.eggs
        if (resources.stock_token !== undefined) stockTokens.value = resources.stock_token
        if (resources.production_token !== undefined) productionTokens.value = resources.production_token
        if (resources.wild_token !== undefined) wildTokens.value = resources.wild_token
        if (resources.chest_key !== undefined) chestKeys.value = resources.chest_key
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-logout', handleLogout)
      window.addEventListener('mining-game-over', handleMiningGameOver)
      
      onBeforeUnmount(() => {
        window.removeEventListener('auth-logout', handleLogout)
        window.removeEventListener('mining-game-over', handleMiningGameOver)
      })
    }
  })

  // Initialiser les données du joueur si pas déjà fait
  if (!player.value && typeof localStorage !== 'undefined' && localStorage.getItem('token')) {
    refreshPlayer().catch(() => {}) // Silencieux si erreur
  }

  async function refreshPlayer() {
    try {
      //console.log('🔄 refreshPlayer: début')
      const token = localStorage.getItem('token')
      if (!token) {
        //console.log('❌ refreshPlayer: pas de token')
        // Réinitialiser les données si pas de token
        clearPlayerData()
        return
      }

      const data = await apiGet('/api/egg/status')
      if (data) {
        //console.log('📊 refreshPlayer: données reçues:', data)
        eggs.value = data.totalEggs || 0
        stockTokens.value = data.stockTokens || 0
        productionTokens.value = data.productionTokens || 0
        wildTokens.value = data.wildTokens || 0
        chestKeys.value = data.chestKeys || 0
        //console.log('✅ refreshPlayer: œufs mis à jour:', eggs.value)
      }

      // Récupérer l'XP / level (API unifiée /api/user/me)
      try {
        const u = await apiGet('/api/user/me')
        if (u) {
          // Stocker les informations de base de l'utilisateur
          player.value = {
            profileId: u?.profileId || u?.id || null,
            username: u?.username || null,
            avatar: u?.avatar || null,
            lastSeen: u?.lastSeen || null
          }
          
          const prevLevel = level.value || 1
          const currentProfileId = u?.profileId || u?.id || null
          // Mémorise le dernier utilisateur pour éviter un faux level-up lors d'un switch de compte
          const lastProfileId = (typeof window !== 'undefined') ? window.__lastProfileId : undefined
          const newLevel = u?.experience?.level ?? 1
          level.value = newLevel
          xp.value = u?.experience?.points ?? 0
          xpRequired.value = u?.experience?.required_points ?? 2
          // Synchroniser aussi les ressources centrales (incluant tokens)
          if (u?.resources) {
            eggs.value = Number(u.resources.eggs ?? eggs.value)
            stockTokens.value = Number(u.resources.stock_token ?? stockTokens.value)
            productionTokens.value = Number(u.resources.production_token ?? productionTokens.value)
            wildTokens.value = Number(u.resources.wild_token ?? wildTokens.value)
            chestKeys.value = Number(u.resources.chest_key ?? chestKeys.value)
          }
          try {
            if (typeof window !== 'undefined') {
              // N'émettre le level-up que si le même utilisateur passe un niveau
              if (lastProfileId && currentProfileId && lastProfileId === currentProfileId && newLevel > prevLevel) {
                window.dispatchEvent(new CustomEvent('level-up', { detail: { from: prevLevel, to: newLevel } }))
              }
              // Mettre à jour le dernier profileId après traitement
              window.__lastProfileId = currentProfileId || null
            }
          } catch (_) {}
          // Si on veut manter resources aussi depuis cette route, on pourrait synchroniser ici.
        }
      } catch (_) {}
    } catch (error) {
      console.error('Erreur lors de la récupération des données du joueur:', error)
    }
  }

  async function fetchTeam() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const data = await apiGet('/api/team')
      if (data) {
        team.value = data
        try { window.__teamSlotsCached = Array.isArray(team.value?.slots) ? [...team.value.slots] : [] } catch (_) {}
      }
    } catch (err) {
      console.error('Erreur fetchTeam:', err)
    }
  }

  async function updateTeam(newSlots) {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const updated = await apiPut('/api/team', { slots: newSlots })
      if (updated) {
        team.value = updated
        try { window.__teamSlotsCached = Array.isArray(team.value?.slots) ? [...team.value.slots] : [] } catch (_) {}
        // Notifier globalement que l'équipe a changé (ex: pour rafraîchir l'income)
        try {
          window.dispatchEvent(new CustomEvent('team-updated', { detail: { team: team.value } }))
        } catch (_) { /* no-op */ }
        return true
      }
    } catch (err) {
      console.error('Erreur updateTeam:', err)
    }
    return false
  }

  function isInTeam(especeId) {
    return Array.isArray(team.value?.slots) && team.value.slots.some(s => s?.especeId === especeId)
  }

  async function equipChicken(especeId) {
    await fetchTeam()
    const max = team.value.maxSlots || 3
    const slots = Array.isArray(team.value.slots) ? [...team.value.slots] : []
    
    // Vérifier si l'équipe est pleine
    const filledSlots = slots.filter(s => s?.especeId).length
    const isFull = filledSlots >= max
    
    // Trouver un slot libre
    let placed = false
    for (let i = 0; i < max; i++) {
      if (!slots[i] || !slots[i].especeId) {
        slots[i] = { especeId }
        placed = true
        break
      }
    }
    
    if (!placed) {
      // Équipe pleine - retourner l'information pour que l'UI puisse gérer
      return { success: false, teamFull: true, currentTeam: slots }
    }
    
    const success = await updateTeam(slots)
    return { success, teamFull: false }
  }

  async function unequipChicken(especeId) {
    await fetchTeam()
    const max = team.value.maxSlots || 3
    const slots = Array.isArray(team.value.slots) ? [...team.value.slots] : []
    for (let i = 0; i < Math.min(max, slots.length); i++) {
      if (slots[i]?.especeId === especeId) {
        slots[i] = { especeId: null }
      }
    }
    return updateTeam(slots)
  }

  // Nouvelle fonction pour remplacer un membre d'équipe spécifique
  async function replaceTeamMember(slotIndex, newEspeceId) {
    await fetchTeam()
    const max = team.value.maxSlots || 3
    const slots = Array.isArray(team.value.slots) ? [...team.value.slots] : []
    
    if (slotIndex >= 0 && slotIndex < max) {
      slots[slotIndex] = { especeId: newEspeceId }
      const success = await updateTeam(slots)
      return { success }
    }
    
    return { success: false }
  }

  function addEggs(n) {
    eggs.value += n
  }

  function spendEggs(n) {
    if (eggs.value >= n) {
      eggs.value -= n
      return true
    }
    return false
  }

  function setEggs(n) {
    eggs.value = n
  }

  function addTokens(type, amount) {
    if (type === 'stock_token') {
      stockTokens.value += amount
    } else if (type === 'production_token') {
      productionTokens.value += amount
    } else if (type === 'wild_token') {
      wildTokens.value += amount
    } else if (type === 'chest_key') {
      chestKeys.value += amount
    }
  }

  function spendTokens(type, amount) {
    if (type === 'stock_token' && stockTokens.value >= amount) {
      stockTokens.value -= amount
      return true
    } else if (type === 'production_token' && productionTokens.value >= amount) {
      productionTokens.value -= amount
      return true
    } else if (type === 'wild_token' && wildTokens.value >= amount) {
      wildTokens.value -= amount
      return true
    } else if (type === 'chest_key' && chestKeys.value >= amount) {
      chestKeys.value -= amount
      return true
    }
    return false
  }

  function canAfford(price) {
    if (typeof price === 'number') {
      return eggs.value >= price
    }
    
    switch (price.type) {
      case 'eggs':
        return eggs.value >= price.count
      case 'stock_token':
        return stockTokens.value >= price.count
      case 'production_token':
        return productionTokens.value >= price.count
      case 'wild_token':
        return wildTokens.value >= price.count
      case 'chest_key':
        return chestKeys.value >= price.count
      default:
        return false
    }
  }

  function getLevel() { return level.value }

  // === Artefacts ===
  async function fetchArtifactSlots() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const data = await apiGet('/api/user/artifact-slots')
      if (data) {
        artifactSlots.value = data
      }
    } catch (err) {
      console.error('Erreur fetchArtifactSlots:', err)
    }
  }

  async function equipArtifact(artifactId) {
    try {
      const token = localStorage.getItem('token')
      if (!token) return false
      
      await fetchArtifactSlots()
      const equipped = artifactSlots.value.equipped || []
      const slotsCount = artifactSlots.value.slotsCount || 0
      
      // Vérifier s'il y a de la place
      const usedSlots = equipped.filter(id => id !== null && id !== '').length
      if (usedSlots >= slotsCount) {
        throw new Error('Tous les emplacements sont occupés')
      }
      
      const result = await apiPut('/api/user/artifact/equip/' + artifactId)
      if (result && result.success) {
        artifactSlots.value = result.artifactSlots
        return true
      }
    } catch (err) {
      console.error('Erreur equipArtifact:', err)
      throw err
    }
    return false
  }

  async function unequipArtifact(artifactId) {
    try {
      const token = localStorage.getItem('token')
      if (!token) return false
      
      const result = await apiPut('/api/user/artifact/unequip/' + artifactId)
      if (result && result.success) {
        artifactSlots.value = result.artifactSlots
        return true
      }
    } catch (err) {
      console.error('Erreur unequipArtifact:', err)
      throw err
    }
    return false
  }

  return {
    eggs,
    stockTokens,
    productionTokens,
    wildTokens,
    chestKeys,
    team,
    artifactSlots,
    level,
    xp,
    xpRequired,
    player,
    addEggs,
    spendEggs,
    setEggs,
    addTokens,
    spendTokens,
    canAfford,
    getLevel,
    refreshPlayer,
    refreshPlayerData: refreshPlayer, // Alias pour compatibilité
    // Team
    fetchTeam,
    updateTeam,
    isInTeam,
    equipChicken,
    unequipChicken,
    replaceTeamMember,
    // Artifacts
    fetchArtifactSlots,
    equipArtifact,
    unequipArtifact
  }
}
