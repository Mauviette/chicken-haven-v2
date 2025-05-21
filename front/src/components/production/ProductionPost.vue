<template>
  <div class="post-block">
    <template v-if="placeholder || !posteComplet">
      <div class="poste-locked">
        <span class="poste-locked-title">???</span>
      </div>
    </template>

    <template v-else>
      <div class="post-header">
        <div class="post-title">
          <span class="icone">{{ posteComplet.icone }}</span>
          <span class="nom">{{ posteComplet.nom }}</span>
        </div>
        <div class="stat-cle">🎯 Stat : {{ formatStat(posteComplet.stat) }}</div>
      </div>

      <div class="infos">
        <div class="duree">⏱️ Durée : {{ posteComplet.duree }} min</div>
        <div class="recompenses">
          🎁 Récompenses :
          <ul>
            <li v-for="r in posteComplet.recompenses" :key="r.nom">
              {{ r.nom }} ×{{ r.min }}–{{ r.max }}
              <span v-if="r.rare"> ({{ r.chance }}%)</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="slots-container">
        <ProductionSlot
          v-for="slotIndex in posteComplet.slots"
          :key="slotIndex"
          :poste="posteComplet"
          :slotIndex="typeof posteComplet.slots === 'number' ? slotIndex - 1 : slotIndex"
          @ajouter="() => $emit('ouvrir', posteComplet)"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import ProductionSlot from './ProductionSlot.vue'
import { computed } from 'vue'
import { usePost } from '@/composables/usePost' // correction ici

const { postes } = usePost() // on récupère postes via le composable

const props = defineProps({
  poste: Object,
  placeholder: Boolean
})

const posteComplet = computed(() => {
  if (!props.poste) return null
  return postes.value.find(p => p.id === props.poste.id)
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
  min-height: 120px;
}

.poste-locked {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 120px;
  background: #f3e9d6;
  border-radius: 12px;
  border: 2px dashed #c2c2c2;
}

.poste-locked-title {
  font-size: 2rem;
  color: #c2c2c2;
  font-family: 'Fredoka', sans-serif;
  letter-spacing: 2px;
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
