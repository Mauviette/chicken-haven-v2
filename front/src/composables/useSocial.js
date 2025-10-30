// composables/useSocial.js
import { ref, computed } from 'vue'
import { apiGet } from '@/utils/api'
import { useToast } from '@/composables/useToast'

const leaderboards = ref(null)
const userRankings = ref(null)
const meta = ref(null)
const loading = ref(false)
const error = ref(null)

// État pour le mode de leaderboard sélectionné
const leaderboardMode = ref('classic') // 'classic' ou 'apocalypse'

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

  // Fonction pour changer le mode de leaderboard
  const setLeaderboardMode = (mode) => {
    leaderboardMode.value = mode
  }

  // Fonction utilitaire pour filtrer les joueurs selon le mode
  const filterPlayersByMode = (players) => {
    if (!Array.isArray(players)) return []
    
    if (leaderboardMode.value === 'classic') {
      return players.filter(player => !player.apocalypse)
    } else if (leaderboardMode.value === 'apocalypse') {
      return players.filter(player => player.apocalypse)
    }
    
    return players
  }

  // Getters computed
  const hasLeaderboards = computed(() => {
    return leaderboards.value && 
           leaderboards.value.totalEggs && 
           leaderboards.value.maxEggs && 
           leaderboards.value.chickens
  })

  // Leaderboards filtrés et triés selon le mode
  const totalEggsLeaderboard = computed(() => {
    const players = leaderboards.value?.totalEggs || []
    const filtered = filterPlayersByMode(players)
    return filtered.sort((a, b) => b.value - a.value)
  })
  
  const maxEggsLeaderboard = computed(() => {
    const players = leaderboards.value?.maxEggs || []
    const filtered = filterPlayersByMode(players)
    return filtered.sort((a, b) => b.value - a.value)
  })
  
  const chickensLeaderboard = computed(() => {
    const players = leaderboards.value?.chickens || []
    const filtered = filterPlayersByMode(players)
    return filtered.sort((a, b) => b.value - a.value)
  })

  // Rankings utilisateur recalculés selon le mode
  const currentUserRanking = computed(() => {
    if (!userRankings.value || !leaderboards.value) return null
    
    const rankings = { ...userRankings.value }
    const mode = leaderboardMode.value
    
    // Fonction helper pour recalculer le rang d'un utilisateur dans une liste filtrée
    const recalculateRank = (originalRankings, leaderboardType) => {
      if (!rankings[leaderboardType] || !rankings[leaderboardType].profileId) return
      
      const allPlayers = leaderboards.value[leaderboardType] || []
      const filteredPlayers = filterPlayersByMode(allPlayers)
      
      // Trier les joueurs filtrés par valeur décroissante (comme le backend)
      const sortedFilteredPlayers = [...filteredPlayers].sort((a, b) => b.value - a.value)
      
      // Trouver la position de l'utilisateur dans la liste triée
      const userIndex = sortedFilteredPlayers.findIndex(p => p.profileId === rankings[leaderboardType].profileId)
      
      if (userIndex >= 0) {
        rankings[leaderboardType].rank = userIndex + 1
        rankings[leaderboardType].total = sortedFilteredPlayers.length
      }
    }
    
    // Recalculer les rangs pour chaque type de leaderboard
    recalculateRank(rankings, 'totalEggs')
    recalculateRank(rankings, 'maxEggs')
    recalculateRank(rankings, 'chickens')
    
    return rankings
  })

  return {
    // State
    leaderboards,
    userRankings,
    meta,
    loading,
    error,
    leaderboardMode,
    
    // Computed
    hasLeaderboards,
    totalEggsLeaderboard,
    maxEggsLeaderboard,
    chickensLeaderboard,
    currentUserRanking,
    
    // Actions
    fetchLeaderboards,
    fetchPlayerProfile,
    setLeaderboardMode
  }
}