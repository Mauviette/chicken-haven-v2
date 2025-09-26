// composables/useSettings.js
import { ref, watch } from 'vue'
import { useAuth } from './useAuth'

const settings = ref({
  sound: true,
  animations: true,
  volume: 100,
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
      // Fusionner avec des valeurs par défaut et normaliser
      const incoming = data?.settings || {}
      const merged = {
        sound: true,
        animations: true,
        volume: 100,
        ...incoming,
      }
      // Clamp/typer
      merged.volume = Math.max(0, Math.min(100, Number(merged.volume ?? 100)))
      merged.sound = Boolean(merged.sound)
      merged.animations = Boolean(merged.animations)
      settings.value = merged
      isLoaded.value = true
    } catch (err) {
      console.error('Erreur lors du chargement des settings :', err)
    }
  }

  async function saveSettings() {
    if (!token.value) return
    try {
        // Normaliser avant d'envoyer
        const out = {
          sound: Boolean(settings.value?.sound),
          animations: Boolean(settings.value?.animations),
          volume: Math.max(0, Math.min(100, Number(settings.value?.volume ?? 100)))
        }
        await fetch('/api/auth/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.value}`
          },
          body: JSON.stringify({ settings: out })
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
