<template>
  <div class="production-screen">
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
                {{ Math.floor(currentGains) }} / {{ eggState.maxIncome }}
              </div>
            </div>
            
            <div class="income-info">
              <span class="income-rate">{{ eggState.income }}/s</span>
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
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useEgg } from '@/composables/useEgg'
import { usePlayer } from '@/composables/usePlayer'
import { usePoules } from '@/composables/usePoules'
import { useGameData } from '@/composables/useGameData'
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

// Effets visuels
const eggEffects = ref([])
let effectId = 0

// Pluie d'œufs (même logique que dans AuthView)
const eggContainer = ref(null)
function dropEggs(count = 20) {
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
    const eggsGained = Math.floor(currentGains.value)
    const result = await clickEgg()
    // Créer l'effet visuel
    if (eggsGained > 0) {
      createEggEffect(eggsGained)
    }
    // Effet visuel/Toast si Chanceuse a proc
    if (result?.chanceuse?.active && result.chanceuse.proc) {
      const bonus = result.chanceuse.bonusEggs || 0
      if (window.$toast) {
        window.$toast(`Chanceuse ! +${bonus} œufs bonus 🍀`, 'success')
      }
      // Effet identique à AuthView (pluie d'œufs) avec l'amount défini dans le DSL si présent
      const rainAmount = (result.chanceuse.effects || []).find(e => e?.type === 'visual_effect' && e?.effect === 'egg_rain')?.amount
      dropEggs(Math.max(1, Number(rainAmount) || 20))
    }
    // Actualiser l'affichage des œufs dans la TopBar
    await refreshPlayer()
  }
}

onMounted(async () => {
  // S'assurer que l'équipe est à jour pour les stats
  await fetchTeam()
  await fetchEggStatus()
  startUpdates()
})

onUnmounted(() => {
  stopUpdates()
})
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
  gap: 20px;
}

.clickable-egg {
  position: relative;
  width: 120px;
  height: 120px;
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
  font-size: 80px;
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
  width: 100px;
  height: 100px;
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
  padding: 15px;
  min-width: 200px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.gains-bar-container {
  margin-bottom: 10px;
}

.gains-bar {
  width: 100%;
  height: 20px;
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
  font-size: 16px;
  color: #8B4513;
  margin-top: 5px;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.income-info {
  text-align: center;
  font-family: 'Courier New', monospace;
  color: #666;
  font-size: 14px;
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
  width: 400px;
  height: 300px;
  padding-top: 20px;
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

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
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
