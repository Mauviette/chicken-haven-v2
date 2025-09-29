import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameData } from './useGameData.js'
import { usePlayer } from './usePlayer.js'
import { apiGet, apiPost, apiPut } from '@/utils/api.js'

const chickenImages = import.meta.glob('@/assets/chickens/**/basic.png', { eager: true })
const hiddenImage = chickenImages['/src/assets/chickens/hidden/basic.png']?.default || ''

// NOTE: Toutes les données d'espèces et de talents doivent désormais provenir de useGameData()

// Méthodes pour le système de talents (utilise les données synchronisées)
function getTalentLevel(poule) {
  if (!poule) return 0
  // Si la poule est possédée mais que le niveau n'est pas encore connu côté client, assumer niveau 1
  const missingOrZero = (poule.niveauTalent == null || poule.niveauTalent === 0)
  if (missingOrZero) {
    // 1) possédée: niveau 1 par défaut
    if (poule.quantite > 0) return 1
    // 2) ou bien déjà équipée dans l'équipe (juste après un equip avant refresh poules)
    try {
      const slots = Array.isArray(window.__teamSlotsCached) ? window.__teamSlotsCached : []
      if (slots.some(s => s?.especeId === poule.especeId)) return 1
    } catch (_) {}
  }
  return poule.niveauTalent || 0
}

function isTalentUnlocked(poule) {
  // Pour l'instant, considérons que le talent est débloqué si la poule est possédée
  return poule && poule.quantite > 0
}

export function getTalentLevelRoman(poule) {
  const niveau = getTalentLevel(poule)
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']
  return romanNumerals[niveau - 1] || '???'
}

// Fonctions exportées reposant sur les données synchronisées
export function getTalentEffect(poule) {
  // Délègue à la version synchronisée
  return getTalentEffectSync(poule)
}

// Fonction utilitaire pour récupérer l'icône d'un talent depuis les données synchronisées
export function getIcon(talentName) {
  try {
    const { talents } = useGameData()
    const talentInfo = (talents.value || {})[talentName]
    return talentInfo?.icon || ''
  } catch (error) {
    console.error('Erreur getIcon:', error)
    return ''
  }
}

export function getTalentDisplayName(poule) {
  // Délègue à la version synchronisée
  return getTalentDisplayNameSync(poule)
}

// Singleton d'état partagé entre tous les appels à usePoules()
const rawPoules = ref([])
const loading = ref(true)

async function fetchPoulesSingleton() {
  try {
    // Ne pas appeler l'API si l'utilisateur n'est pas connecté
    const token = localStorage.getItem('token')
    if (!token) {
      rawPoules.value = []
      return
    }
    const data = await apiGet('/api/poules')
    rawPoules.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Erreur chargement poules:', err)
  } finally {
    loading.value = false
  }
}

export function usePoules() {
  // Utiliser les données synchronisées
  const { especies, talents, getEspeceInfo, getTalentInfo, talentLevelUpgradeCost } = useGameData()
  const { refreshPlayer } = usePlayer()
  // Helper local (évite import circulaire avec useAuth)
  const isLoggedIn = () => !!localStorage.getItem('token')

  // Charger une seule fois (les montages suivants ne rechargeront pas si déjà fait)
  const onLogin = () => {
    fetchPoulesSingleton()
  }
  const onLogout = () => {
    rawPoules.value = []
    loading.value = false
  }

  onMounted(() => {
    // Charge seulement si connecté
    if (isLoggedIn() && (!rawPoules.value || rawPoules.value.length === 0)) {
      fetchPoulesSingleton()
    } else if (!isLoggedIn()) {
      // Pas connecté: pas d'appel réseau et pas d'état de chargement bloqué
      loading.value = false
    }

    // Écoute les événements globaux pour réagir aux changements d'auth
    try {
      window.addEventListener('auth-login', onLogin)
      window.addEventListener('auth-logout', onLogout)
    } catch (_) {}
  })

  onUnmounted(() => {
    try {
      window.removeEventListener('auth-login', onLogin)
      window.removeEventListener('auth-logout', onLogout)
    } catch (_) {}
  })

  const poules = computed(() => {
    // Accéder correctement aux données d'espèces
    const especiesData = especies.value || {}
    return Object.keys(especiesData).map((id) => {
      const fromServer = rawPoules.value.find((p) => p.especeId === id)
      return (
        fromServer || {
          especeId: id,
          quantite: 0,
          niveauTalent: 0,
          statutEnergie: { etat: 'non_obtenue' },
          posteOccupe: null,
        }
      )
    })
  })

  function getImage(id) {
    const especiesData = especies.value || {}
    const espece = especiesData[id]
    if (espece?.image) {
      // Convertir le chemin backend vers le chemin frontend
      const frontendPath = `/src/assets/${espece.image}`
      return chickenImages[frontendPath]?.default || hiddenImage
    }
    return hiddenImage
  }

  function getNom(id) {
    const especiesData = especies.value || {}
    const espece = especiesData[id]
    return espece?.nom || '???'
  }

  function getTalent(id) {
    const especiesData = especies.value || {}
    const espece = especiesData[id]
    return espece?.talent || '???'
  }

  function getCategorie(id) {
    const especiesData = especies.value || {}
    const espece = especiesData[id]
    return espece?.categorie || '???'
  }

  // Fonctions locales du composable pour les talents
  function getTalentInfoLocal(talentName) {
    const talentsData = talents.value || {}
    return talentsData[talentName] || null
  }

  function canUpgradeTalent(poule) {
    if (!isTalentUnlocked(poule)) return false
    const cost = getTalentNextCost(poule)
    if (!cost || cost.maxed) return false
    return true
  }

  // Calcule le coût courant côté client selon gameData (pour affichage)
  function getTalentNextCost(poule) {
    try {
      const tName = (especies.value?.[poule.especeId]?.talent) || null
      const tInfo = talents.value?.[tName] || {}
      const nivType = tInfo?.nivType || 'basic'
      const table = talentLevelUpgradeCost.value || null
      if (!table || !table[nivType]) return null
      const current = Number(poule.niveauTalent || 1)
      const next = current + 1
      const limit = Number(table[nivType].limit || 0)
      if (limit && next > limit) return { maxed: true }
      const egg_cost = table[nivType].egg_cost?.[current - 1]
      const chicken_cost = table[nivType].chicken_cost?.[current - 1]
      if (egg_cost == null || chicken_cost == null) return null
      return { egg_cost: Number(egg_cost), chicken_cost: Number(chicken_cost) }
    } catch (_) { return null }
  }

  async function upgradeTalent(poule) {
    try {
      if (!canUpgradeTalent(poule)) return false
      const data = await apiPost('/api/talent/upgrade', { especeId: poule.especeId })
      if (!data?.success) {
        window.$toast?.(data?.error || 'Amélioration impossible', 'error')
        return false
      }
      // appliquer retour serveur
      const idx = rawPoules.value.findIndex(p => p.especeId === poule.especeId)
      if (idx !== -1) rawPoules.value[idx] = { ...rawPoules.value[idx], ...data.poule }
      await refreshPlayer()
      window.$toast?.('Talent amélioré !', 'success')
      return true
    } catch (e) {
      console.error('upgradeTalent client error:', e)
      window.$toast?.('Erreur réseau', 'error')
      return false
    }
  }

  // Efface le flag "new" pour une espèce donnée (réactif + persistance best-effort)
  async function clearNew(especeId) {
    if (!especeId) return
    const idx = rawPoules.value.findIndex(p => p.especeId === especeId)
    if (idx !== -1 && rawPoules.value[idx]?.new) {
      rawPoules.value[idx] = { ...rawPoules.value[idx], new: false }
    }
    try {
      await apiPut(`/api/poules/${encodeURIComponent(especeId)}`, { new: false })
    } catch (_) { /* best-effort */ }
  }

  // Versions composable des fonctions de talent (utilisent les données synchronisées)
  function getTalentEffectSync(poule) {
    if (!poule || !poule.especeId) return '???'
    try {
      const especiesData = especies.value || {}
      const talentsData = talents.value || {}
      const espece = especiesData[poule.especeId]
      const niveau = getTalentLevel(poule)
      const talentName = espece?.talent
      const calc = talentsData[talentName]?.calculation

      // Petit évaluateur d'expressions (miroir minimal du serveur)
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

      // 1) Essayer d'interpréter un bonus de revenu passif (Énergétique) via le DSL
      if (calc && Array.isArray(calc.effects)) {
        const incomeEff = calc.effects.find(e => e?.type === 'income_bonus_per_second')
        if (incomeEff?.amount != null) {
          const perEnergy = evalExpr(incomeEff.amount, { niveau, teamEnergy: 1 })
          const fmt = Number.isInteger(perEnergy) ? `${perEnergy}` : perEnergy.toFixed(1)
          return `+${fmt} de revenu par seconde pour chaque point d'énergie dans l'équipe.`
        }
      }

      // 2) Essayer d'interpréter un stat_buff générique
      if (calc && Array.isArray(calc.effects)) {
        const ctx = { niveau }
        const deltas = { intelligence: 0, energie: 0, charisme: 0 }
        for (const eff of calc.effects) {
          if (!eff || eff.type !== 'stat_buff') continue
          if (eff.target && eff.target !== 'team') continue
          const stats = eff.stats || {}
          for (const key of ['intelligence', 'energie', 'charisme']) {
            if (stats[key] != null) {
              deltas[key] += Number(evalExpr(stats[key], ctx)) || 0
            }
          }
        }
        const parts = []
        if (deltas.intelligence) parts.push(`+${deltas.intelligence} intelligence`)
        if (deltas.energie) parts.push(`+${deltas.energie} énergie`)
        if (deltas.charisme) parts.push(`+${deltas.charisme} charisme`)
        if (parts.length) {
          return `${parts.join(' et ')} à toutes les poules de l'équipe.`
        }
      }

      // 2.b) Talent basé sur une probabilité par œuf: Chanceuse
      // Cherche une condition random_chance et un effet resource eggs
      if (calc) {
        const rc = Array.isArray(calc.conditions)
          ? calc.conditions.find(c => c?.type === 'random_chance')
          : null
        const resEff = Array.isArray(calc.effects)
          ? calc.effects.find(e => e?.type === 'resource' && e?.resource === 'eggs')
          : null
        if (rc && resEff) {
          // pSingle peut être 0..1 (fraction) ou 0..100 (pourcents)
          let p = 0.01
          if (typeof rc.value === 'number' && !Number.isNaN(rc.value)) {
            p = rc.value > 1 ? (rc.value / 100) : rc.value
          }
          const pct = Math.round(p * 100)
          // Montant: souvent niveau * stockageMax -> afficher en fonction du niveau
          // Sans connaître stockageMax côté client, on exprime la formule textuelle
          return `Pour chaque œuf collecté, ${pct}% de chance de gagner stockage max × ${niveau} en œufs.`
        }
      }

      // 3) Sinon, préférer un texte d'effet plutôt que la description
      //    a) Si par exception le backend expose une fonction effet, l'utiliser
      const tInfo = talentsData[talentName]
      if (tInfo && typeof tInfo.effet === 'function') {
        return tInfo.effet(niveau)
      }
      //    b) Fallback local minimal (les fonctions ne sont pas sérialisables côté backend)
      const localEffect = {
        'Chanceuse': (n) => `Pour chaque œuf collecté, 1% de chance de gagner stockage max × ${n} en œufs.`,
        'Énergétique': (n) => `+${(n * 0.2).toFixed(1)} de revenu par seconde pour chaque point d'énergie dans l'équipe.`,
        'Energetique': (n) => `+${(n * 0.2).toFixed(1)} de revenu par seconde pour chaque point d'énergie dans l'équipe.`,
        'Persévérante': (n) => `+${n} énergie et intelligence à toutes les poules de l'équipe.`,
        'Perseverante': (n) => `+${n} énergie et intelligence à toutes les poules de l'équipe.`,
        'Vive': (n) => `Vitesse de mission +${n * 8}%`,
        'Curieuse': (n) => `+${n * 3}% d'événements spéciaux`,
        'Discrète': (n) => `Risque réduit de ${n * 6}%`,
        'Discrete': (n) => `Risque réduit de ${n * 6}%`,
        'Gourmande': (n) => `Consommation -${n * 5}%`,
        'Protectrice': (n) => `Protection +${n * 7}%`,
        'Maligne': (n) => `+${n * 4}% de réussite aux énigmes`,
        'Majestueuse': (n) => `Charisme concours +${n * 6}%`,
        'Rapide': (n) => `Vitesse +${n * 10}%`,
        'Joyeuse': (n) => `Moral +${n * 2}`
      }
      if (talentName && typeof localEffect[talentName] === 'function') {
        return localEffect[talentName](niveau)
      }
      //    c) Dernier recours: description backend
      return (tInfo?.description || '???')
    } catch (error) {
      console.error('Erreur getTalentEffectSync:', error)
      return '???'
    }
  }

  function getTalentDisplayNameSync(poule) {
    try {
      const especiesData = especies.value || {}
      const talentsData = talents.value || {}
      const espece = especiesData[poule.especeId]
      const talentName = espece?.talent
      const talentInfo = talentsData[talentName]
      const icon = talentInfo?.icon || ''
      return `${icon} ${talentName} ${getTalentLevelRoman(poule)}`
    } catch (error) {
      console.error('Erreur getTalentDisplayNameSync:', error)
      return '??? ???'
    }
  }

  return {
    poules,
    loading,
    // Données synchronisées (utilisez useGameData directement pour accéder aux dernières données)
    especies,
    talents,
    // Fonctions utilitaires
    getNom,
    getImage,
    getTalent,
    getCategorie,
    hiddenImage,
  fetchPoules: fetchPoulesSingleton,
  refreshPoules: fetchPoulesSingleton, // Alias pour compatibilité
  clearNew,
    // Système de talents :
    getTalentInfo: getTalentInfoLocal,
    getTalentLevel,
    canUpgradeTalent,
    upgradeTalent,
    getTalentEffect,
    getIcon,
    getTalentDisplayName,
    getTalentLevelRoman,
  getTalentNextCost,
    // Versions synchronisées (à utiliser dans les composants)
    getTalentEffectSync,
    getTalentDisplayNameSync,
  }
}
