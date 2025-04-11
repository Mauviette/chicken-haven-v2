<template>
  <div
    class="grid-wrapper"
    ref="gridWrapper"
    @mousedown="startDrag"
    @mousemove="onDrag"
    @mouseup="endDrag"
    @mouseleave="endDrag"
    @wheel.prevent="onScroll"
  >
    <div
      class="farm-grid"
      :style="{
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`
      }"
    >
      <FarmTile
        v-for="(tile, index) in tiles"
        :key="index"
        :tileStyle="getTileStyle(tile)"
        :type="tile.type"
      />

      <Chicken
        v-for="chicken in chickens"
        :key="`${chicken.x}-${chicken.y}`"
        :x="chicken.x"
        :y="chicken.y"
        :type="chicken.type"
        :gridSize="props.gridSize"
        :isWalkable="isWalkable"
      />
    </div>
  </div>
</template>
  
<script setup>
import { ref, computed } from 'vue'
import FarmTile from './FarmTile.vue'
import Chicken from './Chicken.vue'

  const props = defineProps({
    gridSize: { type: Number, default: 14 },
    tileWidth: { type: Number, default: 64 },
    tileHeight: { type: Number, default: 32 }
  })

  // Liste des poulets
  const chickens = ref([
    { x: 5, y: 6, type: 'white' },
    { x: 4, y: 6, type: 'white' },
    { x: 3, y: 6, type: 'white' },
    { x: 2, y: 6, type: 'white' },
    { x: 6, y: 5, type: 'red' }
  ])

  
    const tileWidth = 64
    const tileHeight = 32
  
    const margin = 5

    const tiles = computed(() => {
    const arr = []
    for (let y = 0; y < props.gridSize; y++) {
      for (let x = 0; x < props.gridSize; x++) {
        let type = 'grass'

        // bord de la ferme ?
        if (
          x === 0 || y === 0 ||
          x === props.gridSize - 1 || y === props.gridSize - 1
        ) {
          type = 'beach'
        }

        arr.push({ x, y, type })
      }
    }
    return arr
  })

  
  // Centrage
  const offset = ref({ x: 0, y: 0 })
  const zoom = ref(1)
  
  const gridWrapper = ref(null)
  
  // Drag
  let isDragging = false
  let dragStart = { x: 0, y: 0 }
  
  function isWalkable(x, y) {
    // limites de la map
    if (x < 0 || y < 0 || x >= props.gridSize || y >= props.gridSize) return false

    // check poules déjà présentes
    for (const chicken of chickens.value) {
      if (chicken.x === x && chicken.y === y) return false
    }

    // check bâtiments ou arbres plus tard
    // for (const tree of trees.value) { ... }

    return true
  }

  function startDrag(e) {
    isDragging = true
    dragStart = { x: e.clientX, y: e.clientY }
  }
  
  function onDrag(e) {
    if (!isDragging) return
    offset.value.x += e.clientX - dragStart.x
    offset.value.y += e.clientY - dragStart.y
    dragStart = { x: e.clientX, y: e.clientY }
  }
  
function endDrag() {
  isDragging = false
}

// Zoom
function onScroll(e) {
  const delta = -e.deltaY
  zoom.value += delta * 0.001
  zoom.value = Math.min(2, Math.max(0.5, zoom.value))
}

function getTileStyle({ x, y }) {
  const left = (x - y) * (tileWidth / 2)
  const top = (x + y) * (tileHeight / 2)
  return {
    left: `${left}px`,
    top: `${top}px`,
  }
}
</script>
  
<style scoped>
.grid-wrapper {
  width: 100%;
  height: calc(100vh - 80px);
  overflow: hidden;
  position: relative;
  cursor: grab;
  background: #6ec5ff; /* Océan clair */
  /* OU avec image : */
  /* background-image: url('@/assets/ocean-background.png'); */
  /* background-size: cover; */
}

  .farm-grid {
    position: absolute;
    left: 50%;
    top: 50%;
    transform-origin: center center;
  }
  </style>
  
