<template>
    <div class="slot-card" :class="{ libre: !poule }">
      <template v-if="poule">
        <img :src="image" class="poule-img" />
        <div class="info">
          <div class="nom">{{ espece.nom }}</div>
          <div class="statut">
            <span v-if="isTerminé">✅ Terminé</span>
            <span v-else>⏳ {{ tempsRestant }}</span>
          </div>
        </div>
        <button
          v-if="isTerminé"
          class="collect-btn"
          @click="collecter"
        >
          Récolter
        </button>
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
  
  const props = defineProps({
    poste: Object,
    slotIndex: Number
  })
  
  const { poules, especeData, getImage } = usePoules()
  
  // Attribution naïve : slot n°N => première poule en mission sur ce poste
  const poule = computed(() => {
    return poules.value.find(p =>
      p.posteOccupe === props.poste.id &&
      p.statutEnergie.etat === 'en mission'
    )
  })
  
  const espece = computed(() => especeData[poule.value?.especeId])
  const image = computed(() => getImage(poule.value?.especeId))
  
  const isTerminé = computed(() => {
    if (!poule.value) return false
    const dispo = new Date(poule.value.statutEnergie.heureDisponible)
    return new Date() >= dispo
  })
  
  const tempsRestant = computed(() => {
    if (!poule.value) return ''
    const reste = new Date(poule.value.statutEnergie.heureDisponible) - new Date()
    const minutes = Math.ceil(reste / 60000)
    return minutes > 0 ? `${minutes} min restantes` : 'Terminé'
  })
  
  function collecter() {
    // Placeholder : tu implémenteras /api/production/collect plus tard
    window.$toast?.success('Récompense récoltée !')
  }
  </script>
  
  <style scoped>
  .slot-card {
    width: 160px;
    min-height: 100px;
    background-color: #fffaf1;
    border: 2px solid #ffc66e;
    border-radius: 12px;
    padding: 10px;
    font-family: 'Fredoka', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  
  .poule-img {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    object-fit: cover;
    margin-bottom: 6px;
    border: 2px solid #ffdb85;
  }
  
  .info {
    text-align: center;
    font-size: 13px;
    color: #6d3c00;
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
  }
  </style>
  