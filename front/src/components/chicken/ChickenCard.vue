<template>
  <div
    :class="['poule-card', espece?.rarete || 'commune', { grisee: !poule.owned }, { 'apocalypse-mode': isApocalypseMode }]"
  >
    <template v-if="espece && poule.owned">
      <!-- Badges coins en bordure de carte -->
      <div v-if="inTeam" class="badge-corner badge-team" aria-label="Équipe">🐾</div>
      <div v-if="showUpgradeBadge" class="badge-corner badge-upgrade" aria-label="Amélioration disponible">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="upgrade-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
        </svg>
      </div>
      <div class="image-wrapper">
        <img :src="image" alt="poule" class="poule-image" draggable="false" />
        <div v-if="isActivableTalent" class="badge-activable-talent" aria-label="Capacité activable">⚡</div>
        <!-- Badge NOUVEAU (style Market) -->
        <div v-if="isNew" class="new-badge">NOUVEAU</div>
      </div>
      <div class="info">
        <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
          <span class="name">{{ espece.nom }}</span>
          <span class="quantite">x{{ poule.quantite }}</span>
        </div>
        <div class="rarete">{{ formatRareté(espece.rarete) }}</div>
        <div class="categorie">
          {{ formatGroupe(espece.id) }} (niv. {{ currentTalentLevel }}/{{ maxTalentLevel }})
        </div>
        <div class="talent">{{ getTalentDisplayName(poule) }}</div>
      </div>
    </template>
    <template v-else-if="espece">
  <div class="image-wrapper">
    <img :src="hiddenImage" alt="hidden chicken" class="poule-image" draggable="false" />
    <div v-if="isActivableTalent" class="badge-activable-talent" aria-label="Capacité activable">⚡</div>
  </div>
      <div class="info">
        <div class="name">???</div>
        <div class="rarete">{{ formatRareté(espece.rarete) }}</div>
        <div class="categorie">
          {{ formatGroupe(espece.id) }} (niv. 0/{{ maxTalentLevel }})
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
import { useGameData } from '@/composables/useGameData'

const props = defineProps({
  poule: Object,
  espece: Object,
  image: String,
  hiddenImage: String,
})

const { getTalentDisplayNameSync, getTalentNextCost, upgradeTalent, poules, getTalentLevel } = usePoules()
const { isInTeam } = usePlayer()
const { talents, talentLevelUpgradeCost } = useGameData()
const { getEspeceInfo } = useGameData()
const inTeam = computed(() => isInTeam(props.poule?.especeId))

// Détecter le mode apocalypse
const { player } = usePlayer()
const isApocalypseMode = computed(() => player.value?.apocalypse || false)

// Niveau actuel et maximum du talent
const currentTalentLevel = computed(() => getTalentLevel(props.poule))
const maxTalentLevel = computed(() => {
  const rarete = props.espece?.rarete || 'commune'
  const table = talentLevelUpgradeCost.value?.[rarete]
  return table?.limit || 1
})

// Badge amélioration disponible: si un nextCost existe et que le joueur a les ressources
import { usePlayer as usePlayerComposable } from '@/composables/usePlayer'
const { eggs } = usePlayerComposable()
const showUpgradeBadge = computed(() => {
  const cost = getTalentNextCost(props.poule)
  if (!cost || cost.maxed) return false // pas d'upgrade si max
  const needChickens = Number(cost.chicken_cost || 0)
  const hasEggs = Number(eggs?.value ?? 0) >= Number(cost.egg_cost || 0)
  // Vérifier qu'on a assez de poules de cette espèce
  const hasChickens = Number(props.poule?.quantite || 0) >= needChickens
  return hasEggs && hasChickens
})

// Badge "nouveau"
const isNew = computed(() => !!props.poule?.new)

// Indique si le talent de cette espèce est activable (triggers contient 'active')
const isActivableTalent = computed(() => {
  try {
    const tName = props.espece?.talent
    const calc = tName && talents.value?.[tName]?.calculation
    const triggers = Array.isArray(calc?.triggers) ? calc.triggers : []
    return triggers.some(t => t?.type === 'active')
  } catch (_) {
    return false
  }
})

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
    legendaire: '🔥 Légendaire',
  }
  return map[r] || r
}

function formatGroupe(especeId) {
  const especeInfo = getEspeceInfo(especeId)
  const groupe = especeInfo?.groupe || props.espece?.groupe || 'fondamental'
  return groupe.charAt(0).toUpperCase() + groupe.slice(1)
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
  user-select: none;
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
  -webkit-user-drag: none;
}

.image-wrapper { position: relative; }

.badge-activable-talent {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 18px;
  height: 18px;
  font-size: 14px;
  line-height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* Badges coins (bordure de la carte) */
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

.badge-team {
  left: -10px;
  /* Couleur dépendante de la carte (définie ci-dessous par rareté) */
  color: #ffffff;
}

.badge-upgrade {
  right: -10px;
  background: linear-gradient(135deg, #34e89e 0%, #0f9d58 100%);
  border: 2px solid #0b7d46;
  color: #ffffff;
}

.upgrade-icon {
  width: 16px;
  height: 16px;
  animation: upgradePulse 1.2s ease-in-out infinite;
}

@keyframes upgradePulse {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* Badge NOUVEAU (style Market) */
.new-badge {
  position: absolute;
  top: -6px;
  left: -6px;
  background: #e74c3c;
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 5;
  transform: rotate(-12deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.info {
  text-align: center;
  font-size: 14px;
  color: #5c2c08;
  user-select: none;
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
.poule-card.legendaire {
  border-color: gold;
}

/* Harmonise le badge équipe avec la bordure de la carte selon la rareté */
.poule-card.commune .badge-team { background: #c2c2c2; border: 2px solid #c2c2c2; }
.poule-card.rare .badge-team { background: #7bc0ff; border: 2px solid #7bc0ff; }
.poule-card.epique .badge-team { background: #c98bff; border: 2px solid #c98bff; }
.poule-card.legendaire .badge-team { background: gold; border: 2px solid gold; color: #5c2c08; }

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
.poule-card.legendaire .rarete {
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

/* Mode SOMBRE */
.dark-mode .poule-card {
  background: #2a2a2a !important;
  border-color: #666666 !important;
  color: #e0e0e0 !important;
}

.dark-mode .poule-card .info {
  color: #cccccc !important;
}

.dark-mode .poule-card.commune {
  border-color: #666666 !important;
}
.dark-mode .poule-card.rare {
  border-color: #777777 !important;
}
.dark-mode .poule-card.epique {
  border-color: #888888 !important;
}
.dark-mode .poule-card.legendaire {
  border-color: #999999 !important;
}

.dark-mode .poule-card.commune .badge-team { background: #666666 !important; border: 2px solid #666666 !important; }
.dark-mode .poule-card.rare .badge-team { background: #777777 !important; border: 2px solid #777777 !important; }
.dark-mode .poule-card.epique .badge-team { background: #888888 !important; border: 2px solid #888888 !important; }
.dark-mode .poule-card.legendaire .badge-team { background: #999999 !important; border: 2px solid #999999 !important; color: #1a1a1a !important; }

.dark-mode .poule-card .quantite {
  color: #aaaaaa !important;
}

.dark-mode .poule-card.commune .rarete {
  background: rgba(102, 102, 102, 0.2) !important;
  color: #cccccc !important;
}
.dark-mode .poule-card.rare .rarete {
  background: rgba(119, 119, 119, 0.2) !important;
  color: #e0e0e0 !important;
}
.dark-mode .poule-card.epique .rarete {
  background: rgba(136, 136, 136, 0.2) !important;
  color: #e0e0e0 !important;
}
.dark-mode .poule-card.legendaire .rarete {
  background: rgba(153, 153, 153, 0.2) !important;
  color: #e0e0e0 !important;
}

/* Badge NOUVEAU en mode sombre */
.dark-mode .new-badge {
  background: #666666 !important;
  color: #ffffff !important;
}

/* Badge upgrade en mode sombre */
.dark-mode .badge-upgrade {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%) !important;
  border: 2px solid #4CAF50 !important;
}

/* Mode APOCALYPSE */
.apocalypse-mode .poule-card {
  background: #2d1b1b !important;
  border-color: #ff4444 !important;
  color: #ffcccc !important;
}

.apocalypse-mode .poule-card .info {
  color: #ffaaaa !important;
}

.apocalypse-mode .poule-card.commune {
  border-color: #ff4444 !important;
}
.apocalypse-mode .poule-card.rare {
  border-color: #ff6b6b !important;
}
.apocalypse-mode .poule-card.epique {
  border-color: #ff8888 !important;
}
.apocalypse-mode .poule-card.legendaire {
  border-color: #ffaa44 !important;
}

.apocalypse-mode .poule-card.commune .badge-team { background: #ff4444 !important; border: 2px solid #ff4444 !important; }
.apocalypse-mode .poule-card.rare .badge-team { background: #ff6b6b !important; border: 2px solid #ff6b6b !important; }
.apocalypse-mode .poule-card.epique .badge-team { background: #ff8888 !important; border: 2px solid #ff8888 !important; }
.apocalypse-mode .poule-card.legendaire .badge-team { background: #ffaa44 !important; border: 2px solid #ffaa44 !important; color: #ffffff !important; }

.apocalypse-mode .poule-card .quantite {
  color: #ffaaaa !important;
}

.apocalypse-mode .poule-card.commune .rarete {
  background: rgba(255, 68, 68, 0.3) !important;
  color: #ffaaaa !important;
}
.apocalypse-mode .poule-card.rare .rarete {
  background: rgba(255, 107, 107, 0.3) !important;
  color: #ffcccc !important;
}
.apocalypse-mode .poule-card.epique .rarete {
  background: rgba(255, 136, 136, 0.3) !important;
  color: #ffdddd !important;
}
.apocalypse-mode .poule-card.legendaire .rarete {
  background: rgba(255, 170, 68, 0.3) !important;
  color: #ffeedd !important;
}

/* Badge NOUVEAU en mode apocalypse */
.apocalypse-mode .new-badge {
  background: #ff4444 !important;
  color: #ffffff !important;
}

/* Badge upgrade en mode apocalypse */
.apocalypse-mode .badge-upgrade {
  background: linear-gradient(135deg, #ff6666 0%, #cc3333 100%) !important;
  border: 2px solid #ff4444 !important;
}

</style>

