<template>
    <div class="post-block">
  
      <div class="post-header">
        <div class="post-title">
          <span class="icone">{{ poste.icone }}</span>
          <span class="nom">{{ poste.nom }}</span>
        </div>
        <div class="stat-cle">🎯 Stat : {{ formatStat(poste.stat) }}</div>
      </div>
  
      <div class="infos">
        <div class="duree">⏱️ Durée : {{ poste.duree }} min</div>
        <div class="recompenses">
          🎁 Récompenses :
          <ul>
            <li v-for="r in poste.recompenses" :key="r.nom">
              {{ r.nom }} ×{{ r.quantite }}
              <span v-if="r.rare"> ({{ r.chance }}%)</span>
            </li>
          </ul>
        </div>
      </div>
  
      <div class="slots-container">
        <ProductionSlot
          v-for="slotIndex in poste.slots"
          :key="slotIndex"
          :poste="poste"
          :slotIndex="slotIndex"
          @ajouter="() => $emit('ouvrir', poste)"
        />
      </div>
  
    </div>
  </template>
  
  <script setup>
  import ProductionSlot from './ProductionSlot.vue'
  
  defineProps({
    poste: Object
  })
  
  function formatStat(stat) {
    const map = {
      charisme: 'Charisme',
      energie: 'Énergie',
      intelligence: 'Intelligence'
    }
    return map[stat] || stat
  }
  </script>
  
  <style scoped>
  .post-block {
    margin-bottom: 32px;
    padding: 16px;
    background-color: #fffaf1;
    border: 3px solid #ffc66e;
    border-radius: 16px;
    font-family: 'Fredoka', sans-serif;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  .post-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .post-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    color: #6d3c00;
  }
  
  .icone {
    font-size: 20px;
  }
  
  .stat-cle {
    font-size: 14px;
    color: #5c2c08;
  }
  
  .infos {
    font-size: 14px;
    color: #6d3c00;
    margin-bottom: 12px;
  }
  
  .recompenses ul {
    list-style: none;
    padding-left: 0;
    margin: 4px 0 0;
  }
  
  .recompenses li {
    margin-bottom: 2px;
  }
  
  .slots-container {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  </style>
  