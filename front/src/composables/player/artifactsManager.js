/**
 * Gestion des artefacts équipés du joueur
 */
import { apiGet, apiPut } from '@/utils/api.js'
import { artifactSlots } from './playerState.js'

/**
 * Récupère les slots d'artefacts depuis le serveur
 */
export async function fetchArtifactSlots() {
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

/**
 * Équipe un artefact
 * @param {string} artifactId - ID de l'artefact à équiper
 * @returns {boolean} - true si l'équipement a réussi
 * @throws {Error} - Si tous les emplacements sont occupés
 */
export async function equipArtifact(artifactId) {
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

/**
 * Retire un artefact équipé
 * @param {string} artifactId - ID de l'artefact à retirer
 * @returns {boolean} - true si le retrait a réussi
 */
export async function unequipArtifact(artifactId) {
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
