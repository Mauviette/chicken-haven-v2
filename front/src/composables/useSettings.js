// composables/useSettings.js
import { ref, watch } from 'vue'
import { useAuth } from './useAuth'
import { apiGet, apiPatch } from '@/utils/api.js'
import { useAppLoading } from './useAppLoading'

const settings = ref({
  sound: true,
  animations: true,
  volume: 100,
  buffsEverywhere: false, // Option pour afficher les buffs sur toutes les pages
  darkMode: false, // Mode sombre pour une meilleure visibilité de nuit
  collectionSort: {
    key: 'quantite',
    order: 'desc'
  }
})

const isLoaded = ref(false)

export function useSettings() {
  const { token } = useAuth()
  const { setSettingsLoading } = useAppLoading()

  async function fetchSettings() {
    if (!token.value) {
      // Marquer comme chargées si pas de token
      setSettingsLoading(false)
      return
    }
    try {
      const data = await apiGet('/api/auth/me')
      // Fusionner avec des valeurs par défaut et normaliser
      const incoming = data?.settings || {}
      const merged = {
        sound: true,
        animations: true,
        volume: 100,
        buffsEverywhere: false,
        darkMode: false,
        collectionSort: {
          key: 'quantite',
          order: 'desc'
        },
        ...incoming,
        collectionSort: {
          key: incoming.collectionSort?.key || 'quantite',
          order: incoming.collectionSort?.order || 'desc'
        }
      }
      // Clamp/typer
      merged.volume = Math.max(0, Math.min(100, Number(merged.volume ?? 100)))
      merged.sound = Boolean(merged.sound)
      merged.animations = Boolean(merged.animations)
      settings.value = merged
      isLoaded.value = true
      
      // Marquer comme chargées
      setSettingsLoading(false)
    } catch (err) {
      console.error('Erreur lors du chargement des settings :', err)
      // Marquer comme chargées même en cas d'erreur
      setSettingsLoading(false)
    }
  }

  async function saveSettings() {
    if (!token.value) return
    try {
        // Normaliser avant d'envoyer
        const out = {
          sound: Boolean(settings.value?.sound),
          animations: Boolean(settings.value?.animations),
          volume: Math.max(0, Math.min(100, Number(settings.value?.volume ?? 100))),
          buffsEverywhere: Boolean(settings.value?.buffsEverywhere),
          darkMode: Boolean(settings.value?.darkMode),
          collectionSort: {
            key: settings.value?.collectionSort?.key || 'quantite',
            order: settings.value?.collectionSort?.order || 'desc'
          }
        }
        await apiPatch('/api/auth/settings', { settings: out })
        
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
