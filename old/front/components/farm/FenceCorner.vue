<template>
  <div
    class="fence-corner"
    :class="position"
    :style="{ left: `${x}px`, top: `${y}px` }"
  >
    <img src="../../assets/tiles/fence/simple.png" alt="fence" />
  </div>
</template>

<script setup>
defineProps({
  position: String,
  x: Number,
  y: Number
})
</script>

<style scoped>
.fence-corner {
  position: absolute;
  width: 16px;
  height: 16px;
  z-index: 20;
  image-rendering: pixelated;
}

img {
  width: 100%;
  height: 100%;
}
</style>
  
