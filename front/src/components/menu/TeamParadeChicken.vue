<template>
  <!-- Conteneur acteur positionné relativement à la scène (parent .stage) -->
  <div class="actor" :style="{ left: x + 'px' }">
    <Tooltip :text="tooltipHtml" :key="tooltipHtml" v-if="!isMobile">
      <div class="parade-wrapper">
        <img
        v-if="currentImg"
        :src="currentImg"
        class="parade-chicken"
        :class="[state, isFallback ? 'fallback' : '']"
        :alt="name"
        :style="{ '--dir': direction }"
        @click="emitOpenDetail"
        />
  <!-- Indicateur talent activable: petit éclair en haut à droite -->
  <span v-if="isActivableTalent" :class="['badge-activable', { 'not-ready': !isTalentReady }]">
    ⚡
    <span class="badge-subtype">{{ talentSubIcon }}</span>
  </span>
      </div>
    </Tooltip>
    <!-- Version sans tooltip pour mobile -->
    <div class="parade-wrapper" v-if="currentImg && isMobile">
      <img
      v-if="currentImg && isMobile"
      :src="currentImg"
      class="parade-chicken"
      :class="[state, isFallback ? 'fallback' : '']"
      :alt="name"
      :style="{ '--dir': direction }"
      @click="emitOpenDetail"
      />
  <span v-if="isActivableTalent" :class="['badge-activable', { 'not-ready': !isTalentReady }]">
    ⚡
    <span class="badge-subtype">{{ talentSubIcon }}</span>
  </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import Tooltip from '@/components/menu/Tooltip.vue'
import { usePoules } from '@/composables/usePoules'
import { useGameData } from '@/composables/useGameData'
import { apiCall } from '@/utils/api'
import { useSound } from '@/composables/useSound'
import { useEgg } from '@/composables/useEgg'
import { useBuffs } from '@/composables/useBuffs'

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

// Détection mobile
const isMobile = ref(window.innerWidth <= 768)

// Écouter les changements de taille d'écran
function updateMobileState() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  window.addEventListener('resize', updateMobileState)
  initPosition()
  applyImage()
  rafId = requestAnimationFrame(step)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMobileState)
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
  if (!props.especeId) return
  const talent = especeDataFor(props.especeId)?.talent
  if (talent === 'Maligne' || talent === 'Joyeuse' || talent === 'Rapide') {
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

// Tooltip combinant nom en gras + effet du talent
const { especies, poules, getTalentEffectSync } = usePoules()
const { talents } = useGameData()
const { click: sndClick, confirm: sndOk } = useSound()
const { eggState, fetchEggStatus } = useEgg()
const { fetchBuffs } = useBuffs()

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
    if (storage) return '📦'
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
      if (inc && dur) {
        window.$toast?.(`${talentName} activé: revenu x${inc} pendant ${Math.round((dur||0)/1000)}s`, 'power')
      } else if (sto && dur) {
        window.$toast?.(`${talentName} activé: stockage x${sto} pendant ${Math.round((dur||0)/1000)}s`, 'power')
      } else if (stat && dur) {
        window.$toast?.(`${talentName} activé: bonus de stats pendant ${Math.round((dur||0)/1000)}s`, 'power')
      } else {
        window.$toast?.(`${talentName} activé`, 'power')
      }
      sndOk()
      // Rafraîchir immédiatement les cooldowns et la liste des buffs
      await Promise.allSettled([ fetchEggStatus(), fetchBuffs?.() ])
    } else {
      const readyInMs = data?.readyInMs
      const errMsg = data?.error || `Activation impossible (${response.status})`
      if (readyInMs != null) {
        const s = Math.ceil(readyInMs / 1000)
        window.$toast?.(`${talentName} en recharge (${s}s)`, 'error')
        // Synchroniser les cooldowns côté client
        await fetchEggStatus()
        // Ouvrir le détail comme demandé quand non disponible
        emit('open-detail', props.especeId)
      } else {
        window.$toast?.(errMsg, 'error')
      }
    }
  } catch (e) {
    window.$toast?.('Erreur activation talent', 'error')
  } finally {
    isActivating.value = false
  }
}

// État talent activable et cooldown
const isActivableTalent = computed(() => {
  const t = especeDataFor(props.especeId)?.talent
  return t === 'Maligne' || t === 'Joyeuse' || t === 'Rapide'
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

onMounted(() => {
  initPosition()
  applyImage()
  rafId = requestAnimationFrame(step)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
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
  z-index: 2;
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

/* Les GIF gèrent déjà l'animation; garder un léger effet visuel si souhaité (optionnel) */
.parade-chicken.walk { filter: brightness(1); }
.parade-chicken.idle { filter: saturate(0.99); }
.parade-chicken.peck { filter: contrast(1.02); }
</style>