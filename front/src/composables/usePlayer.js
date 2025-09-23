import { ref } from 'vue'

const eggs = ref(0)

export function usePlayer() {
  async function refreshPlayer() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/egg/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        eggs.value = data.totalEggs || 0
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données du joueur:', error)
    }
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

  function getLevel() {
    return 5
  }

  return {
    eggs,
    addEggs,
    spendEggs,
    setEggs,
    getLevel,
    refreshPlayer
  }
}
