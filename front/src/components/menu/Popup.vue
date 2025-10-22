<template>
    <div class="popup-overlay" @click.self="emitClose">
      <div class="popup-content">
        <button class="close-btn" @click="emitClose">✕</button>
        <slot />
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, onBeforeUnmount } from 'vue'
  import { useSound } from '@/composables/useSound'
  const emit = defineEmits(['close'])
  const { open, close } = useSound()
  
  // Shared stack across Popup instances (most recent at the end).
  // Use window property so HMR won't reset it unexpectedly.
  const popupStack = typeof window !== 'undefined'
    ? (window.__popupStack = window.__popupStack || [])
    : []
  
  const instanceId = Symbol('popup-instance')
  
  function onKeyDown(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      // Only close if this instance is the most recently opened popup
      if (popupStack[popupStack.length - 1] === instanceId) {
        emitClose()
      }
    }
  }
  
  onMounted(() => {
    // Register this popup as most recent
    popupStack.push(instanceId)
    // Son d'ouverture du popup
    open()
    window.addEventListener('keydown', onKeyDown)
  })
  
  onBeforeUnmount(() => {
    // Ensure removal from stack
    const idx = popupStack.indexOf(instanceId)
    if (idx > -1) popupStack.splice(idx, 1)
    window.removeEventListener('keydown', onKeyDown)
  })
  
  function emitClose() {
    // Defensive removal from stack in case close is triggered manually
    const idx = popupStack.indexOf(instanceId)
    if (idx > -1) popupStack.splice(idx, 1)
    // Son de fermeture du popup
    close()
    emit('close')
  }
  </script>
  
  <style scoped>
  .popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(20, 10, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }
  
  .popup-content {
    background-color: #7a3e10;
    background-image: url('@/assets/bar/bg.png');
    background-repeat: repeat;
    border: 2px solid #ffc66e;
    border-radius: 16px;
    padding: 24px;
    width: 360px;
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;
    font-family: 'Fredoka', sans-serif;
    color: #fff9e5;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    position: relative;
    animation: popupEnter 0.25s ease-out;
    box-sizing: border-box;
  }


  .close-btn {
    position: absolute;
    top: 8px;
    right: 12px;
    background: none;
    border: none;
    font-size: 20px;
    color: #fff9e5;
    
  }
  
@keyframes popupEnter {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .popup-content {
    width: 340px;
    max-width: 95vw;
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .popup-content {
    width: 300px;
    max-width: 90vw;
    padding: 16px;
  }
  
  .close-btn {
    top: 6px;
    right: 10px;
    font-size: 18px;
  }
}
  </style>
