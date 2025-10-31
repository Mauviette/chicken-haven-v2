<template>
  <!-- Conteneur acteur positionné relativement à la scène (parent .stage) -->
  <div class="actor" :class="{ 'has-special': hasSpecialFeature }" :style="{ left: x + 'px' }">
      <Tooltip :text="tooltipHtml" :key="tooltipHtml" v-if="!isMobile" :force-hide="forceHideTooltip">
      <div class="parade-wrapper">
        <img
        v-if="currentImg"
        :src="currentImg"
        ref="chickenRef"
        class="parade-chicken"
        :class="[state, isFallback ? 'fallback' : '', isUpgrading ? 'upgrading' : '']"
        :alt="name"
        :data-espece-id="especeId"
        :style="{ '--dir': direction }"
        @click="emitOpenDetail"
        />
        <!-- Particules d'amélioration -->
        <div v-if="isUpgrading" class="upgrade-particles">
          <span class="particle" v-for="i in 8" :key="i" :style="{ '--delay': (i * 0.1) + 's', '--angle': (i * 45) + 'deg' }">✨</span>
        </div>
  <!-- Indicateur talent activable: petit éclair en haut à droite -->
  <span v-if="isActivableTalent" :class="['badge-activable', { 'not-ready': !isTalentReady }]">
    ⚡
    <span class="badge-subtype">{{ talentSubIcon }}</span>
  </span>
  <!-- Badge amélioration disponible: flèche verte en haut à gauche -->
  <span v-if="showUpgradeBadge" class="badge-upgrade" aria-label="Amélioration disponible">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="upgrade-icon">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  </span>
  <!-- Indicateur cadeau disponible: brillance et icône cadeau -->
  <div v-if="hasChickenGift" class="gift-indicator">
    <span
      class="gift-icon"
      role="button"
      tabindex="0"
      aria-label="Collecter le cadeau"
      @click.stop="onGiftClick"
      @keydown.stop.prevent="onGiftKeydown"
    >🎁</span>
  </div>
      </div>
    </Tooltip>
    <!-- Version sans tooltip pour mobile -->
    <div class="parade-wrapper" v-if="currentImg && isMobile">
      <img
      v-if="currentImg && isMobile"
      :src="currentImg"
      ref="chickenRef"
      class="parade-chicken"
      :class="[state, isFallback ? 'fallback' : '', isUpgrading ? 'upgrading' : '']"
      :alt="name"
      :data-espece-id="especeId"
      :style="{ '--dir': direction }"
      @click="emitOpenDetail"
      />
      <!-- Particules d'amélioration pour mobile -->
      <div v-if="isUpgrading" class="upgrade-particles">
        <span class="particle" v-for="i in 8" :key="i" :style="{ '--delay': (i * 0.1) + 's', '--angle': (i * 45) + 'deg' }">✨</span>
      </div>
  <span v-if="isActivableTalent" :class="['badge-activable', { 'not-ready': !isTalentReady }]">
    ⚡
    <span class="badge-subtype">{{ talentSubIcon }}</span>
  </span>
  <!-- Badge amélioration disponible pour mobile -->
  <span v-if="showUpgradeBadge" class="badge-upgrade" aria-label="Amélioration disponible">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="upgrade-icon">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  </span>
  <!-- Indicateur cadeau disponible pour mobile -->
  <div v-if="hasChickenGift" class="gift-indicator">
    <span
      class="gift-icon"
      role="button"
      tabindex="0"
      aria-label="Collecter le cadeau"
      @click.stop="onGiftClick"
      @keydown.stop.prevent="onGiftKeydown"
    >🎁</span>
  </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import Tooltip from '@/components/menu/Tooltip.vue'
import { usePoules } from '@/composables/usePoules'
import { useGameData } from '@/composables/useGameData'
import { apiCall } from '@/utils/api'
import { useSound } from '@/composables/useSound'
import { useEgg } from '@/composables/useEgg'
import { useBuffs } from '@/composables/useBuffs'
import { useChickenGifts } from '@/composables/useChickenGifts'
import { useAchievements } from '@/composables/useAchievements'

const props = defineProps({
  especeId: String,
  name: String,
  talentEffect: String,
  images: Object, // { walk, idle, peck, fallback }
  energy: { type: Number, default: 3 },
  containerWidth: { type: Number, default: 800 },
  statBuffs: { type: Object, default: () => ({ intelligence: 0, energie: 0, charisme: 0 }) }
})

const emit = defineEmits(['open-detail'])

const x = ref(0)
const direction = ref(Math.random() < 0.5 ? 1 : -1)
const state = ref('idle') // 'walk' | 'idle' | 'peck'
const currentImg = ref('')
const stateUntil = ref(Date.now() + 2000)
const isFallback = ref(false)
const isActivating = ref(false)
const forceHideTooltip = ref(false)

// Référence à l'élément poule pour obtenir sa position
const chickenRef = ref(null)

// Détection mobile
const isMobile = ref(window.innerWidth <= 768)

// Écouter les changements de taille d'écran
function updateMobileState() {
  isMobile.value = window.innerWidth <= 768
}

const isUpgrading = ref(false)

// Écouter l'événement d'amélioration de poule
function onChickenUpgraded(event) {
  // Vérifier si c'est cette poule qui a été améliorée
  if (event.detail?.especeId === props.especeId) {
    isUpgrading.value = true
    // Réinitialiser après l'animation (0.8 secondes)
    setTimeout(() => {
      isUpgrading.value = false
    }, 800)
  }
}

onMounted(() => {
  window.addEventListener('resize', updateMobileState)
  window.addEventListener('chicken-upgraded', onChickenUpgraded)
  initPosition()
  applyImage()
  rafId = requestAnimationFrame(step)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMobileState)
  window.removeEventListener('chicken-upgraded', onChickenUpgraded)
  if (rafId) cancelAnimationFrame(rafId)
})

function applyImage() {
  const img = props.images?.[state.value] || props.images?.fallback
  currentImg.value = img || ''
  // Fallback
  isFallback.value = !props.images?.[state.value] && !!props.images?.fallback
}

function rand(min, max) { return Math.random() * (max - min) + min }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)] }

let rafId = null
let lastTs = 0

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function step(ts) {
  if (!lastTs) lastTs = ts
  const dt = (ts - lastTs) / 1000
  lastTs = ts

  const padding = 10
  const maxX = Math.max(padding, props.containerWidth - padding - 56)
  const minX = padding

  const now = Date.now()
  if (now >= stateUntil.value) {
    const next = choice(['walk', 'walk', 'idle', 'peck'])
    state.value = next
    stateUntil.value = now + (next === 'walk' ? rand(2200, 5200) : rand(1200, 2600))
    if (Math.random() < 0.35) direction.value *= -1
    applyImage()
  }

  if (state.value === 'walk') {
    const speed = 10 + (props.energy - 1) * 4 // px/s (lent)
    x.value += speed * direction.value * dt
    if (x.value < minX) { x.value = minX; direction.value = 1; state.value = Math.random() < 0.5 ? 'idle' : 'peck'; stateUntil.value = now + rand(900, 1800); applyImage() }
    if (x.value > maxX) { x.value = maxX; direction.value = -1; state.value = Math.random() < 0.5 ? 'idle' : 'peck'; stateUntil.value = now + rand(900, 1800); applyImage() }
  }

  // Lecture unique pour peck: une fois la fenêtre passée, revenir en idle
  if (state.value === 'peck' && Date.now() >= stateUntil.value) {
    state.value = 'idle'
    stateUntil.value = Date.now() + rand(1200, 2600)
    applyImage()
  }

  rafId = requestAnimationFrame(step)
}

function initPosition() {
  const padding = 10
  const maxX = Math.max(padding, props.containerWidth - padding - 56)
  x.value = rand(padding, maxX)
}

function emitOpenDetail() {
  // Vérifier d'abord si cette poule a un cadeau actif
  if (hasChickenGift.value) {
    // Récupérer la position de la poule pour l'animation
    let position = null
    if (chickenRef.value) {
      const rect = chickenRef.value.getBoundingClientRect()
      position = {
        x: rect.left + rect.width / 2,
        y: rect.top - 20 // Un peu au-dessus de la poule
      }
    }
    collectGift(props.especeId, position)
    // Forcer la fermeture de la tooltip
    forceHideTooltip.value = true
    nextTick(() => {
      forceHideTooltip.value = false
    })
    giftCollect()
    return
  }

  if (!props.especeId) return
  const talent = especeDataFor(props.especeId)?.talent
  if (talent === 'Maligne' || talent === 'Joyeuse' || talent === 'Rapide' || talent === 'Temporelle') {
    if (isTalentReady.value) {
      triggerActiveTalent(talent)
    } else {
      // Pas prêt: ouvrir détail
      emit('open-detail', props.especeId)
    }
  } else {
    emit('open-detail', props.especeId)
  }
}

// Fonction pour créer les effets visuels d'activation du time_stop
function createTimeStopActivationEffects() {
  if (!chickenRef.value) {
    return
  }
  
  const chickenRect = chickenRef.value.getBoundingClientRect()
  const stageRect = chickenRef.value.closest('.stage')?.getBoundingClientRect()
  if (!stageRect) {
    return
  }
  
  // Position relative à la scène
  const relativeX = chickenRect.left - stageRect.left + chickenRect.width / 2
  const relativeY = chickenRect.top - stageRect.top + chickenRect.height / 2
  
  // Calculer la position sur la poule (même position)
  const offsetX = 0 // Même position X
  const offsetY = -28 // Aligner le bas du fantôme avec le bas de la poule
  
  // 1. Silhouette fantomatique derrière la poule
  const ghostElement = document.createElement('img')
  ghostElement.src = '/src/assets/chickens/pouletaro/stand/basic.png'
  ghostElement.style.cssText = `
    position: absolute;
    left: ${relativeX + offsetX}px;
    top: ${relativeY + offsetY}px;
    width: 56px;
    height: 56px;
    opacity: 0;
    filter: grayscale(0.6) invert(1);
    transform: scaleX(${direction.value}) scale(1);
    transform-origin: bottom center;
    pointer-events: none;
    z-index: 25;
    image-rendering: pixelated;
  `
  
  const stageElement = chickenRef.value.closest('.stage')
  if (stageElement) {
    stageElement.appendChild(ghostElement)
    
    // Animation de la silhouette fantomatique RAPIDE
    ghostElement.animate([
      { opacity: 0, transform: `scaleX(${direction.value}) scale(1) translateX(0)` },
      { opacity: 1, transform: `scaleX(${direction.value}) scale(1) translateX(-5px)`, offset: 0.4 },
      { opacity: 0, transform: `scaleX(${direction.value}) scale(1) translateX(-10px)` }
    ], {
      duration: 600, // Plus rapide : 600ms au lieu de 1200ms
      easing: 'ease-out'
    })
    
    setTimeout(() => {
      if (ghostElement.parentNode) {
        ghostElement.remove()
      }
    }, 600)
  }
  
  // 2. Cercle blanc qui sort de la poule RAPIDEMENT
  const circleElement = document.createElement('div')
  circleElement.style.cssText = `
    position: absolute;
    left: ${relativeX}px;
    top: ${relativeY}px;
    width: 20px;
    height: 20px;
    background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 24;
  `
  
  if (stageElement) {
    stageElement.appendChild(circleElement)
    
    // Animation du cercle RAPIDE
    circleElement.animate([
      { 
        width: '20px', 
        height: '20px', 
        opacity: 1,
        transform: 'translate(-50%, -50%) scale(1)'
      },
      { 
        width: '150px', 
        height: '150px', 
        opacity: 0.7,
        transform: 'translate(-50%, -50%) scale(1)',
        offset: 0.6
      },
      { 
        width: '200px', 
        height: '200px', 
        opacity: 0,
        transform: 'translate(-50%, -50%) scale(1)'
      }
    ], {
      duration: 400, // Plus rapide : 400ms au lieu de 800ms
      easing: 'ease-out'
    })
    
    setTimeout(() => {
      if (circleElement.parentNode) {
        circleElement.remove()
      }
    }, 400)
  }
}

// Tooltip combinant nom en gras + effet du talent
const { especies, poules, getTalentEffectSync, getTalentNextCost } = usePoules()
const { talents } = useGameData()
const { click: sndClick, confirm: sndOk, giftCollect } = useSound()
const { eggState, fetchEggStatus } = useEgg()
const { fetchBuffs } = useBuffs()
const { hasActiveGift, collectGift } = useChickenGifts()
const { incrementProgress } = useAchievements()

// Collecte de cadeau déclenchée depuis l'UI (icone)
function onGiftClick(e) {
  try {
    // empêcher la propagation vers le click sur la poule
    if (e && e.stopPropagation) e.stopPropagation()
  } catch (_) {}
  if (!props.especeId) return
  if (!hasChickenGift.value) return
  // position centrale de la poule pour l'animation
  let position = null
  if (chickenRef.value) {
    try {
      const rect = chickenRef.value.getBoundingClientRect()
      position = { x: rect.left + rect.width / 2, y: rect.top - 20 }
    } catch (_) { position = null }
  }
  // Appeler la fonction du composable
  collectGift(props.especeId, position)
  // Forcer la fermeture de la tooltip
  forceHideTooltip.value = true
  nextTick(() => {
    forceHideTooltip.value = false
  })
  // son local
  try { giftCollect() } catch (_) {}
}

function onGiftKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onGiftClick(e)
  }
}

// État des cadeaux pour cette poule
const hasChickenGift = computed(() => {
  const hasGift = props.especeId ? hasActiveGift(props.especeId) : false
  return hasGift
})

// Propriété pour déterminer si la poule a une fonctionnalité spéciale (cadeau ou capacité)
const hasSpecialFeature = computed(() => {
  return hasChickenGift.value || isActivableTalent.value
})

// Badge amélioration disponible (similaire à ChickenCard)
import { usePlayer as usePlayerComposable } from '@/composables/usePlayer'
const { eggs } = usePlayerComposable()
const showUpgradeBadge = computed(() => {
  const poule = (poules.value || []).find(p => p.especeId === props.especeId)
  if (!poule) return false
  const cost = getTalentNextCost(poule)
  if (!cost || cost.maxed) return false
  const needChickens = Number(cost.chicken_cost || 0)
  const hasEggs = Number(eggs?.value ?? 0) >= Number(cost.egg_cost || 0)
  // Vérifier qu'on a assez de poules de cette espèce
  const hasChickens = Number(poule?.quantite || 0) >= needChickens
  return hasEggs && hasChickens
})

function especeDataFor(id) {
  return (especies.value || {})[id] || null
}

// Détermine la sous-icône à afficher sur l'éclair selon le type de capacité
const talentSubIcon = computed(() => {
  try {
    const info = especeDataFor(props.especeId)
    const talentName = info?.talent
    if (!talentName) return '✨'
    const calc = talents.value?.[talentName]?.calculation
    if (!calc) return '✨'
    const effs = Array.isArray(calc.effects) ? calc.effects : []
    // Cas buff de stats temporaires (ex: Maligne)
    const statMult = effs.find(e => e?.type === 'apply_stat_multiplier')
    if (statMult?.stats) {
      if (statMult.stats.intelligence != null) return '🧠'
      if (statMult.stats.energie != null) return '⚡'
      if (statMult.stats.charisme != null) return '✨'
      return '✨'
    }
    // Cas buff d'income (ex: Joyeuse)
    const income = effs.find(e => e?.type === 'apply_buff' && (e?.buff_type === 'income' || e?.buff_type === 'income_multiplier'))
    if (income) return '💰'
    // Cas buff de stockage (ex: Rapide)
    const storage = effs.find(e => e?.type === 'apply_buff' && (e?.buff_type === 'storage' || e?.buff_type === 'storage_multiplier'))
    if (storage) return '🧺'
    // Cas time_stop (ex: Temporelle)
    const timeStop = effs.find(e => e?.type === 'time_stop_buff')
    if (timeStop) return '⏰'
    return '✨'
  } catch (_) {
    return '✨'
  }
})

async function triggerActiveTalent(talentName) {
  try {
    if (isActivating.value) return
    isActivating.value = true
    sndClick()
    // Utiliser apiCall pour pouvoir lire le JSON même en cas de 400
    const response = await apiCall('/api/talent/activate', {
      method: 'POST',
      body: JSON.stringify({ talentName })
    })
    let data = null
    try { data = await response.clone().json() } catch (_) { data = null }

    if (response.ok && data?.success) {
      const dur = data?.applied?.duration
      const inc = data?.applied?.income_multiplier
      const sto = data?.applied?.storage_multiplier
      const stat = data?.applied?.stat || data?.applied?.type === 'stat_multiplier'
      const timeStop = data?.applied?.type === 'time_stop'
      if (inc && dur) {
        //window.$toast?.(`${talentName} activé: revenu x${inc} pendant ${Math.round((dur||0)/1000)}s`, 'power')
      } else if (sto && dur) {
        //window.$toast?.(`${talentName} activé: stockage x${sto} pendant ${Math.round((dur||0)/1000)}s`, 'power')
      } else if (stat && dur) {
        //window.$toast?.(`${talentName} activé: bonus de stats pendant ${Math.round((dur||0)/1000)}s`, 'power')
      } else if (timeStop && dur) {
        //window.$toast?.(`${talentName} activé: arrêt du temps pendant ${Math.round((dur||0)/1000)}s`, 'power')
        // Effets visuels d'activation du time_stop
        createTimeStopActivationEffects()
      } else {
        //window.$toast?.(`${talentName} activé`, 'power')
      }
      sndOk()
      // Incrémenter le compteur des utilisations de capacités
      incrementProgress('chickenAbilitiesUsed', 1)
      // Déclencher la mise à jour des quêtes
      window.dispatchEvent(new CustomEvent('quest-action'))
      // Rafraîchir immédiatement les cooldowns et la liste des buffs
      await Promise.allSettled([ fetchEggStatus(), fetchBuffs?.() ])
    } else {
      const readyInMs = data?.readyInMs
      const errMsg = data?.error || `Activation impossible (${response.status})`
      if (readyInMs != null) {
        const s = Math.ceil(readyInMs / 1000)
        //window.$toast?.(`${talentName} en recharge (${s}s)`, 'error')
        // Synchroniser les cooldowns côté client
        await fetchEggStatus()
        // Ouvrir le détail comme demandé quand non disponible
        emit('open-detail', props.especeId)
      } else {
        //window.$toast?.(errMsg, 'error')
      }
    }
  } catch (e) {
    //window.$toast?.('Erreur activation talent', 'error')
  } finally {
    isActivating.value = false
  }
}

// État talent activable et cooldown
const isActivableTalent = computed(() => {
  const t = especeDataFor(props.especeId)?.talent
  return t === 'Maligne' || t === 'Joyeuse' || t === 'Rapide' || t === 'Temporelle'
})

const cooldownKey = computed(() => {
  const t = especeDataFor(props.especeId)?.talent
  return t ? `talent_${t}` : null
})

const nowMs = () => Date.now()
const remainingMs = computed(() => {
  const key = cooldownKey.value
  if (!key) return 0
  const cdMap = eggState.value?.cooldowns || {}
  const until = cdMap[key] ? new Date(cdMap[key]).getTime() : 0
  const delta = (until || 0) - nowMs()
  return Math.max(0, delta)
})

const isTalentReady = computed(() => remainingMs.value <= 0)

// Invalider l’affichage toutes les secondes pour le compte à rebours
let _tick = null
onMounted(() => {
  if (!_tick) _tick = setInterval(() => { /* force computed to update */ x.value = x.value }, 1000)
})
onUnmounted(() => {
  if (_tick) { clearInterval(_tick); _tick = null }
})

// Mini évaluateur d'expressions (aligné avec Production.vue)
function evalExpr(expr, ctx) {
  if (expr == null) return 0
  if (typeof expr === 'number') return expr
  if (typeof expr === 'string') return Number.isFinite(ctx[expr]) ? ctx[expr] : (ctx[expr] ?? 0)
  if (typeof expr === 'object') {
    if (Object.prototype.hasOwnProperty.call(expr, 'var')) {
      const v = expr.var
      return Number.isFinite(ctx[v]) ? ctx[v] : (ctx[v] ?? 0)
    }
    const op = expr.op
    const args = Array.isArray(expr.args) ? expr.args : []
    const vals = args.map(a => evalExpr(a, ctx))
    switch (op) {
      case 'add': return vals.reduce((a, b) => a + b, 0)
      case 'sub': return vals.slice(1).reduce((a, b) => a - b, vals[0] || 0)
      case 'mul': return vals.reduce((a, b) => a * b, 1)
      case 'div': return vals.slice(1).reduce((a, b) => (b === 0 ? a : a / b), vals[0] || 0)
      case 'min': return Math.min(...vals)
      case 'max': return Math.max(...vals)
      default: return 0
    }
  }
  return 0
}

// Buffs personnels (target: 'me') pour cette poule (ex: Majestueuse => +5*niveau charisme)
const selfBuffs = computed(() => {
  const id = props.especeId
  const result = { intelligence: 0, energie: 0, charisme: 0 }
  if (!id) return result
  try {
    const sp = especies.value?.[id]
    const talentName = sp?.talent
    const calc = (talentName && (talents.value?.[talentName]?.calculation)) || null
    if (!calc || !Array.isArray(calc.effects)) return result
    const p = (poules.value || []).find(pp => pp.especeId === id)
    const niveau = Math.max(1, Number(p?.niveauTalent) || 1)
    const ctx = { niveau }
    for (const eff of calc.effects) {
      if (!eff || eff.type !== 'stat_buff') continue
      const target = eff.target || 'me'
      if (target !== 'me') continue
      const st = eff.stats || {}
      for (const key of ['intelligence', 'energie', 'charisme']) {
        if (st[key] != null) {
          result[key] += Number(evalExpr(st[key], ctx)) || 0
        }
      }
    }
  } catch (_) {}
  return result
})

const tooltipHtml = computed(() => {
  // Toujours recalculer l'effet avec le niveau courant depuis le store
  const p = (poules.value || []).find(pp => pp.especeId === props.especeId)
  const effect = p ? (getTalentEffectSync(p) || '') : (props.talentEffect || '')
  const title = props.name ? `<strong>${props.name}</strong>` : ''
  const st = especies.value?.[props.especeId]?.stats || {}

  const baseInt = Number(st.intelligence ?? 0)
  const baseEne = Number(st.energie ?? 0)
  const baseCha = Number(st.charisme ?? 0)
  // Buffs d'équipe reçus + buff personnel (Majestueuse, Discrète, etc.)
  const teamBuffs = props.statBuffs || { intelligence: 0, energie: 0, charisme: 0 }
  const selfB = selfBuffs.value || { intelligence: 0, energie: 0, charisme: 0 }
  const safe = (v) => Number.isFinite(Number(v)) ? Number(v) : 0
  const bInt = safe(teamBuffs.intelligence) + safe(selfB.intelligence)
  const bEne = safe(teamBuffs.energie) + safe(selfB.energie)
  const bCha = safe(teamBuffs.charisme) + safe(selfB.charisme)

  const showInt = baseInt + bInt
  const showEne = baseEne + bEne
  const showCha = baseCha + bCha

  const annotate = (v) => {
    if (v > 0) return ` <span style="color:#118a00">(+${v})</span>`
    if (v < 0) return ` <span style="color:#c22020">(-${Math.abs(v)})</span>`
    return ''
  }
  const statsLine = `🧠${showInt}${annotate(bInt)} ⚡${showEne}${annotate(bEne)} ✨${showCha}${annotate(bCha)}`

  const parts = []
  if (title) parts.push(title)
  if (statsLine) parts.push(statsLine)
  if (isActivableTalent.value) {
    const ms = remainingMs.value
    const s = Math.ceil(ms / 1000)
    const label = isTalentReady.value ? '<span style="color:#27ae60">Prêt</span>' : `${s}s de recharge`
    parts.push(`Capacité: ${label}`)
  }
  if (effect) parts.push(effect)
  return parts.join('<br>')
})



watch(() => props.containerWidth, () => {
  // recaler dans les bornes si la zone change
  const padding = 10
  const maxX = Math.max(padding, props.containerWidth - padding - 56)
  x.value = clamp(x.value, padding, maxX)
})
</script>

<style scoped>
/* Racine absolue positionnée par rapport à .stage (parent avec position:relative) */
.actor {
  position: absolute;
  bottom: -4px; /* ancrer les pattes au bas de la scène, baissé de 1px */
  pointer-events: auto; /* nécessaire pour le tooltip */
  z-index: 15;
}

/* Poules avec fonctionnalités spéciales (cadeau ou capacité) s'affichent devant */
.actor.has-special {
  z-index: 18;
}

/* Si fallback PNG, agrandir à 56x56 */
.parade-chicken.fallback {
  width: 56px;
  height: 56px;
  max-height: unset;
}

.parade-chicken {
  display: block;
  width: 56px;
  height: 56px;
  image-rendering: pixelated;
  transform: scaleX(var(--dir, 1));
  transform-origin: bottom center;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}
/* Wrapper pour positionner les badges */
.parade-wrapper {
  position: relative;
  display: inline-block;
}

.badge-activable {
  position: absolute;
  top: -4px;
  right: -12px;
  font-size: 16px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.badge-activable .badge-subtype {
  position: absolute;
  right: -3px;
  bottom: -3px;
  font-size: 8px;
  line-height: 1;
  text-shadow: -1px 0 #fff, 0 1px #fff, 1px 0 #fff, 0 -1px #fff; /* lisibilité */
}

/* Variante quand la capacité n'est pas prête */
.badge-activable.not-ready {
  filter: grayscale(1) brightness(0.8);
  opacity: 0.7;
}

/* Badge amélioration disponible (style ChickenCard) */
.badge-upgrade {
  position: absolute;
  top: -4px;
  left: -12px;
  width: 15px;
  height: 15px;
  background: linear-gradient(135deg, #34e89e 0%, #0f9d58 100%);
  border: 2px solid #0b7d46;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  z-index: 21;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.upgrade-icon {
  width: 12px;
  height: 12px;
  animation: upgradePulse 1.2s ease-in-out infinite;
}

@keyframes upgradePulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* Les GIF gèrent déjà l'animation; garder un léger effet visuel si souhaité (optionnel) */
.parade-chicken.walk { filter: brightness(1); }
.parade-chicken.idle { filter: saturate(0.99); }
.parade-chicken.peck { filter: contrast(1.02); }

/* Animation d'amélioration */
.parade-chicken.upgrading {
  animation: upgrade-explosion 0.8s ease-out;
}

/* Particules d'amélioration */
.upgrade-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.particle {
  position: absolute;
  font-size: 12px;
  animation: particle-explosion 0.8s ease-out forwards;
  animation-delay: var(--delay, 0s);
  transform-origin: center;
}

@keyframes upgrade-explosion {
  0% { 
    transform: scaleX(var(--dir, 1)) scale(1);
    filter: brightness(1) saturate(1);
  }
  20% { 
    transform: scaleX(var(--dir, 1)) scale(1.3);
    filter: brightness(1.8) saturate(1.5) hue-rotate(45deg);
  }
  40% { 
    transform: scaleX(var(--dir, 1)) scale(0.9);
    filter: brightness(2.2) saturate(2) hue-rotate(90deg);
  }
  60% { 
    transform: scaleX(var(--dir, 1)) scale(1.4);
    filter: brightness(2.5) saturate(2.5) hue-rotate(180deg);
  }
  80% { 
    transform: scaleX(var(--dir, 1)) scale(1.1);
    filter: brightness(1.8) saturate(1.8) hue-rotate(270deg);
  }
  100% { 
    transform: scaleX(var(--dir, 1)) scale(1);
    filter: brightness(1.2) saturate(1.2) hue-rotate(360deg);
  }
}

@keyframes particle-explosion {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0);
  }
  20% {
    opacity: 1;
    transform: translate(calc(cos(var(--angle)) * 10px), calc(sin(var(--angle)) * 10px)) scale(1);
  }
  60% {
    opacity: 1;
    transform: translate(calc(cos(var(--angle)) * 25px), calc(sin(var(--angle)) * 25px)) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(calc(cos(var(--angle)) * 35px), calc(sin(var(--angle)) * 35px)) scale(0.8);
  }
}

/* Indicateur de cadeau actif */
.gift-indicator {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 22;
  /* Permettre clics et focus sur l'icône du cadeau */
  pointer-events: auto;
}

.gift-icon {
  position: relative;
  font-size: 32px;
  animation: gift-float 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
  text-shadow: 0 0 10px rgba(255,255,255,0.8);
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  user-select: none;
}

@keyframes gift-float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.95;
  }
  50% {
    transform: translateY(-6px) scale(1.08);
    opacity: 1;
  }
}
</style>