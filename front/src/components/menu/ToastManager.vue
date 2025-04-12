<template>
  <div class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="toast"
    >
      <span class="emoji">{{ emojiMap[toast.type] || 'ℹ️' }}</span>
      <span class="message">{{ toast.message }}</span>
      <button class="close-btn" @click="removeToast(toast.id)">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])

const emojiMap = {
  success: '✅',
  error: '❌',
  info: 'ℹ️'
}

function showToast(message, type = 'info', duration = 5000) {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, message, type })

  setTimeout(() => {
    removeToast(id)
  }, duration)
}

function removeToast(id) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

defineExpose({ showToast })
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 100px;
  left: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toast {
  display: flex;
  align-items: center;
  min-width: 240px;
  max-width: 300px;
  background-color: #7a3e10;
  border: 2px solid #ffc66e;
  background-image: url('@/assets/bar/bg.png');
  background-repeat: repeat;
  border-radius: 12px;
  padding: 8px 12px;
  color: #fff9e5;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;
  position: relative;
  overflow: hidden;
}

.emoji {
  margin-right: 8px;
  font-size: 18px;
}

.message {
  flex-grow: 1;
}

.close-btn {
  background: none;
  border: none;
  color: #fff9e5;
  font-size: 16px;
  
  padding: 0 6px;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
