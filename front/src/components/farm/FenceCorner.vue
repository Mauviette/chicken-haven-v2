<template>
    <div
      class="fence-corner"
      :class="position"
      :style="{ left: `${x}px`, top: `${y}px` }"
    />
  </template>
  
  <script setup>
  defineProps({
    position: String, // 'top-left', 'top-right', etc.
    x: Number,
    y: Number
  })
  </script>
  
  <style scoped>
  .fence-corner {
    position: absolute;
    width: 16px;
    height: 16px;
    background-size: cover;
    image-rendering: pixelated;
    z-index: 20;
  }
  .fence-corner.top-left {
    background-image: url('@/assets/tiles/fence/corner-top-left.png');
  }
  .fence-corner.top-right {
    background-image: url('@/assets/tiles/fence/corner-top-right.png');
  }
  .fence-corner.bottom-left {
    background-image: url('@/assets/tiles/fence/corner-bottom-left.png');
  }
  .fence-corner.bottom-right {
    background-image: url('@/assets/tiles/fence/corner-bottom-right.png');
  }
  </style>
  