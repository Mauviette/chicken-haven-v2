<template>
    <div
      class="fence"
      :class="side"
      :style="{ left: `${x}px`, top: `${y}px` }"
    />
  </template>
  
  <script setup>
  defineProps({
    side: String, // 'top' | 'bottom' | 'left' | 'right'
    x: Number,
    y: Number
  })
  </script>
  
  <style scoped>
  .fence {
    position: absolute;
    width: 16px;
    height: 16px;
    background-repeat: no-repeat;
    background-size: cover;
    z-index: 10;
    image-rendering: pixelated;
    box-sizing: border-box;
  }
  .fence.top {
    background-image: url('@/assets/tiles/fence/top.png');
  }
  .fence.bottom {
    background-image: url('@/assets/tiles/fence/bottom.png');
  }
  .fence.left {
    background-image: url('@/assets/tiles/fence/left.png');
  }
  .fence.right {
    background-image: url('@/assets/tiles/fence/right.png');
  }
  </style>
  