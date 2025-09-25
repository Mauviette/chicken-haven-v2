<template>
  <div
    class="tooltip-wrapper"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove"
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
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  text: String,
  position: { type: String, default: 'top' }, // 'top' | 'bottom' | 'left' | 'right'
  followMouse: { type: Boolean, default: true },
})

const wrapper = ref(null)
const show = ref(false)
const position = ref({ top: 0, left: 0 })
const tooltipEl = ref(null)

const tooltipOffset = { x: 15, y: 12 } // Offset par rapport au curseur (plus bas)

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
  show.value = true
  // Attendre que la tooltip soit montée pour mesurer sa taille réelle
  nextTick(() => updateMousePosition(event))
}

function handleMouseLeave() {
  show.value = false
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

onMounted(() => {
  document.addEventListener('mousemove', handleGlobalMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleGlobalMouseMove)
})
</script>

<style scoped>
.tooltip-wrapper {
  display: inline-block;
  position: relative;
  z-index: auto;
  cursor: url('@/assets/ui/cursor/mark_question.png') 0 0, auto;
  font-family: 'Fredoka', sans-serif;
}

.tooltip-box {
  position: fixed;
  background: #fff9e5;
  color: #6d3c00;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  white-space: normal;
  border: 2px solid #ffc66e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 999999;
  pointer-events: none;
  max-width: min(300px, 90vw);
  font-family: 'Fredoka', sans-serif;
  transition: opacity 0.2s ease;
  line-height: 1.4;
  word-wrap: break-word;
}
</style>
