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
        transform: `translate(-50%, -50%) rotate(${obj.rotation || 0}deg)`
      }"
      @click="(event) => handleClick(obj, event)"
    >
      <span class="spawnable-icon">{{ obj.icon }}</span>
      <div class="spawnable-glow"></div>
    </div>
  </div>
</template>

<script setup>
import { useSpawnables } from '@/composables/useSpawnables'
import { useSound } from '@/composables/useSound'

const { activeSpawnables, clickObject } = useSpawnables()
const { eggClick } = useSound()

const handleClick = async (obj, event) => {
  try {
    // Jouer un son
    eggClick()
    
    // Récupérer l'élément cliqué
    const element = event.currentTarget
    
    // Sauvegarder la position avant que l'élément ne disparaisse
    const rect = element.getBoundingClientRect()
    
    // Effet visuel de clic immédiat
    element.style.transform = `translate(-50%, -50%) rotate(${obj.rotation || 0}deg) scale(1.4)`
    element.style.transition = 'transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    element.classList.add('clicked')
    
    // Gérer le clic et récupérer la récompense
    const reward = await clickObject(obj)
    
    // Créer l'effet visuel avec le vrai montant (utiliser la position sauvegardée)
    if (reward && reward.type === 'resource' && reward.resource === 'eggs') {
      console.log('🎨 Création de l\'effet visuel pour:', reward.amount, 'œufs')
      createRewardEffectAtPosition(rect, reward.amount)
    }
    
    // Animation de retour avec un petit bounce
    setTimeout(() => {
      element.style.transform = `translate(-50%, -50%) rotate(${obj.rotation || 0}deg) scale(1.1)`
      setTimeout(() => {
        element.style.transform = `translate(-50%, -50%) rotate(${obj.rotation || 0}deg) scale(1)`
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
  console.log('🎨 createRewardEffectAtPosition appelée avec:', { rect, amount })
  
  // Rotation aléatoire pour le texte
  const randomRotation = (Math.random() - 0.5) * 40 // Entre -20 et +20 degrés
  
  // Effet principal du nombre
  const effectEl = document.createElement('div')
  effectEl.textContent = `+${amount}`
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
  
  console.log('📍 Position de l\'effet:', { left: rect.left, top: rect.top, width: rect.width })
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
      filter: 'brightness(3)' 
    },
    { 
      opacity: 1, 
      transform: `translateX(-50%) translateY(-25px) scale(1.4) rotate(${randomRotation}deg)`, 
      filter: 'brightness(1.8)',
      offset: 0.25
    },
    { 
      opacity: 1, 
      transform: `translateX(-50%) translateY(-50px) scale(1.2) rotate(${randomRotation}deg)`, 
      filter: 'brightness(1.4)',
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
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.spawnable-object {
  position: absolute;
  pointer-events: auto;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, pointer;
  transform: translate(-50%, -50%);
  z-index: 10;
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
.spawnable-white_egg .spawnable-icon {
  filter: drop-shadow(0 3px 6px rgba(255, 240, 200, 0.6)) brightness(1.2) contrast(1.1) saturate(0.8);
  color: #F5F5DC; /* Beige crème au lieu du blanc pur */
}

.spawnable-white_egg .spawnable-glow {
  background: radial-gradient(circle, rgba(245, 245, 220, 0.4) 0%, rgba(255, 248, 220, 0.2) 50%, transparent 70%);
  width: 50px;
  height: 50px;
}

.spawnable-chocolate .spawnable-icon {
  filter: drop-shadow(0 2px 4px rgba(139, 69, 19, 0.5));
}

.spawnable-chocolate .spawnable-glow {
  background: radial-gradient(circle, rgba(222, 184, 135, 0.4) 0%, transparent 70%);
}

/* Animations */
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