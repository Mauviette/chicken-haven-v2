<template>
  <router-view />
  <ToastManager ref="toastManager" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ToastManager from '@/components/menu/ToastManager.vue'

const toastManager = ref(null)

onMounted(() => {
  window.$toast = toastManager.value.showToast
})
</script>

<style>
body {
  user-select: none;
  margin: 0;
  overflow: hidden;
  cursor: url('@/assets/ui/cursor/hand_small_point.png') 16 16, auto;
}

a, button, input[type="button"], input[type="submit"], input[type="checkbox"] select, textarea, .pointer {
  cursor: url('@/assets/ui/cursor/hand_small_point_n.png') 16 16, auto;
}

img,
.fence,
.tile,
.fog,
.chicken {
  image-rendering: pixelated;
}

</style>
