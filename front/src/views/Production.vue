<template>
  <div class="production-screen" :class="{ 'apocalypse-mode': isApocalypseMode, 'time-stop-active': isTimeStopActive }">
    <!-- Debug: isApocalypseMode = {{ isApocalypseMode }} -->
    <!-- Bandeau des buffs actifs -->
    <div class="buffs-container" v-if="activeBuffs.length > 0">
      <Tooltip 
        v-for="(buff, index) in activeBuffs"
        :key="`buff-${index}-${buff.lasts_until}`"
        :text="getBuffTooltipHtml(buff)"
        position="bottom"
        :followMouse="false"
      >
        <div
          class="buff-badge"
          :style="{
            background: `linear-gradient(135deg, ${getBuffColor(buff).bg}, ${getBuffColor(buff).bg}dd)`,
            borderColor: getBuffColor(buff).border
          }"
        >
          <div class="buff-duration-ring">{{ getBuffDuration(buff).remaining }}</div>
          <div class="buff-icon">{{ getBuffIcon(buff) }}</div>
          <div class="buff-short">{{ formatBuffShort(buff) }}</div>
        </div>
      </Tooltip>
    </div>

    <!-- Bandeau des stats d'équipe -->
    <div class="team-stats-banner">
      <Tooltip :text="intelligenceTooltipHtml">
        <span class="stat-chip" :class="{ buffed: teamStatMult.intelligence > 1, debuffed: teamStats.intelligence < 0 }">🧠 {{ teamStats.intelligence < 0 ? '-' + formatNumber(Math.abs(teamStats.intelligence)) : formatNumber(teamStats.intelligence) }}</span>
      </Tooltip>
      <Tooltip :text="energieTooltipHtml">
        <span class="stat-chip" :class="{ buffed: teamStatMult.energie > 1, debuffed: teamStats.energie < 0 }">⚡ {{ teamStats.energie < 0 ? '-' + formatNumber(Math.abs(teamStats.energie)) : formatNumber(teamStats.energie) }}</span>
      </Tooltip>
      <Tooltip :text="charismeTooltipHtml">
        <span class="stat-chip" :class="{ buffed: teamStatMult.charisme > 1, debuffed: teamStats.charisme < 0 }">✨ {{ teamStats.charisme < 0 ? '-' + formatNumber(Math.abs(teamStats.charisme)) : formatNumber(teamStats.charisme) }}</span>
      </Tooltip>
      
      <!-- (Mine accessible depuis la barre du bas) -->
    </div>
    
    <div class="production-content">

      <div class="egg-clicker">
        <!-- Œuf cliquable principal -->
        <div class="egg-container">
          <div 
            class="clickable-egg"
            :class="{ 'loading': eggState.isLoading, 'clickable': isClickable, 'max-gains': currentGains >= eggState.maxIncome }"
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
                  :style="{ width: effectiveProgressPercentage + '%' }"
                ></div>
              </div>
              <div class="gains-text">
                <Tooltip :text="storageTooltipHtml">
                  <span>{{ formatNumber(Math.floor(displayedCurrentGains)) }} / {{ formatNumber(Math.floor(displayedMaxIncome)) }}</span>
                </Tooltip>
              </div>
              <div class="gains-per-click">
                <!--span class="click-info">💰 {{ Math.floor(currentGains) }} œuf{{ Math.floor(currentGains) > 1 ? 's' : '' }} par clic</span-->
              </div>
            </div>
            
            <div class="income-info">
              <Tooltip :text="incomeTooltipHtml">
                <span class="income-rate">{{ formatIncome(displayedIncome) }}/s</span>
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
import { formatNumber } from '@/utils/format.js'

const { 
  eggState, 
  currentGains, 
  isClickable, 
  progressPercentage,
  fetchEggStatus: originalFetchEggStatus, 
  clickEgg, 
  startUpdates, 
  stopUpdates 
} = useEgg()

// Wrapper pour fetchEggStatus qui met aussi à jour les buffs
const fetchEggStatus = async () => {
  const result = await originalFetchEggStatus()
  // Si fetchEggStatus retourne des données avec buffs, les utiliser
  if (result && result.buffs) {
    updateBuffsFromEggStatus(result)
  }
  return result
}

const { refreshPlayer, fetchTeam, team, setEggs, player, eggs, apocalypse } = usePlayer()
const { especies, poules } = usePoules()
const { talents } = useGameData()
const { eggClick, incomeUp, timeStop } = useSound()
const { activeBuffs, fetchBuffs, getTimeRemaining, getBuffDuration, formatBuffEffect, getBuffIcon, getBuffColor, formatBuffShort, buffs, allActiveBuffs, updateBuffsFromEggStatus } = useBuffs()

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
  if (x === 0) return '0'
  if (x >= 1000) return formatNumber(Math.floor(x))
  if (x >= 1) return x.toFixed(1)
  return x.toFixed(2)
}
const roman = (n) => {
  const arr = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV']
  return arr[(Number(n)||0)-1] || `${n}`
}

// Fonctions utilitaires pour les buffs
const getActiveIncomeBuffs = () => {
  return activeBuffs.value.filter(buff => {
    const type = buff.buff_type || 'income'
    return type === 'income' || type === 'income_multiplier'
  })
}

const getActiveStorageBuffs = () => {
  return activeBuffs.value.filter(buff => {
    const type = buff.buff_type || 'income'
    return type === 'storage'
  })
}

const getIncomeBuffMultiplier = () => {
  return getActiveIncomeBuffs().reduce((total, buff) => {
    const multiplier = parseFloat(buff.buff?.amount || 1)
    return total * multiplier
  }, 1)
}

const getStorageBuffMultiplier = () => {
  return getActiveStorageBuffs().reduce((total, buff) => {
    const multiplier = parseFloat(buff.buff?.amount || 1)
    return total * multiplier
  }, 1)
}

// Mult multiplicateurs temporaires pour stats d’équipe (via origin/type)
const teamStatMult = computed(() => {
  const mult = { intelligence: 1, energie: 1, charisme: 1 }
  for (const b of allActiveBuffs.value) {
    const op = b.buff?.operation || 'mult'
    const amt = parseFloat(b.buff?.amount || 1)
    if (op !== 'mult') continue
    switch (b.buff_type) {
      case 'team_stat_intelligence': mult.intelligence *= amt; break
      case 'team_stat_energie': mult.energie *= amt; break
      case 'team_stat_charisme': mult.charisme *= amt; break
    }
  }
  return mult
})

const isTimeStopActive = computed(() => {
  const active = allActiveBuffs.value.some(b => b.buff_type === 'time_stop')
  if (active && frozenIncome.value === null) {
    // Figer le revenu au moment où time_stop devient actif
    frozenIncome.value = eggState.value.income
  } else if (!active) {
    // Réinitialiser quand time_stop se termine
    frozenIncome.value = null
  }
  return active
})

const makeStatTooltip = (label, base, extraPerMember, members, mult) => {
  const extraTotal = extraPerMember * members
  const subtotal = base + extraTotal
  const total = subtotal * mult
  const formatValue = (val) => `<strong style="color: ${val < 0 ? '#cc0000' : 'inherit'}">${val < 0 ? '' : (val > 0 ? '+' : '')}${Math.round(val)}</strong>`
  return `<div>
    <div style="font-weight:bold;margin-bottom:4px;">${label}</div>
    <div>Base: ${formatValue(base)}</div>
    <div>Buffs équipe: ${formatValue(extraTotal)}</div>
    ${mult > 1 ? `<div>Multiplicateur temporaire: <strong>x${mult.toFixed(2)}</strong></div>` : ''}
    <div style="margin-top:4px;border-top:1px dashed #e3b96a;padding-top:4px;">Total: ${formatValue(total)}</div>
  </div>`
}

const intelligenceTooltipHtml = computed(() => makeStatTooltip(
  "Intelligence d'équipe",
  teamStatsBreakdown.value.base.intelligence,
  teamStatsBreakdown.value.buffsPerMember.intelligence,
  teamStatsBreakdown.value.memberCount,
  teamStatMult.value.intelligence
))

const energieTooltipHtml = computed(() => makeStatTooltip(
  "Énergie d'équipe",
  teamStatsBreakdown.value.base.energie,
  teamStatsBreakdown.value.buffsPerMember.energie,
  teamStatsBreakdown.value.memberCount,
  teamStatMult.value.energie
))

const charismeTooltipHtml = computed(() => makeStatTooltip(
  "Charisme d'équipe",
  teamStatsBreakdown.value.base.charisme,
  teamStatsBreakdown.value.buffsPerMember.charisme,
  teamStatsBreakdown.value.memberCount,
  teamStatMult.value.charisme
))

// Breakdown détaillé: base (stats de chaque membre + buffs perso), buffs par membre (target: team), et nombre de membres
const teamStatsBreakdown = computed(() => {
  const slots = team.value?.slots || []
  let base = { intelligence: 0, energie: 0, charisme: 0 }
  for (const s of slots) {
    const id = s?.especeId
    if (!id) continue
    const sp = especies.value?.[id]
    if (sp?.stats) {
      // Base
      const bInt = Number(sp.stats.intelligence) || 0
      const bEne = Number(sp.stats.energie) || 0
      const bCha = Number(sp.stats.charisme) || 0
      // Buffs personnels (target: 'me'), ex: Majestueuse
      let selfBuff = { intelligence: 0, energie: 0, charisme: 0 }
      try {
        const talentName = sp?.talent
        const calc = talents.value?.[talentName]?.calculation
        if (calc && Array.isArray(calc.effects)) {
          const p = poules.value?.find(pp => pp.especeId === id)
          const niveau = Math.max(1, Number(p?.niveauTalent) || 1)
          const ctx = { niveau }
          for (const eff of calc.effects) {
            if (!eff || eff.type !== 'stat_buff') continue
            const target = eff.target || 'me'
            if (target !== 'me') continue
            const st = eff.stats || {}
            for (const key of ['intelligence', 'energie', 'charisme']) {
              if (st[key] != null) {
                selfBuff[key] += Number(evalExpr(st[key], ctx)) || 0
              }
            }
          }
        }
      } catch (_) {}

      base.intelligence += bInt + (selfBuff.intelligence || 0)
      base.energie += bEne + (selfBuff.energie || 0)
      base.charisme += bCha + (selfBuff.charisme || 0)
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
  return { base, buffsPerMember, memberCount }
})

// Stats d'équipe effectives (base + buffs team par membre) * multiplicateurs temporaires
const teamStats = computed(() => {
  const br = teamStatsBreakdown.value
  const mult = teamStatMult.value
  return {
    intelligence: (br.base.intelligence + (br.buffsPerMember.intelligence || 0) * br.memberCount) * mult.intelligence,
    energie: (br.base.energie + (br.buffsPerMember.energie || 0) * br.memberCount) * mult.energie,
    charisme: (br.base.charisme + (br.buffsPerMember.charisme || 0) * br.memberCount) * mult.charisme,
  }
})

// Valeurs affichées en mode apocalypse (divisées par 10)
const isApocalypseMode = computed(() => {
  const apocalypseVal = apocalypse.value
  //console.log('isApocalypseMode computed - apocalypse.value:', apocalypseVal, 'player.value:', player.value)
  return Boolean(apocalypseVal)
})

const displayedCurrentGains = computed(() => {
  const isApocalypse = isApocalypseMode.value
  //console.log('displayedCurrentGains - isApocalypse:', isApocalypse, 'currentGains:', currentGains.value, 'result:', isApocalypse ? currentGains.value / 10 : currentGains.value)
  return isApocalypse ? currentGains.value / 10 : currentGains.value
})

const displayedMaxIncome = computed(() => {
  const isApocalypse = isApocalypseMode.value
  //console.log('displayedMaxIncome - isApocalypse:', isApocalypse, 'maxIncome:', eggState.value.maxIncome, 'result:', isApocalypse ? eggState.value.maxIncome / 10 : eggState.value.maxIncome)
  return isApocalypse ? eggState.value.maxIncome / 10 : eggState.value.maxIncome
})

const displayedIncome = computed(() => {
  const isApocalypse = isApocalypseMode.value
  const result = isApocalypse ? eggState.value.income / 10 : eggState.value.income
  //console.log('displayedIncome - isApocalypse:', isApocalypse, 'income:', eggState.value.income, 'result:', result, 'formatIncome(result):', formatIncome(result))
  return result
})

// Progression figée pendant time_stop
const frozenProgress = ref(null)
const frozenIncome = ref(null)
const effectiveProgressPercentage = computed(() => {
  if (isTimeStopActive.value) {
    // Pendant time_stop, geler la progression
    if (frozenProgress.value === null) {
      frozenProgress.value = progressPercentage.value
    }
    return frozenProgress.value
  } else {
    // Réinitialiser la progression gelée quand time_stop se termine
    frozenProgress.value = null
    return progressPercentage.value
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
      teamCharisme: Number(currentTeamStats.charisme || 0),
      stockageMax: Number(eggState.value.maxIncome || 0)
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
  const isApocalypse = isApocalypseMode.value
  const effective = Number(eggState.value.income || 0)
  const displayedEffective = isApocalypse ? effective / 10 : effective
  const bonusDetails = talentBonusDetails.value
  const talentBonus = Number(bonusDetails.income.total || 0)
  const displayedTalentBonus = isApocalypse ? talentBonus / 10 : talentBonus
  // Les buffs temporaires sont déjà inclus dans effective, donc on ne les soustrait pas
  const base = Math.max(0, effective - talentBonus)
  const displayedBase = isApocalypse ? base / 10 : base
  const subtotal = base + talentBonus
  const displayedSubtotal = isApocalypse ? subtotal / 10 : subtotal

  let html = `<div>`
  html += `<div style="font-weight:bold;margin-bottom:4px;">Revenu par seconde${isApocalypse ? ' (Mode Apocalypse)' : ''}</div>`
  html += `<div>Base (incl. améliorations): <strong>${isApocalypse ? Math.floor(displayedBase) : formatIncome(displayedBase)}</strong></div>`

  if (bonusDetails.income.entries.length) {
    for (const e of bonusDetails.income.entries) {
      const displayedAmount = isApocalypse ? e.amount / 10 : e.amount
      html += `<div>${e.talentName} — ${e.name} (niv ${roman(e.level)}): <strong>+${isApocalypse ? Math.floor(displayedAmount) : formatIncome(displayedAmount)}</strong></div>`
    }
  } else {
    html += `<div style="opacity:.8;">Aucun bonus de talent actif</div>`
  }

  // Section buffs temporaires (maintenant inclus dans le total)
  const incomeBuffs = getActiveIncomeBuffs()
  if (incomeBuffs.length > 0) {
    html += `<div style="margin-top:8px;border-top:1px solid #d4752a;padding-top:4px;">`
    html += `<div style="font-weight:bold;color:#d4752a;margin-bottom:2px;">🍫 Buffs Temporaires Actifs</div>`
    for (const buff of incomeBuffs) {
      const multiplier = parseFloat(buff.buff?.amount || 1)
      const percentage = Math.round((multiplier - 1) * 100)
      const timeRemaining = getTimeRemaining(buff)
      html += `<div style="color:#8B4513;">${buff.origin || 'Buff'} (+${percentage}%): <strong>${timeRemaining}</strong></div>`
    }
    html += `</div>`
  }

  html += `<div style="margin-top:4px;border-top:1px dashed #e3b96a;padding-top:4px;">`
  html += `<div>Sous-total: <strong>${isApocalypse ? Math.floor(displayedSubtotal) : formatIncome(displayedSubtotal)}</strong>/s</div>`
  html += `<div style="font-weight:bold;">Total: <strong>${isApocalypse ? formatIncome(displayedEffective) : formatIncome(displayedEffective)}</strong>/s</div>`
  html += `</div>`
  html += `</div>`
  return html
})

// HTML du tooltip du stockage maximum
const storageTooltipHtml = computed(() => {
  const isApocalypse = isApocalypseMode.value
  const effective = Number(eggState.value.maxIncome || 0)
  const displayedEffective = isApocalypse ? effective / 10 : effective
  const bonusDetails = talentBonusDetails.value
  const talentBonus = Number(bonusDetails.storage.total || 0)
  const displayedTalentBonus = isApocalypse ? talentBonus / 10 : talentBonus
  // Les buffs temporaires sont déjà inclus dans effective, donc on ne les soustrait pas
  const base = Math.max(0, effective - talentBonus)
  const displayedBase = isApocalypse ? base / 10 : base
  const subtotal = base + talentBonus
  const displayedSubtotal = isApocalypse ? subtotal / 10 : subtotal

  let html = `<div>`
  html += `<div style="font-weight:bold;margin-bottom:4px;">Stockage maximum${isApocalypse ? ' (Mode Apocalypse)' : ''}</div>`
  html += `<div>Base (incl. améliorations): <strong>${isApocalypse ? Math.floor(displayedBase) : Math.round(displayedBase)}</strong></div>`

  if (bonusDetails.storage.entries.length) {
    for (const e of bonusDetails.storage.entries) {
      const displayedAmount = isApocalypse ? e.amount / 10 : e.amount
      html += `<div>${e.talentName} — ${e.name} (niv ${roman(e.level)}): <strong>+${isApocalypse ? Math.floor(displayedAmount) : Math.round(displayedAmount)}</strong></div>`
    }
  } else {
    html += `<div style="opacity:.8;">Aucun bonus de talent actif</div>`
  }

  // Section buffs temporaires (maintenant inclus dans le total)
  const storageBuffs = getActiveStorageBuffs()
  if (storageBuffs.length > 0) {
    html += `<div style="margin-top:8px;border-top:1px solid #d4752a;padding-top:4px;">`
    html += `<div style="font-weight:bold;color:#d4752a;margin-bottom:2px;">🍫 Buffs Temporaires Actifs</div>`
    for (const buff of storageBuffs) {
      const multiplier = parseFloat(buff.buff?.amount || 1)
      const percentage = Math.round((multiplier - 1) * 100)
      const timeRemaining = getTimeRemaining(buff)
      html += `<div style="color:#8B4513;">${buff.origin || 'Buff'} (+${percentage}%): <strong>${timeRemaining}</strong></div>`
    }
    html += `</div>`
  }

  html += `<div style="margin-top:4px;border-top:1px dashed #e3b96a;padding-top:4px;">`
  html += `<div>Sous-total: <strong>${isApocalypse ? Math.floor(displayedSubtotal) : Math.round(displayedSubtotal)}</strong></div>`
  html += `<div style="font-weight:bold;">Total: <strong>${isApocalypse ? Math.floor(displayedEffective) : Math.round(displayedEffective)}</strong></div>`
  html += `</div>`
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

// Fonction pour créer l'effet de récompense à une position donnée
const createRewardEffectAtPosition = (rect, amount) => {
  console.log('createRewardEffectAtPosition called with rect:', rect, 'amount:', amount)
  // Rotation aléatoire pour le texte
  const randomRotation = (Math.random() - 0.5) * 40 // Entre -20 et +20 degrés
  
  // Effet principal du nombre
  const effectEl = document.createElement('div')
  effectEl.textContent = `+${formatNumber(amount)}`
  effectEl.className = 'reward-effect'
  effectEl.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top - 15}px;
    font-size: 32px;
    font-weight: 900;
    color: #FFD700;
    text-shadow: 3px 3px 6px rgba(0,0,0,0.9), 0 0 20px rgba(255,215,0,0.8);
    pointer-events: none;
    z-index: 9999;
    transform: translateX(-50%) rotate(${randomRotation}deg);
    font-family: 'Fredoka', sans-serif;
    letter-spacing: 2px;
    user-select: none;
  `
  
  document.body.appendChild(effectEl)
  
  // Cercles concentriques supprimés
  
  // Créer des particules d'étoiles autour
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div')
    particle.textContent = '✨'
    particle.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + rect.height / 2}px;
      font-size: 24px;
      pointer-events: none;
      z-index: 9998;
      transform: translateX(-50%) translateY(-50%);
      user-select: none;
    `
    
    document.body.appendChild(particle)
    
    // Animation des particules dans différentes directions
    const angle = (i * 30) * Math.PI / 180 // 30 degrés entre chaque particule
    const distance = 100 + Math.random() * 80
    const endX = Math.cos(angle) * distance
    const endY = Math.sin(angle) * distance
    
    particle.animate([
      { 
        opacity: 0,
        transform: 'translateX(-50%) translateY(-50%) scale(0) rotate(0deg)',
      },
      { 
        opacity: 1,
        transform: 'translateX(-50%) translateY(-50%) scale(1.5) rotate(180deg)',
        offset: 0.3
      },
      { 
        opacity: 0,
        transform: `translateX(${endX - 50}%) translateY(${endY - 50}%) scale(0.5) rotate(360deg)`,
      }
    ], {
      duration: 2000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    })
    
    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove()
      }
    }, 2000)
  }
  
  // Animation du texte principal
  effectEl.animate([
    { 
      opacity: 0, 
      transform: `translateX(-50%) translateY(0) scale(0.5) rotate(${randomRotation}deg)`, 
      filter: 'brightness(3)' 
    },
    { 
      opacity: 1, 
      transform: `translateX(-50%) translateY(-30px) scale(1.8) rotate(${randomRotation}deg)`, 
      filter: 'brightness(2)',
      offset: 0.3
    },
    { 
      opacity: 1, 
      transform: `translateX(-50%) translateY(-60px) scale(1.4) rotate(${randomRotation}deg)`, 
      filter: 'brightness(1.5)',
      offset: 0.7
    },
    { 
      opacity: 0, 
      transform: `translateX(-50%) translateY(-120px) scale(1) rotate(${randomRotation}deg)`, 
      filter: 'brightness(1)' 
    }
  ], {
    duration: 2500,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  })
  
  setTimeout(() => {
    if (effectEl.parentNode) {
      effectEl.remove()
    }
  }, 2500)
}

// Fonction pour créer l'effet d'explosion de l'oeuf à la fin du time_stop
const createTimeStopEndExplosion = () => {
  console.log('createTimeStopEndExplosion called')
  
  // Obtenir la position de l'oeuf
  const eggElement = document.querySelector('.clickable-egg')
  if (!eggElement) return
  
  const eggRect = eggElement.getBoundingClientRect()
  const centerX = eggRect.left + eggRect.width / 2
  const centerY = eggRect.top + eggRect.height / 2
  
  // Afficher le total des gains accumulés
  const totalGains = timeStopGainsAccumulator.value
  if (totalGains > 0) {
    const totalGainsElement = document.createElement('div')
    totalGainsElement.textContent = `+${formatNumber(totalGains)}`
    totalGainsElement.className = 'time-stop-total-gains'
    totalGainsElement.style.cssText = `
      position: fixed;
      left: ${centerX}px;
      top: ${centerY - 50}px;
      font-size: 48px;
      font-weight: 900;
      color: #FFD700;
      text-shadow: 4px 4px 8px rgba(0,0,0,0.9), 0 0 30px rgba(255,215,0,0.8);
      pointer-events: none;
      z-index: 9999;
      transform: translateX(-50%) translateY(-50%);
      font-family: 'Fredoka', sans-serif;
      letter-spacing: 3px;
      user-select: none;
    `
    
    document.body.appendChild(totalGainsElement)
    
    // Animation JavaScript pour le fade away progressif
    totalGainsElement.animate([
      { 
        opacity: 0, 
        transform: 'translateX(-50%) translateY(-50%) scale(0.5)', 
        filter: 'brightness(3)' 
      },
      { 
        opacity: 1, 
        transform: 'translateX(-50%) translateY(-50%) scale(1.5)', 
        filter: 'brightness(2)',
        offset: 0.08
      },
      { 
        opacity: 1, 
        transform: 'translateX(-50%) translateY(-100px) scale(1.2)', 
        filter: 'brightness(1.5)',
        offset: 0.25
      },
      { 
        opacity: 1, 
        transform: 'translateX(-50%) translateY(-150px) scale(1)', 
        filter: 'brightness(1)',
        offset: 0.45
      },
      { 
        opacity: 0.95, 
        transform: 'translateX(-50%) translateY(-165px) scale(0.97)', 
        filter: 'brightness(0.97)',
        offset: 0.65
      },
      { 
        opacity: 0.85, 
        transform: 'translateX(-50%) translateY(-175px) scale(0.94)', 
        filter: 'brightness(0.94)',
        offset: 0.75
      },
      { 
        opacity: 0.6, 
        transform: 'translateX(-50%) translateY(-185px) scale(0.91)', 
        filter: 'brightness(0.91)',
        offset: 0.85
      },
      { 
        opacity: 0.3, 
        transform: 'translateX(-50%) translateY(-192px) scale(0.87)', 
        filter: 'brightness(0.87)',
        offset: 0.92
      },
      { 
        opacity: 0.1, 
        transform: 'translateX(-50%) translateY(-197px) scale(0.83)', 
        filter: 'brightness(0.83)',
        offset: 0.98
      },
      { 
        opacity: 0, 
        transform: 'translateX(-50%) translateY(-200px) scale(0.8)', 
        filter: 'brightness(0.8)' 
      }
    ], {
      duration: 4500,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    })
    
    setTimeout(() => {
      if (totalGainsElement.parentNode) {
        totalGainsElement.remove()
      }
    }, 4500)
  }
  
  // Réinitialiser l'accumulateur
  timeStopGainsAccumulator.value = 0
  
  // 1. Flash lumineux initial
  const flashElement = document.createElement('div')
  flashElement.style.cssText = `
    position: fixed;
    left: ${centerX}px;
    top: ${centerY}px;
    width: 10px;
    height: 10px;
    background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,215,0,0.8) 50%, transparent 100%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 9999;
  `
  
  document.body.appendChild(flashElement)
  
  flashElement.animate([
    { 
      width: '10px', 
      height: '10px', 
      opacity: 1,
      transform: 'translate(-50%, -50%) scale(1)'
    },
    { 
      width: '300px', 
      height: '300px', 
      opacity: 0.8,
      transform: 'translate(-50%, -50%) scale(1)',
      offset: 0.3
    },
    { 
      width: '500px', 
      height: '500px', 
      opacity: 0,
      transform: 'translate(-50%, -50%) scale(1)'
    }
  ], {
    duration: 600,
    easing: 'ease-out'
  })
  
  setTimeout(() => {
    if (flashElement.parentNode) {
      flashElement.remove()
    }
  }, 600)
  
  // 2. Explosion de particules d'or et d'étoiles
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div')
    const isStar = Math.random() < 0.5
    particle.textContent = isStar ? '⭐' : '✨'
    particle.style.cssText = `
      position: fixed;
      left: ${centerX}px;
      top: ${centerY}px;
      font-size: ${20 + Math.random() * 20}px;
      pointer-events: none;
      z-index: 9998;
      transform: translate(-50%, -50%);
      user-select: none;
    `
    
    document.body.appendChild(particle)
    
    // Animation des particules dans toutes les directions
    const angle = (i * 18) * Math.PI / 180 // 18 degrés entre chaque particule
    const distance = 150 + Math.random() * 200
    const endX = Math.cos(angle) * distance
    const endY = Math.sin(angle) * distance
    
    particle.animate([
      { 
        opacity: 0,
        transform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
      },
      { 
        opacity: 1,
        transform: 'translate(-50%, -50%) scale(1.5) rotate(180deg)',
        offset: 0.2
      },
      { 
        opacity: 1,
        transform: `translate(${endX - 50}%, ${endY - 50}%) scale(1) rotate(360deg)`,
        offset: 0.6
      },
      { 
        opacity: 0,
        transform: `translate(${endX - 50}%, ${endY - 50}%) scale(0.5) rotate(540deg)`,
      }
    ], {
      duration: 2000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      delay: Math.random() * 200
    })
    
    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove()
      }
    }, 2200)
  }
  
  // 3. Cercle d'énergie expansif
  const energyRing = document.createElement('div')
  energyRing.style.cssText = `
    position: fixed;
    left: ${centerX}px;
    top: ${centerY}px;
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 215, 0, 0.8);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 9997;
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  `
  
  document.body.appendChild(energyRing)
  
  energyRing.animate([
    { 
      width: '50px', 
      height: '50px', 
      opacity: 1,
      borderWidth: '4px',
      transform: 'translate(-50%, -50%) scale(1)'
    },
    { 
      width: '200px', 
      height: '200px', 
      opacity: 0.6,
      borderWidth: '2px',
      transform: 'translate(-50%, -50%) scale(1)',
      offset: 0.5
    },
    { 
      width: '400px', 
      height: '400px', 
      opacity: 0,
      borderWidth: '1px',
      transform: 'translate(-50%, -50%) scale(1)'
    }
  ], {
    duration: 1000,
    easing: 'ease-out'
  })
  
  setTimeout(() => {
    if (energyRing.parentNode) {
      energyRing.remove()
    }
  }, 1000)
  
  // 4. Fragments d'oeuf qui s'envolent
  for (let i = 0; i < 8; i++) {
    const fragment = document.createElement('div')
    fragment.textContent = '🥚'
    fragment.style.cssText = `
      position: fixed;
      left: ${centerX}px;
      top: ${centerY}px;
      font-size: 16px;
      pointer-events: none;
      z-index: 9996;
      transform: translate(-50%, -50%);
      user-select: none;
    `
    
    document.body.appendChild(fragment)
    
    const angle = (i * 45) * Math.PI / 180 // 45 degrés entre chaque fragment
    const distance = 100 + Math.random() * 150
    const endX = Math.cos(angle) * distance
    const endY = Math.sin(angle) * distance
    
    fragment.animate([
      { 
        opacity: 1,
        transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
      },
      { 
        opacity: 0.8,
        transform: `translate(${endX - 50}%, ${endY - 50}%) scale(0.8) rotate(${Math.random() * 360}deg)`,
        offset: 0.7
      },
      { 
        opacity: 0,
        transform: `translate(${endX - 50}%, ${endY - 50}%) scale(0.3) rotate(${Math.random() * 720}deg)`,
      }
    ], {
      duration: 1500,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      delay: 100 + Math.random() * 300
    })
    
    setTimeout(() => {
      if (fragment.parentNode) {
        fragment.remove()
      }
    }, 1800)
  }
  
  // 5. Secousse de l'écran (effet subtil)
  const productionScreen = document.querySelector('.production-screen')
  if (productionScreen) {
    productionScreen.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)', offset: 0.1 },
      { transform: 'translateX(5px)', offset: 0.2 },
      { transform: 'translateX(-3px)', offset: 0.3 },
      { transform: 'translateX(3px)', offset: 0.4 },
      { transform: 'translateX(0)', offset: 0.5 }
    ], {
      duration: 300,
      easing: 'ease-out'
    })
  }
}

// Fonction pour créer l'effet visuel de coup porté à l'œuf pendant time_stop
const createTimeStopClickEffect = (clickX, clickY) => {
  console.log('createTimeStopClickEffect called with clickX:', clickX, 'clickY:', clickY)
  // Créer un effet d'impact à la position du clic
  const impactElement = document.createElement('div')
  impactElement.style.cssText = `
    position: fixed;
    left: ${clickX}px;
    top: ${clickY}px;
    width: 10px;
    height: 10px;
    background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,215,0,0.7) 50%, transparent 100%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 9999;
  `
  
  document.body.appendChild(impactElement)
  
  // Animation de l'impact
  impactElement.animate([
    { 
      width: '10px', 
      height: '10px', 
      opacity: 1,
      transform: 'translate(-50%, -50%) scale(1)'
    },
    { 
      width: '60px', 
      height: '60px', 
      opacity: 0.8,
      transform: 'translate(-50%, -50%) scale(1)',
      offset: 0.3
    },
    { 
      width: '100px', 
      height: '100px', 
      opacity: 0,
      transform: 'translate(-50%, -50%) scale(1)'
    }
  ], {
    duration: 400,
    easing: 'ease-out'
  })
  
  // Créer des lignes radiales pour simuler des fissures/cracks
  for (let i = 0; i < 6; i++) {
    const crackElement = document.createElement('div')
    const angle = (i * 60) * Math.PI / 180 // 60 degrés entre chaque ligne
    const length = 30 + Math.random() * 20
    
    crackElement.style.cssText = `
      position: fixed;
      left: ${clickX}px;
      top: ${clickY}px;
      width: ${length}px;
      height: 2px;
      background: linear-gradient(to right, rgba(255,255,255,0.8), transparent);
      transform: translate(-50%, -50%) rotate(${i * 60}deg);
      transform-origin: left center;
      pointer-events: none;
      z-index: 9998;
    `
    
    document.body.appendChild(crackElement)
    
    crackElement.animate([
      { 
        width: '0px',
        opacity: 1
      },
      { 
        width: `${length}px`,
        opacity: 0.6,
        offset: 0.4
      },
      { 
        width: `${length}px`,
        opacity: 0
      }
    ], {
      duration: 500,
      easing: 'ease-out'
    })
    
    setTimeout(() => {
      if (crackElement.parentNode) {
        crackElement.remove()
      }
    }, 500)
  }
  
  // Créer des particules d'étoiles autour du point d'impact
  for (let i = 0; i < 8; i++) {
    const particleElement = document.createElement('div')
    particleElement.textContent = '✨'
    const angle = (i * 45) * Math.PI / 180 // 45 degrés entre chaque particule
    const distance = 40 + Math.random() * 30
    
    particleElement.style.cssText = `
      position: fixed;
      left: ${clickX}px;
      top: ${clickY}px;
      font-size: 16px;
      pointer-events: none;
      z-index: 9997;
      transform: translate(-50%, -50%);
      user-select: none;
    `
    
    document.body.appendChild(particleElement)
    
    particleElement.animate([
      { 
        opacity: 0,
        transform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
      },
      { 
        opacity: 1,
        transform: `translate(-50%, -50%) scale(1) rotate(180deg)`,
        offset: 0.2
      },
      { 
        opacity: 0,
        transform: `translate(${Math.cos(angle) * distance - 50}%, ${Math.sin(angle) * distance - 50}%) scale(0.5) rotate(360deg)`,
      }
    ], {
      duration: 800,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    })
    
    setTimeout(() => {
      if (particleElement.parentNode) {
        particleElement.remove()
      }
    }, 800)
  }
  
  setTimeout(() => {
    if (impactElement.parentNode) {
      impactElement.remove()
    }
  }, 400)
}

// Accumulateur pour les clics time_stop (calcul local)
let timeStopClickAccumulator = 0
let timeStopClickCount = 0

// Variable pour accumuler les gains affichés pendant time_stop
const timeStopGainsAccumulator = ref(0)

// Fonction pour calculer les gains locaux pendant time_stop
const calculateTimeStopGains = () => {
  if (!isTimeStopActive.value) {
    return 0
  }
  
  // Utiliser le revenu figé stocké localement
  const frozenEffectiveIncome = frozenIncome.value || 0
  
  // Calculer le multiplicateur basé sur le talent Temporelle
  let multiplier = 0.25 // Valeur par défaut si pas trouvé
  try {
    const slots = team.value?.slots || []
    for (const s of slots) {
      const id = s?.especeId
      if (!id) continue
      const sp = especies.value?.[id]
      const talentName = sp?.talent
      if (talentName === 'Temporelle') {
        const calc = talents.value?.[talentName]?.calculation
        if (calc && Array.isArray(calc.effects)) {
          const p = poules.value?.find(pp => pp.especeId === id)
          const niveau = Math.max(1, Number(p?.niveauTalent) || 1)
          const ctx = { niveau }
          for (const eff of calc.effects) {
            if (!eff || eff.type !== 'time_stop_buff') continue
            const clickMultBase = eff.click_multiplier_base
            if (clickMultBase != null) {
              multiplier = Number(evalExpr(clickMultBase, ctx)) || 0.25
              break
            }
          }
        }
        break // On prend la première poule Temporelle trouvée
      }
    }
  } catch (e) {
    console.error('Error calculating time_stop multiplier:', e)
  }
  
  
  // Calculer les gains pour ce clic: revenu figé * multiplicateur
  const gainsForThisClick = Math.round(frozenEffectiveIncome * multiplier)
  
  
  return Math.max(1, gainsForThisClick) // Minimum 1 œuf
}

// Fonction pour envoyer les clics accumulés au serveur
const flushTimeStopClicks = async () => {
  if (timeStopClickAccumulator <= 0) return
  
  try {
    const response = await fetch('/api/egg/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        timeStopBatch: {
          totalEggs: timeStopClickAccumulator,
          clickCount: timeStopClickCount
        }
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      // Mettre à jour les œufs totaux depuis la réponse
      if (result.totalEggs !== undefined) {
        setEggs(Number(result.totalEggs))
      }
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi des clics time_stop:', error)
  }
  
  // Réinitialiser l'accumulateur
  timeStopClickAccumulator = 0
  timeStopClickCount = 0
}

const handleEggClick = async (event) => {
  console.log('handleEggClick called, isTimeStopActive:', isTimeStopActive.value, 'event:', event)
  // Pendant time_stop, permettre TOUJOURS les clics (spam-clic)
  if (!isTimeStopActive.value && !isClickable.value) {
    return
  }
  
  // Son d'œuf cliqué
  eggClick()
  
  let eggsGained = 0
  
  if (isTimeStopActive.value) {
    // Mode time_stop: calcul local pour éviter les appels API répétés
    eggsGained = calculateTimeStopGains()
    console.log('Time stop click: eggsGained =', eggsGained, 'event =', event)
    
    // Accumuler les clics
    timeStopClickAccumulator += eggsGained
    timeStopClickCount++
    
    // Accumuler les gains pour l'affichage final
    timeStopGainsAccumulator.value += eggsGained
    
    // Créer l'effet visuel spécial time_stop à la position du clic
    if (event && eggsGained > 0) {
      console.log('Creating time stop click effects')
      // Effet d'impact supprimé
      
      // Ajouter l'effet d'impact au point de clic
      createTimeStopClickEffect(event.clientX, event.clientY)
    }
    
    // Mettre à jour l'affichage local des œufs (estimation)
    setEggs(eggs.value + eggsGained)
    
    // Programmer l'envoi au serveur si pas déjà programmé
    if (!window.timeStopFlushTimeout) {
      window.timeStopFlushTimeout = setTimeout(async () => {
        await flushTimeStopClicks()
        window.timeStopFlushTimeout = null
      }, 1000) // Envoi différé de 1 seconde
    }
    
    return // Sortir tôt pour éviter l'appel API normal
  }
  
  // Mode normal : appel API classique
  const result = await clickEgg()
  
  // Si l'API a échoué, pas besoin de restaurer car useEgg gère maintenant l'état
  if (!result) {
    return
  }
  
  // Déterminer les œufs gagnés selon le mode
  if (result.timeStop || result.timeStopClick) {
    // Pendant time_stop, utiliser la valeur retournée par le serveur
    eggsGained = result.eggsGained || 0
  } else {
    // Mode normal : utiliser les gains retournés par l'API
    eggsGained = result.eggsGained || Math.round(currentGains.value)
  }
  
  // Créer l'effet visuel
  if (eggsGained > 0) {
    if (isTimeStopActive.value) {
      // Pendant time_stop, les effets sont accumulés pour la fin
      // Ne rien afficher ici
    } else {
      // Effet normal: œufs qui sautent
      createEggEffect(eggsGained)
    }
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
  try {
    // Si la réponse contient le totalEggs à jour, évitons un fetch supplémentaire
    if (typeof result.totalEggs === 'number') {
      setEggs(Number(result.totalEggs))
    } else {
      await refreshPlayer()
    }
  } catch (_) {
    await refreshPlayer()
  }
}

// Le mini-jeu de minage est maintenant géré globalement depuis BottomBar / App.vue

onMounted(async () => {
  // S'assurer que l'équipe est à jour pour les stats
  await fetchTeam()
  // startUpdates fera un fetchEggStatus immédiat
  await fetchBuffs()
  startUpdates()
  
  // Écouter les changements du mode apocalypse
  if (typeof window !== 'undefined') {
    window.addEventListener('apocalypse-mode-changed', () => {
      console.log('Production.vue - apocalypse mode changed, refreshing player')
      refreshPlayer()
    })
  }
  
  // Rafraîchir les buffs périodiquement (toutes les 15s); le compte à rebours est calculé en local
  const BUFFS_REFRESH_MS = 15000
  if (typeof window !== 'undefined') {
    window.__buffsInterval && clearInterval(window.__buffsInterval)
    window.__buffsInterval = setInterval(() => { fetchBuffs() }, BUFFS_REFRESH_MS)
  }

  // Rafraîchir les cooldowns des talents actifs périodiquement (toutes les 5s)
  const COOLDOWNS_REFRESH_MS = 5000
  if (typeof window !== 'undefined') {
    window.__cooldownsInterval && clearInterval(window.__cooldownsInterval)
    window.__cooldownsInterval = setInterval(() => { fetchEggStatus() }, COOLDOWNS_REFRESH_MS)
  }
})

onUnmounted(() => {
  stopUpdates()
  if (typeof window !== 'undefined') {
    window.removeEventListener('apocalypse-mode-changed', () => {
      console.log('Production.vue - apocalypse mode changed, refreshing player')
      refreshPlayer()
    })
  }
  if (typeof window !== 'undefined' && window.__buffsInterval) {
    clearInterval(window.__buffsInterval)
    window.__buffsInterval = null
  }
  if (typeof window !== 'undefined' && window.__cooldownsInterval) {
    clearInterval(window.__cooldownsInterval)
    window.__cooldownsInterval = null
  }
  // S'assurer que les clics time_stop accumulés sont envoyés avant de quitter
  if (typeof window !== 'undefined' && window.timeStopFlushTimeout) {
    clearTimeout(window.timeStopFlushTimeout)
    flushTimeStopClicks()
  }
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

// Watcher pour déboguer displayedIncome
watch(() => displayedIncome.value, (nv, ov) => {
  //console.log('displayedIncome changed from', ov, 'to', nv, 'formatIncome(nv):', formatIncome(nv))
})

// Watcher pour jouer le son time_stop à l'activation
watch(() => isTimeStopActive.value, (nv, ov) => {
  if (nv && !ov) {
    timeStop()
    // Réinitialiser l'accumulateur des gains affichés au début du time_stop
    timeStopGainsAccumulator.value = 0
  } else if (!nv && ov) {
    // Time_stop vient de se terminer, envoyer les clics accumulés immédiatement
    if (window.timeStopFlushTimeout) {
      clearTimeout(window.timeStopFlushTimeout)
      window.timeStopFlushTimeout = null
    }
    flushTimeStopClicks()
    // Ajouter l'effet d'explosion de l'oeuf à la fin du time_stop
    createTimeStopEndExplosion()
  }
})


</script>

<style scoped>
.production-screen {
  flex: 1;
  width: 100%;
  background: url('@/assets/background/main/1.png') no-repeat center center;
  background-size: cover;
  overflow: hidden;
  position: relative;
  font-family: 'Fredoka', sans-serif;
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
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  cursor: url('@/assets/ui/cursor/mark_question.png') 0 0, auto;
  transition: all 0.3s ease;
  animation: buff-pulse 3s infinite ease-in-out;
  position: relative;
}

.buff-duration-ring {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 8px;
  font-weight: bold;
  padding: 1px 3px;
  border-radius: 8px;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8);
  font-family: 'Courier New', monospace;
  z-index: 15;
}

.buff-short {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 8px;
  font-weight: bold;
  padding: 1px 3px;
  border-radius: 8px;
  white-space: nowrap;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.8);
  font-family: 'Courier New', monospace;
  z-index: 15;
  pointer-events: none;
}

.buff-badge:hover {
  transform: scale(1.15);
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  animation-play-state: paused;
}

.buff-badge:hover .buff-duration-ring {
  opacity: 0.8;
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

.team-stats-banner .stat-chip.buffed {
  color: #c99100;
  font-weight: 700;
}

.team-stats-banner .stat-chip.debuffed {
  color: #cc0000;
  font-weight: 700;
}

.mining-icon {
  background: linear-gradient(135deg, #8b6914, #a17e1a);
  border: 2px solid #ffc66e;
  border-radius: 10px;
  padding: 4px 8px;
  font-size: 20px;  
  cursor: url('@/assets/ui/cursor/hand_point_n.png') 0 0, auto;
  transition: all 0.2s ease;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.mining-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 105, 20, 0.4);
  background: linear-gradient(135deg, #a17e1a, #c99100);
}

.mining-icon:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(139, 105, 20, 0.4);
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

/* Mode APOCALYPSE */
.production-screen.apocalypse-mode {
  background: url('@/assets/hardcore/background/1.png') no-repeat center center !important;
  background-size: cover !important;
  position: relative;
}

.production-screen.apocalypse-mode::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: 60px 60px, 80px 80px, 100px 100px, 40px 40px, 40px 40px, 40px 40px, 40px 40px;
  background-position: 0 0, 0 0, 0 0, 0 0, 20px 20px, 20px -20px, -20px 20px;
  animation: apocalypse-bg-shift 25s linear infinite, apocalypse-bg-pulse 4s ease-in-out infinite alternate;
  pointer-events: none;
  z-index: 0;
}

.production-screen.apocalypse-mode .production-content {
  position: relative;
  z-index: 2;
}

.production-screen.apocalypse-mode .egg-clicker {
  background-color: #2a0a00;
  border-color: #660000;
  box-shadow: 0 -4px 10px rgba(102, 0, 0, 0.25);
}

.production-screen.apocalypse-mode .gains-display {
  background: rgba(42, 10, 0, 0.95);
  border-color: #660000;
}

.production-screen.apocalypse-mode .gains-progress {
  background: #8b0000;
}

.production-screen.apocalypse-mode .gains-text {
  color: #ff6666;
}

.production-screen.apocalypse-mode .income-rate {
  background: #330000;
  border-color: #660000;
  color: #ffaaaa;
}

.production-screen.apocalypse-mode .egg-sprite {
  filter: brightness(0.7) contrast(1.2) hue-rotate(0deg) saturate(0.8);
  animation: apocalypse-egg-pulse 3s infinite ease-in-out;
}

.production-screen.apocalypse-mode .clickable-egg.clickable:hover {
  transform: scale(1.15);
  filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.6));
}

/* Mode SOMBRE */
.dark-mode .production-screen {
  background: url('@/assets/background/main/1.png') no-repeat center center;
  background-size: cover;
  filter: brightness(0.75) contrast(1.2) saturate(0.8);
}

.dark-mode .egg-clicker {
  background-color: #1a1a1a;
  border-color: #444444;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.5);
}

.dark-mode .gains-display {
  background: rgba(26, 26, 26, 0.95);
  border-color: #555555;
}

.dark-mode .gains-bar {
  background: #2a2a2a;
  border-color: #666666;
}

.dark-mode .gains-progress {
  background: #666666;
}

.dark-mode .gains-text {
  color: #cccccc;
}

.dark-mode .income-rate {
  background: #1a1a1a;
  border-color: #444444;
  color: #aaaaaa;
}

.dark-mode .team-stats-banner {
  color: #cccccc;
  text-shadow: 0 1px 0 #000;
}

.dark-mode .team-stats-banner .stat-chip {
  background: rgba(26, 26, 26, 0.8);
  border-color: #666666;
  color: #cccccc;
}

.dark-mode .team-stats-banner .stat-chip.buffed {
  color: #ffd700;
}

@keyframes apocalypse-egg-pulse {
  0%, 100% { 
    transform: scale(1);
    filter: brightness(0.7) contrast(1.2) hue-rotate(0deg) saturate(0.8);
  }
  50% { 
    transform: scale(1.05);
    filter: brightness(0.8) contrast(1.3) hue-rotate(5deg) saturate(0.9);
  }
}

@keyframes apocalypse-egg-pulse {
  0%, 100% { 
    transform: scale(1);
    filter: brightness(0.7) contrast(1.2) hue-rotate(0deg) saturate(0.8);
  }
  50% { 
    transform: scale(1.05);
    filter: brightness(0.8) contrast(1.3) hue-rotate(5deg) saturate(0.9);
  }
}

@keyframes apocalypse-bg-shift {
  0% {
    background-position: 0 0, 0 0, 0 0, 0 0, 20px 20px, 20px -20px, -20px 20px;
  }
  100% {
    background-position: 60px 60px, 80px 80px, 100px 100px, 40px 40px, 60px 60px, 60px 20px, 20px 60px;
  }
}

@keyframes apocalypse-bg-pulse {
  0% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* Mode TIME_STOP */
.production-screen.time-stop-active {
  filter: sepia(0.3) saturate(1.2) brightness(1.1) contrast(1.1);
}

.production-screen.time-stop-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(1px);
  z-index: 1;
}

.production-screen.time-stop-active .production-content {
  position: relative;
  z-index: 2;
}

.production-screen.time-stop-active .clickable-egg {
  transform: scale(3);
  filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.8));
}

.production-screen.time-stop-active .egg-sprite {
  animation: time-stop-egg-glow 2s infinite alternate;
}

@keyframes time-stop-egg-glow {
  0% { 
    filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.4));
    transform: scale(1);
  }
  100% { 
    filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.8));
    transform: scale(1.05);
  }
}

/* Animation pour les cercles d'impact pendant time_stop */
@keyframes time-stop-impact {
  0% {
    width: 20px;
    height: 20px;
    opacity: 1;
    border-width: 3px;
  }
  50% {
    width: 120px;
    height: 120px;
    opacity: 0.8;
    border-width: 2px;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
    border-width: 1px;
  }
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
