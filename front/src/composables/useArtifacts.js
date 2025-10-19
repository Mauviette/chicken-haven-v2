import { ref, computed } from 'vue'
import { apiGet } from '@/utils/api'

// État partagé des artefacts du joueur
const artifacts = ref([])
const loading = ref(false)

export function useArtifacts() {
  // Récupère la liste des artefacts possédés par le joueur
  async function fetchArtifacts() {
    loading.value = true
    try {
      const data = await apiGet('/api/user/artifacts')
      artifacts.value = data.artifacts || []
      return data
    } catch (err) {
      console.error('Erreur lors de la récupération des artefacts:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Enrichit les artefacts avec les données du jeu
  // Retourne TOUS les artefacts (possédés et non possédés)
  function enrichArtifacts(artifactsData) {
    if (!artifactsData) return []
    
    // Créer un Set des IDs possédés pour une recherche rapide
    const ownedIds = new Set(artifacts.value.map(a => a.artifactId))
    
    // Créer un Map des artefacts possédés pour accéder facilement aux données
    const ownedMap = new Map(artifacts.value.map(a => [a.artifactId, a]))
    
    // Retourner tous les artefacts du jeu avec le flag owned
    return Object.values(artifactsData).map(artifactData => {
      const isOwned = ownedIds.has(artifactData.id)
      const ownedArtifact = ownedMap.get(artifactData.id)
      
      return {
        artifactId: artifactData.id,
        owned: isOwned,
        ...artifactData,
        ...(ownedArtifact || {})
      }
    })
  }

  // Vérifie si un artefact est possédé
  function hasArtifact(artifactId) {
    return artifacts.value.some(a => a.artifactId === artifactId)
  }

  return {
    artifacts,
    loading,
    fetchArtifacts,
    enrichArtifacts,
    hasArtifact
  }
}
