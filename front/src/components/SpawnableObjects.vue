<!-- components/SpawnableObjects.vue -->
<!-- Composant pour afficher les objets cliquables spawnés par les talents -->

<template>
  <div class="spawnables-container">
    <div
      v-for="obj in activeSpawnables"
      :key="obj.id"
      class="spawnable-object"
      :class="[`spawnable-${obj.style}`, { 'spawnable-animate': true }]"
      :style="{
        left: obj.x + '%',
        top: obj.y + '%'
      }"
      @click="handleClick(obj)"
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

const handleClick = async (obj) => {
  try {
    // Jouer un son
    eggClick()
    
    // Effet visuel de clic
    const element = event.currentTarget
    element.style.transform = 'scale(1.2)'
    element.style.transition = 'transform 0.1s ease'
    
    setTimeout(() => {
      element.style.transform = 'scale(1)'
    }, 100)
    
    // Gérer le clic
    await clickObject(obj)
  } catch (error) {
    console.error('Erreur lors du clic sur l\'objet spawné:', error)
  }
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
  font-size: 24px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.spawnable-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: spawnable-glow 2s ease-in-out infinite alternate;
  z-index: 1;
}

/* Styles spécifiques pour différents types d'objets */
.spawnable-white-egg .spawnable-icon {
  filter: drop-shadow(0 2px 4px rgba(255, 255, 255, 0.5));
}

.spawnable-white-egg .spawnable-glow {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4) 0%, transparent 70%);
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
</style>