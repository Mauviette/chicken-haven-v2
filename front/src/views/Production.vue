<template>
  <div class="production-screen">
    <!-- Bandeau des buffs actifs -->
    <div class="buffs-container" v-if="activeBuffs.length > 0">
      <div
        v-for="(buff, index) in activeBuffs"
        :key="index"
        class="buff-badge"
      >
        <Tooltip 
          :text="getBuffTooltipHtml(buff)"
          position="bottom"
          :followMouse="false"
        >
          <div class="buff-icon">{{ getBuffIcon(buff) }}</div>
        </Tooltip>
      </div>
    </div>

    <!-- Bandeau des stats d'équipe -->
    <div class="team-stats-banner">
      <Tooltip text="Somme de l'intelligence des poules équipées.">
        <span class="stat-chip">🧠 {{ teamStats.intelligence }}</span>
      </Tooltip>
      <Tooltip text="Somme de l'énergie de l'équipe.">
        <span class="stat-chip">⚡ {{ teamStats.energie }}</span>
      </Tooltip>
      <Tooltip text="Somme du charisme des poules équipées.">
        <span class="stat-chip">✨ {{ teamStats.charisme }}</span>
      </Tooltip>
    </div>
    <div class="production-content">

      <div class="egg-clicker">
        <!-- Œuf cliquable principal -->
        <div class="egg-container">
          <div 
            class="clickable-egg"
            :class="{ 
              'clickable': isClickable, 
              'max-gains': currentGains >= eggState.maxIncome,
              'loading': eggState.isLoading 
            }"
            @click="handleEggClick"
          >
            <div class="egg-sprite">🥚</div>
            <div class="egg-glow" v-if="currentGains >= eggState.maxIncome"></div>
            
            <!-- Effets visuels d'œufs qui sautent -->
            <div class="egg-effects-container">
              <div 
                v-for="effect in eggEffects" 
                :key="effect.id"
                class="flying-egg"
                :style="{
                  '--start-x': effect.startX + 'px',
                  '--start-y': effect.startY + 'px',
                  '--jump-x': effect.jumpX + 'px',
                  '--jump-y': effect.jumpY + 'px',
                  '--fall-y': effect.fallY + 'px',
                  '--rotation': effect.rotation + 'deg',
                  animationDelay: effect.delay + 'ms',
                  animationDuration: effect.duration + 'ms'
                }"
              >
                🥚
              </div>
            </div>
          </div>

          <!-- Barre de progression des gains -->
          <div class="gains-display">
            <div class="gains-bar-container">
              <div class="gains-bar">
                <div 
                  class="gains-progress" 
                  :style="{ width: progressPercentage + '%' }"
                ></div>
              </div>
              <div class="gains-text">
                <Tooltip :text="storageTooltipHtml">
                  <span>{{ Math.floor(currentGains) }} / {{ eggState.maxIncome }}</span>
                </Tooltip>
              </div>
              <div class="gains-per-click">
                <!--span class="click-info">💰 {{ Math.floor(currentGains) }} œuf{{ Math.floor(currentGains) > 1 ? 's' : '' }} par clic</span-->
              </div>
            </div>
            
            <div class="income-info">
              <Tooltip :text="incomeTooltipHtml">
                <span class="income-rate">{{ formatIncome(eggState.income) }}/s</span>
              </Tooltip>
            </div>
          </div>

        </div>

      </div>
    </div>
    <!-- Overlay pour la pluie d'œufs -->
    <div ref="eggContainer" class="falling-eggs-container"></div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed, watch } from 'vue'
import { useEgg } from '@/composables/useEgg'
import { usePlayer } from '@/composables/usePlayer'
import { usePoules } from '@/composables/usePoules'
import { useGameData } from '@/composables/useGameData'
import { useSound } from '@/composables/useSound'
import { useBuffs } from '@/composables/useBuffs'
import { apiPost } from '@/utils/api'
import Tooltip from '@/components/menu/Tooltip.vue'

const { 
  eggState, 
  currentGains, 
  isClickable, 
  progressPercentage,
  fetchEggStatus, 
  clickEgg, 
  startUpdates, 
  stopUpdates 
} = useEgg()

const { refreshPlayer, fetchTeam, team } = usePlayer()
const { especies, poules } = usePoules()
const { talents } = useGameData()
const { eggClick, incomeUp } = useSound()
const { activeBuffs, fetchBuffs, getTimeRemaining, formatBuffEffect, getBuffIcon } = useBuffs()

console.log('activeBuffs.value:', activeBuffs.value);

// Mini évaluateur d'expressions (miroir minimal du serveur)
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

// Formatters
const formatIncome = (n) => {
  const x = Number(n || 0)
  return Number.isInteger(x) ? x : x.toFixed(1)
}
const roman = (n) => {
  const arr = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV']
  return arr[(Number(n)||0)-1] || `${n}`
}

// Stats d'équipe (somme des stats des poules équipées) + buffs du DSL (stat_buff target: team)
const teamStats = computed(() => {
  const slots = team.value?.slots || []
  let base = { intelligence: 0, energie: 0, charisme: 0 }
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const sp = especies.value?.[id]
    if (sp?.stats) {
      base.intelligence += Number(sp.stats.intelligence) || 0
      base.energie += Number(sp.stats.energie) || 0
      base.charisme += Number(sp.stats.charisme) || 0
    }
  }
  // Buffs par membre agrégés
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
  const memberCount = slots.filter(s => s?.especeId).length
  return {
    intelligence: base.intelligence + (buffsPerMember.intelligence || 0) * memberCount,
    energie: base.energie + (buffsPerMember.energie || 0) * memberCount,
    charisme: base.charisme + (buffsPerMember.charisme || 0) * memberCount,
  }
})

// Calcul générique des bonus de talents (remplace energeticDetails)
const talentBonusDetails = computed(() => {
  try {
    const slots = team.value?.slots || []
    const speciesMap = especies.value || {}
    const talentsMap = talents.value || {}
    const owned = poules.value || []
    const currentTeamStats = teamStats.value || {}
    const teamStatsCtx = {
      teamEnergy: Number(currentTeamStats.energie || 0),
      teamIntelligence: Number(currentTeamStats.intelligence || 0),
      teamCharisme: Number(currentTeamStats.charisme || 0)
    }

    let totalIncome = 0
    let totalStorage = 0
    const incomeEntries = []
    const storageEntries = []

    for (const s of slots) {
      const id = s?.especeId
      if (!id) continue
      const sp = speciesMap[id]
      const tName = sp?.talent
      if (!tName) continue
      const calc = talentsMap[tName]?.calculation
      if (!calc || !Array.isArray(calc.effects)) continue
      
      const own = owned.find(p => p.especeId === id)
      const niveau = Math.max(1, Number(own?.niveauTalent) || 1)
      const ctx = { niveau, ...teamStatsCtx }

      // Calculer les bonus d'income
      const incomeEffects = calc.effects.filter(e => e?.type === 'income_bonus_per_second' && (e?.resource === 'eggs' || e?.resource == null))
      for (const eff of incomeEffects) {
        const amount = Number(evalExpr(eff.amount, ctx)) || 0
        if (amount > 0) {
          totalIncome += amount
          incomeEntries.push({ 
            especeId: id, 
            name: sp?.nom || id, 
            talentName: tName,
            level: niveau, 
            amount,
            type: 'income'
          })
        }
      }

      // Calculer les bonus de stockage
      const storageEffects = calc.effects.filter(e => e?.type === 'storage_bonus' && (e?.resource === 'eggs' || e?.resource == null))
      for (const eff of storageEffects) {
        const amount = Number(evalExpr(eff.amount, ctx)) || 0
        if (amount > 0) {
          totalStorage += amount
          storageEntries.push({ 
            especeId: id, 
            name: sp?.nom || id, 
            talentName: tName,
            level: niveau, 
            amount,
            type: 'storage'
          })
        }
      }
    }

    return { 
      income: { total: totalIncome, entries: incomeEntries },
      storage: { total: totalStorage, entries: storageEntries }
    }
  } catch (_) {
    return { 
      income: { total: 0, entries: [] },
      storage: { total: 0, entries: [] }
    }
  }
})

// HTML du tooltip de l'income
const incomeTooltipHtml = computed(() => {
  const effective = Number(eggState.value.income || 0)
  const bonusDetails = talentBonusDetails.value
  const base = Math.max(0, effective - Number(bonusDetails.income.total || 0))

  let html = `<div>`
  html += `<div style="font-weight:bold;margin-bottom:4px;">Revenu par seconde</div>`
  html += `<div>Base (incl. améliorations): <strong>${formatIncome(base)}</strong></div>`

  if (bonusDetails.income.entries.length) {
    for (const e of bonusDetails.income.entries) {
      html += `<div>${e.talentName} — ${e.name} (niv ${roman(e.level)}): <strong>+${formatIncome(e.amount)}</strong></div>`
    }
  } else {
    html += `<div style="opacity:.8;">Aucun bonus de talent actif</div>`
  }

  html += `<div style="margin-top:4px;border-top:1px dashed #e3b96a;padding-top:4px;">Total: <strong>${formatIncome(effective)}</strong>/s</div>`
  html += `</div>`
  return html
})

// HTML du tooltip du stockage maximum
const storageTooltipHtml = computed(() => {
  const effective = Number(eggState.value.maxIncome || 0)
  const bonusDetails = talentBonusDetails.value
  const base = Math.max(0, effective - Number(bonusDetails.storage.total || 0))

  let html = `<div>`
  html += `<div style="font-weight:bold;margin-bottom:4px;">Stockage maximum</div>`
  html += `<div>Base (incl. améliorations): <strong>${base}</strong></div>`

  if (bonusDetails.storage.entries.length) {
    for (const e of bonusDetails.storage.entries) {
      html += `<div>${e.talentName} — ${e.name} (niv ${roman(e.level)}): <strong>+${e.amount}</strong></div>`
    }
  } else {
    html += `<div style="opacity:.8;">Aucun bonus de talent actif</div>`
  }

  html += `<div style="margin-top:4px;border-top:1px dashed #e3b96a;padding-top:4px;">Total: <strong>${effective}</strong></div>`
  html += `</div>`
  return html
})

// HTML du tooltip des buffs
const getBuffTooltipHtml = (buff) => {
  const effect = formatBuffEffect(buff)
  const timeRemaining = getTimeRemaining(buff)
  const origin = buff.origin || 'Inconnu'

  let html = `<div>`
  html += `<div style="font-weight:bold;margin-bottom:4px;color:#d4752a;">${effect}</div>`
  html += `<div style="margin-bottom:4px;">Source: <strong>${origin}</strong></div>`
  html += `<div style="color:#666;">Durée restante: <strong>${timeRemaining}</strong></div>`
  html += `</div>`
  return html
}

// Effets visuels
const eggEffects = ref([])
let effectId = 0

// Pluie d'œufs (même logique que dans AuthView)
const eggContainer = ref(null)
function dropEggs(count = 50) {
  if (!eggContainer.value) return
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span')
    span.textContent = '🥚'
    span.classList.add('falling-egg')

    // Rotation aléatoire entre -360° et +720°
    const rotateDeg = Math.floor(Math.random() * 1080 - 360) // -360 à 720
    span.style.setProperty('--rotation', `${rotateDeg}deg`)

    // Position, taille, délai
    const offset = 32 // max taille de l’emoji (en px)
    const maxLeft = window.innerWidth - offset
    const leftPx = Math.random() * maxLeft
    span.style.left = `${leftPx}px`
    span.style.fontSize = Math.random() * 16 + 16 + 'px'
    span.style.animationDelay = Math.random() * 0.5 + 's'

    eggContainer.value.appendChild(span)

    setTimeout(() => {
      span.remove()
    }, 3000)
  }
}

// Fonction pour créer l'effet d'œufs qui sautent
const createEggEffect = (eggsGained) => {
  const numEggs = Math.min(eggsGained, 8)
  
  for (let i = 0; i < numEggs; i++) {
    // Position de départ plus proche du centre (rayon plus petit)
    const startRadius = Math.random() * 10 // 0-10px du centre
    const startAngle = Math.random() * Math.PI * 2
    const startX = Math.cos(startAngle) * startRadius
    const startY = Math.sin(startAngle) * startRadius
    
    // Direction aléatoire pour le saut
    const jumpAngle = Math.random() * Math.PI * 2
    const jumpDistance = 40 + Math.random() * 60 // 40-100px
    const jumpX = Math.cos(jumpAngle) * jumpDistance
    const jumpY = Math.sin(jumpAngle) * jumpDistance - (20 + Math.random() * 20) // Légèrement vers le haut
    
    // Gravité pour la chute
    const fallDistance = 80 + Math.random() * 40 // Distance de chute
    
    const effect = {
      id: effectId++,
      startX: startX,
      startY: startY,
      jumpX: jumpX,
      jumpY: jumpY,
      fallY: jumpY + fallDistance,
      delay: i * 30, // Délai échelonné plus rapide
      duration: 1200 + Math.random() * 400, // Durée plus longue pour la physique
      rotation: Math.random() * 360 // Rotation initiale aléatoire
    }
    
    eggEffects.value.push(effect)
    
    // Supprimer l'effet après l'animation
    setTimeout(() => {
      const index = eggEffects.value.findIndex(e => e.id === effect.id)
      if (index > -1) {
        eggEffects.value.splice(index, 1)
      }
    }, effect.duration + effect.delay + 100)
  }
}

const handleEggClick = async () => {
  if (isClickable.value) {
    // Son d'œuf cliqué
    eggClick()
    const eggsGained = Math.floor(currentGains.value)
    
    // Afficher immédiatement un toast avec les gains
    if (window.$toast && eggsGained > 0) {
      //window.$toast(`+${eggsGained} œuf${eggsGained > 1 ? 's' : ''} 🥚`, 'success')
    }
    
  const result = await clickEgg()
    
    // Si l'API a échoué, pas besoin de restaurer car useEgg gère maintenant l'état
    if (!result) {
      return
    }
    
    // Créer l'effet visuel
    if (eggsGained > 0) {
      createEggEffect(eggsGained)
    }

    // Effet Chanceuse: pluie d'œufs + toast
    try {
      const ch = result?.chanceuse
      if (ch?.proc) {
        dropEggs(40)
        if (window.$toast) {
          const bonus = Math.floor(Number(ch.bonusEggs || 0))
          window.$toast(`🍀 Chanceuse ! +${bonus} œufs bonus`, 'success')
        }
      }
    } catch (_) {}
    
    // Actualiser l'affichage des œufs dans la TopBar
    await refreshPlayer()
  }
}

onMounted(async () => {
  // S'assurer que l'équipe est à jour pour les stats
  await fetchTeam()
  await fetchEggStatus()
  await fetchBuffs()
  startUpdates()
  
  // Test temporaire - ajouter un buff pour voir l'affichage
  // (Vous pouvez supprimer cette partie une fois que ça marche)
  if (activeBuffs.value.length === 0) {
    console.log('Aucun buff trouvé, test d\'ajout d\'un buff...')
    try {
      const response = await apiPost('/api/user/test-buff')
      console.log('Buff de test ajouté:', response)
      await fetchBuffs()
    } catch (error) {
      console.error('Erreur lors de l\'ajout du buff de test:', error)
    }
  }
})

onUnmounted(() => {
  stopUpdates()
})

// Son lorsque la barre de gains se remplit (augmentation de currentGains)
let _lastGains = 0
let _lastGainsSoundAt = 0
const GAINS_EPS = 0.5   // déclencher si +0.5 œuf
const GAINS_SOUND_COOLDOWN = 400 // ms
watch(() => currentGains.value, (nv, ov) => {
  const now = Date.now()
  const prev = typeof ov === 'number' ? ov : _lastGains
  const cur = typeof nv === 'number' ? nv : prev
  if (cur > prev + GAINS_EPS && (now - _lastGainsSoundAt) > GAINS_SOUND_COOLDOWN) {
    incomeUp()
    _lastGainsSoundAt = now
  }
  _lastGains = cur
})

// Debug des buffs actifs
watch(() => activeBuffs.value, (newBuffs) => {
  console.log('Buffs actifs mis à jour:', newBuffs)
}, { immediate: true })
</script>

<style scoped>
.production-screen {
  flex: 1;
  width: 100%;
  background-image: url('@/assets/background/main/1.png');
  overflow: hidden;
  position: relative;
  font-family: 'Fredoka', sans-serif;
  background-size: cover;
  background-position: center;
}

.team-stats-banner {
  position: absolute;
  top: 6px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 12px;
  color: #3a2b1a;
  text-shadow: 0 1px 0 #fff;
  pointer-events: auto;
  z-index: 5;
}

.buffs-container {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 6px;
  z-index: 10;
  pointer-events: auto;
}

.buff-badge {
  background: linear-gradient(135deg, #ffd700, #ffeb3b);
  border: 2px solid #d4af37;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  cursor: url('@/assets/ui/cursor/mark_question.png') 0 0, auto;
  transition: all 0.2s ease;
  animation: buff-pulse 3s infinite ease-in-out;
}

.buff-badge:hover {
  transform: scale(1.1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.buff-icon {
  font-size: 18px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.team-stats-banner .stat-chip {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #c8ab86;
  padding: 2px 6px;
  border-radius: 8px;
}

.production-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.egg-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5vh;
}

.clickable-egg {
  position: relative;
  width: clamp(90px, 15vw, 140px);
  height: clamp(90px, 15vw, 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: transform 0.2s ease, filter 0.2s ease;
  filter: grayscale(0.5);
}

.clickable-egg.clickable {
  filter: grayscale(0);
  animation: pulse 5s infinite;
}

.clickable-egg.max-gains {
  animation: pulse 5s infinite, max-glow 5s infinite alternate;
}

.clickable-egg.clickable:hover {
  transform: scale(1.1);
}

.clickable-egg.loading {
  pointer-events: none;
  opacity: 0.7;
}

.egg-sprite {
  font-size: clamp(56px, 10vw, 110px);
  z-index: 2;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.egg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(80px, 13vw, 120px);
  height: clamp(80px, 13vw, 120px);
  background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: glow 2s infinite alternate;
  z-index: 1;
}

.egg-effects-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 10;
}

.flying-egg {
  position: absolute;
  font-size: 12px;
  animation: fly-and-fall 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  pointer-events: none;
  transform: translate(-50%, -50%);
  left: 50%;
  top: 50%;
}

.gains-display {
  background: rgba(255, 255, 255, 0.95);
  border: 3px solid #8B4513;
  border-radius: 12px;
  padding: clamp(10px, 2vw, 16px);
  width: min(65%, 360px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.gains-bar-container {
  margin-bottom: 10px;
}

.gains-bar {
  width: 100%;
  height: clamp(14px, 2.2vh, 22px);
  background: #E0E0E0;
  border: 2px solid #8B4513;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.gains-progress {
  height: 100%;
  background: #b77b3d;
  transition: width 0.3s ease;
  border-radius: 2px;
  background-image: url('@/assets/bar/bg.png');
}

.gains-text {
  text-align: center;
  font-family: 'Fredoka', sans-serif;
  font-weight: bold;
  font-size: clamp(14px, 2.8vw, 18px);
  color: #8B4513;
  margin-top: 6px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.gains-per-click {
  text-align: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #c8ab86;
}

.click-info {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  color: #27ae60;
  font-weight: bold;
  background: rgba(39, 174, 96, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(39, 174, 96, 0.3);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.income-info {
  text-align: center;
  font-family: 'Courier New', monospace;
  color: #666;
  font-size: clamp(12px, 2.4vw, 14px);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.income-rate {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.egg-clicker {
  background-color: #421d00;
  background-color: #ffeecd;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23fab862' fill-opacity='0.39' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: repeat;
  max-width: min(92vw, 560px);
  height: clamp(240px, 56vh, 360px);
  aspect-ratio: 4 / 3;
  padding-top: 2vh;
  border-radius: 10px;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
  position: relative;
  border: 4px solid #cfa881;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.25);
}

@keyframes fly-and-fall {
  0% {
    opacity: 1;
    transform: translate(var(--start-x), var(--start-y)) scale(1) rotate(var(--rotation));
  }
  30% {
    opacity: 1;
    transform: translate(var(--jump-x), var(--jump-y)) scale(1.1) rotate(calc(var(--rotation) + 180deg));
  }
  100% {
    opacity: 0;
    transform: translate(var(--jump-x), var(--fall-y)) scale(0.8) rotate(calc(var(--rotation) + 720deg));
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes max-glow {
  0% { filter: brightness(1) drop-shadow(0 0 5px rgba(255, 215, 0, 0.3)); }
  100% { filter: brightness(1.1) drop-shadow(0 0 10px rgba(255, 215, 0, 0.5)); }
}

@keyframes glow {
  0% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes buff-pulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 
      0 2px 6px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
  50% { 
    transform: scale(1.05);
    box-shadow: 
      0 3px 8px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      0 0 8px rgba(255, 215, 0, 0.3);
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Ajustements responsives additionnels */
@media (max-width: 840px) {
  .team-stats-banner {
    font-size: 11px;
    gap: 6px;
  }
}

@media (max-height: 640px) {
  .egg-container { gap: 1.5vh; }
}
</style>

<style>
/* Styles globaux pour reproduire exactement l'effet d'AuthView */
.falling-egg {
  position: absolute;
  top: -40px;
  animation: egg-drop 2.5s linear forwards;
  user-select: none;
  pointer-events: none;
  z-index: 9999;
  transform: rotate(0deg);
}

@keyframes egg-drop {
  to {
    top: 100vh;
    transform: rotate(var(--rotation));
    opacity: 0;
  }
}
</style>
