import { ref } from 'vue'
import { apiGet, apiPost } from '@/utils/api'

const chestKeys = ref(0)
const ownedArtifacts = ref([])
const totalArtifacts = ref(0)
const loading = ref(false)

export function useChest() {
  // Récupère les informations sur les coffres
  async function fetchChestInfo() {
    loading.value = true
    try {
      const data = await apiGet('/api/chest/info')
      chestKeys.value = data.chestKeys || 0
      ownedArtifacts.value = data.ownedArtifacts || []
      totalArtifacts.value = data.totalArtifacts || 0
      return data
    } catch (err) {
      console.error('Erreur lors de la récupération des infos coffres:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Ouvre un coffre
  async function openChest() {
    loading.value = true
    try {
      const data = await apiPost('/api/chest/open')

      if (data.success) {
        chestKeys.value = data.chestKeys || 0

        // Si l'artéfact n'était pas déjà possédé, l'ajouter à la liste
        if (!data.alreadyOwned && data.artifact) {
          ownedArtifacts.value.push(data.artifact.id)
        }

        // Déclencher un événement pour rafraîchir les achievements
        window.dispatchEvent(new CustomEvent('chest-opened'))

        return data
      }
    } catch (err) {
      console.error('Erreur lors de l\'ouverture du coffre:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    chestKeys,
    ownedArtifacts,
    totalArtifacts,
    loading,
    fetchChestInfo,
    openChest
  }
}