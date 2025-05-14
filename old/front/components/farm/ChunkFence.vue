<template>
  <div
    class="fence"
    :class="side"
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <img src="../../assets/tiles/fence/simple.png" alt="fence" />
  </div>
</template>

<script setup>
defineProps({
  side: String,
  x: Number,
  y: Number
})
</script>

<style scoped>
.fence {
  position: absolute;
  width: 16px;
  height: 16px;
  z-index: 10;
  image-rendering: pixelated;
}

img {
  width: 100%;
  height: 100%;
}
</style>
  
