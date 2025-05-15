<template>
    <div class="popup-overlay" @click.self="emitClose">
      <div class="popup-content">
        <button class="close-btn" @click="emitClose">✕</button>
        <slot />
      </div>
    </div>
  </template>
  
  <script setup>
  const emit = defineEmits(['close'])
  function emitClose() {
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
  </style>
  