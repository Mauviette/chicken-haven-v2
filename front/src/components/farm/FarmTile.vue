<template>
  <div :class="['tile', type]" :style="tileStyle"></div>
    <!--div :class="['tile', type]" :style="tileStyle">
    <span style="color: white; font-size: 6px">{{ type[0].toUpperCase() }}</span>
  </div-->

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
  width: 16px;
  height: 16px;
  background-size: cover;
  background-repeat: no-repeat;
  user-select: none;
}

.tile.grass {
  background-image: url('@/assets/tiles/grass.png');
}

.tile.beach {
  background-image: url('@/assets/tiles/beach.png');
}

.tile.forest {
  background-image: url('@/assets/tiles/forest/leaves.png');
}

.tile.forest_trunk {
  background-image: url('@/assets/tiles/forest/trunk.png');
}

</style>