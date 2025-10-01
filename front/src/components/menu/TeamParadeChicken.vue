j<template>
  <!-- Conteneur acteur positionné relativement à la scène (parent .stage) -->
  <div class="actor" :style="{ left: x + 'px' }">
    <Tooltip :text="tooltipHtml" :key="tooltipHtml" v-if="!isMobile">
      <img
        v-if="currentImg"
        :src="currentImg"
        class="parade-chicken"
        :class="[state, isFallback ? 'fallback' : '']"
        :alt="name"
        :style="{ '--dir': direction }"
        @click="emitOpenDetail"
      />
    </Tooltip>
    <!-- Version sans tooltip pour mobile -->
    <img
      v-if="currentImg && isMobile"
      :src="currentImg"
      class="parade-chicken"
      :class="[state, isFallback ? 'fallback' : '']"
      :alt="name"
      :style="{ '--dir': direction }"
      @click="emitOpenDetail"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import Tooltip from '@/components/menu/Tooltip.vue'
import { usePoules } from '@/composables/usePoules'

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
  if (props.especeId) {
    emit('open-detail', props.especeId)
  }
}

// Tooltip combinant nom en gras + effet du talent
const { especies, poules, getTalentEffectSync } = usePoules()

const tooltipHtml = computed(() => {
  // Toujours recalculer l'effet avec le niveau courant depuis le store
  const p = (poules.value || []).find(pp => pp.especeId === props.especeId)
  const effect = p ? (getTalentEffectSync(p) || '') : (props.talentEffect || '')
  const title = props.name ? `<strong>${props.name}</strong>` : ''
  const st = especies.value?.[props.especeId]?.stats || {}

  const baseInt = Number(st.intelligence ?? 0)
  const baseEne = Number(st.energie ?? 0)
  const baseCha = Number(st.charisme ?? 0)
  const bInt = Math.max(0, Number(props.statBuffs?.intelligence) || 0)
  const bEne = Math.max(0, Number(props.statBuffs?.energie) || 0)
  const bCha = Math.max(0, Number(props.statBuffs?.charisme) || 0)

  const showInt = baseInt + bInt
  const showEne = baseEne + bEne
  const showCha = baseCha + bCha

  const plus = (v) => v > 0 ? ` <span style="color:#118a00">(+${v})</span>` : ''
  const statsLine = `🧠${showInt}${plus(bInt)} ⚡${showEne}${plus(bEne)} ✨${showCha}${plus(bCha)}`

  const parts = []
  if (title) parts.push(title)
  if (statsLine) parts.push(statsLine)
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
  max-height: 56px; /* adapté à la hauteur de scène (72px) */
  image-rendering: pixelated;
  transform: scaleX(var(--dir, 1));
  transform-origin: bottom center;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

/* Les GIF gèrent déjà l'animation; garder un léger effet visuel si souhaité (optionnel) */
.parade-chicken.walk { filter: brightness(1); }
.parade-chicken.idle { filter: saturate(0.99); }
.parade-chicken.peck { filter: contrast(1.02); }
</style>