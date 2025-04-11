<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { chickenStats } from '@/data/chicken_stats'

const props = defineProps({
  x: Number,
  y: Number,
  type: { type: String, default: 'white' },
  tileWidth: { type: Number, default: 64 },
  tileHeight: { type: Number, default: 32 },
  gridSize: { type: Number, default: 14 },
  isWalkable: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['click'])

const pos = ref({ x: props.x, y: props.y })         // position logique
const visualPos = ref({ x: props.x, y: props.y })    // position affichée
const currentAnimation = ref('idle')
const facing = ref('right') // ou 'left'
const stats = chickenStats[props.type] || chickenStats.white

let aiTimeout = null
let movementInterval = null

function loopAI() {
  const delay = Math.random() * (stats.idleTime[1] - stats.idleTime[0]) + stats.idleTime[0]

  const willPeck = Math.random() < stats.peckingChance
  const willMove = Math.random() < stats.movementFrequency

  aiTimeout = setTimeout(() => {
    if (willPeck && willMove) {
      // Si les deux sont vrais, on choisit aléatoirement l'une des actions
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
    } else {
      loopAI() // Si aucune action n'est choisie, on recommence directement
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
  ]

  const shuffled = directions.sort(() => Math.random() - 0.5)

  for (const { dx, dy } of shuffled) {
    const newX = pos.value.x + dx
    const newY = pos.value.y + dy
    const isInside =
      newX >= 0 && newY >= 0 &&
      newX < props.gridSize && newY < props.gridSize

    if (isInside && props.isWalkable(newX, newY)) {
      pos.value = { x: newX, y: newY }
      animateMovement()
      
      if (dx < 0) facing.value = 'left'
      if (dx > 0) facing.value = 'right'
      break
    }
  }

  // Délai plus court après le mouvement si movementFrequency est élevé
  const nextActionDelay = stats.movementFrequency >= 0.8 ? 
    200 / stats.speed : // Délai court si très active
    800 / stats.speed   // Délai normal sinon

  setTimeout(() => {
    currentAnimation.value = 'idle'
    loopAI()
  }, nextActionDelay)
}

function animateMovement() {
  clearInterval(movementInterval)

  const duration = 500 / stats.speed
  const stepTime = 16
  const steps = duration / stepTime

  const dx = (pos.value.x - visualPos.value.x) / steps
  const dy = (pos.value.y - visualPos.value.y) / steps

  let step = 0
  movementInterval = setInterval(() => {
    step++
    visualPos.value.x += dx
    visualPos.value.y += dy
    if (step >= steps) {
      visualPos.value = { ...pos.value }
      clearInterval(movementInterval)
    }
  }, stepTime)
}

onMounted(() => {
  loopAI()
})

onUnmounted(() => {
  clearTimeout(aiTimeout)
  clearInterval(movementInterval)
})

function handleClick() {
  emit('click')
}

const style = computed(() => {
  const left = (visualPos.value.x - visualPos.value.y) * (props.tileWidth / 2) + 12
  const top = (visualPos.value.x + visualPos.value.y) * (props.tileHeight / 2) - 16
  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    zIndex: Math.floor(visualPos.value.x + visualPos.value.y + 1),
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
  <img
    class="chicken"
    :src="spritePath"
    :style="style"
    @click="handleClick"
    :alt="type"
  />
</template>

<style scoped>
.chicken {
  user-select: none;
  pointer-events: auto;
}
</style>
