<template>
  <Popup @close="emit('close')">
    <div class="chicken-detail" v-if="espece">
      <div class="header">
        <img :src="image" class="chicken-img" />
        <div class="header-text">
            <div style="display: flex; align-items: center;">
            <h2 class="name" style="margin: 0;">
              {{ espece.nom }}
            </h2>
            <div style="font-size:16px; color:#ffd58f; margin-left:8px; margin-top: 1px;">
              ×{{ poule.quantite }}
            </div>
            </div>

          <div class="rarete" :class="espece.rarete">{{ formatRareté(espece.rarete) }}</div>
          <div class="categorie">{{ espece.categorie === 'eclosion' ? '🥚 Éclosion' : '🧬 Fusion' }}</div>
          <div class="quantite"></div>
        </div>
      </div>

      <div class="section">
        <div class="label">Talent</div>
        <div class="value">
          <Tooltip :text="getTalentEffect(poule)" >      
            {{ getTalentDisplayName(poule) }}
          </Tooltip>
        </div>
      </div>

      <div class="section stats-section">
        <div class="stat-line">
          <span>🧠 Intelligence</span>
          <span class="stars">{{ renderStars(espece.stats?.intelligence || 0) }}</span>
        </div>
        <div class="stat-line">
          <span>⚡ Énergie</span>
          <span class="stars">{{ renderStars(espece.stats?.energie || 0) }}</span>
        </div>
        <div class="stat-line">
          <span>✨ Charisme</span>
          <span class="stars">{{ renderStars(espece.stats?.charisme || 0) }}</span>
        </div>
      </div>
      

      <!-- À venir : stats, actions, amélioration, etc. -->
    </div>
    <div v-else class="loading-detail">
      <div class="loading-content">
        Chargement des détails...
      </div>
    </div>
  </Popup>
</template>

<script setup>
import Popup from '@/components/menu/Popup.vue'
import Tooltip from '../menu/Tooltip.vue'
import { usePoules } from '@/composables/usePoules'

const emit = defineEmits(['close'])

const props = defineProps({
  poule: Object,
  espece: Object,
  image: String,
  quantite: Number
})

const { getTalentDisplayNameSync, getTalentEffectSync } = usePoules()

function getTalentDisplayName(poule) {
  return getTalentDisplayNameSync(poule)
}

function getTalentEffect(poule) {
  return getTalentEffectSync(poule)
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

function renderStars(n) {
  const full = '★'.repeat(n)
  const empty = '☆'.repeat(5 - n)
  return full + empty
}

</script>

<style scoped>
.chicken-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Fredoka', sans-serif;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chicken-img {
  padding: 5px;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid #ffc66e;
  background-color: #eaeb9e;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='32' viewBox='0 0 16 32'%3E%3Cg fill='%23ffca35' fill-opacity='0.33'%3E%3Cpath fill-rule='evenodd' d='M0 24h4v2H0v-2zm0 4h6v2H0v-2zm0-8h2v2H0v-2zM0 0h4v2H0V0zm0 4h2v2H0V4zm16 20h-6v2h6v-2zm0 4H8v2h8v-2zm0-8h-4v2h4v-2zm0-20h-6v2h6V0zm0 4h-4v2h4V4zm-2 12h2v2h-2v-2zm0-8h2v2h-2V8zM2 8h10v2H2V8zm0 8h10v2H2v-2zm-2-4h14v2H0v-2zm4-8h6v2H4V4zm0 16h6v2H4v-2zM6 0h2v2H6V0zm0 24h2v2H6v-2z'/%3E%3C/g%3E%3C/svg%3E");
  box-sizing: content-box;
}

.header-text {
  display: flex;
  flex-direction: column;
}

.name {
  margin: 0;
  font-size: 20px;
  color: #fff9e5;
}

.rarete {
  font-size: 14px;
  color: #ffd58f;
}

.categorie {
  font-size: 14px;
  color: #ffd58f;
}
.rarete.commune {
    color: #c2c2c2;
}
.rarete.rare {
    color: #7bc0ff;
}
.rarete.epique {
    color: #c98bff;
}
.rarete.legendary {
    color: gold;
}
.section {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  background: rgba(255, 249, 229, 0.1);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #ffdfac;
  color: #fff9e5;
}

.label {
  font-weight: bold;
  color: #ffe6b5;
}

.stats-section {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.stats-values {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.stars {
  font-family: monospace;
  color: #ffd58f;
  margin-left: 10px;
}

.stat-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  color: #fffbe5;
  width: 100%;
}

.stat-line .stars {
  margin-left: auto;
  margin-right: 0;
  min-width: 90px;
  text-align: right;
  display: block;
}

.loading-detail {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  font-family: 'Fredoka', sans-serif;
}

.loading-content {
  font-size: 16px;
  color: #fff9e5;
  text-align: center;
}

</style>
