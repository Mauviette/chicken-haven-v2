// composables/useSettings.js
import { ref, watch } from 'vue'
import { useAuth } from './useAuth'

const settings = ref({
  sound: true,
  animations: true
})

const isLoaded = ref(false)

export function useSettings() {
  const { token } = useAuth()

  async function fetchSettings() {
    if (!token.value) return
    try {
        const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token.value}` }
          })
      
      const data = await res.json()
      settings.value = data.settings || {}
      isLoaded.value = true
    } catch (err) {
      console.error('Erreur lors du chargement des settings :', err)
    }
  }

  async function saveSettings() {
    if (!token.value) return
    try {
        await fetch('/api/auth/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.value}`
          },
          body: JSON.stringify({ settings: settings.value })
        })
        
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des settings :', err)
    }
  }

  // Auto-save à chaque modif
  watch(settings, saveSettings, { deep: true })

  return {
    settings,
    fetchSettings,
    isLoaded
  }
}
