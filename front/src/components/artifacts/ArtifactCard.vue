<template>
  <div
    :class="['artifact-card', artifactData?.rarete || 'commune', { grisee: !artifact.owned }]"
  >
    <div v-if="!artifactData">
      <div class="loading-card">
        <div class="loading-placeholder"></div>
      </div>
    </div>
    <template v-else-if="artifact.owned">
      <div v-if="isEquipped" class="badge-corner badge-equipped" aria-label="Équipé">⛏️</div>
      
      <div class="icon-wrapper">
        <div class="artifact-icon">{{ artifactData.icon || '❖' }}</div>
      </div>
      
      <div class="info">
        <div class="artifact-name">{{ artifactData.name }}</div>
        <div class="rarete">{{ formatRareté(artifactData.rarete) }}</div>
        <div class="effect">{{ artifactData.description }}</div>
      </div>
    </template>
    <template v-else>
      <!-- Artefact non possédé -->
      <div class="icon-wrapper">
        <div class="artifact-icon">❓</div>
      </div>
      
      <div class="info">
        <div class="artifact-name">???</div>
        <div class="rarete">{{ formatRareté(artifactData.rarete) }}</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePlayer } from '@/composables/usePlayer'
import { useGameData } from '@/composables/useGameData'

const props = defineProps({
  artifact: Object,
  artifactData: Object
})

const { artifactSlots } = usePlayer()

const isEquipped = computed(() => {
  const equipped = artifactSlots.value?.equipped || []
  return equipped.includes(props.artifact?.artifactId)
})

function formatRareté(r) {
  const map = {
    commune: '⭐ Commun',
    rare: '🌟 Rare',
    epique: '💎 Épique',
    legendaire: '🔥 Légendaire'
  }
  return map[r] || r
}
</script>

<style scoped>
.artifact-card {
  width: 160px;
  background: #fffaf1;
  border: 3px solid #ffc66e;
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.1s ease;
  position: relative;
  user-select: none;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

.artifact-card.grisee {
  opacity: 0.5;
  filter: grayscale(100%);    
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
}

.artifact-card:hover {
  transform: translateY(-2px);
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.artifact-icon {
  font-size: 64px;
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  -webkit-user-drag: none;
}

.badge-corner {
  position: absolute;
  top: -10px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  pointer-events: none;
}

.badge-equipped {
  right: -10px;
  color: #ffffff;
}

.info {
  text-align: center;
  font-size: 14px;
  color: #5c2c08;
  user-select: none;
}

.artifact-card.commune {
  border-color: #c2c2c2;
}
.artifact-card.rare {
  border-color: #7bc0ff;
}
.artifact-card.epique {
  border-color: #c98bff;
}
.artifact-card.legendaire {
  border-color: gold;
}

.artifact-card.commune .badge-equipped { background: #c2c2c2; border: 2px solid #c2c2c2; }
.artifact-card.rare .badge-equipped { background: #7bc0ff; border: 2px solid #7bc0ff; }
.artifact-card.epique .badge-equipped { background: #c98bff; border: 2px solid #c98bff; }
.artifact-card.legendaire .badge-equipped { background: gold; border: 2px solid gold; color: #5c2c08; }

.artifact-name {
  font-weight: bold;
  font-size: 14px;
  color: #5c2c08;
  margin-bottom: 4px;
}

.rarete {
  margin: 6px 0;
  padding: 2px 8px;
  border-radius: 8px;
  display: inline-block;
  font-weight: bold;
  font-size: 13px;
  background: #ececec;
}

.artifact-card.commune .rarete {
  background: #e6e6e6;
  color: #6d6d6d;
}
.artifact-card.rare .rarete {
  background: #e0f2ff;
  color: #2176ae;
}
.artifact-card.epique .rarete {
  background: #f3e6ff;
  color: #8e44ad;
}
.artifact-card.legendaire .rarete {
  background: #fffbe6;
  color: #b8860b;
}

.effect {
  font-size: 12px;
  color: #8B4513;
  margin-top: 4px;
  font-style: italic;
}

.loading-card {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 180px;
}

.loading-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(90deg, #ffc66e 25%, #ffe6b5 50%, #ffc66e 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 600px) {
  .artifact-card {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
  }

  .artifact-icon {
    width: 64px;
    height: 64px;
    font-size: 40px;
    flex-shrink: 0;
  }

  .icon-wrapper {
    margin-bottom: 0;
  }

  .info {
    text-align: left;
    flex: 1;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .artifact-name {
    font-size: 14px;
    font-weight: bold;
  }

  .rarete {
    font-size: 12px;
    display: inline-block;
    max-width: 50%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 4px 0;
    padding: 2px 8px;
  }

  .effect {
    font-size: 11px;
  }
}
</style>
