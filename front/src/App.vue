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
  margin: 0;
  overflow: hidden;
}
</style>