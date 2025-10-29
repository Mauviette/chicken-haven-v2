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

  // Leaderboards filtrés selon le mode
  const totalEggsLeaderboard = computed(() => {
    const players = leaderboards.value?.totalEggs || []
    return filterPlayersByMode(players)
  })
  
  const maxEggsLeaderboard = computed(() => {
    const players = leaderboards.value?.maxEggs || []
    return filterPlayersByMode(players)
  })
  
  const chickensLeaderboard = computed(() => {
    const players = leaderboards.value?.chickens || []
    return filterPlayersByMode(players)
  })

  // Rankings utilisateur filtrés selon le mode
  const currentUserRanking = computed(() => {
    if (!userRankings.value) return null
    
    const rankings = { ...userRankings.value }
    
    // Recalculer les rangs en fonction du mode filtré
    if (leaderboardMode.value === 'classic') {
      // Pour le mode classique, on garde les rangs originaux mais on filtre les comptes apocalypse
      // Les rangs sont recalculés côté serveur ou on les ajuste ici
      if (rankings.totalEggs && rankings.totalEggs.rank) {
        const classicPlayers = filterPlayersByMode(leaderboards.value?.totalEggs || [])
        const userIndex = classicPlayers.findIndex(p => p.profileId === rankings.totalEggs.profileId)
        rankings.totalEggs.rank = userIndex >= 0 ? userIndex + 1 : rankings.totalEggs.rank
        rankings.totalEggs.total = classicPlayers.length
      }
      if (rankings.maxEggs && rankings.maxEggs.rank) {
        const classicPlayers = filterPlayersByMode(leaderboards.value?.maxEggs || [])
        const userIndex = classicPlayers.findIndex(p => p.profileId === rankings.maxEggs.profileId)
        rankings.maxEggs.rank = userIndex >= 0 ? userIndex + 1 : rankings.maxEggs.rank
        rankings.maxEggs.total = classicPlayers.length
      }
      if (rankings.chickens && rankings.chickens.rank) {
        const classicPlayers = filterPlayersByMode(leaderboards.value?.chickens || [])
        const userIndex = classicPlayers.findIndex(p => p.profileId === rankings.chickens.profileId)
        rankings.chickens.rank = userIndex >= 0 ? userIndex + 1 : rankings.chickens.rank
        rankings.chickens.total = classicPlayers.length
      }
    } else if (leaderboardMode.value === 'apocalypse') {
      // Pour le mode apocalypse, même logique
      if (rankings.totalEggs && rankings.totalEggs.rank) {
        const apocalypsePlayers = filterPlayersByMode(leaderboards.value?.totalEggs || [])
        const userIndex = apocalypsePlayers.findIndex(p => p.profileId === rankings.totalEggs.profileId)
        rankings.totalEggs.rank = userIndex >= 0 ? userIndex + 1 : rankings.totalEggs.rank
        rankings.totalEggs.total = apocalypsePlayers.length
      }
      if (rankings.maxEggs && rankings.maxEggs.rank) {
        const apocalypsePlayers = filterPlayersByMode(leaderboards.value?.maxEggs || [])
        const userIndex = apocalypsePlayers.findIndex(p => p.profileId === rankings.maxEggs.profileId)
        rankings.maxEggs.rank = userIndex >= 0 ? userIndex + 1 : rankings.maxEggs.rank
        rankings.maxEggs.total = apocalypsePlayers.length
      }
      if (rankings.chickens && rankings.chickens.rank) {
        const apocalypsePlayers = filterPlayersByMode(leaderboards.value?.chickens || [])
        const userIndex = apocalypsePlayers.findIndex(p => p.profileId === rankings.chickens.profileId)
        rankings.chickens.rank = userIndex >= 0 ? userIndex + 1 : rankings.chickens.rank
        rankings.chickens.total = apocalypsePlayers.length
      }
    }
    
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