<template>
  <div
    class="slot-card"
    :class="{
      libre: slotData && !slotData.especeId,
      locked: !slotData
    }"
    :style="slotBackground"
  >
    <template v-if="!slotData">
      <div class="slot-locked">
        <span class="slot-locked-title">🔒</span>
      </div>
    </template>
    <template v-else-if="slotData.especeId">
      <img :src="image" class="poule-img" />
      <div class="info">
        <!--div class="nom-bg">
          <span class="nom">{{ espece?.nom || '??' }}</span>
        </div-->
      </div>
      <div class="progress-bar-container">
        <div
          class="progress-bar"
          :class="{ termine: isTermine }"
          :style="{ width: progressPercent + '%'}"
        ></div>
        <span class="progress-text" :class="{ termine: isTermine }">
          <template v-if="isTermine">Terminé</template>
          <template v-else>{{ tempsRestant }}</template>
        </span>
      </div>
      <div v-if="isTermine && slotData.recompenseDisponible && slotData.recompenses?.length">
        <!--div class="recompenses">
          <div v-for="r in slotData.recompenses" :key="r.type">
            {{ r.type }} ×{{ r.quantite }} <span v-if="r.rare">(rare)</span>
          </div>
        </div-->
      </div>
    </template>
    <template v-else>
      <div class="ajouter-zone">
        <button @click="$emit('ajouter')" class="ajouter-btn">➕ Ajouter</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePoules } from '@/composables/usePoules'
import { usePost } from '@/composables/usePost'

const props = defineProps({
  poste: Object,
  slotIndex: Number
})

const { postesDuJoueur } = usePost()
const { especeData, getImage } = usePoules()

const slotData = computed(() =>
  postesDuJoueur.value.find(
    p => p.type === props.poste.id && p.slotId === props.slotIndex
  ) || null
)

const espece = computed(() => {
  if (!slotData.value || !slotData.value.especeId) return null
  return especeData?.[slotData.value.especeId] || null
})
const image = computed(() => {
  if (!slotData.value || !slotData.value.especeId) return ''
  return typeof getImage === 'function' ? getImage(slotData.value.especeId) : ''
})

const isTermine = computed(() => {
  if (!slotData.value || !slotData.value.dateFin) return false
  return new Date() >= new Date(slotData.value.dateFin)
})

const tempsRestant = computed(() => {
  if (!slotData.value || !slotData.value.dateFin) return ''
  const reste = new Date(slotData.value.dateFin) - new Date()
  const minutes = Math.ceil(reste / 60000)
  return minutes > 0 ? `${minutes} min restantes` : 'Terminé'
})

// Progress bar calculation
const progressPercent = computed(() => {
  if (!slotData.value || !slotData.value.dateDebut || !slotData.value.dateFin) return 0
  const debut = new Date(slotData.value.dateDebut).getTime()
  const fin = new Date(slotData.value.dateFin).getTime()
  const now = Date.now()
  if (now >= fin) return 100
  if (now <= debut) return 0
  return Math.min(100, Math.round(((now - debut) / (fin - debut)) * 100))
})

const slotBackground = computed(() => {
  if (props.poste?.id === 'couveuse') {
    return {
      backgroundImage: "url('/assets/background/production/nest.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  } else if (props.poste?.id === 'pondoir') {
    return {
      backgroundImage: "url('/assets/background/production/pondoir.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  }
})

function collecter() {
  window.$toast?.success('Récompense récoltée !')
}
</script>

<style scoped>
.slot-card {
  min-width: 160px;
  min-height: 120px;
  background-color: #fffaf1;
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 10px;
  font-family: 'Fredoka', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  /* background-image handled dynamically */
  transition: box-shadow 0.3s, filter 0.3s;
}

.slot-card:not(.locked):has(.progress-bar.termine) {
  /* Ajoute un effet brillant quand terminé */
  box-shadow: 0 0 16px 4px #7ed957cc, 0 2px 8px #0002;
  filter: brightness(1.13) saturate(1.15);
  border-color: #7ed957;
  z-index: 10;
}

.poule-img {
  width: 64px;
  height: 64px;
  box-sizing: content-box;
  display: block;
  margin-left: auto;
  margin-right: auto;
  margin-top: 10px;
}

.info {
  text-align: center;
  font-size: 13px;
  color: #6d3c00;
  width: 100%;
}

.nom-bg {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  padding: 2px 10px;
  margin-bottom: 6px;
  display: inline-block;
  box-shadow: 0 1px 4px #0001;
}

.nom {
  font-weight: bold;
  font-size: 15px;
  color: #6d3c00;
  letter-spacing: 1px;
}

.progress-bar-container {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  width: calc(100% - 20px);
  height: 22px;
  background: #f3e5c0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px #0001;
  z-index: 3;
}

.progress-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #4fc3f7 60%, #b3e5fc 100%);
  transition: width 0.3s;
  z-index: 1;
}
.progress-bar.termine {
  background: linear-gradient(90deg, #7ed957 60%, #b6f7a5 100%);
}

.progress-text {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  font-size: 13px;
  color: #6d3c00;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: none;
  text-shadow: 0 1px 2px #fff, 0 0px 2px #fff;
}
.progress-text.termine {
  color: #226d00;
  text-shadow: 0 1px 2px #fff, 0 0px 2px #fff;
}

.ajouter-zone {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.ajouter-btn {
  background-color: #f3e5c0;
  border: 2px dashed #ffc66e;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
}

.collect-btn {
  margin-top: 6px;
  padding: 4px 8px;
  font-size: 13px;
  background-color: #7a3e10;
  color: #fff9e5;
  border: 2px solid #ffc66e;
  border-radius: 8px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  font-family: 'Fredoka', sans-serif;
}

.locked {
  opacity: 0.5;
  pointer-events: none;
  background: #eee;
}
.slot-locked {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 80px;
}
.slot-locked-title {
  color: #b0a99f;
  font-size: 1.1rem;
  font-family: 'Fredoka', sans-serif;
  letter-spacing: 1px;
}

/* Mode Apocalypse */
.apocalypse-mode .production-slot {
  background-color: #2a1111;
  border-color: #ff6666;
}

.apocalypse-mode .progress-bar {
  background: #1a0a0a;
}

.apocalypse-mode .progress-fill-working {
  background: linear-gradient(90deg, #ff6666 60%, #ff8888 100%);
}

.apocalypse-mode .progress-fill-ready {
  background: linear-gradient(90deg, #cc3333 60%, #ff6666 100%);
}

.apocalypse-mode .slot-info {
  background-color: #1a0808;
}

.apocalypse-mode .collect-btn {
  background-color: #662222;
  border-color: #ff6666;
  color: #ffaaaa;
}

.apocalypse-mode .locked {
  background: #331111;
}

.apocalypse-mode .slot-locked-title {
  color: #996666;
}

</style>
