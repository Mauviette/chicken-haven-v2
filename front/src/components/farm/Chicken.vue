<script setup>
import { computed, ref, onMounted, onUnmounted, reactive } from 'vue'
import { chickenStats } from '@/data/chicken_stats'

const props = defineProps({
  x: Object,
  y: Object,
  type: { type: String, default: 'white' },
  gridSize: { type: Number, default: 14 },
  tileSize: { type: Number, default: 16 },
  isWalkable: Function
})

const visualPos = reactive({ x: props.x.value, y: props.y.value })
const currentAnimation = ref('idle')
const facing = ref('right')
const stats = chickenStats[props.type] || chickenStats.white
const isRunning = ref(false)

let aiTimeout = null
let movementInterval = null

function loopAI() {
  const delay = Math.random() * (stats.idleTime[1] - stats.idleTime[0]) + stats.idleTime[0]
  const willPeck = Math.random() < stats.peckingChance
  const willMove = Math.random() < stats.movementFrequency
  const willShake = Math.random() < stats.shakingChance
  const willRun = Math.random() < stats.runningModeChance

  aiTimeout = setTimeout(() => {
    if (willRun) return runAround()
    if (willPeck && willMove && Math.random() < 0.5) {
      currentAnimation.value = 'pecking'
      setTimeout(() => {
        currentAnimation.value = 'idle'
        loopAI()
      }, stats.peckingTime)
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

function moveRandomly(skipLoop = false) {
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
      facing.value = dx < 0 ? 'left' : 'right'
      break
    }
  }

  if (!skipLoop) {
    setTimeout(() => {
      currentAnimation.value = 'idle'
      loopAI()
    }, stats.movementFrequency >= 0.8 ? 200 / stats.speed : 800 / stats.speed)
  }
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

function runAround() {
  if (isRunning.value) return
  isRunning.value = true
  currentAnimation.value = 'walking'

  const duration = stats.runningModeDuration || 3000
  const interval = 600 / stats.speed
  const endTime = Date.now() + duration

  function runStep() {
    if (Date.now() > endTime) {
      isRunning.value = false
      currentAnimation.value = 'idle'
      loopAI()
      return
    }
    moveRandomly(true)
    setTimeout(runStep, interval)
  }
  runStep()
}

onMounted(() => loopAI())
onUnmounted(() => {
  clearTimeout(aiTimeout)
  clearInterval(movementInterval)
})

const style = computed(() => {
  return {
    position: 'absolute',
    left: `${visualPos.x * props.tileSize + 1.5}px`,
    top: `${visualPos.y * props.tileSize}px`,
    zIndex: visualPos.y,
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
  <div class="chicken-wrapper" :style="style">
    <img class="chicken" :src="spritePath" :alt="type" draggable="false" />
  </div>
</template>

<style scoped>
.chicken-wrapper {
  user-select: none;
}

.chicken {
  width: 12px;
  height: 12px;
  user-select: none;
  pointer-events: auto;
  position: relative;
  z-index: 2;
}
</style>
