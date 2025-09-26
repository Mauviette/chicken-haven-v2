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
              ×{{ currentPoule?.quantite ?? poule?.quantite }}
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
          <Tooltip :text="getTalentEffect(currentPoule || poule)" >      
            {{ getTalentDisplayName(currentPoule || poule) }}
          </Tooltip>
        </div>
      </div>

      <!-- La section coûts intégrée dans le bouton d'action plus bas -->

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

      <div class="actions" style="justify-content: space-between; align-items:center;">
            <div>
              <!-- Toujours utiliser la Tooltip custom: affiche ressources manquantes et/ou effet du prochain niveau -->
              <Tooltip v-if="nextCost && !maxed" :text="upgradeTooltipText" :followMouse="true">
                <BuyButton
                  :onClick="onUpgrade"
                  :disabled="!canUpgrade || upgrading"
                  :price="upgradePrices"
                >
                  {{ upgrading ? '...' : 'Améliorer' }}
                </BuyButton>
              </Tooltip>
            </div>
        <div>
          <button v-if="!inTeam" class="btn equip" @click="onEquip">Équiper dans l'équipe</button>
          <button v-else class="btn unequip" @click="onUnequip">Retirer de l'équipe</button>
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
import BuyButton from '@/components/menu/BuyButton.vue'
import Tooltip from '../menu/Tooltip.vue'
import { usePoules } from '@/composables/usePoules'
import { usePlayer } from '@/composables/usePlayer'
import { computed, ref, onMounted } from 'vue'
import { useSound } from '@/composables/useSound'

const emit = defineEmits(['close', 'updated'])

const props = defineProps({
  poule: Object,
  espece: Object,
  image: String,
  quantite: Number
})

const { getTalentDisplayNameSync, getTalentEffectSync, getTalentNextCost, upgradeTalent, poules } = usePoules()
const { isInTeam, equipChicken, unequipChicken, eggs } = usePlayer()
const { click, confirm, close: sndClose } = useSound()

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

// Toujours récupérer une version fraîche de la poule depuis le store pour refléter les upgrades
const currentPoule = computed(() => {
  const id = props.poule?.especeId
  if (!id) return props.poule
  const found = (poules.value || []).find(p => p.especeId === id)
  return found || props.poule
})

const inTeam = computed(() => isInTeam(currentPoule.value?.especeId))

const upgrading = ref(false)
const nextCost = computed(() => getTalentNextCost(currentPoule.value))
const maxed = computed(() => !nextCost.value)
const upgradePrices = computed(() => {
  if (!nextCost.value) return null
  return [
    { type: 'eggs', count: nextCost.value.egg_cost },
    // On utilise un faux type pour l'icône poule; BuyButton s'attend à un type connu
    // On affichera l'icône via eggs si inconnu; mais mieux: remap vers un montant textuel avec poule
    { type: 'eggs', count: nextCost.value.chicken_cost + 1, _iconOverride: '🐔' }
  ]
})
const canUpgrade = computed(() => {
  const cost = nextCost.value
  const p = currentPoule.value
  if (!cost || !p) return false
  const needChickens = Number(cost.chicken_cost || 0) + 1
  const hasEggs = Number(eggs?.value ?? 0) >= Number(cost.egg_cost || 0)
  const hasChickens = Number(p.quantite || 0) >= needChickens
  return hasEggs && hasChickens
})

const missingTooltip = computed(() => {
  const cost = nextCost.value
  const p = currentPoule.value
  if (!cost || !p) return ''
  const needChickens = Number(cost.chicken_cost || 0) + 1
  const haveEggs = Number(eggs?.value ?? 0)
  const haveChickens = Number(p.quantite || 0)
  const missing = []
  if (haveEggs < Number(cost.egg_cost || 0)) missing.push(`🥚 Il manque ${Number(cost.egg_cost) - haveEggs} œufs`)
  if (haveChickens < needChickens) missing.push(`🐔 Il manque ${needChickens - haveChickens} poule(s) de cette espèce`)
  return missing.length ? missing.join('<br/>') : ''
})

// Effet du prochain niveau (hover)
const nextEffectText = computed(() => {
  try {
    if (!nextCost.value) return ''
    const base = currentPoule.value
    if (!base) return ''
    const clone = { ...base, niveauTalent: (base?.niveauTalent || 1) + 1 }
    return getTalentEffectSync(clone)
  } catch (_) { return '' }
})

// Texte de tooltip pour le bouton d'upgrade (fusion: manquants + prochain niveau)
const upgradeTooltipText = computed(() => {
  if (maxed.value || !nextCost.value) return ''
  const parts = []
  if (!canUpgrade.value) {
    const miss = missingTooltip.value
    if (miss) parts.push(miss)
  }
  const next = nextEffectText.value
  if (next) parts.push(`<em>Prochain niveau</em> : ${next}`)
  return parts.join('<br/>')
})

async function onEquip() {
  if (!currentPoule.value || currentPoule.value.quantite <= 0) return
  const ok = await equipChicken(currentPoule.value.especeId)
  if (ok) {
    const name = props.espece?.nom || currentPoule.value.especeId
    window.$toast?.(`${name} équipée`, 'team-add')
    // Certains flux d'achat équipent immédiatement : rafraîchir succès
    try { window.dispatchEvent(new CustomEvent('chicken-bought', { detail: { especeId: currentPoule.value.especeId } })) } catch (_) {}
  } else {
    window.$toast?.("Impossible d'équiper.", 'error')
  }
}

async function onUnequip() {
  if (!currentPoule.value) return
  const ok = await unequipChicken(currentPoule.value.especeId)
  if (ok) {
    const name = props.espece?.nom || currentPoule.value.especeId
    window.$toast?.(`${name} retirée de l'équipe`, 'team-remove')
  } else {
    window.$toast?.('Action impossible.', 'error')
  }
}

async function onUpgrade() {
  if (!canUpgrade.value || upgrading.value) return
  upgrading.value = true
  try {
    click()
  const ok = await upgradeTalent(currentPoule.value || props.poule)
    if (ok) {
      confirm()
      // Notifier le parent pour resynchroniser la poule (si la référence a changé)
      emit('updated')
    }
    else sndClose()
  } finally {
    upgrading.value = false
  }
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

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid #ffc66e;
  background: #fffaf1;
  font-family: 'Fredoka', sans-serif;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
}

.btn.equip { background: #e9ffe6; border-color: #8ed68b; }
.btn.unequip { background: #fff1f1; border-color: #ffb3b3; }
.btn.upgrade { background: #e6f3ff; border-color: #8bb4d6; }

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
