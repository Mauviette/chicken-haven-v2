<template>
  <div
    class="tooltip-wrapper"
    @mouseenter="show = true"
    @mouseleave="show = false"
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
import { ref, onMounted, nextTick, watch } from 'vue'

defineProps({ text: String })

const wrapper = ref(null)
const show = ref(false)
const position = ref({ top: 0, left: 0 })

async function updateFixedPosition() {
  await nextTick()
  const el = wrapper.value
  if (!el) return

  const rect = el.getBoundingClientRect()
  const tooltipHeight = 36 // valeur approximative
  const margin = 8

  position.value = {
    // Décale le popup plus bas de 10px
    top: rect.top + window.scrollY - tooltipHeight - margin + 10,
    left: rect.left + rect.width / 2 + window.scrollX
  }
}

onMounted(() => {
  if (show.value) updateFixedPosition()
})

watch(show, (visible) => {
  if (visible) updateFixedPosition()
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
  transform: translateX(-50%);
  background: #fff9e5;
  color: #6d3c00;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  white-space: nowrap;
  border: 2px solid #ffc66e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 999999;
  pointer-events: none;
  max-width: 90vw;
  font-family: 'Fredoka', sans-serif;
}
</style>
