/**
 * Gestion de l'équipe du joueur
 */
import { apiGet, apiPut } from '@/utils/api.js'
import { team, player, apocalypse } from './playerState.js'

/**
 * Récupère les données des espèces depuis le cache global
 * @returns {Object} - Données des espèces
 */
function getEspeceData() {
  // Utilise le cache global alimenté par useGameData
  return window.__gameDataCache?.especies || {}
}

/**
 * Récupère l'équipe depuis le serveur
 */
export async function fetchTeam() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return
    const data = await apiGet('/api/team')
    if (data) {
      team.value = data
      try { 
        window.__teamSlotsCached = Array.isArray(team.value?.slots) ? [...team.value.slots] : [] 
      } catch (_) {}
    }
  } catch (err) {
    console.error('Erreur fetchTeam:', err)
  }
}

/**
 * Met à jour l'équipe sur le serveur
 * @param {Array} newSlots - Nouveaux slots d'équipe
 * @returns {boolean} - true si la mise à jour a réussi
 */
export async function updateTeam(newSlots) {
  try {
    const token = localStorage.getItem('token')
    if (!token) return false
    const updated = await apiPut('/api/team', { slots: newSlots })
    if (updated) {
      team.value = updated
      try { 
        window.__teamSlotsCached = Array.isArray(team.value?.slots) ? [...team.value.slots] : [] 
      } catch (_) {}
      // Notifier globalement que l'équipe a changé
      try {
        window.dispatchEvent(new CustomEvent('team-updated', { detail: { team: team.value } }))
      } catch (_) {}
      return true
    }
  } catch (err) {
    console.error('Erreur updateTeam:', err)
  }
  return false
}

/**
 * Vérifie si une poule est dans l'équipe
 * @param {string} especeId - ID de l'espèce
 * @returns {boolean}
 */
export function isInTeam(especeId) {
  return Array.isArray(team.value?.slots) && team.value.slots.some(s => s?.especeId === especeId)
}

/**
 * Vérifie si un cooldown est actif pour une poule en mode apocalypse
 * @param {string} especeId - ID de l'espèce
 * @returns {boolean} - true si un cooldown bloque l'action
 */
function hasCooldownActive(especeId) {
  if (!apocalypse.value) return false
  
  const especeData = getEspeceData()
  const talentName = especeData[especeId]?.talent
  const activableTalents = ['Maligne', 'Joyeuse', 'Rapide']
  
  if (talentName && activableTalents.includes(talentName)) {
    const cooldownKey = `talent_${talentName}`
    const cooldownEnd = player.value?.cooldowns?.[cooldownKey]
    if (cooldownEnd) {
      const now = new Date()
      const endTime = new Date(cooldownEnd)
      if (endTime > now) {
        return true
      }
    }
  }
  return false
}

/**
 * Équipe une poule
 * @param {string} especeId - ID de l'espèce à équiper
 * @returns {Object} - { success, teamFull, currentTeam? }
 */
export async function equipChicken(especeId) {
  await fetchTeam()
  const max = team.value.maxSlots || 3
  const slots = Array.isArray(team.value.slots) ? [...team.value.slots] : []
  
  // Vérifier si l'équipe est pleine
  const filledSlots = slots.filter(s => s?.especeId).length
  
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
    // Équipe pleine
    return { success: false, teamFull: true, currentTeam: slots }
  }
  
  const success = await updateTeam(slots)
  return { success, teamFull: false }
}

/**
 * Retire une poule de l'équipe
 * @param {string} especeId - ID de l'espèce à retirer
 * @returns {boolean} - true si le retrait a réussi
 */
export async function unequipChicken(especeId) {
  await fetchTeam()
  const max = team.value.maxSlots || 3
  const slots = Array.isArray(team.value.slots) ? [...team.value.slots] : []
  
  // Vérification apocalypse: empêcher le retrait si cooldown actif
  if (hasCooldownActive(especeId)) {
    window.$toast?.('Impossible de retirer cette poule - capacité en recharge (mode Apocalypse)', 'error')
    return false
  }
  
  for (let i = 0; i < Math.min(max, slots.length); i++) {
    if (slots[i]?.especeId === especeId) {
      slots[i] = { especeId: null }
    }
  }
  return updateTeam(slots)
}

/**
 * Remplace un membre d'équipe à un slot spécifique
 * @param {number} slotIndex - Index du slot
 * @param {string} newEspeceId - ID de la nouvelle espèce
 * @returns {Object} - { success }
 */
export async function replaceTeamMember(slotIndex, newEspeceId) {
  await fetchTeam()
  const max = team.value.maxSlots || 3
  const slots = Array.isArray(team.value.slots) ? [...team.value.slots] : []
  
  // Vérification apocalypse sur la poule à remplacer
  if (slotIndex >= 0 && slotIndex < max) {
    const currentEspeceId = slots[slotIndex]?.especeId
    if (currentEspeceId && hasCooldownActive(currentEspeceId)) {
      window.$toast?.('Impossible de remplacer cette poule - capacité en recharge (mode Apocalypse)', 'error')
      return { success: false }
    }
    
    slots[slotIndex] = { especeId: newEspeceId }
    const success = await updateTeam(slots)
    return { success }
  }
  
  return { success: false }
}
