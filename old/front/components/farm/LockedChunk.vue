<template>
    <div
      class="locked-chunk"
      :class="{ 'is-adjacent': isAdjacent }"
      :style="{
        left: `${chunk.x * chunkSize * tileSize}px`,
        top: `${chunk.y * chunkSize * tileSize}px`,
        width: `${chunkSize * tileSize}px`,
        height: `${chunkSize * tileSize}px`
      }"
      @click="isAdjacent && emit('unlock', chunk)"
    >
      <div class="fog-container">
        <div class="fog-cloud fog-cloud-1">☁️</div>
        <div class="fog-cloud fog-cloud-2">☁️</div>
        <div class="fog-cloud fog-cloud-3">☁️</div>
        <div class="fog-cloud fog-cloud-4">🌫️</div>
        <div class="fog-cloud fog-cloud-5">🌫️</div>
      </div>
    </div>
  </template>

  <script setup>
  const props = defineProps({
    chunk: Object,
    chunkSize: Number,
    tileSize: Number,
    isAdjacent: {
      type: Boolean,
      default: true
    }
  })
  const emit = defineEmits(['unlock'])
  </script>

  <style scoped>
  .locked-chunk {
    position: absolute;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 20px;
    overflow: hidden;
  }

  .is-adjacent {
    cursor: url('@/assets/ui/cursor/hand_small_point_n.png') 16 16, auto;
    background: rgba(0, 0, 0, 0.3);
  }

  .locked-chunk:not(.is-adjacent) {
    background: rgba(0, 0, 0, 0.5);
  }

  .fog-container {
    position: relative;
    width: 100%;
    height: 100%;
    backdrop-filter: blur(2px);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .is-adjacent .fog-container {
    backdrop-filter: blur(1px);
  }

  .locked-chunk:not(.is-adjacent) .fog-container {
    backdrop-filter: blur(3px);
  }

  .fog-cloud {
    position: absolute;
    font-size: 32px;
    opacity: 0.8;
    animation: float 8s infinite ease-in-out;
  }

  .is-adjacent .fog-cloud {
    opacity: 0.7;
  }

  .locked-chunk:not(.is-adjacent) .fog-cloud {
    opacity: 0.9;
    font-size: 36px;
  }

  .fog-cloud-1 {
    top: 20%;
    left: 20%;
    animation-delay: 0s;
  }

  .fog-cloud-2 {
    top: 60%;
    left: 70%;
    animation-delay: 1s;
  }

  .fog-cloud-3 {
    top: 30%;
    left: 60%;
    animation-delay: 2s;
  }

  .fog-cloud-4 {
    top: 70%;
    left: 30%;
    animation-delay: 3s;
  }

  .fog-cloud-5 {
    top: 50%;
    left: 50%;
    animation-delay: 4s;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0) translateX(0);
    }
    25% {
      transform: translateY(-5px) translateX(5px);
    }
    50% {
      transform: translateY(0) translateX(10px);
    }
    75% {
      transform: translateY(5px) translateX(5px);
    }
  }
  </style>
