<template>
    <div
      class="locked-chunk"
      :style="{
        left: `${chunk.x * chunkSize * tileSize}px`,
        top: `${chunk.y * chunkSize * tileSize}px`,
        width: `${chunkSize * tileSize}px`,
        height: `${chunkSize * tileSize}px`
      }"
      @click="emit('unlock', chunk)"
    >
      <div class="fog">🌫️</div>
    </div>
  </template>
  
  <script setup>
  const props = defineProps({
    chunk: Object,
    chunkSize: Number,
    tileSize: Number
  })
  const emit = defineEmits(['unlock'])
  </script>
  
  <style scoped>
  .locked-chunk {
    position: absolute;
    background: rgba(0, 0, 0, 0.4);
    cursor: url('@/assets/ui/cursor/hand_small_point_n.png') 16 16, auto;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 20px;
  }
  .fog {
    backdrop-filter: blur(2px);
  }
  </style>
  