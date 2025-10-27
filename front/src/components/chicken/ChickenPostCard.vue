<template>
  <div class="post-card" :class="`rarity-${espece.rarete}`">
    <img
      :src="image"
      alt="poule"
      class="poule-img"
      @click="showDetail = true"
    />

    <div class="info">
      <div class="name">{{ espece.nom }}</div>
      <ToolTip :text="getTalentEffect(poule)">
        <div class="talent">
          {{ getTalentDisplayName(poule) }}
        </div>
      </ToolTip>
      <div class="stat">
        {{ statIcon }} {{ statLabel }} :
        <strong>{{ espece.stats[posteStat] || 0 }}</strong>
      </div>
    </div>

    <button class="assign-btn" @click="$emit('assigner', poule)">
      Assigner
    </button>

    <ChickenDetail
      v-if="showDetail"
      :poule="poule"
      :espece="espece"
      :image="image"
      @close="showDetail = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getTalentEffect, getTalentDisplayName } from '@/composables/usePoules'
import ToolTip from '@/components/menu/Tooltip.vue'
import ChickenDetail from '@/components/chicken/ChickenDetail.vue'

const props = defineProps({
  poule: Object,
  espece: Object,
  image: String,
  posteStat: {
    type: String,
    default: 'charisme'
  }
})

const toRoman = (n) => {
  const r = ['','I','II','III','IV','V']
  return r[n] || n
}

const statIcon = '✨'
const statLabel = 'Charisme'

const showDetail = ref(false)
</script>

<style scoped>
.post-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid #ffc66e;
  border-radius: 12px;
  padding: 10px;
  background: #fffaf1;
  font-family: 'Fredoka', sans-serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: border-color 0.2s, box-shadow 0.2s;
}

/* Indicateur visuel de rareté sur le contour */
.post-card.rarity-commune {
  border-color: #c2c2c2;
}
.post-card.rarity-rare {
  border-color: #7bc0ff;
  box-shadow: 0 0 0 2px #7bc0ff44, 0 2px 4px rgba(0,0,0,0.08);
}
.post-card.rarity-epique {
  border-color: #c98bff;
  box-shadow: 0 0 0 2px #c98bff44, 0 2px 4px rgba(0,0,0,0.08);
}
.post-card.rarity-legendaire {
  border-color: gold;
  box-shadow: 0 0 0 2px #ffd70066, 0 2px 4px rgba(0,0,0,0.10);
}

.poule-img {
  padding: 2px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid #ffc66e;
  background-color: #eaeb9e;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='32' viewBox='0 0 16 32'%3E%3Cg fill='%23ffca35' fill-opacity='0.33'%3E%3Cpath fill-rule='evenodd' d='M0 24h4v2H0v-2zm0 4h6v2H0v-2zm0-8h2v2H0v-2zM0 0h4v2H0V0zm0 4h2v2H0V4zm16 20h-6v2h6v-2zm0 4H8v2h8v-2zm0-8h-4v2h4v-2zm0-20h-6v2h6V0zm0 4h-4v2h4V4zm-2 12h2v2h-2v-2zm0-8h2v2h-2V8zM2 8h10v2H2V8zm0 8h10v2H2v-2zm-2-4h14v2H0v-2zm4-8h6v2H4V4zm0 16h6v2H4v-2zM6 0h2v2H6V0zm0 24h2v2H6v-2z'/%3E%3C/g%3E%3C/svg%3E");
  box-sizing: content-box;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #5c2c08;
}

.name {
  font-weight: bold;
  font-size: 16px;
}

.talent {
  font-size: 13px;
  color: #b2773c;
}

.stat {
  font-size: 13px;
}

.assign-btn {
  background-color: #7a3e10;
  border: 2px solid #ffc66e;
  color: #fff9e5;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: background-color 0.1s ease;
}

.assign-btn:hover {
  background-color: #8a4a1c;
}

/* Mode Apocalypse */
.apocalypse-mode .chicken-post-card {
  background: #2a1111;
  border-color: #ff6666;
}

.apocalypse-mode .talent {
  color: #ff8888;
}

.apocalypse-mode .assign-btn {
  background-color: #662222;
  border-color: #ff6666;
  color: #ffaaaa;
}

.apocalypse-mode .assign-btn:hover {
  background-color: #883333;
}

</style>
