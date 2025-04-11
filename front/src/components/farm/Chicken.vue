<script setup>
import { computed, ref, onMounted, onUnmounted, reactive } from 'vue'
import { chickenStats } from '@/data/chicken_stats'

const props = defineProps({
  x: Object,
  y: Object,
  type: { type: String, default: 'white' },
  gridSize: { type: Number, default: 14 },
  tileWidth: { type: Number, default: 64 },
  tileHeight: { type: Number, default: 32 },
  isWalkable: Function
})

const visualPos = reactive({ x: props.x.value, y: props.y.value })
const currentAnimation = ref('idle')
const facing = ref('right')
const stats = chickenStats[props.type] || chickenStats.white

let aiTimeout = null
let movementInterval = null

function loopAI() {
  const delay = Math.random() * (stats.idleTime[1] - stats.idleTime[0]) + stats.idleTime[0]
  const willPeck = Math.random() < stats.peckingChance
  const willMove = Math.random() < stats.movementFrequency
  const willShake = Math.random() < stats.shakingChance

  aiTimeout = setTimeout(() => {
    if (willPeck && willMove) {
      if (Math.random() < 0.5) {
        currentAnimation.value = 'pecking'
        setTimeout(() => {
          currentAnimation.value = 'idle'
          loopAI()
        }, stats.peckingTime)
      } else {
        moveRandomly()
      }
    } else if (willPeck) {
      currentAnimation.value = 'pecking'
      setTimeout(() => {
        currentAnimation.value = 'idle'
        loopAI()
      }, stats.peckingTime)
    } else if (willMove) {
      moveRandomly()
    } else if (willShake) {
      shake()
    } else {
      loopAI()
    }
  }, delay)
}

function moveRandomly() {
  currentAnimation.value = 'walking'
  const directions = [
    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
    { dx: 1, dy: 1 }, { dx: -1, dy: -1 },
    { dx: -1, dy: 1 }, { dx: 1, dy: -1 }
  ].sort(() => Math.random() - 0.5)

  for (const { dx, dy } of directions) {
    const newX = props.x.value + dx
    const newY = props.y.value + dy
    const isInside = newX >= 0 && newY >= 0 && newX < props.gridSize && newY < props.gridSize

    if (isInside && props.isWalkable(newX, newY)) {
      props.x.value = newX
      props.y.value = newY
      animateMovement()
      
      // Nouvelle logique pour la direction en vue isométrique
      const isoX = dx - dy // Conversion en coordonnées isométriques
      if (isoX > 0) facing.value = 'right'
      if (isoX < 0) facing.value = 'left'
      break
    }
  }

  setTimeout(() => {
    currentAnimation.value = 'idle'
    loopAI()
  }, stats.movementFrequency >= 0.8 ? 200 / stats.speed : 800 / stats.speed)
}

function animateMovement() {
  clearInterval(movementInterval)
  const duration = 525 / stats.speed
  const stepTime = 16
  const steps = duration / stepTime

  const dx = (props.x.value - visualPos.x) / steps
  const dy = (props.y.value - visualPos.y) / steps

  let step = 0
  movementInterval = setInterval(() => {
    step++
    visualPos.x += dx
    visualPos.y += dy
    if (step >= steps) {
      visualPos.x = props.x.value
      visualPos.y = props.y.value
      clearInterval(movementInterval)
    }
  }, stepTime)
}

function shake() {
  currentAnimation.value = 'shaking'
  setTimeout(() => {
    currentAnimation.value = 'idle'
    loopAI()
  }, stats.shakingTime)
}

onMounted(() => loopAI())
onUnmounted(() => {
  clearTimeout(aiTimeout)
  clearInterval(movementInterval)
})

const style = computed(() => {
  const left = (visualPos.x - visualPos.y) * (props.tileWidth / 2) + 12
  const top = (visualPos.x + visualPos.y) * (props.tileHeight / 2) - 16
  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: '36px',
    height: '36px',
    zIndex: Math.floor(visualPos.x + visualPos.y + 1),
    transform: facing.value === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
    transformOrigin: 'center'
  }
})

const sprites = import.meta.glob('@/assets/chickens/*/*.gif', { eager: true })
const spritePath = computed(() => {
  const key = `/src/assets/chickens/${props.type}/${currentAnimation.value}.gif`
  return sprites[key]?.default || ''
})
</script>

<template>
  <img class="chicken" :src="spritePath" :style="style" :alt="type" />
</template>

<style scoped>
.chicken {
  user-select: none;
  pointer-events: auto;
}
</style>
