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
        :style="{ top: `${position.top}px`, left: `${position.left}px` }"
        v-html="text"
      >
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

defineProps({ text: String })

const wrapper = ref(null)
const show = ref(false)
const position = ref({ top: 0, left: 0 })

const tooltipOffset = { x: 15, y: -10 } // Offset par rapport au curseur

function updateMousePosition(event) {
  if (!show.value) return
  
  const tooltipHeight = 100 // estimation plus réaliste pour des descriptions longues
  const tooltipWidth = 300 // estimation plus réaliste pour des descriptions
  
  let top = event.clientY + window.scrollY + tooltipOffset.y
  let left = event.clientX + window.scrollX + tooltipOffset.x
  
  // Vérifier si le tooltip dépasse la fenêtre à droite
  if (left + tooltipWidth > window.innerWidth + window.scrollX) {
    left = event.clientX + window.scrollX - tooltipWidth - Math.abs(tooltipOffset.x)
  }
  
  // Vérifier si le tooltip dépasse encore à gauche après correction
  if (left < window.scrollX) {
    left = window.scrollX + 10
  }
  
  // Vérifier si le tooltip dépasse la fenêtre en haut
  if (top < window.scrollY) {
    top = event.clientY + window.scrollY + Math.abs(tooltipOffset.y) + 20
  }
  
  // Vérifier si le tooltip dépasse la fenêtre en bas
  if (top + tooltipHeight > window.innerHeight + window.scrollY) {
    top = event.clientY + window.scrollY - tooltipHeight - Math.abs(tooltipOffset.y)
  }
  
  // S'assurer que le tooltip reste visible même en cas de problème
  if (top < window.scrollY) {
    top = window.scrollY + 10
  }
  
  position.value = { top, left }
}

function handleMouseEnter(event) {
  show.value = true
  updateMousePosition(event)
}

function handleMouseLeave() {
  show.value = false
}

function handleMouseMove(event) {
  if (show.value) {
    updateMousePosition(event)
  }
}

// Écouter les mouvements de souris globaux pour un suivi plus fluide
function handleGlobalMouseMove(event) {
  if (show.value) {
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
  position: absolute;
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
