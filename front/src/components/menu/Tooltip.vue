<template>
  <div class="tooltip-container" @mouseenter="show = true" @mouseleave="show = false">
    <slot />
    <div v-if="show" class="tooltip-box">
      {{ text }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
defineProps({ text: String })
const show = ref(false)
</script>

<style scoped>
.tooltip-container {
  position: relative;
  display: inline-block;
}

.tooltip-box {
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background: #fff9e5;
  color: #6d3c00;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  white-space: nowrap;
  border: 2px solid #ffc66e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
  max-width: 90vw;

}
@media (max-width: 600px) {
  .tooltip-box {
    left: auto;
    right: 0;
    transform: none;
    white-space: normal;
  }
}

.tooltip-container:hover {
    cursor: url('@/assets/ui/cursor/mark_question.png') 0 0, auto;
}
</style>
