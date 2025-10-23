<template>
  <div ref="container" class="team-parade" v-if="entries.length">
    <div class="stage">
      <TeamParadeChicken
        v-for="(e, i) in entries"
        :key="e.especeId + '-' + e.level"
        :especeId="e.especeId"
        :name="e.name"
        :talentEffect="e.talentEffect"
        :statBuffs="e.statBuffs"
        :images="e.images"
        :energy="e.energy"
        :containerWidth="containerWidth"
        @open-detail="handleOpenDetail"
      />
    </div>
    <!-- Popup détail ouvert directement depuis la parade -->
    <Teleport to="body">
      <ChickenDetail
        v-if="selectedPoule && especeData"
        :poule="selectedPoule"
        :espece="especeData[selectedPoule.especeId]"
        :image="getImage(selectedPoule.especeId)"
        @close="handleCloseDetail"
        @updated="handleDetailUpdated"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import ChickenDetail from '@/components/chicken/ChickenDetail.vue'
import { useRouter } from 'vue-router'
import { usePlayer } from '@/composables/usePlayer'
import { usePoules } from '@/composables/usePoules'
import { useGameData } from '@/composables/useGameData'
import { useEgg } from '@/composables/useEgg'
import TeamParadeChicken from '@/components/menu/TeamParadeChicken.vue'

const { team } = usePlayer()
const { especies, getImage, poules, getTalentEffectSync, getTalentLevel } = usePoules()
const { especies: especeData, talents } = useGameData()
const { eggState, fetchEggStatus, startUpdates, stopUpdates } = useEgg()

const container = ref(null)
const containerWidth = ref(0)
const router = useRouter()
const selectedPoule = ref(null)

// Charger des variantes animées si disponibles, sinon fallback basic
const walkingImages = import.meta.glob('@/assets/chickens/**/walking.gif', { eager: true })
const idleImages = import.meta.glob('@/assets/chickens/**/idle.gif', { eager: true })
const peckingImages = import.meta.glob('@/assets/chickens/**/pecking.gif', { eager: true })

function findAnim(especeId) {
  const info = especies.value?.[especeId]
  let folder = null
  if (info?.image) {
    // ex: 'chickens/white/basic.png' -> 'white'
    const parts = info.image.split('/')
    if (parts.length >= 3) folder = parts[1]
  }
  const pathBase = folder
    ? `/src/assets/chickens/${folder}/`
    : `/src/assets/chickens/${especeId}/`
  return {
    walk: walkingImages[`${pathBase}walking.gif`]?.default || null,
    idle: idleImages[`${pathBase}idle.gif`]?.default || null,
    peck: peckingImages[`${pathBase}pecking.gif`]?.default || null,
    fallback: getImage(especeId)
  }
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }
function rand(min, max) { return Math.random() * (max - min) + min }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// Mini évaluateur d'expressions (miroir minimal de celui du serveur)
function evalExpr(expr, ctx) {
  if (expr == null) return 0
  if (typeof expr === 'number') return expr
  if (typeof expr === 'string') return Number.isFinite(ctx[expr]) ? ctx[expr] : (ctx[expr] ?? 0)
  if (typeof expr === 'object') {
    if (Object.prototype.hasOwnProperty.call(expr, 'var')) {
      const v = expr.var
      return Number.isFinite(ctx[v]) ? ctx[v] : (ctx[v] ?? 0)
    }
    const op = expr.op
    const args = Array.isArray(expr.args) ? expr.args : []
    const vals = args.map(a => evalExpr(a, ctx))
    switch (op) {
      case 'add': return vals.reduce((a, b) => a + b, 0)
      case 'sub': return vals.slice(1).reduce((a, b) => a - b, vals[0] || 0)
      case 'mul': return vals.reduce((a, b) => a * b, 1)
      case 'div': return vals.slice(1).reduce((a, b) => (b === 0 ? a : a / b), vals[0] || 0)
      case 'min': return Math.min(...vals)
      case 'max': return Math.max(...vals)
      default: return 0
    }
  }
  return 0
}

const entries = computed(() => {
  const slots = team.value?.slots || []
  // Agréger tous les buffs de stats d'équipe à partir du DSL (stat_buff target: 'team')
  const buffsPerMember = { intelligence: 0, energie: 0, charisme: 0 }
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const info = especies.value?.[id]
    const talentName = info?.talent
    if (!talentName) continue
    const calc = talents.value?.[talentName]?.calculation
    if (!calc || !Array.isArray(calc.effects)) continue
    const p = poules.value?.find(pp => pp.especeId === id)
    const niveau = Math.max(1, Number(p?.niveauTalent) || 1)
    const ctx = { niveau }
    for (const eff of calc.effects) {
      if (!eff || eff.type !== 'stat_buff') continue
      if (eff.target && eff.target !== 'team') continue
      const st = eff.stats || {}
      for (const key of ['intelligence', 'energie', 'charisme']) {
        if (st[key] != null) {
          buffsPerMember[key] += Number(evalExpr(st[key], ctx)) || 0
        }
      }
    }
  }

  const out = []
  // Compter le nombre de membres équipés pour appliquer le buff par membre
  const memberCount = slots.filter(s => s?.especeId).length
  for (const s of slots) {
    if (!s?.especeId) continue
    const info = especies.value?.[s.especeId]
    const poule = poules.value?.find(p => p.especeId === s.especeId)
    // Effet du talent : pour Chanceuse, afficher “niveau * stock”
    let talentEffect = ''
    if (poule && info?.talent === 'Chanceuse') {
      const niveau = getTalentLevel(poule)
      const stock = eggState.value?.maxIncome || 0
      const amount = Math.max(0, Math.floor(niveau * stock))
      talentEffect = `Pour chaque oeuf récolté, 1% de chance de gagner ${amount} oeufs.`
    } else if (poule && (info?.talent === 'Énergétique' || info?.talent === 'Energetique')) {
      // Effet du talent : pour Énergétique, afficher le bonus exact en œufs/s via le DSL
      const niveau = getTalentLevel(poule)
      const teamSlots = team.value?.slots || []
      let teamEnergyBase = 0
      for (const ts of teamSlots) {
        const tid = ts?.especeId
        if (!tid) continue
        const species = especies.value?.[tid]
        teamEnergyBase += Number(species?.stats?.energie) || 0
      }
      const teamEnergy = teamEnergyBase + ((buffsPerMember.energie || 0) * Math.max(0, memberCount))
      // Lire l'effet depuis le DSL pour éviter tout hardcode (0.2, etc.)
      const calc = talents.value?.[info?.talent]?.calculation
      const eff = Array.isArray(calc?.effects) ? calc.effects.find(e => e?.type === 'income_bonus_per_second') : null
      let amount = 0
      if (eff?.amount != null) {
        amount = Number(evalExpr(eff.amount, { niveau, teamEnergy })) || 0
      } else {
        // Fallback théorique
        amount = teamEnergy * (niveau * 0.2)
      }
      const fmt = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2)
      talentEffect = `Augmente vos revenus de ${fmt} œufs/s (⚡${teamEnergy}).`
    } else if (poule) {
      talentEffect = getTalentEffectSync(poule)
    }
    const energy = info?.stats?.energie ?? 3
    out.push({
      especeId: s.especeId,
      name: info?.nom || s.especeId,
      talentEffect,
      level: getTalentLevel(poule) || 0,
      // Buffs par membre agrégés (utilisés par le tooltip enfant)
      statBuffs: { ...buffsPerMember },
      images: findAnim(s.especeId),
      energy
    })
  }
  return out
})

function measure() {
  if (container.value) {
    containerWidth.value = container.value.clientWidth
  } else if (typeof window !== 'undefined') {
    containerWidth.value = window.innerWidth
  }
}

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  // Récupérer le statut de l'œuf pour avoir maxIncome (stock) à jour pour le tooltip
  fetchEggStatus().catch(() => {})
  // Démarrer les mises à jour périodiques pour les cooldowns des talents
  startUpdates()
  
  // Interval supplémentaire pour s'assurer que les cooldowns sont mis à jour fréquemment
  if (typeof window !== 'undefined') {
    window.__teamParadeCooldownsInterval && clearInterval(window.__teamParadeCooldownsInterval)
    window.__teamParadeCooldownsInterval = setInterval(() => { fetchEggStatus() }, 2000)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', measure)
  // Arrêter les mises à jour périodiques
  stopUpdates()
  // Nettoyer l'interval supplémentaire
  if (typeof window !== 'undefined' && window.__teamParadeCooldownsInterval) {
    clearInterval(window.__teamParadeCooldownsInterval)
    window.__teamParadeCooldownsInterval = null
  }
})

watch(() => team.value?.slots, () => {
  // rien à faire, entries est computed
}, { deep: true })

function handleOpenDetail(especeId) {
  if (!especeId) return
  // Trouver la poule depuis les données pour la passer au composant détail
  const p = (poules.value || []).find(p => p.especeId === especeId)
  if (p) {
    selectedPoule.value = p
  } else {
    // fallback précédent: navigation vers la Collection si la donnée n'est pas encore dispo
    router.push({ path: '/collection', query: { detail: especeId } })
  }
}

function handleDetailUpdated() {
  // Rechercher la poule fraîche dans la source (poules.value est réactif et mis à jour par upgradeTalent)
  if (!selectedPoule.value) return
  const id = selectedPoule.value.especeId
  const fresh = (poules.value || []).find(pp => pp.especeId === id)
  if (fresh) {
    // Remplacer la référence pour forcer le rerender du composant enfant
    selectedPoule.value = { ...fresh }
  }
}

function handleCloseDetail() {
  // En fermant, on nettoie la sélection
  selectedPoule.value = null
}
</script>

<style scoped>
.team-parade {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 80px; /* aligner juste au dessus de la BottomBar (80px) */
  height: 72px; /* zone de déambulation */
  pointer-events: none; /* Tooltip réactivé dans les enfants */
  display: block;
  overflow: visible; /* éviter la coupe du haut des sprites */
  z-index: 2; /* au-dessus de la BottomBar (qui n'a pas de z-index) */
}

/* Ajustements responsifs pour s'adapter à la BottomBar */
@media (max-width: 768px) {
  .team-parade {
    bottom: 0; /* directement en bas car pas de BottomBar sur mobile */
    height: 60px;
  }
}

@media (max-width: 480px) {
  .team-parade {
    bottom: 0; /* directement en bas sur très petits écrans */
    height: 50px;
  }
}

.stage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible; /* permettre aux GIF de déborder si besoin */
}
/* Les styles d'animation des poules sont désormais gérés dans le composant enfant */

</style>
