<template>
  <div
    :class="['poule-card', espece?.rarete || 'commune', { grisee: poule.quantite === 0 }]"
  >
    <template v-if="espece && poule.quantite > 0">
      <div class="image-wrapper">
        <img :src="image" alt="poule" class="poule-image" />
        <div v-if="inTeam" class="badge-team">Équipe</div>
      </div>
      <div class="info">
        <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
          <span class="name">{{ espece.nom }}</span>
          <span class="quantite">x{{ poule.quantite }}</span>
        </div>
        <div class="rarete">{{ formatRareté(espece.rarete) }}</div>
        <div class="categorie">
          {{ espece.categorie === 'eclosion' ? '🥚 Éclosion' : '🧬 Fusion' }}
        </div>
        <div class="talent">{{ getTalentDisplayName(poule) }}</div>
      </div>
    </template>
    <template v-else-if="espece">
      <img :src="hiddenImage" alt="hidden chicken" class="poule-image" />
      <div class="info">
        <div class="name">???</div>
        <div class="rarete">{{ formatRareté(espece.rarete) }}</div>
        <div class="categorie">
          {{ espece.categorie === 'eclosion' ? '🥚 Éclosion' : '🧬 Fusion' }}
        </div>
      </div>
    </template>
    <template v-else>
      <!-- Cas où espece n'est pas encore chargée -->
      <div class="loading-card">
        <div class="loading-placeholder"></div>
        <div class="info">
          <div class="name">Chargement...</div>
          <div class="rarete">-</div>
          <div class="categorie">-</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { usePlayer } from '@/composables/usePlayer'
import { usePoules } from '@/composables/usePoules'

const props = defineProps({
  poule: Object,
  espece: Object,
  image: String,
  hiddenImage: String,
})

const { getTalentDisplayNameSync } = usePoules()
const { isInTeam } = usePlayer()
const inTeam = computed(() => isInTeam(props.poule?.especeId))

function getTalentDisplayName(poule) {
  return getTalentDisplayNameSync(poule)
}

function formatStatut(poule) {
  if (!poule.statutEnergie) return '❓ Inconnue'
  if (poule.statutEnergie.etat === 'non_obtenue') return '❓ Inconnue'
  if (poule.statutEnergie.etat === 'disponible') return '✅ Disponible'
  if (poule.statutEnergie.etat === 'en mission') return `🔄 En mission (${poule.posteOccupe})`
  if (poule.statutEnergie.etat === 'fatiguee') return `💤 Repos jusqu’à ${new Date(poule.statutEnergie.heureDisponible).toLocaleTimeString()}`
  return 'Inconnu'
}

function toRoman(num) {
  if (typeof num !== 'number') return ''
  const romans = ['','I','II','III','IV','V','VI','VII','VIII','IX','X']
  return romans[num] || num
}

function formatRareté(r) {
  const map = {
    commune: '⭐ Commune',
    rare: '🌟 Rare',
    epique: '💎 Épique',
    legendary: '🔥 Légendaire',
  }
  return map[r] || r
}
</script>

<style scoped>
.poule-card {
  width: 160px;
  background: #fffaf1;
  border: 3px solid #ffc66e;
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.1s ease;
  position: relative;
}

.poule-card.grisee {
  opacity: 0.5;
  filter: grayscale(100%);    
  cursor: url('@/assets/ui/cursor/disabled.png') 0 0, auto;
}

.poule-card:hover {
  transform: translateY(-2px);
}

.poule-card img.poule-image {
  width: 100%;
  border-radius: 10px;
  margin-bottom: 8px;
}

.image-wrapper { position: relative; }
.badge-team {
  position: absolute;
  top: 6px;
  left: 6px;
  background: #e9ffe6;
  border: 2px solid #8ed68b;
  color: #2f6b2d;
  border-radius: 8px;
  padding: 2px 6px;
  font-size: 12px;
}

.info {
  text-align: center;
  font-size: 14px;
  color: #5c2c08;
}

.poule-card.commune {
  border-color: #c2c2c2;
}
.poule-card.rare {
  border-color: #7bc0ff;
}
.poule-card.epique {
  border-color: #c98bff;
}
.poule-card.legendary {
  border-color: gold;
}

.quantite {
  font-size: 12px;
  color: #b89c86;
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

.poule-card.commune .rarete {
  background: #e6e6e6;
  color: #6d6d6d;
}
.poule-card.rare .rarete {
  background: #e0f2ff;
  color: #2176ae;
}
.poule-card.epique .rarete {
  background: #f3e6ff;
  color: #8e44ad;
}
.poule-card.legendary .rarete {
  background: #fffbe6;
  color: #b8860b;
}

.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
}

.loading-placeholder {
  width: 100%;
  height: 100px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 10px;
  margin-bottom: 8px;
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
  .poule-card {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
  }

  .poule-card img.poule-image {
    width: 64px;
    height: 64px;
    object-fit: cover;
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

  .categorie,
  .talent,
  .quantite {
    font-size: 12px;
  }

  .name {
    font-size: 14px;
    font-weight: bold;
  }
}

</style>