<template>
  <div class="production-screen">
    <div class="production-content">

      <div class="egg-clicker">
        <!-- Œuf cliquable principal -->
        <div class="egg-container">
          <div 
            class="clickable-egg"
            :class="{ 
              'clickable': isClickable, 
              'max-gains': currentGains >= eggState.maxIncome,
              'loading': eggState.isLoading 
            }"
            @click="handleEggClick"
          >
            <div class="egg-sprite">🥚</div>
            <div class="egg-glow" v-if="currentGains >= eggState.maxIncome"></div>
            
            <!-- Effets visuels d'œufs qui sautent -->
            <div class="egg-effects-container">
              <div 
                v-for="effect in eggEffects" 
                :key="effect.id"
                class="flying-egg"
                :style="{
                  '--start-x': effect.startX + 'px',
                  '--start-y': effect.startY + 'px',
                  '--jump-x': effect.jumpX + 'px',
                  '--jump-y': effect.jumpY + 'px',
                  '--fall-y': effect.fallY + 'px',
                  '--rotation': effect.rotation + 'deg',
                  animationDelay: effect.delay + 'ms',
                  animationDuration: effect.duration + 'ms'
                }"
              >
                🥚
              </div>
            </div>
          </div>

          <!-- Barre de progression des gains -->
          <div class="gains-display">
            <div class="gains-bar-container">
              <div class="gains-bar">
                <div 
                  class="gains-progress" 
                  :style="{ width: progressPercentage + '%' }"
                ></div>
              </div>
              <div class="gains-text">
                {{ currentGains }} / {{ eggState.maxIncome }}
              </div>
            </div>
            
            <div class="income-info">
              <span class="income-rate">{{ eggState.income }}/s</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useEgg } from '@/composables/useEgg'
import { usePlayer } from '@/composables/usePlayer'

const { 
  eggState, 
  currentGains, 
  isClickable, 
  progressPercentage,
  fetchEggStatus, 
  clickEgg, 
  startUpdates, 
  stopUpdates 
} = useEgg()

const { refreshPlayer } = usePlayer()

// Effets visuels
const eggEffects = ref([])
let effectId = 0

// Fonction pour créer l'effet d'œufs qui sautent
const createEggEffect = (eggsGained) => {
  const numEggs = Math.min(eggsGained, 8)
  
  for (let i = 0; i < numEggs; i++) {
    // Position de départ plus proche du centre (rayon plus petit)
    const startRadius = Math.random() * 10 // 0-10px du centre
    const startAngle = Math.random() * Math.PI * 2
    const startX = Math.cos(startAngle) * startRadius
    const startY = Math.sin(startAngle) * startRadius
    
    // Direction aléatoire pour le saut
    const jumpAngle = Math.random() * Math.PI * 2
    const jumpDistance = 40 + Math.random() * 60 // 40-100px
    const jumpX = Math.cos(jumpAngle) * jumpDistance
    const jumpY = Math.sin(jumpAngle) * jumpDistance - (20 + Math.random() * 20) // Légèrement vers le haut
    
    // Gravité pour la chute
    const fallDistance = 80 + Math.random() * 40 // Distance de chute
    
    const effect = {
      id: effectId++,
      startX: startX,
      startY: startY,
      jumpX: jumpX,
      jumpY: jumpY,
      fallY: jumpY + fallDistance,
      delay: i * 30, // Délai échelonné plus rapide
      duration: 1200 + Math.random() * 400, // Durée plus longue pour la physique
      rotation: Math.random() * 360 // Rotation initiale aléatoire
    }
    
    eggEffects.value.push(effect)
    
    // Supprimer l'effet après l'animation
    setTimeout(() => {
      const index = eggEffects.value.findIndex(e => e.id === effect.id)
      if (index > -1) {
        eggEffects.value.splice(index, 1)
      }
    }, effect.duration + effect.delay + 100)
  }
}

const handleEggClick = async () => {
  if (isClickable.value) {
    const eggsGained = Math.floor(currentGains.value)
    await clickEgg()
    // Créer l'effet visuel
    if (eggsGained > 0) {
      createEggEffect(eggsGained)
    }
    // Actualiser l'affichage des œufs dans la TopBar
    await refreshPlayer()
  }
}

onMounted(async () => {
  await fetchEggStatus()
  startUpdates()
})

onUnmounted(() => {
  stopUpdates()
})
</script>

<style scoped>
/* � DIMENSION PARALLÈLE ULTRA-PSYCHÉDÉLIQUE � */
.production-screen {
  flex: 1;
  width: 100%;
  background: 
    radial-gradient(circle at 25% 25%, #ff00ff 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, #00ffff 0%, transparent 50%),
    radial-gradient(circle at 50% 10%, #ffff00 0%, transparent 40%),
    radial-gradient(circle at 10% 90%, #ff0080 0%, transparent 45%),
    radial-gradient(circle at 90% 10%, #80ff00 0%, transparent 45%),
    conic-gradient(from 0deg at 50% 50%, 
      #ff0000 0deg, #ff8000 45deg, #ffff00 90deg, #80ff00 135deg,
      #00ff00 180deg, #00ff80 225deg, #00ffff 270deg, #0080ff 315deg, #ff0000 360deg);
  background-size: 
    200% 200%, 300% 300%, 150% 150%, 250% 250%, 180% 180%, 600% 600%;
  animation: 
    interdimensional-chaos 3s ease-in-out infinite,
    cosmic-drift 8s linear infinite,
    reality-glitch 5s ease-in-out infinite;
  overflow: hidden;
  position: relative;
  font-family: 'Comic Sans MS', 'Fredoka', cursive;
  
  /* PORTAILS TEMPORELS */
  &::before {
    content: '🌀 👁️ 🔮 💫 ⚡ 🌈 🎆 🎇 🌟 ✨ 💎 🚀 👽 🛸 🌌 🌠 🔥 💥 🌀 👁️ 🔮 💫 ⚡ 🌈 🎆 🎇 🌟 ✨ 💎 🚀 👽 🛸 🌌 🌠 🔥 💥';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    font-size: 25px;
    line-height: 60px;
    animation: 
      portal-storm 4s linear infinite,
      reality-warp 6s ease-in-out infinite,
      dimensional-shift 10s linear infinite;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
    white-space: nowrap;
    filter: blur(1px) hue-rotate(0deg);
  }
  
  /* FRACTALES HYPNOTIQUES */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      repeating-conic-gradient(from 0deg at 30% 30%, 
        transparent 0deg, rgba(255, 0, 255, 0.3) 10deg, transparent 20deg),
      repeating-conic-gradient(from 45deg at 70% 70%, 
        transparent 0deg, rgba(0, 255, 255, 0.3) 15deg, transparent 30deg),
      repeating-radial-gradient(circle at 50% 50%, 
        transparent 0px, rgba(255, 255, 0, 0.2) 20px, transparent 40px);
    background-size: 100px 100px, 150px 150px, 80px 80px;
    animation: 
      fractal-madness 12s linear infinite,
      hypnotic-spin 8s linear infinite reverse;
    pointer-events: none;
    z-index: 2;
  }
}

.production-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  z-index: 2;
}

.egg-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  transform: perspective(1000px) rotateX(10deg);
  animation: float-container 6s ease-in-out infinite;
}

/* 🌀 L'ŒUF HYPERDIMENSIONNEL SUPRÊME 🌀 */
.clickable-egg {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s cubic-bezier(0.68, -2.55, 0.265, 3.55);
  filter: grayscale(0.2) contrast(2) saturate(3);
  
  /* VORTEX HYPERDIMENSIONNEL */
  background: 
    conic-gradient(from 0deg, 
      #ff0080 0deg, #ff8000 30deg, #ffff00 60deg, #80ff00 90deg,
      #00ff80 120deg, #00ffff 150deg, #0080ff 180deg, #8000ff 210deg,
      #ff00ff 240deg, #ff0040 270deg, #ff4000 300deg, #ffff80 330deg, #ff0080 360deg),
    radial-gradient(circle at 50% 50%, 
      transparent 30%, rgba(255, 255, 255, 0.8) 35%, transparent 40%),
    radial-gradient(circle at 50% 50%, 
      transparent 50%, rgba(0, 0, 0, 0.3) 55%, transparent 60%);
  background-size: 300% 300%, 100% 100%, 120% 120%;
  border-radius: 50%;
  padding: 15px;
  animation: 
    vortex-spin 1s linear infinite,
    hyperdimensional-pulse 3s ease-in-out infinite,
    reality-distortion 4s ease-in-out infinite;
  
  /* MULTIPLES AURAS COSMIQUES */
  box-shadow: 
    0 0 30px rgba(255, 0, 128, 0.8),
    0 0 60px rgba(0, 255, 128, 0.6),
    0 0 90px rgba(128, 0, 255, 0.5),
    0 0 120px rgba(255, 128, 0, 0.4),
    0 0 150px rgba(0, 128, 255, 0.3),
    inset 0 0 30px rgba(255, 255, 255, 0.4),
    inset 0 0 60px rgba(0, 0, 0, 0.2);
}

.clickable-egg.clickable {
  filter: grayscale(0) contrast(3) saturate(5) brightness(2);
  animation: 
    vortex-spin 0.3s linear infinite,
    hyperdimensional-pulse 1s ease-in-out infinite,
    reality-distortion 2s ease-in-out infinite,
    apocalypse-mode 0.8s ease-in-out infinite;
  transform: scale(1.3) rotate(0deg);
  
  /* APOCALYPSE D'ÉMOJIS */
  &::before {
    content: '��💥�⚡�👽🛸��🎆🎇💫🌟✨🎊🎉💀☠️👻🤯😵‍💫🥴🤪😜🤩🥳🤠👹👺🤖👾🎭🎪🎨🎬🎮🎯🎲🃏🎰🎳🏆🥇🏅🎖️🏵️🎗️🎟️🎫�';
    position: absolute;
    top: -50px;
    left: -50px;
    right: -50px;
    bottom: -50px;
    font-size: 20px;
    animation: 
      apocalypse-orbit 2s linear infinite,
      emoji-chaos 1s ease-in-out infinite;
    pointer-events: none;
    z-index: 15;
    filter: blur(0.5px) hue-rotate(0deg);
  }
  
  /* ANNEAUX DE POUVOIR COSMIQUE */
  &::after {
    content: '';
    position: absolute;
    top: -30px;
    left: -30px;
    right: -30px;
    bottom: -30px;
    border: 5px solid transparent;
    border-radius: 50%;
    background: 
      conic-gradient(from 0deg, 
        #ff0080 0deg, #00ff80 60deg, #8000ff 120deg, 
        #ff8000 180deg, #0080ff 240deg, #ff0080 300deg, #ff0080 360deg) border-box;
    background-clip: border-box;
    animation: 
      cosmic-rings 1.5s linear infinite,
      power-surge 2s ease-in-out infinite;
    z-index: -1;
  }
}

.clickable-egg.max-gains {
  animation: 
    vortex-spin 0.1s linear infinite,
    hyperdimensional-pulse 0.3s ease-in-out infinite,
    reality-distortion 0.5s ease-in-out infinite,
    apocalypse-mode 0.2s ease-in-out infinite,
    end-of-world 0.4s ease-in-out infinite !important;
  filter: grayscale(0) contrast(5) saturate(10) brightness(3) hue-rotate(0deg);
  transform: scale(1.8) rotate(0deg);
  
  /* FIN DU MONDE NUMÉRIQUE */
  &::before {
    content: '🌋�☠️��🔥💥💀☠️👻🤯😵‍💫💀�💥���☠️🌋🔥💥💀👹☠️�💥🔥💀👺👹�💥🔥💀☠️👻🤯😵‍💫💀�💥🔥👹';
    position: absolute;
    top: -80px;
    left: -80px;
    right: -80px;
    bottom: -80px;
    font-size: 30px;
    animation: 
      armageddon-whirlwind 0.3s linear infinite,
      digital-apocalypse 0.5s ease-in-out infinite;
    pointer-events: none;
    z-index: 20;
    filter: blur(1px) hue-rotate(0deg) drop-shadow(0 0 10px #ff0080);
  }
  
  /* FOUDRE COSMIQUE */
  &::after {
    content: '⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡';
    position: absolute;
    top: -100px;
    left: -100px;
    right: -100px;
    bottom: -100px;
    font-size: 40px;
    animation: 
      lightning-storm 0.1s linear infinite,
      cosmic-thunder 0.2s ease-in-out infinite;
    pointer-events: none;
    z-index: 25;
    filter: brightness(3) drop-shadow(0 0 20px #ffff00);
  }
}

.clickable-egg.clickable:hover {
  transform: scale(1.3) rotate(360deg);
  animation-duration: 0.5s;
  filter: grayscale(0) contrast(1.3) saturate(2) brightness(1.2) hue-rotate(180deg);
}

.clickable-egg.loading {
  pointer-events: none;
  opacity: 0.7;
  animation: loading-wobble 0.8s ease-in-out infinite;
}

.egg-sprite {
  font-size: 100px;
  z-index: 5;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  /* Fond blanc pour contraster avec l'arc-en-ciel */
  background: radial-gradient(circle, white 60%, transparent 80%);
  border-radius: 50%;
  padding: 10px;
  
  /* Effet de rebond permanent */
  animation: egg-wiggle 2s ease-in-out infinite;
  
  /* Ombre portée colorée */
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3)) 
          drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
  transition: all 0.3s ease;
}

.egg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  background: conic-gradient(from 90deg, 
    rgba(255, 0, 128, 0.6), rgba(0, 255, 128, 0.6), 
    rgba(128, 0, 255, 0.6), rgba(255, 128, 0, 0.6),
    rgba(255, 0, 128, 0.6));
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: glow-pulse 1.5s ease-in-out infinite alternate, slow-rotate 8s linear infinite;
  z-index: 1;
  filter: blur(8px);
}

.egg-effects-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 15;
}

.flying-egg {
  position: absolute;
  font-size: 16px;
  animation: crazy-fly-and-fall 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  pointer-events: none;
  transform: translate(-50%, -50%);
  left: 50%;
  top: 50%;
  /* Effet de trail arc-en-ciel */
  filter: hue-rotate(0deg) saturate(2);
  animation-name: crazy-fly-and-fall, rainbow-trail;
}

/* 🎪 INTERFACE DE STATS DÉMENTE 🎪 */
.gains-display {
  background: linear-gradient(135deg, 
    #ff6b9d 0%, #c44569 25%, #f8b500 50%, 
    #3742fa 75%, #7bed9f 100%);
  background-size: 300% 300%;
  animation: crazy-bg 4s ease-in-out infinite;
  
  border: 5px solid transparent;
  background-clip: padding-box;
  border-radius: 20px;
  padding: 20px;
  min-width: 250px;
  position: relative;
  
  /* Bordure animée arc-en-ciel */
  &::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: conic-gradient(from 0deg, 
      #ff0080, #00ff80, #8000ff, #ff8000, 
      #0080ff, #ff0080);
    border-radius: 25px;
    z-index: -1;
    animation: border-spin 3s linear infinite;
  }
  
  /* Effet de particules */
  &::after {
    content: '✨ 💫 ⭐ 🌟 ✨ 💫 ⭐ 🌟';
    position: absolute;
    top: -15px;
    left: -15px;
    right: -15px;
    bottom: -15px;
    font-size: 12px;
    animation: particle-dance 6s linear infinite;
    pointer-events: none;
    z-index: 10;
  }
  
  /* Ombre démente */
  box-shadow: 
    0 10px 30px rgba(255, 107, 157, 0.4),
    0 20px 60px rgba(55, 66, 250, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.2),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
}

.gains-bar-container {
  margin-bottom: 15px;
  position: relative;
}

.gains-bar {
  width: 100%;
  height: 25px;
  background: linear-gradient(90deg, #2c2c2c 0%, #1a1a1a 100%);
  border: 3px solid #fff;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  
  /* Effet néon */
  box-shadow: 
    0 0 10px rgba(255, 255, 255, 0.3),
    inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.gains-progress {
  height: 100%;
  background: linear-gradient(90deg, 
    #ff006e 0%, #8338ec 20%, #3a86ff 40%, 
    #06ffa5 60%, #ffbe0b 80%, #ff006e 100%);
  background-size: 300% 100%;
  animation: progress-rainbow 2s linear infinite;
  border-radius: 10px;
  position: relative;
  
  /* Effet de brillance qui se déplace */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
    animation: shine-sweep 3s ease-in-out infinite;
  }
  
  /* Particules dans la barre */
  &::after {
    content: '✨';
    position: absolute;
    top: 50%;
    right: 5px;
    transform: translateY(-50%);
    font-size: 12px;
    animation: sparkle-bounce 1s ease-in-out infinite;
  }
}

.gains-text {
  text-align: center;
  font-family: 'Comic Sans MS', 'Fredoka', cursive;
  font-weight: 900;
  font-size: 18px;
  color: #fff;
  margin-top: 8px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  /* Effet texte néon pulsant */
  text-shadow: 
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 15px #ff006e,
    0 0 20px #ff006e,
    0 0 35px #ff006e;
  animation: neon-pulse 2s ease-in-out infinite alternate;
  
  /* Transformation 3D */
  transform: perspective(100px) rotateX(15deg);
}

.income-info {
  text-align: center;
  font-family: 'Comic Sans MS', 'Fredoka', cursive;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  margin-top: 10px;
}

.income-rate {
  background: linear-gradient(45deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
  padding: 8px 16px;
  border-radius: 20px;
  border: 3px solid #fff;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  
  /* Effet holographique */
  background-size: 200% 200%;
  animation: hologram 3s ease-in-out infinite;
  
  /* Ombre colorée */
  box-shadow: 
    0 5px 15px rgba(255, 154, 158, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  
  /* Texte avec effet chrome */
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  background-image: linear-gradient(45deg, #333, #666, #999, #666, #333);
  background-size: 300% 100%;
  animation: chrome-text 2s linear infinite;
}

/* 🎨 CONTENEUR PRINCIPAL PSYCHÉDÉLIQUE 🎨 */
.egg-clicker {
  background: linear-gradient(145deg, 
    #667eea 0%, #764ba2 25%, #f093fb 50%, 
    #f5576c 75%, #4facfe 100%);
  background-size: 400% 400%;
  animation: mega-gradient 8s ease-in-out infinite;
  
  width: 400px;
  height: 350px;
  padding: 25px;
  border-radius: 25px;
  position: relative;
  
  /* Bordure multicolore animée */
  border: 6px solid transparent;
  background-clip: padding-box;
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: -6px;
    right: -6px;
    bottom: -6px;
    background: conic-gradient(from 45deg, 
      #ff0080 0deg, #00ff80 72deg, #8000ff 144deg, 
      #ff8000 216deg, #0080ff 288deg, #ff0080 360deg);
    border-radius: 31px;
    z-index: -2;
    animation: hyper-spin 4s linear infinite;
  }
  
  /* Effet de profondeur avec plusieurs ombres */
  box-shadow: 
    0 20px 40px rgba(102, 126, 234, 0.4),
    0 40px 80px rgba(245, 87, 108, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 0 30px rgba(255, 255, 255, 0.1);
  
  /* Effet de lévitation */
  animation: mega-gradient 8s ease-in-out infinite, levitate 6s ease-in-out infinite;
}

.gains-bar {
  width: 100%;
  height: 20px;
  background: #E0E0E0;
  border: 2px solid #8B4513;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.gains-progress {
  height: 100%;
  background: #b77b3d;
  transition: width 0.3s ease;
  border-radius: 2px;
  background-image: url('@/assets/bar/bg.png');
}

.gains-text {
  text-align: center;
  font-family: 'Fredoka', sans-serif;
  font-weight: bold;
  font-size: 16px;
  color: #8B4513;
  margin-top: 5px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.income-info {
  text-align: center;
  font-family: 'Courier New', monospace;
  color: #666;
  font-size: 14px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.income-rate {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.egg-clicker {
  background-color: #421d00;
  background-image: url('@/assets/bar/bg.png');
  background-repeat: repeat;
  width: 350px;
  height: 290px;
  padding-top: 20px;
  border-radius: 10px;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  position: relative;
  border: 4px solid #b77b3d;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.25);
}

/* ✨ ANIMATIONS FOLLES ✨ */
@keyframes rainbow-wave {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes float-dots {
  0% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(-10px) translateX(5px); }
  66% { transform: translateY(5px) translateX(-3px); }
  100% { transform: translateY(0px) translateX(0px); }
}

@keyframes sparkle-rain {
  0% { transform: translateY(-100vh) translateX(0); }
  100% { transform: translateY(100vh) translateX(100px); }
}

@keyframes float-container {
  0%, 100% { transform: perspective(1000px) rotateX(10deg) translateY(0px); }
  50% { transform: perspective(1000px) rotateX(10deg) translateY(-15px); }
}

@keyframes halo-spin {
  0% { background-position: 0% 0%; }
  100% { background-position: 360% 0%; }
}

@keyframes mega-bounce {
  0%, 100% { transform: scale(1.1) translateY(0px); }
  50% { transform: scale(1.15) translateY(-10px); }
}

@keyframes max-chaos {
  0% { filter: grayscale(0) contrast(1.5) saturate(2) brightness(1.3) hue-rotate(0deg); }
  25% { filter: grayscale(0) contrast(1.8) saturate(3) brightness(1.5) hue-rotate(90deg); }
  50% { filter: grayscale(0) contrast(2) saturate(4) brightness(1.7) hue-rotate(180deg); }
  75% { filter: grayscale(0) contrast(1.8) saturate(3) brightness(1.5) hue-rotate(270deg); }
  100% { filter: grayscale(0) contrast(1.5) saturate(2) brightness(1.3) hue-rotate(360deg); }
}

@keyframes explosion-orbit {
  0% { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(360deg) scale(1.2); }
}

@keyframes chaos-whirlwind {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.5); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes loading-wobble {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

@keyframes egg-wiggle {
  0%, 100% { transform: rotate(-2deg) scale(1); }
  25% { transform: rotate(1deg) scale(1.05); }
  50% { transform: rotate(2deg) scale(1); }
  75% { transform: rotate(-1deg) scale(1.05); }
}

@keyframes glow-pulse {
  0% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
}

@keyframes slow-rotate {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes crazy-fly-and-fall {
  0% {
    opacity: 1;
    transform: translate(var(--start-x), var(--start-y)) scale(1) rotate(var(--rotation));
  }
  25% {
    opacity: 1;
    transform: translate(calc(var(--jump-x) * 0.5), calc(var(--jump-y) * 0.5)) scale(1.5) rotate(calc(var(--rotation) + 180deg));
  }
  50% {
    opacity: 1;
    transform: translate(var(--jump-x), var(--jump-y)) scale(1.2) rotate(calc(var(--rotation) + 360deg));
  }
  100% {
    opacity: 0;
    transform: translate(var(--jump-x), var(--fall-y)) scale(0.5) rotate(calc(var(--rotation) + 1080deg));
  }
}

@keyframes rainbow-trail {
  0% { filter: hue-rotate(0deg) saturate(2); }
  100% { filter: hue-rotate(360deg) saturate(2); }
}

@keyframes crazy-bg {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes border-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes particle-dance {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes progress-rainbow {
  0% { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}

@keyframes shine-sweep {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes sparkle-bounce {
  0%, 100% { transform: translateY(-50%) scale(1); }
  50% { transform: translateY(-50%) scale(1.5); }
}

@keyframes neon-pulse {
  0% {
    text-shadow: 
      0 0 5px #fff,
      0 0 10px #fff,
      0 0 15px #ff006e,
      0 0 20px #ff006e,
      0 0 35px #ff006e;
  }
  100% {
    text-shadow: 
      0 0 10px #fff,
      0 0 20px #fff,
      0 0 30px #ff006e,
      0 0 40px #ff006e,
      0 0 70px #ff006e;
  }
}

@keyframes hologram {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 200% 50%; }
}

@keyframes chrome-text {
  0% { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}

/* 🚀💥🌈 ANIMATIONS HYPERDIMENSIONNELLES SUPRÊMES ULTRA DÉLIRANTES 🌈💥🚀 */

@keyframes vortex-spin {
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(90deg) scale(1.05); }
  50% { transform: rotate(180deg) scale(0.95); }
  75% { transform: rotate(270deg) scale(1.02); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes hyperdimensional-pulse {
  0%, 100% { 
    transform: scale(1) perspective(1000px) rotateX(0deg) rotateY(0deg);
    filter: brightness(1) saturate(3);
  }
  25% { 
    transform: scale(1.1) perspective(1000px) rotateX(5deg) rotateY(5deg);
    filter: brightness(1.3) saturate(4);
  }
  50% { 
    transform: scale(1.2) perspective(1000px) rotateX(-3deg) rotateY(-3deg);
    filter: brightness(1.5) saturate(5);
  }
  75% { 
    transform: scale(1.05) perspective(1000px) rotateX(3deg) rotateY(-2deg);
    filter: brightness(1.2) saturate(4);
  }
}

@keyframes reality-distortion {
  0%, 100% { 
    transform: skew(0deg) perspective(500px) rotateZ(0deg);
    filter: hue-rotate(0deg);
  }
  20% { 
    transform: skew(2deg) perspective(500px) rotateZ(5deg);
    filter: hue-rotate(72deg);
  }
  40% { 
    transform: skew(-1deg) perspective(500px) rotateZ(-3deg);
    filter: hue-rotate(144deg);
  }
  60% { 
    transform: skew(1.5deg) perspective(500px) rotateZ(4deg);
    filter: hue-rotate(216deg);
  }
  80% { 
    transform: skew(-0.5deg) perspective(500px) rotateZ(-2deg);
    filter: hue-rotate(288deg);
  }
}

@keyframes apocalypse-mode {
  0%, 100% { 
    transform: scale(1) rotate(0deg);
    filter: brightness(1) contrast(3);
  }
  10% { 
    transform: scale(1.3) rotate(36deg);
    filter: brightness(3) contrast(5);
  }
  20% { 
    transform: scale(0.8) rotate(-45deg);
    filter: brightness(0.5) contrast(2);
  }
  30% { 
    transform: scale(1.5) rotate(90deg);
    filter: brightness(4) contrast(6);
  }
  40% { 
    transform: scale(0.7) rotate(-90deg);
    filter: brightness(0.3) contrast(1);
  }
  50% { 
    transform: scale(1.8) rotate(180deg);
    filter: brightness(5) contrast(8);
  }
  60% { 
    transform: scale(0.6) rotate(-180deg);
    filter: brightness(0.2) contrast(0.5);
  }
  70% { 
    transform: scale(1.6) rotate(270deg);
    filter: brightness(4.5) contrast(7);
  }
  80% { 
    transform: scale(0.9) rotate(-270deg);
    filter: brightness(0.8) contrast(2.5);
  }
  90% { 
    transform: scale(1.4) rotate(360deg);
    filter: brightness(3.5) contrast(4);
  }
}

@keyframes end-of-world {
  0% { 
    transform: scale(1) rotate(0deg) perspective(1000px) rotateX(0deg) rotateY(0deg);
    filter: brightness(1) contrast(5) saturate(10);
  }
  10% { 
    transform: scale(2) rotate(36deg) perspective(1000px) rotateX(45deg) rotateY(15deg);
    filter: brightness(5) contrast(8) saturate(15);
  }
  20% { 
    transform: scale(0.5) rotate(-72deg) perspective(1000px) rotateX(-30deg) rotateY(-45deg);
    filter: brightness(0.2) contrast(10) saturate(5);
  }
  30% { 
    transform: scale(3) rotate(144deg) perspective(1000px) rotateX(60deg) rotateY(30deg);
    filter: brightness(8) contrast(3) saturate(20);
  }
  40% { 
    transform: scale(0.3) rotate(-216deg) perspective(1000px) rotateX(-75deg) rotateY(-60deg);
    filter: brightness(0.1) contrast(15) saturate(2);
  }
  50% { 
    transform: scale(4) rotate(288deg) perspective(1000px) rotateX(90deg) rotateY(45deg);
    filter: brightness(10) contrast(1) saturate(25);
  }
  60% { 
    transform: scale(0.2) rotate(-360deg) perspective(1000px) rotateX(-90deg) rotateY(-75deg);
    filter: brightness(0.05) contrast(20) saturate(1);
  }
  70% { 
    transform: scale(5) rotate(432deg) perspective(1000px) rotateX(120deg) rotateY(60deg);
    filter: brightness(15) contrast(0.5) saturate(30);
  }
  80% { 
    transform: scale(0.1) rotate(-504deg) perspective(1000px) rotateX(-120deg) rotateY(-90deg);
    filter: brightness(0.02) contrast(25) saturate(0.5);
  }
  90% { 
    transform: scale(6) rotate(576deg) perspective(1000px) rotateX(150deg) rotateY(75deg);
    filter: brightness(20) contrast(0.2) saturate(35);
  }
  100% { 
    transform: scale(1.8) rotate(720deg) perspective(1000px) rotateX(0deg) rotateY(0deg);
    filter: brightness(3) contrast(5) saturate(10);
  }
}

@keyframes cosmic-drift {
  0% { background-position: 0% 0%; }
  25% { background-position: 100% 100%; }
  50% { background-position: 200% 0%; }
  75% { background-position: 0% 200%; }
  100% { background-position: 0% 0%; }
}

@keyframes interdimensional-chaos {
  0% { 
    background-position: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%;
    filter: hue-rotate(0deg) contrast(3) saturate(3);
  }
  16.66% { 
    background-position: 100% 50%, 50% 100%, 25% 75%, 75% 25%, 90% 10%, 20% 80%;
    filter: hue-rotate(60deg) contrast(4) saturate(4);
  }
  33.33% { 
    background-position: 50% 100%, 100% 0%, 75% 25%, 25% 75%, 10% 90%, 80% 20%;
    filter: hue-rotate(120deg) contrast(5) saturate(5);
  }
  50% { 
    background-position: 100% 100%, 50% 50%, 100% 0%, 0% 100%, 50% 50%, 100% 0%;
    filter: hue-rotate(180deg) contrast(6) saturate(6);
  }
  66.66% { 
    background-position: 0% 50%, 100% 100%, 25% 75%, 75% 25%, 90% 10%, 10% 90%;
    filter: hue-rotate(240deg) contrast(5) saturate(5);
  }
  83.33% { 
    background-position: 50% 0%, 0% 50%, 75% 25%, 25% 75%, 20% 80%, 80% 20%;
    filter: hue-rotate(300deg) contrast(4) saturate(4);
  }
  100% { 
    background-position: 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%;
    filter: hue-rotate(360deg) contrast(3) saturate(3);
  }
}
</style>
