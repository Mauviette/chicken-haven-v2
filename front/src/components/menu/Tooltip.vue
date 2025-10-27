<template>
  <div
    class="tooltip-wrapper"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove"
    @click="handleClick"
    ref="wrapper"
  >
    <slot />
    <Teleport to="body">
      <div
        v-if="show"
        class="tooltip-box"
        ref="tooltipEl"
        :style="{ top: `${position.top}px`, left: `${position.left}px` }"
        v-html="text"
      >
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  text: String,
  position: { type: String, default: 'top' }, // 'top' | 'bottom' | 'left' | 'right'
  followMouse: { type: Boolean, default: true },
  forceHide: { type: Boolean, default: false }
})

const wrapper = ref(null)
const show = ref(false)
const position = ref({ top: 0, left: 0 })
const tooltipEl = ref(null)
const isMobile = ref(false)

const tooltipOffset = { x: 15, y: 12 } // Offset par rapport au curseur (plus bas)

// Détecter si c'est un appareil tactile
function detectMobile() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

function getTooltipSize() {
  const rect = tooltipEl.value?.getBoundingClientRect?.()
  if (rect) return { width: rect.width, height: rect.height }
  // fallback si pas encore monté
  return { width: 300, height: 100 }
}

function updateMousePosition(event) {
  if (!show.value) return
  
  const { width: tooltipWidth, height: tooltipHeight } = getTooltipSize()

  let top
  let left
  const margin = 8

  if (props.followMouse) {
    // Suivi de la souris (coordonnées viewport)
    top = event.clientY + tooltipOffset.y
    left = event.clientX + tooltipOffset.x

    // Clamp doux à l'écran sans "flip" brutal
    if (left + tooltipWidth > window.innerWidth - margin) {
      left = window.innerWidth - tooltipWidth - margin
    }
    if (left < margin) left = margin

    if (top + tooltipHeight > window.innerHeight - margin) {
      top = window.innerHeight - tooltipHeight - margin
    }
    if (top < margin) top = margin
  } else {
    // Ancré à l'élément: centré, selon props.position
    const rect = wrapper.value?.getBoundingClientRect?.()
    if (rect) {
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      switch ((props.position || 'top').toLowerCase()) {
        case 'bottom':
          top = rect.bottom + 8
          left = centerX - tooltipWidth / 2
          break
        case 'left':
          top = centerY - tooltipHeight / 2
          left = rect.left - tooltipWidth - 8
          break
        case 'right':
          top = centerY - tooltipHeight / 2
          left = rect.right + 8
          break
        case 'top':
        default:
          top = rect.top - tooltipHeight - 8
          left = centerX - tooltipWidth / 2
      }
      // Clamp à l'écran
      if (left + tooltipWidth > window.innerWidth - margin) {
        left = window.innerWidth - tooltipWidth - margin
      }
      if (left < margin) left = margin
      if (top + tooltipHeight > window.innerHeight - margin) {
        top = window.innerHeight - tooltipHeight - margin
      }
      if (top < margin) top = margin
    } else {
      // fallback: similaire à suivi souris
      top = event.clientY + tooltipOffset.y
      left = event.clientX + tooltipOffset.x
    }
  }

  position.value = { top, left }
}

function handleMouseEnter(event) {
  if (isMobile.value) return // Sur mobile, utiliser le clic
  show.value = true
  // Attendre que la tooltip soit montée pour mesurer sa taille réelle
  nextTick(() => updateMousePosition(event))
}

function handleMouseLeave() {
  if (isMobile.value) return // Sur mobile, garder visible jusqu'au clic suivant
  show.value = false
}

function handleClick(event) {
  if (!isMobile.value) return // Sur desktop, utiliser le hover
  show.value = !show.value // Toggle
  if (show.value) {
    nextTick(() => updateMousePosition(event))
  }
}

function handleMouseMove(event) {
  if (show.value && props.followMouse) {
    updateMousePosition(event)
  }
}

// Écouter les mouvements de souris globaux pour un suivi plus fluide
function handleGlobalMouseMove(event) {
  if (show.value && props.followMouse) {
    updateMousePosition(event)
  }
}

// Fermer la tooltip sur mobile quand on clique ailleurs
function handleGlobalClick(event) {
  if (!isMobile.value || !show.value) return
  if (wrapper.value && !wrapper.value.contains(event.target)) {
    show.value = false
  }
}

onMounted(() => {
  isMobile.value = detectMobile()
  document.addEventListener('mousemove', handleGlobalMouseMove)
  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleGlobalMouseMove)
  document.removeEventListener('click', handleGlobalClick)
})

// Si le texte change pendant que la tooltip est ouverte, forcer un léger remount pour garantir la mise à jour visuelle
watch(() => props.text, () => {
  if (show.value) {
    show.value = false
    nextTick(() => {
      show.value = true
    })
  }
})

// Forcer la fermeture de la tooltip si forceHide devient true
watch(() => props.forceHide, (newVal) => {
  if (newVal) {
    show.value = false
  }
})
</script>

<style>
.tooltip-wrapper {
  display: inline-block;
  position: relative;
  z-index: auto;
  cursor: url('@/assets/ui/cursor/mark_question.png') 0 0, auto;
  font-family: 'Fredoka', sans-serif;
}

.tooltip-box {
  position: fixed;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  white-space: normal;
  border: 2px solid var(--border-primary);
  box-shadow: 0 2px 8px var(--shadow-tertiary);
  z-index: 999999;
  pointer-events: none;
  max-width: min(300px, 90vw);
  font-family: 'Fredoka', sans-serif;
  transition: opacity 0.2s ease;
  line-height: 1.4;
  word-wrap: break-word;
}
</style>
