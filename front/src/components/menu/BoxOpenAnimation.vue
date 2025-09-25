<template>
  <transition name="fade">
    <div v-if="show" class="box-open-overlay">
      <div class="box-open-content">
        <div class="glow"></div>
        <div class="box-wrap">
          <div class="box-icon" :class="{ pop: popping }">{{ icon }}</div>
          <div class="burst" :class="{ show: popping }"></div>
        </div>
        <div class="label">{{ label }}</div>
        <div class="sparkles">
          <span v-for="n in 12" :key="n" class="sparkle" :style="sparkleStyle(n)"></span>
        </div>
      </div>
    </div>
  </transition>
  
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  icon: { type: String, default: '📦' },
  label: { type: String, default: 'Ouverture de la boîte…' },
})

// Petit effet "pop" au démarrage
const popping = ref(false)
watch(() => props.show, (v) => {
  if (v) {
    popping.value = false
    requestAnimationFrame(() => {
      popping.value = true
      setTimeout(() => (popping.value = false), 450)
    })
  }
})

// Styles aléatoires contrôlés par index (déterministes)
function sparkleStyle(n) {
  const angle = (n * 30) % 360
  const dist = 30 + (n % 5) * 10
  const duration = 1200 + (n % 4) * 200
  const delay = (n % 6) * 60
  const size = 4 + (n % 3) * 2
  return {
    '--angle': `${angle}deg`,
    '--dist': `${dist}px`,
    '--dur': `${duration}ms`,
    '--delay': `${delay}ms`,
    width: `${size}px`,
    height: `${size}px`,
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 180ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.box-open-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  user-select: none;
  pointer-events: all;
}

.box-open-content {
  position: relative;
  width: 260px;
  height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.glow {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient( circle, rgba(255,230,150,0.85), rgba(255,198,110,0.55) 60%, rgba(0,0,0,0) 70% );
  filter: blur(2px);
  animation: glowPulse 1200ms ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { transform: scale(0.95); opacity: 0.9 }
  50% { transform: scale(1.05); opacity: 1 }
}

.box-wrap { position: relative; }

.box-icon {
  font-size: 84px;
  transform-origin: center bottom;
  animation: breathe 1100ms ease-in-out infinite;
  filter: drop-shadow(0 6px 8px rgba(0,0,0,0.25));
}

.box-icon.pop { animation: pop 450ms cubic-bezier(.2, .8, .2, 1) forwards; }

@keyframes breathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-4px) scale(1.03); }
}

@keyframes pop {
  0% { transform: scale(0.85); }
  60% { transform: scale(1.15); }
  100% { transform: scale(1.0); }
}

.burst {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(255, 230, 150, 0.0),
    rgba(255, 230, 150, 0.9) 10%,
    rgba(255, 198, 110, 0.0) 20%,
    rgba(255, 230, 150, 0.0) 30%,
    rgba(255, 198, 110, 0.85) 40%,
    rgba(255, 230, 150, 0.0) 50%,
    rgba(255, 198, 110, 0.9) 60%,
    rgba(255, 230, 150, 0.0) 70%,
    rgba(255, 198, 110, 0.0) 100%
  );
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}

.burst.show {
  animation: burstOut 500ms ease-out forwards;
}

@keyframes burstOut {
  0% { transform: scale(0.3); opacity: 0; }
  70% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}

.label {
  margin-top: 12px;
  font-family: 'Fredoka', sans-serif;
  font-weight: bold;
  color: #fff9e5;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.sparkles { position: absolute; inset: 0; pointer-events: none; }
.sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  background: #fff3c2;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: sparkle var(--dur) ease-in-out var(--delay) infinite;
  box-shadow: 0 0 6px rgba(255, 245, 200, 0.8);
}

@keyframes sparkle {
  0% { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(0.6); opacity: 0; }
  40% { opacity: 1; }
  70% { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--dist)) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--dist)) scale(0); opacity: 0; }
}
</style>
