import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import { useAuth } from './useAuth'

const eggState = ref({
  income: 1,
  maxIncome: 30,
  currentStocked: 0,
  lastClick: new Date(),
  totalEggs: 0,
  isLoading: false
})

let updateInterval = null

export function useEgg() {
  const { token } = useAuth()

  const API_BASE = 'http://localhost:3002/api/egg'

  // État calculé pour l'affichage
  const currentGains = computed(() => {
    const now = new Date()
    const timeDiff = Math.floor((now - new Date(eggState.value.lastClick)) / 1000)
    const calculated = Math.min(timeDiff * eggState.value.income, eggState.value.maxIncome)
    return Math.floor(calculated)
  })

  const isClickable = computed(() => {
    return eggState.value.income >= 1 && currentGains.value >= 1
  })

  const progressPercentage = computed(() => {
    return Math.min((currentGains.value / eggState.value.maxIncome) * 100, 100)
  })

  // Récupérer le statut de l'œuf depuis l'API
  const fetchEggStatus = async () => {
    if (!token.value) return

    try {
      const response = await fetch(`${API_BASE}/status`, {
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        eggState.value = {
          ...eggState.value,
          income: data.income,
          maxIncome: data.maxIncome,
          lastClick: new Date(data.lastClick),
          totalEggs: data.totalEggs
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut de l\'œuf:', error)
      window.$toast("Erreur")
    }
  }

  // Cliquer sur l'œuf
  const clickEgg = async () => {
    if (!token.value || !isClickable.value || eggState.value.isLoading) return

    eggState.value.isLoading = true

    try {
      const response = await fetch(`${API_BASE}/click`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        eggState.value = {
          ...eggState.value,
          totalEggs: data.totalEggs,
          lastClick: new Date(data.lastClick)
        }

        // Afficher un message de succès si disponible
        if (window.$toast) {
          //window.$toast(`+${data.eggsGained} œufs collectés !`, 'success')
        }
      } else {
        const error = await response.json()
        if (window.$toast) {
          window.$toast(error.error || 'Erreur lors du clic', 'error')
        }
      }
    } catch (error) {
      console.error('Erreur lors du clic sur l\'œuf:', error)
      if (window.$toast) {
        window.$toast('Erreur de connexion', 'error')
      }
    } finally {
      eggState.value.isLoading = false
    }
  }

  // Démarrer les mises à jour automatiques
  const startUpdates = () => {
    if (updateInterval) return

    updateInterval = setInterval(() => {
      // Force la réactivité en mettant à jour une référence
      eggState.value = { ...eggState.value }
    }, 1000)
  }

  // Arrêter les mises à jour automatiques
  const stopUpdates = () => {
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
  }

  return {
    // État
    eggState: readonly(eggState),
    
    // Propriétés calculées
    currentGains,
    isClickable,
    progressPercentage,
    
    // Méthodes
    fetchEggStatus,
    clickEgg,
    startUpdates,
    stopUpdates
  }
}