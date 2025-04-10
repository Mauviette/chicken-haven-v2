<template>
  <div :class="['tile', type]" :style="tileStyle"></div>
</template>

  
<script setup>
defineProps({
  tileStyle: Object,
  type: {
    type: String,
    default: 'grass'
  }
})
</script>
  
  
  <style scoped>
.tile {
  position: absolute;
  width: 64px;
  height: 32px;
  background-size: cover;
  background-repeat: no-repeat;
  user-select: none;
}

.tile.grass {
  background-image: url('@/assets/FarmTile.png');
}
.tile.beach {
  background-image: url('@/assets/BeachTile.png');
}

  </style>
  