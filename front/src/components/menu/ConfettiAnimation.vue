<template>
  <div v-if="show" class="confetti-container" :key="animationKey">
    <div
      v-for="(confetti, index) in confettiPieces"
      :key="`${animationKey}-${index}`"
      class="confetti-piece"
      :style="confetti.style"
    >
      {{ confetti.emoji }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: '⚡'
  }
})

const confettiPieces = ref([])
const animationKey = ref(0)

const confettiEmojis = ['🎉', '✨', '🌟', '💫', '🎊', '🔥', '⚡', '💰', '📈']

function createConfetti() {
  const pieces = []
  const numberOfPieces = 25
  
  // Incrémenter la clé pour forcer un nouveau rendu
  animationKey.value++

  for (let i = 0; i < numberOfPieces; i++) {
    const emoji = Math.random() < 0.3 ? props.icon : confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)]
    
    pieces.push({
      emoji,
      style: {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 0.5}s`,
        animationDuration: `${2 + Math.random() * 1}s`,
        fontSize: `${16 + Math.random() * 8}px`
      }
    })
  }
  
  confettiPieces.value = pieces
}

watch(() => props.show, (newValue) => {
  if (newValue) {
    createConfetti()
  } else {
    setTimeout(() => {
      confettiPieces.value = []
    }, 100)
  }
})
</script>

<style scoped>
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9998;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -50px;
  animation: confetti-fall linear forwards;
  user-select: none;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-50px) rotate(0deg) scale(1);
    opacity: 1;
  }
  50% {
    opacity: 1;
    transform: translateY(50vh) rotate(180deg) scale(0.8);
  }
  100% {
    transform: translateY(100vh) rotate(360deg) scale(0.5);
    opacity: 0;
  }
}

/* Variantes d'animation pour plus de diversité */
.confetti-piece:nth-child(odd) {
  animation-name: confetti-fall-left;
}

.confetti-piece:nth-child(even) {
  animation-name: confetti-fall-right;
}

@keyframes confetti-fall-left {
  0% {
    transform: translateY(-50px) translateX(0) rotate(0deg) scale(1);
    opacity: 1;
  }
  50% {
    opacity: 1;
    transform: translateY(50vh) translateX(-30px) rotate(180deg) scale(0.8);
  }
  100% {
    transform: translateY(100vh) translateX(-60px) rotate(360deg) scale(0.5);
    opacity: 0;
  }
}

@keyframes confetti-fall-right {
  0% {
    transform: translateY(-50px) translateX(0) rotate(0deg) scale(1);
    opacity: 1;
  }
  50% {
    opacity: 1;
    transform: translateY(50vh) translateX(30px) rotate(-180deg) scale(0.8);
  }
  100% {
    transform: translateY(100vh) translateX(60px) rotate(-360deg) scale(0.5);
    opacity: 0;
  }
}
</style>