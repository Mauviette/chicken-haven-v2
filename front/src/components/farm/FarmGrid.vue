<template>
  <div
    class="grid-wrapper"
    ref="gridWrapper"
    :class="{ dragging: isDraggingRef }"
    @mousedown="startDrag"
    @mousemove="onDrag"
    @mouseup="endDrag"
    @mouseleave="endDrag"
    @wheel.prevent="onScroll"
  >
    <div
      class="farm-grid"
      :style="{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }"
    >
      <FarmTile
        v-for="(tile, index) in tiles"
        :key="index"
        :tileStyle="getTileStyle(tile)"
        :type="tile.type"
      />

      <Chicken
        v-for="chicken in chickens"
        :key="chicken.id"
        :x="chicken.x"
        :y="chicken.y"
        :type="chicken.type"
        :gridSize="gridSize"
        :isWalkable="isWalkable"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FarmTile from './FarmTile.vue'
import Chicken from './Chicken.vue'

const gridSize = 14
const tileWidth = 64
const tileHeight = 32

const chickens = [
  { id: 1, type: 'white', x: ref(3), y: ref(2) },
  { id: 2, type: 'red', x: ref(6), y: ref(6) },
  { id: 3, type: 'black', x: ref(1), y: ref(3) }
]

const offset = ref({ x: 0, y: 0 })
const zoom = ref(1)
const gridWrapper = ref(null)
const isDraggingRef = ref(false)

function isWalkable(x, y) {
  for (const chicken of chickens) {
    if (chicken.x.value === x && chicken.y.value === y) {
      return false
    }
  }
  return true
}

function startDrag(e) {
  isDragging = true
  isDraggingRef.value = true
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
  isDraggingRef.value = false
 }

function onScroll(e) {
  const delta = -e.deltaY
  zoom.value += delta * 0.001
  zoom.value = Math.min(2, Math.max(0.5, zoom.value))
}

function getTileStyle({ x, y }) {
  const left = (x - y) * (tileWidth / 2)
  const top = (x + y) * (tileHeight / 2)
  return { left: `${left}px`, top: `${top}px` }
}

let isDragging = false
let dragStart = { x: 0, y: 0 }

const tiles = Array.from({ length: gridSize * gridSize }, (_, i) => {
  const x = i % gridSize
  const y = Math.floor(i / gridSize)
  const type = (x === 0 || y === 0 || x === gridSize - 1 || y === gridSize - 1) ? 'beach' : 'grass'
  return { x, y, type }
})
</script>

<style scoped>
.grid-wrapper {
  width: 100%;
  height: calc(100vh - 80px);
  overflow: hidden;
  position: relative;
  background: #6ec5ff;
  cursor: url('@/assets/ui/cursor/hand_small_open.png') 16 16, auto;
}
.farm-grid {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
}

.grid-wrapper.dragging {
  cursor: url('@/assets/ui/cursor/hand_small_closed.png') 16 16, auto;
}
</style>
