// composables/useSocial.js
import { ref, computed } from 'vue'
import { apiGet } from '@/utils/api'
import { useToast } from '@/composables/useToast'

const leaderboards = ref(null)
const userRankings = ref(null)
const meta = ref(null)
const loading = ref(false)
const error = ref(null)

export function useSocial() {
  const { toast } = useToast()

  const fetchLeaderboards = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiGet('/api/social/leaderboards')
      
      if (response.success) {
        leaderboards.value = response.leaderboards
        userRankings.value = response.userRankings
        meta.value = response.meta
      } else {
        throw new Error(response.error || 'Erreur lors du chargement des classements')
      }
    } catch (err) {
      console.error('Erreur fetchLeaderboards:', err)
      error.value = err.message || 'Erreur de connexion'
      toast?.('Impossible de charger les classements', 'error')
    } finally {
      loading.value = false
    }
  }

  const fetchPlayerProfile = async (profileId) => {
    if (!profileId) return null
    
    try {
      const response = await apiGet(`/api/social/player/${profileId}`)
      
      if (response.success) {
        return response.player
      } else {
        throw new Error(response.error || 'Joueur introuvable')
      }
    } catch (err) {
      console.error('Erreur fetchPlayerProfile:', err)
      toast?.('Impossible de charger le profil du joueur', 'error')
      return null
    }
  }

  // Getters computed
  const hasLeaderboards = computed(() => {
    return leaderboards.value && 
           leaderboards.value.totalEggs && 
           leaderboards.value.maxEggs && 
           leaderboards.value.chickens
  })

  const totalEggsLeaderboard = computed(() => leaderboards.value?.totalEggs || [])
  const maxEggsLeaderboard = computed(() => leaderboards.value?.maxEggs || [])
  const chickensLeaderboard = computed(() => leaderboards.value?.chickens || [])

  const currentUserRanking = computed(() => userRankings.value)

  return {
    // State
    leaderboards,
    userRankings,
    meta,
    loading,
    error,
    
    // Computed
    hasLeaderboards,
    totalEggsLeaderboard,
    maxEggsLeaderboard,
    chickensLeaderboard,
    currentUserRanking,
    
    // Actions
    fetchLeaderboards,
    fetchPlayerProfile
  }
}