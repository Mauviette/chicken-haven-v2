<!-- components/SpawnableObjects.vue -->
<!-- Composant pour afficher les objets cliquables spawnés par les talents -->

<template>
  <div class="spawnables-container">
    <div
      v-for="obj in activeSpawnables"
      :key="obj.id"
      class="spawnable-object"
      :class="[`spawnable-${obj.type}`, { 'spawnable-animate': true }]"
      :style="{
        left: obj.x + '%',
        top: obj.y + '%',
        transform: `translate(-50%, -50%)`
      }"
      @click="(event) => handleClick(obj, event)"
    >
      <span 
        class="spawnable-icon" 
        :style="{
          transform: `rotate(${obj.rotation || 0}deg)`
        }"
      >
        {{ obj.icon }}
      </span>
      <div class="spawnable-glow"></div>
    </div>
  </div>
</template>

<script setup>
import { useSpawnables } from '@/composables/useSpawnables'
import { useSound } from '@/composables/useSound'
import { formatNumber } from '@/utils/format.js'

const { activeSpawnables, clickObject } = useSpawnables()
const { play } = useSound()

const handleClick = async (obj, event) => {
  try {
    // Vérifier si l'objet n'est pas expiré côté frontend avant de continuer
    const now = Date.now()
    const age = now - obj.timestamp
        if (age >= obj.lifetime) return
    
    // Jouer un son
    play('select_004', { volume: 0.25 })
    
    // Récupérer l'élément cliqué
    const element = event.currentTarget
    const icon = element.querySelector('.spawnable-icon')
    
    // Sauvegarder la position avant que l'élément ne disparaisse
    const rect = element.getBoundingClientRect()
    
    // Effet visuel de clic immédiat
    element.style.transform = `translate(-50%, -50%) scale(1.4)`
    element.style.transition = 'transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    element.classList.add('clicked')
    
    // Gérer le clic et récupérer la récompense
    const reward = await clickObject(obj)
    
    // Créer l'effet visuel avec le vrai montant ou buff
    if (reward && reward.type === 'resource' && reward.resource === 'eggs') {
      createRewardEffectAtPosition(rect, reward.amount)
    } else if (reward && reward.type === 'buff') {
      createBuffEffectAtPosition(rect, reward)
    }
    
    // Animation de retour avec un petit bounce
    setTimeout(() => {
      element.style.transform = `translate(-50%, -50%) scale(1.1)`
      setTimeout(() => {
        element.style.transform = `translate(-50%, -50%) scale(1)`
        element.classList.remove('clicked')
      }, 100)
    }, 200)
    
  } catch (error) {
    console.error('Erreur lors du clic sur l\'objet spawné:', error)
    // En cas d'erreur, ne pas afficher d'effet de récompense
  }
}

// Fonction pour créer l'effet visuel de récompense à une position donnée
const createRewardEffectAtPosition = (rect, amount) => {
  // Rotation aléatoire pour le texte
  const randomRotation = (Math.random() - 0.5) * 40 // Entre -20 et +20 degrés
  
  // Effet principal du nombre
  const effectEl = document.createElement('div')
  effectEl.textContent = `+${formatNumber(amount)}`
  effectEl.className = 'reward-effect'
  effectEl.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top - 15}px;
    font-size: 26px;
    font-weight: 900;
    color: #FFD700;
    text-shadow: 3px 3px 6px rgba(0,0,0,0.9), 0 0 15px rgba(255,215,0,0.7);
    pointer-events: none;
    z-index: 9999;
    transform: translateX(-50%) rotate(${randomRotation}deg);
    font-family: 'Fredoka', sans-serif;
    letter-spacing: 2px;
    user-select: none;
  `
  
  document.body.appendChild(effectEl)
  
  // Créer des particules d'étoiles autour
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div')
    particle.textContent = '✨'
    particle.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      font-size: 18px;
      pointer-events: none;
      z-index: 9998;
      transform: translateX(-50%) translateY(-50%);
      user-select: none;
    `
    
    document.body.appendChild(particle)
    
    // Animation des particules dans différentes directions
    const angle = (i * 45) * Math.PI / 180 // 45 degrés entre chaque particule (8 particules)
    const distance = 70 + Math.random() * 50
    const endX = Math.cos(angle) * distance
    const endY = Math.sin(angle) * distance
    
    particle.animate([
      { 
        opacity: 0,
        transform: 'translateX(-50%) translateY(-50%) scale(0) rotate(0deg)',
      },
      { 
        opacity: 1,
        transform: 'translateX(-50%) translateY(-50%) scale(1.2) rotate(180deg)',
        offset: 0.2
      },
      { 
        opacity: 0,
        transform: `translateX(${endX - 50}%) translateY(${endY - 50}%) scale(0.3) rotate(360deg)`,
      }
    ], {
      duration: 1800,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    })
    
    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove()
      }
    }, 1800)
  }
  
  // Animation du texte principal
  effectEl.animate([
    { 
      opacity: 0, 
      transform: `translateX(-50%) translateY(0) scale(0.3) rotate(${randomRotation}deg)`, 
      filter: 'brightness(2)' 
    },
    { 
      opacity: 1, 
      transform: `translateX(-50%) translateY(-25px) scale(1.4) rotate(${randomRotation}deg)`, 
      filter: 'brightness(1.4)',
      offset: 0.25
    },
    { 
      opacity: 1, 
      transform: `translateX(-50%) translateY(-50px) scale(1.2) rotate(${randomRotation}deg)`, 
      filter: 'brightness(1.2)',
      offset: 0.6
    },
    { 
      opacity: 0, 
      transform: `translateX(-50%) translateY(-90px) scale(0.8) rotate(${randomRotation}deg)`, 
      filter: 'brightness(1)' 
    }
  ], {
    duration: 2200,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  })
  
  setTimeout(() => {
    if (effectEl.parentNode) {
      effectEl.remove()
    }
  }, 2200)
}

// Fonction pour créer l'effet visuel des buffs
const createBuffEffectAtPosition = (rect, reward) => {
  // Rotation aléatoire pour le texte
  const randomRotation = (Math.random() - 0.5) * 30 // Entre -15 et +15 degrés
  
  // Icône et couleur selon le type de buff
  let icon = '✨'
  let color = '#FF6B35'
  
  switch (reward.buff_type) {
    case 'income_multiplier':
    case 'income':
      icon = '💰'
      color = '#FFD700'
      break
    case 'production':
      icon = '⚙️'
      color = '#FF6B35'
      break
    case 'storage':
      icon = '🧺'
      color = '#4ECDC4'
      break
  }
  
  // Effet principal du buff
  const effectEl = document.createElement('div')
  let percentage = 0
  
  // Gérer les différents types de buffs
  if (reward.multiplier) {
    // Ancien format avec un seul multiplicateur
    percentage = Math.round((reward.multiplier - 1) * 100)
  } else if (reward.income_multiplier && reward.storage_multiplier) {
    // Nouveau format avec multiplicateurs séparés (chocolats)
    // Afficher le multiplicateur d'income pour simplifier
    percentage = Math.round((reward.income_multiplier - 1) * 100)
  } else if (reward.income_multiplier) {
    percentage = Math.round((reward.income_multiplier - 1) * 100)
  } else if (reward.storage_multiplier) {
    percentage = Math.round((reward.storage_multiplier - 1) * 100)
  }
  
  effectEl.textContent = `+${percentage}%`
  effectEl.className = 'buff-effect'
  effectEl.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top - 10}px;
    font-size: 24px;
    font-weight: 900;
    color: ${color};
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 12px ${color}88;
    pointer-events: none;
    z-index: 9999;
    transform: translateX(-50%) rotate(${randomRotation}deg);
    font-family: 'Fredoka', sans-serif;
    letter-spacing: 1px;
    user-select: none;
  `
  
  document.body.appendChild(effectEl)
  
  // Créer des particules d'icônes autour
  for (let i = 0; i < 6; i++) {
    const particle = document.createElement('div')
    particle.textContent = icon
    particle.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      font-size: 16px;
      color: ${color};
      pointer-events: none;
      z-index: 9998;
      transform: translateX(-50%) translateY(-50%);
      user-select: none;
    `
    
    document.body.appendChild(particle)
    
    // Animation des particules en spirale
    const angle = (i * 60) * Math.PI / 180 // 60 degrés entre chaque particule
    const distance = 60 + Math.random() * 40
    const endX = Math.cos(angle) * distance
    const endY = Math.sin(angle) * distance
    
    particle.animate([
      { 
        opacity: 0,
        transform: 'translateX(-50%) translateY(-50%) scale(0) rotate(0deg)',
      },
      { 
        opacity: 1,
        transform: 'translateX(-50%) translateY(-50%) scale(1.3) rotate(120deg)',
        offset: 0.3
      },
      { 
        opacity: 0.7,
        transform: `translateX(${endX - 50}%) translateY(${endY - 50}%) scale(0.8) rotate(240deg)`,
        offset: 0.8
      },
      { 
        opacity: 0,
        transform: `translateX(${endX - 50}%) translateY(${endY - 50}%) scale(0.2) rotate(360deg)`,
      }
    ], {
      duration: 2000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    })
    
    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove()
      }
    }, 2000)
  }
  
  // Animation du texte principal
  effectEl.animate([
    { 
      opacity: 0, 
      transform: `translateX(-50%) translateY(0) scale(0.2) rotate(${randomRotation}deg)`, 
      filter: 'brightness(2) blur(2px)' 
    },
    { 
      opacity: 1, 
      transform: `translateX(-50%) translateY(-20px) scale(1.5) rotate(${randomRotation}deg)`, 
      filter: 'brightness(1.5) blur(0px)',
      offset: 0.2
    },
    { 
      opacity: 1, 
      transform: `translateX(-50%) translateY(-40px) scale(1.2) rotate(${randomRotation}deg)`, 
      filter: 'brightness(1.2) blur(0px)',
      offset: 0.7
    },
    { 
      opacity: 0, 
      transform: `translateX(-50%) translateY(-70px) scale(0.8) rotate(${randomRotation}deg)`, 
      filter: 'brightness(1) blur(1px)' 
    }
  ], {
    duration: 2500,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  })
  
  setTimeout(() => {
    if (effectEl.parentNode) {
      effectEl.remove()
    }
  }, 2500)
}

// Fonction pour créer l'effet visuel de récompense (version originale, gardée pour compatibilité)
const createRewardEffect = (clickedElement, amount) => {
  const rect = clickedElement.getBoundingClientRect()
  createRewardEffectAtPosition(rect, amount)
}
</script>

<style scoped>
.spawnables-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 125%;
  height: 125%;
  pointer-events: none;
  z-index: 150;
}

.spawnable-object {
  position: absolute;
  pointer-events: auto;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transform: translate(-50%, -50%);
  z-index: 160;
  user-select: none;
}

.spawnable-animate {
  animation: spawnable-appear 0.5s ease-out, spawnable-bob 3s ease-in-out infinite 0.5s;
}

.spawnable-icon {
  display: block;
  font-size: 36px; /* Plus grand */
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4)) brightness(1.3) contrast(1.2);
}

.spawnable-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: spawnable-glow 2s ease-in-out infinite alternate;
  z-index: 1;
}

/* Styles spécifiques pour différents types d'objets */
.spawnable-white_egg .spawnable-icon,
.spawnable-white_egg .spawnable-icon {
  filter: drop-shadow(0 3px 6px rgba(255, 240, 200, 0.6)) brightness(1.2) contrast(1.1) saturate(0.8);
  color: #F5F5DC; /* Beige crème au lieu du blanc pur */
}

.spawnable-white_egg .spawnable-glow,
.spawnable-white_egg .spawnable-glow {
  background: radial-gradient(circle, rgba(245, 245, 220, 0.4) 0%, rgba(255, 248, 220, 0.2) 50%, transparent 70%);
  width: 50px;
  height: 50px;
}


.spawnable-pink_egg .spawnable-icon {
  filter: brightness(1.2) saturate(1.4);
  mix-blend-mode: color-dodge; /* ou color, ou screen */
  text-shadow: 0 0 8px #ff07c9;
}


.spawnable-pink_egg .spawnable-glow {
  background: radial-gradient(circle, rgba(245, 245, 220, 0.4) 0%, rgba(255, 248, 220, 0.2) 50%, transparent 70%);
  width: 50px;
  height: 50px;
}

.spawnable-chocolate .spawnable-icon {
  filter: drop-shadow(0 3px 6px rgba(139, 69, 19, 0.8)) brightness(1.3) contrast(1.2);
  color: #8B4513;
  animation: chocolate-shimmer 2s ease-in-out infinite alternate;
}

.spawnable-chocolate .spawnable-glow {
  background: radial-gradient(circle, rgba(222, 184, 135, 0.6) 0%, rgba(139, 69, 19, 0.3) 50%, transparent 70%);
  width: 55px;
  height: 55px;
  animation: chocolate-glow 1.5s ease-in-out infinite alternate;
}

/* Animations */
@keyframes chocolate-shimmer {
  0% {
    filter: drop-shadow(0 3px 6px rgba(139, 69, 19, 0.8)) brightness(1.3) contrast(1.2) hue-rotate(0deg);
  }
  100% {
    filter: drop-shadow(0 3px 8px rgba(139, 69, 19, 1)) brightness(1.5) contrast(1.3) hue-rotate(10deg);
  }
}

@keyframes spawnable-appear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes spawnable-bob {
  0%, 100% {
    transform: translate(-50%, -50%) translateY(0);
  }
  50% {
    transform: translate(-50%, -50%) translateY(-5px);
  }
}

@keyframes chocolate-glow {
  0% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1);
    background: radial-gradient(circle, rgba(222, 184, 135, 0.6) 0%, rgba(139, 69, 19, 0.3) 50%, transparent 70%);
  }
  100% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.3);
    background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, rgba(222, 184, 135, 0.5) 50%, transparent 70%);
  }
}

@keyframes spawnable-glow {
  0% {
    opacity: 0.3;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

.spawnable-object:hover {
  transform: translate(-50%, -50%) scale(1.1);
  transition: transform 0.2s ease;
}

.spawnable-object:active {
  transform: translate(-50%, -50%) scale(0.95);
  transition: transform 0.1s ease;
}

.spawnable-object.clicked {
  filter: brightness(1.5) drop-shadow(0 0 15px rgba(255, 255, 255, 0.8));
}

/* Animation de récompense */
:global(.reward-effect) {
  animation: reward-float 2.2s ease-out forwards;
  will-change: transform, opacity;
}

@keyframes reward-float {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(0) scale(0.3);
    filter: brightness(3);
  }
  25% {
    opacity: 1;
    transform: translateX(-50%) translateY(-25px) scale(1.4);
    filter: brightness(1.8);
  }
  60% {
    opacity: 1;
    transform: translateX(-50%) translateY(-50px) scale(1.2);
    filter: brightness(1.4);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-90px) scale(0.8);
    filter: brightness(1);
  }
}
</style>