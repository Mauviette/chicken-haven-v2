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
    legendaire: '🔥 Légendaire',
    unique: '🔴 Unique'
  }
  return map[r] || r
}
</script>

<style scoped>
.artifact-card {
  width: 160px;
  /* fond légèrement opaque et plus doux */
  background: rgba(255, 250, 241, 0.92);
  /* bord restauré à 2px (valeur standard) */
  border: 2px solid rgba(255, 198, 110, 0.65);
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
  border-color: rgba(194,194,194,0.6);
}
.artifact-card.rare {
  border-color: rgba(123,192,255,0.5);
}
.artifact-card.epique {
  border-color: rgba(201,139,255,0.48);
}
.artifact-card.legendaire {
  border-color: rgba(212,175,55,0.85);
}
.artifact-card.unique {
  border-color: rgba(255,0,0,0.7);
}

/* Badges équipés plus doux et semi-transparents */
.artifact-card.commune .badge-equipped { background: rgba(194,194,194,0.85); border: 2px solid rgba(194,194,194,0.85); }
.artifact-card.rare .badge-equipped { background: rgba(123,192,255,0.9); border: 2px solid rgba(123,192,255,0.9); }
.artifact-card.epique .badge-equipped { background: rgba(201,139,255,0.9); border: 2px solid rgba(201,139,255,0.9); }
.artifact-card.legendaire .badge-equipped { background: rgba(212,175,55,0.9); border: 2px solid rgba(212,175,55,0.9); color: #5c2c08; }
.artifact-card.unique .badge-equipped { background: rgba(255,0,0,0.9); border: 2px solid rgba(255,0,0,0.9); }

/* Rareté : fond adouci (moins saturé, légèrement opaque) */
.artifact-card.commune .rarete {
  background: rgba(230,230,230,0.6);
  color: rgba(109,109,109,0.95);
}
.artifact-card.rare .rarete {
  background: rgba(224,242,255,0.38);
  color: rgba(33,118,174,0.95);
}
.artifact-card.epique .rarete {
  background: rgba(243,230,255,0.36);
  color: rgba(142,68,173,0.94);
}
.artifact-card.legendaire .rarete {
  background: rgba(255,251,230,0.5);
  color: rgba(184,134,11,0.95);
}
.artifact-card.unique .rarete {
  background: rgba(255,230,230,0.6);
  color: rgba(204,0,0,0.95);
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

/* Mode SOMBRE */
.dark-mode .artifact-card {
  background: rgba(42, 42, 42, 0.9) !important;
  border-color: rgba(102, 102, 102, 0.8) !important;
  color: #e0e0e0 !important;
}

.dark-mode .artifact-card .info {
  color: #cccccc !important;
}

.dark-mode .artifact-card.commune {
  border-color: rgba(102, 102, 102, 0.8) !important;
}
.dark-mode .artifact-card.rare {
  border-color: rgba(119, 119, 119, 0.8) !important;
}
.dark-mode .artifact-card.epique {
  border-color: rgba(136, 136, 136, 0.8) !important;
}
.dark-mode .artifact-card.legendaire {
  border-color: rgba(153, 153, 153, 0.8) !important;
}
.dark-mode .artifact-card.unique {
  border-color: rgba(255, 102, 102, 0.8) !important;
}

.dark-mode .artifact-card.commune .badge-equipped { background: rgba(102, 102, 102, 0.9) !important; border: 2px solid rgba(102, 102, 102, 0.9) !important; }
.dark-mode .artifact-card.rare .badge-equipped { background: rgba(119, 119, 119, 0.9) !important; border: 2px solid rgba(119, 119, 119, 0.9) !important; }
.dark-mode .artifact-card.epique .badge-equipped { background: rgba(136, 136, 136, 0.9) !important; border: 2px solid rgba(136, 136, 136, 0.9) !important; }
.dark-mode .artifact-card.legendaire .badge-equipped { background: rgba(153, 153, 153, 0.9) !important; border: 2px solid rgba(153, 153, 153, 0.9) !important; color: #1a1a1a !important; }
.dark-mode .artifact-card.unique .badge-equipped { background: rgba(255, 102, 102, 0.9) !important; border: 2px solid rgba(255, 102, 102, 0.9) !important; }

.dark-mode .artifact-card.commune .rarete {
  background: rgba(102, 102, 102, 0.3) !important;
  color: #cccccc !important;
}
.dark-mode .artifact-card.rare .rarete {
  background: rgba(119, 119, 119, 0.3) !important;
  color: #e0e0e0 !important;
}
.dark-mode .artifact-card.epique .rarete {
  background: rgba(136, 136, 136, 0.3) !important;
  color: #e0e0e0 !important;
}
.dark-mode .artifact-card.legendaire .rarete {
  background: rgba(153, 153, 153, 0.3) !important;
  color: #e0e0e0 !important;
}
.dark-mode .artifact-card.unique .rarete {
  background: rgba(255, 102, 102, 0.3) !important;
  color: #ff6666 !important;
}

.dark-mode .artifact-card .effect {
  color: #aaaaaa !important;
}

/* Mode APOCALYPSE */
.apocalypse-mode .artifact-card {
  background: rgba(45, 27, 27, 0.9) !important;
  border-color: rgba(255, 68, 68, 0.8) !important;
  color: #ffcccc !important;
}

.apocalypse-mode .artifact-card .info {
  color: #ffaaaa !important;
}

.apocalypse-mode .artifact-card.commune {
  border-color: rgba(255, 68, 68, 0.8) !important;
}
.apocalypse-mode .artifact-card.rare {
  border-color: rgba(255, 107, 107, 0.8) !important;
}
.apocalypse-mode .artifact-card.epique {
  border-color: rgba(255, 107, 107, 0.8) !important;
}
.apocalypse-mode .artifact-card.legendaire {
  border-color: rgba(255, 107, 107, 0.8) !important;
}
.apocalypse-mode .artifact-card.unique {
  border-color: rgba(255, 68, 68, 0.8) !important;
}

.apocalypse-mode .artifact-card.commune .badge-equipped { background: rgba(255, 68, 68, 0.9) !important; border: 2px solid rgba(255, 68, 68, 0.9) !important; }
.apocalypse-mode .artifact-card.rare .badge-equipped { background: rgba(255, 107, 107, 0.9) !important; border: 2px solid rgba(255, 107, 107, 0.9) !important; }
.apocalypse-mode .artifact-card.epique .badge-equipped { background: rgba(255, 107, 107, 0.9) !important; border: 2px solid rgba(255, 107, 107, 0.9) !important; }
.apocalypse-mode .artifact-card.legendaire .badge-equipped { background: rgba(255, 107, 107, 0.9) !important; border: 2px solid rgba(255, 107, 107, 0.9) !important; color: #ffcccc !important; }
.apocalypse-mode .artifact-card.unique .badge-equipped { background: rgba(255, 68, 68, 0.9) !important; border: 2px solid rgba(255, 68, 68, 0.9) !important; }

.apocalypse-mode .artifact-card.commune .rarete {
  background: rgba(255, 68, 68, 0.3) !important;
  color: #ffaaaa !important;
}
.apocalypse-mode .artifact-card.rare .rarete {
  background: rgba(255, 107, 107, 0.3) !important;
  color: #ffcccc !important;
}
.apocalypse-mode .artifact-card.epique .rarete {
  background: rgba(255, 107, 107, 0.3) !important;
  color: #ffcccc !important;
}
.apocalypse-mode .artifact-card.legendaire .rarete {
  background: rgba(255, 107, 107, 0.3) !important;
  color: #ffcccc !important;
}
.apocalypse-mode .artifact-card.unique .rarete {
  background: rgba(255, 68, 68, 0.3) !important;
  color: #ffaaaa !important;
}

.apocalypse-mode .artifact-card .effect {
  color: #ffaaaa !important;
}

</style>
