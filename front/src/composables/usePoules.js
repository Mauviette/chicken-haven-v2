import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
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
    if (poule.owned) return 1
    // 2) ou bien déjà équipée dans l'équipe (juste après un equip avant refresh poules)
    try {
      const slots = Array.isArray(window.__teamSlotsCached) ? window.__teamSlotsCached : []
      if (slots.some(s => s?.especeId === poule.especeId)) return 1
    } catch (_) {}
  }
  return poule.niveauTalent || 0
}

function isTalentUnlocked(poule) {
  // Le talent est débloqué si la poule est possédée (owned: true)
  return poule && poule.owned
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

  // Seulement utiliser les hooks si on est dans un contexte de composant
  if (typeof getCurrentInstance === 'function' && getCurrentInstance()) {
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
  }

  const poules = computed(() => {
    // Accéder correctement aux données d'espèces
    const especiesData = especies.value || {}
    return Object.keys(especiesData).map((id) => {
      const fromServer = rawPoules.value.find((p) => p.especeId === id)
      if (fromServer) {
        // Poule possédée : ajouter le flag owned: true
        return {
          ...fromServer,
          owned: true
        }
      } else {
        // Poule jamais débloquée : créer un objet par défaut avec owned: false
        return {
          especeId: id,
          quantite: 0,
          niveauTalent: 0,
          statutEnergie: { etat: 'non_obtenue' },
          posteOccupe: null,
          owned: false
        }
      }
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
      // Utiliser la rareté de la poule au lieu de nivType
      const rarete = especies.value?.[poule.especeId]?.rarete || 'commune'
      const table = talentLevelUpgradeCost.value || null
      if (!table || !table[rarete]) return null
      const current = Number(poule.niveauTalent || 1)
      const next = current + 1
      const limit = Number(table[rarete].limit || 0)
      if (limit && next > limit) return { maxed: true }
      const egg_cost = table[rarete].egg_cost?.[current - 1]
      const chicken_cost = table[rarete].chicken_cost?.[current - 1]
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
      
      // Rafraîchir les succès car l'amélioration peut débloquer des succès de niveau
      try {
        const { fetchAchievements } = await import('./useAchievements.js')
        await fetchAchievements()
      } catch (achievementError) {
        console.warn('Erreur rafraîchissement succès après upgrade:', achievementError)
      }
      
      // Émettre un événement pour le système d'achievements
      window.dispatchEvent(new CustomEvent('chicken-upgraded', { detail: { especeId: poule.especeId } }))
      
      // Toast avec nom de la poule et niveau
      const pouleName = getNom(poule.especeId)
      const newLevel = data.poule?.niveauTalent || (poule.niveauTalent + 1)
      window.$toast?.(`${pouleName} améliorée au niveau ${getTalentLevelRoman({ niveauTalent: newLevel })} !`, 'upgrade')
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
      const tInfo = talentsData[talentName]
      
      // Utiliser le champ 'effet' et interpréter les templates
      if (tInfo && tInfo.effet) {
        let effet = tInfo.effet
        
        // Si c'est encore une fonction (cas de développement local), l'appeler
        if (typeof effet === 'function') {
          return effet(niveau)
        }
        
        // Sinon, interpréter le template de chaîne de caractères
        if (typeof effet === 'string') {
          // Remplacer {niveau} par la valeur actuelle
          effet = effet.replace(/\{niveau\}/g, niveau)
          
          // Évaluer les expressions mathématiques simples comme {niveau*0.2}
          effet = effet.replace(/\{([^}]+)\}/g, (match, expr) => {
            try {
              // Remplacer 'niveau' par sa valeur dans l'expression
              const cleanExpr = expr.replace(/niveau/g, niveau)
              // Évaluer l'expression mathématique simple (seulement +, -, *, /, parenthèses et nombres)
              if (/^[\d+\-*/.() ]+$/.test(cleanExpr)) {
                const result = Function('"use strict"; return (' + cleanExpr + ')')()
                // Formatter le résultat (garder 1 décimale si nécessaire)
                return Number.isInteger(result) ? result.toString() : result.toFixed(1)
              }
              return match // Garder l'expression originale si elle ne peut pas être évaluée
            } catch (e) {
              return match // Garder l'expression originale en cas d'erreur
            }
          })
          
          return effet
        }
      }
      
      // Fallback: utiliser la description si pas d'effet défini
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

  function getDescription(poule) {
    const especiesData = especies.value || {};
    if (!poule || !poule.especeId) return '???';
    const espece = especiesData[poule.especeId];
    return espece?.description || '???';
  }

  return {
    poules,
    loading,
    especies,
    talents,
    getNom,
    getImage,
    getTalent,
    getCategorie,
    hiddenImage,
  fetchPoules: fetchPoulesSingleton,
  refreshPoules: fetchPoulesSingleton, // Alias pour compatibilité
  clearNew,
    getTalentInfo: getTalentInfoLocal,
    getTalentLevel,
    canUpgradeTalent,
    upgradeTalent,
    getTalentEffect,
    getIcon,
    getTalentDisplayName,
    getTalentLevelRoman,
  getTalentNextCost,
    getTalentEffectSync,
    getTalentDisplayNameSync,
    getDescription
  }
}
