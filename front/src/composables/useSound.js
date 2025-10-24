// composables/useSound.js
import { ref, watchEffect } from 'vue'
import { useSettings } from './useSettings'

// Petit gestionnaire d'audio (HTMLAudioElement) avec mise en cache et respect du volume/mute
// Contrat
// - play(key: string, opts?: { volume?: number }): joue un son par clé
// - helpers: click(), open(), close(), back(), confirm(), achievement(), toast(type)
// - Respecte settings.sound (mute) et settings.volume (0..100)

const cache = new Map()
const DEFAULT_VOLUME = 0.6

// Mapping des événements -> fichiers. Ajuste au besoin.
const SOUND_MAP = {
  click: new URL('../assets/sounds/ui/click_003.ogg', import.meta.url).href,
  click_soft: new URL('../assets/sounds/ui/click_001.ogg', import.meta.url).href,
  open: new URL('../assets/sounds/ui/bong_001.ogg', import.meta.url).href,
  close: new URL('../assets/sounds/ui/drop_001.ogg', import.meta.url).href,
  back: new URL('../assets/sounds/ui/back_002.ogg', import.meta.url).href,
  confirm: new URL('../assets/sounds/ui/confirmation_001.ogg', import.meta.url).href,
  achievement: new URL('../assets/sounds/ui/confirmation_004.ogg', import.meta.url).href,
  toast_info: new URL('../assets/sounds/ui/click_002.ogg', import.meta.url).href,
  toast_success: new URL('../assets/sounds/ui/confirmation_003.ogg', import.meta.url).href,
  toast_error: new URL('../assets/sounds/ui/close_001.ogg', import.meta.url).href,
  // Spécifiques jeu œuf/income
  egg_click: new URL('../assets/sounds/ui/pluck_001.ogg', import.meta.url).href,
  income_up: new URL('../assets/sounds/ui/glass_002.ogg', import.meta.url).href
  ,
  // Marché / boîtes
  box_open: new URL('../assets/sounds/ui/error_004.ogg', import.meta.url).href,
  chicken_results: new URL('../assets/sounds/ui/chicken-results.ogg', import.meta.url).href,
  // Légendaire
  dark_item: new URL('../assets/sounds/ui/dark-item.mp3', import.meta.url).href,
  // Épique
  epic_item: new URL('../assets/sounds/ui/confirmation_002.ogg', import.meta.url).href,
  // Nouveaux sons
  question: new URL('../assets/sounds/ui/question_003.ogg', import.meta.url).href,
  select_001: new URL('../assets/sounds/ui/select_001.ogg', import.meta.url).href,
  select_005: new URL('../assets/sounds/ui/select_005.ogg', import.meta.url).href,
  scratch_001: new URL('../assets/sounds/ui/scratch_001.ogg', import.meta.url).href,
  scratch_002: new URL('../assets/sounds/ui/scratch_002.ogg', import.meta.url).href,
  scratch_003: new URL('../assets/sounds/ui/scratch_003.ogg', import.meta.url).href,
  scratch_004: new URL('../assets/sounds/ui/scratch_004.ogg', import.meta.url).href,
  scratch_005: new URL('../assets/sounds/ui/scratch_005.ogg', import.meta.url).href,
  select_004: new URL('../assets/sounds/ui/select_004.ogg', import.meta.url).href,
  pluck_002: new URL('../assets/sounds/ui/pluck_002.ogg', import.meta.url).href
}

function getAudio(key) {
  if (!SOUND_MAP[key]) return null
  if (cache.has(key)) return cache.get(key)
  const audio = new Audio(SOUND_MAP[key])
  audio.preload = 'auto'
  cache.set(key, audio)
  return audio
}

export function useSound() {
  const { settings } = useSettings()
  const isMuted = ref(false)
  const masterVolume = ref(DEFAULT_VOLUME)

  // Synchroniser avec les settings utilisateur
  watchEffect(() => {
    const s = settings.value || {}
    isMuted.value = !s.sound
    // 0..100 -> 0..1 + léger plafonnement
    masterVolume.value = Math.max(0, Math.min(1, Number(s.volume ?? 100) / 100))
  })

  function play(key, opts = {}) {
    if (!SOUND_MAP[key]) return
    if (isMuted.value || masterVolume.value === 0) return // Ne joue pas si mute ou volume à 0
    const audio = getAudio(key)
    if (!audio) return
    try {
      // Pour permettre les déclenchements simultanés, on clone le buffer si en cours
      const instance = audio.cloneNode(true)
      const vol = typeof opts.volume === 'number' ? opts.volume : DEFAULT_VOLUME
      const finalVolume = Math.max(0, Math.min(1, vol * masterVolume.value))
      if (finalVolume === 0) return // Ne joue pas si volume final à 0
      instance.volume = finalVolume
      // Astuce mobile: play() doit être déclenché par un event utilisateur
      instance.currentTime = 0
      instance.play().catch(() => {})
    } catch (_) {
      // ignore
    }
  }

  // Helpers courants
  const click = () => play('click')
  const clickSoft = () => play('click_soft')
  const open = () => play('open')
  const close = () => play('close', { volume: 0.5 })
  const back = () => play('back')
  const confirm = () => play('confirm')
  const achievement = () => play('achievement')
  const toast = (type = 'info') => {
    if (type === 'success') play('toast_success')
    else if (type === 'error') play('toast_error')
    else if (type === 'achievement') play('achievement', { volume: 0.25 })
    else play('toast_info')
  }
  // Nouveaux helpers
  const eggClick = () => play('egg_click')
  const incomeUp = () => play('income_up', { volume: 0.05 })
  // Marché
  // Marché (volume un peu plus présent pour feedback clair)
  const boxOpen = (volume = 0.9) => play('box_open', { volume })
  const boxResults = (volume = 0.85) => play('chicken_results', { volume })
  // Drop légendaire
  const legendaryDrop = (volume = 1) => play('dark_item', { volume })
  // Drop épique
  const epicDrop = (volume = 0.9) => play('epic_item', { volume })
  // Nouveaux helpers
  const newItem = () => play('question')
  const profileClick = () => play('select_001', { volume: 0.4 })
  const giftCollect = () => play('select_005', { volume: 0.2 })
  const miningBasic = () => {
    const scratches = ['scratch_001', 'scratch_002', 'scratch_003', 'scratch_004', 'scratch_005']
    const randomScratch = scratches[Math.floor(Math.random() * scratches.length)]
    play(randomScratch, { volume: 0.15 })
  }
  const miningExplosion = () => play('select_004', { volume: 0.15 })
  const miningContinue = () => play('pluck_002', { volume: 0.15 })

  return {
    play,
    click,
    clickSoft,
    open,
    close,
    back,
    confirm,
    achievement,
    toast,
    eggClick,
    incomeUp,
    boxOpen,
    boxResults,
    legendaryDrop,
    epicDrop,
    newItem,
    profileClick,
    giftCollect,
    miningBasic,
    miningExplosion,
    miningContinue
  }
}
