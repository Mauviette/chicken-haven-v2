/**
 * Composable principal pour la gestion des poules
 * Agrège les sous-modules pour une API unifiée
 */
import { computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { useGameData } from './useGameData.js'
import { usePlayer } from './usePlayer.js'
import { apiPut } from '@/utils/api.js'

// État partagé
import { rawPoules, loading, fetchPoulesSingleton, clearPoules } from './poules/poulesState.js'

// Utilitaires de talents
import { 
  getTalentLevel, 
  isTalentUnlocked, 
  getTalentLevelRoman, 
  evaluateEffectTemplate 
} from './poules/talentUtils.js'

// Gestion des améliorations
import { 
  getTalentNextCost as getTalentNextCostBase, 
  canUpgradeTalent as canUpgradeTalentBase, 
  upgradeTalent as upgradeTalentBase 
} from './poules/talentUpgrade.js'

// Images des poules
const chickenImages = import.meta.glob('@/assets/chickens/**/basic.png', { eager: true })
const hiddenImage = chickenImages['/src/assets/chickens/hidden/basic.png']?.default || ''

// Fonctions exportées globalement (pour compatibilité)
export { getTalentLevelRoman }

export function getTalentEffect(poule) {
  return getTalentEffectSync(poule)
}

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
  return getTalentDisplayNameSync(poule)
}

// Versions synchrones des fonctions de talent
function getTalentEffectSync(poule) {
  if (!poule || !poule.especeId) return '???'
  try {
    const { especies, talents } = useGameData()
    const especiesData = especies.value || {}
    const talentsData = talents.value || {}
    const espece = especiesData[poule.especeId]
    const niveau = getTalentLevel(poule)
    const talentName = espece?.talent
    const tInfo = talentsData[talentName]
    
    if (tInfo && tInfo.effet) {
      let effet = tInfo.effet
      
      // Si c'est encore une fonction, l'appeler
      if (typeof effet === 'function') {
        return effet(niveau)
      }
      
      // Interpréter le template
      if (typeof effet === 'string') {
        return evaluateEffectTemplate(effet, niveau)
      }
    }
    
    return (tInfo?.description || '???')
  } catch (error) {
    console.error('Erreur getTalentEffectSync:', error)
    return '???'
  }
}

function getTalentDisplayNameSync(poule) {
  try {
    const { especies, talents } = useGameData()
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

export function usePoules() {
  const { especies, talents, talentLevelUpgradeCost } = useGameData()
  const { refreshPlayer } = usePlayer()
  
  const isLoggedIn = () => !!localStorage.getItem('token')

  // Gestionnaires d'événements
  const onLogin = () => fetchPoulesSingleton()
  const onLogout = () => clearPoules()

  // Hooks de cycle de vie (seulement dans un composant)
  if (typeof getCurrentInstance === 'function' && getCurrentInstance()) {
    onMounted(() => {
      if (isLoggedIn() && (!rawPoules.value || rawPoules.value.length === 0)) {
        fetchPoulesSingleton()
      } else if (!isLoggedIn()) {
        loading.value = false
      }

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

  // Liste des poules enrichie
  const poules = computed(() => {
    const especiesData = especies.value || {}
    return Object.keys(especiesData).map((id) => {
      const fromServer = rawPoules.value.find((p) => p.especeId === id)
      if (fromServer) {
        return { ...fromServer, owned: true }
      } else {
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

  // Fonctions d'accès aux données
  function getImage(id) {
    const especiesData = especies.value || {}
    const espece = especiesData[id]
    if (espece?.image) {
      const frontendPath = `/src/assets/${espece.image}`
      return chickenImages[frontendPath]?.default || hiddenImage
    }
    return hiddenImage
  }

  function getNom(id) {
    return especies.value?.[id]?.nom || '???'
  }

  function getTalent(id) {
    return especies.value?.[id]?.talent || '???'
  }

  function getCategorie(id) {
    return especies.value?.[id]?.categorie || '???'
  }

  function getDescription(poule) {
    if (!poule || !poule.especeId) return '???'
    return especies.value?.[poule.especeId]?.description || '???'
  }

  function getTalentInfoLocal(talentName) {
    return talents.value?.[talentName] || null
  }

  // Fonctions de talent avec contexte
  function getTalentNextCost(poule) {
    return getTalentNextCostBase(poule, especies.value, talents.value, talentLevelUpgradeCost.value)
  }

  function canUpgradeTalent(poule) {
    return canUpgradeTalentBase(poule, especies.value, talents.value, talentLevelUpgradeCost.value)
  }

  async function upgradeTalent(poule) {
    return upgradeTalentBase(poule, refreshPlayer, getNom, especies.value, talents.value, talentLevelUpgradeCost.value)
  }

  // Efface le flag "new" pour une espèce
  async function clearNew(especeId) {
    if (!especeId) return
    const idx = rawPoules.value.findIndex(p => p.especeId === especeId)
    if (idx !== -1 && rawPoules.value[idx]?.new) {
      rawPoules.value[idx] = { ...rawPoules.value[idx], new: false }
    }
    try {
      await apiPut(`/api/poules/${encodeURIComponent(especeId)}`, { new: false })
    } catch (_) {}
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
    refreshPoules: fetchPoulesSingleton,
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
