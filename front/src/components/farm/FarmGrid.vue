/// FarmGrid.vue 
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

      <LockedChunk
        v-for="chunk in lockedChunks"
        :key="`locked-${chunk.x}-${chunk.y}`"
        :chunk="chunk"
        :chunkSize="chunkSize"
        :tileSize="tileSize"
        @unlock="tryUnlockChunk"
      />

      <FenceCorner
        v-for="(corner, index) in fenceCorners"
        :key="`corner-${index}`"
        :x="corner.x"
        :y="corner.y"
        :position="corner.side"
      />

      <ChunkFence
        v-for="(fence, index) in onlyFences"
        :key="`fence-${index}`"
        :x="fence.x"
        :y="fence.y"
        :side="fence.side"
      />

      <Chicken
        v-for="chicken in chickens"
        :key="chicken.id"
        :x="chicken.x"
        :y="chicken.y"
        :type="chicken.type"
        :isWalkable="isWalkable"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import FarmTile from './FarmTile.vue'
import Chicken from './Chicken.vue'
import LockedChunk from './LockedChunk.vue'
import ChunkFence from './ChunkFence.vue'
import FenceCorner from './FenceCorner.vue'
import { generateFences } from '@/composables/generateFences.js'

// === Config ===
const chunkSize = 8
const tileSize = 16

// === Chunks de la ferme ===
const mapChunks = ref([
  { x: 0, y: 0, unlocked: true },
  { x: 1, y: 0, unlocked: true },
  { x: 0, y: 1, unlocked: true },
  { x: 1, y: 1, unlocked: true },
  { x: 2, y: 0, unlocked: false },
  { x: 2, y: 1, unlocked: false },
  { x: 0, y: 2, unlocked: false },
  { x: 1, y: 2, unlocked: false },
  { x: 2, y: 2, unlocked: false },
  { x: -1, y: -1, unlocked: false },
  { x: -1, y: 0, unlocked: false },
  { x: -1, y: 1, unlocked: false },
  { x: -1, y: 2, unlocked: false },
  { x: -2, y: -1, unlocked: false },
  { x: -2, y: 0, unlocked: false },
  { x: -2, y: 1, unlocked: false },
  { x: -2, y: 2, unlocked: false },
  { x: 0, y: -1, unlocked: false },
  { x: 1, y: -1, unlocked: false },
  { x: 2, y: -1, unlocked: false },
  { x: 0, y: -2, unlocked: false },
  { x: 1, y: -2, unlocked: false },
  { x: 2, y: -2, unlocked: false }

])

// === Génération des tuiles visibles ===
const tiles = computed(() => {
  const t = []
  for (const chunk of mapChunks.value) {
    if (!chunk.unlocked) continue
    for (let dx = 0; dx < chunkSize; dx++) {
      for (let dy = 0; dy < chunkSize; dy++) {
        const x = chunk.x * chunkSize + dx
        const y = chunk.y * chunkSize + dy
        t.push({ x, y, type: 'grass' })
      }
    }
  }
  return t
})

const fencesData = ref({ sides: [], corners: [] })

watch(
  mapChunks,
  () => {
    // 💡 force un deep copy pour déclencher la réactivité
    const chunksCopy = JSON.parse(JSON.stringify(mapChunks.value))
    fencesData.value = generateFences(chunksCopy, chunkSize, tileSize)
  },
  { deep: true, immediate: true }
)


const onlyFences = computed(() => fencesData.value.sides)
const fenceCorners = computed(() => fencesData.value.corners)


const lockedChunks = computed(() =>
  mapChunks.value.filter(c => !c.unlocked && isAdjacentToUnlocked(c))
)

function isAdjacentToUnlocked(chunk) {
  return mapChunks.value.some(
    other =>
      other.unlocked &&
      Math.abs(other.x - chunk.x) + Math.abs(other.y - chunk.y) === 1
  )
}

async function tryUnlockChunk(chunk) {
  const index = mapChunks.value.findIndex(
    c => c.x === chunk.x && c.y === chunk.y
  )
  if (index !== -1) {
    const updated = [...mapChunks.value]
    updated[index] = { ...updated[index], unlocked: true }
    mapChunks.value = updated

    // 🔁 attendre que Vue réagisse avant de regénérer
    await nextTick()
    const chunksCopy = JSON.parse(JSON.stringify(mapChunks.value))
    fencesData.value = generateFences(chunksCopy, chunkSize, tileSize)
  }
}

const chickens = [
  { id: 1, type: 'white', x: ref(3), y: ref(2) },
  { id: 2, type: 'red', x: ref(6), y: ref(6) },
  { id: 3, type: 'black', x: ref(1), y: ref(3) }
]

const offset = ref({ x: 0, y: 0 })
const zoom = ref(1.2)
const gridWrapper = ref(null)
const isDraggingRef = ref(false)

let isDragging = false
let dragStart = { x: 0, y: 0 }

onMounted(() => {
  centerGrid()
})

function centerGrid() {
  const totalSize = tileSize * zoom.value
  const wrapper = gridWrapper.value
  if (wrapper) {
    offset.value.x = (wrapper.clientWidth - totalSize) / 2
    offset.value.y = (wrapper.clientHeight - totalSize) / 2
  }
}

function isWalkable(x, y) {
  return !chickens.some(ch => ch.x.value === x && ch.y.value === y)
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
  const zoomFactor = 0.001
  const delta = -e.deltaY
  const newZoom = zoom.value + delta * zoomFactor
  const clampedZoom = Math.round((zoom.value + delta * zoomFactor) * 10) / 10
  if (clampedZoom === zoom.value) return

  const rect = gridWrapper.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const beforeZoomX = (mouseX - offset.value.x) / zoom.value
  const beforeZoomY = (mouseY - offset.value.y) / zoom.value

  zoom.value = clampedZoom

  offset.value.x = mouseX - beforeZoomX * zoom.value
  offset.value.y = mouseY - beforeZoomY * zoom.value
}

function getTileStyle({ x, y }) {
  return {
    left: `${x * tileSize}px`,
    top: `${y * tileSize}px`
  }
}
</script>

<style scoped>
.grid-wrapper {
  width: 100%;
  height: calc(100vh - 80px);
  overflow: hidden;
  position: relative;
  background: #72d73b;
  cursor: url('@/assets/ui/cursor/hand_small_open.png') 16 16, auto;
}

.farm-grid {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: top left;
  transition: transform 0.08s ease-out;
  transform: translateZ(0);
}

.grid-wrapper.dragging {
  cursor: url('@/assets/ui/cursor/hand_small_closed.png') 16 16, auto;
}
</style>
