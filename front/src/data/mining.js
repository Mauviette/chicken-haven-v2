// Configuration du mini-jeu de minage (côté frontend)
// Ces données servent de fallback. La source de vérité est côté serveur (sharedGameData)
// Le module expose `MINING_CONFIG` qui lit dynamiquement dans window.__gameDataCache.mining
// si celui-ci est présent. Il lance aussi une tentative asynchrone pour récupérer
// `/api/game-data/mining` afin d'initialiser le cache côté client.

import { apiGet } from '@/utils/api'

const fallback = {
  gridSize: 5,
  defaultHP: 3,
  tools: {
    shovel: {
      name: 'Pelle',
      icon: '�',
      desc: 'Inflige 3 dégâts sur une case',
      damage: 3,
      pattern: 'single'
    },
    pickaxe: {
      name: 'Pioche',
      icon: '⛏️',
      desc: 'Inflige 2 dégâts sur la case ciblée et 1 dégât sur les cases adjacentes',
      damage: 2,
      pattern: 'cross'
    },
    hammer: {
      name: 'Marteau',
      icon: '🔨',
      desc: 'Inflige 3 dégâts au centre et 1 dégât aux cases voisines (3x3)',
      damage: 1,
      pattern: 'square'
    }
  },
  rewardTypes: {
    eggs: { name: 'Œufs', icon: '🥚', color: '#fff9e5' },
    mining_token: { name: 'Jeton de minage', icon: '🪨', color: '#8b6914' },
    stock_token: { name: 'Jeton de stock', icon: '📦', color: '#7a3e10' },
    production_token: { name: 'Jeton de production', icon: '⚙️', color: '#ffc66e' },
    chest_key: { name: 'Clé à coffre', icon: '🗝️', color: '#b8860b' },
    precious_stone: { name: 'Pierre précieuse', icon: '💎', color: '#9370db' }
  },
  cellStates: {
    intact: { hp: 3, backgroundColor: '#8b6914', borderColor: '#a17e1a', description: 'Case intacte' },
    crackedLight: { hp: 2, backgroundColor: '#8b6914', borderColor: '#a17e1a', description: 'Légères fissures' },
    crackedHeavy: { hp: 1, backgroundColor: '#8b6914', borderColor: '#a17e1a', description: 'Lourdes fissures' },
    dug: { hp: 0, backgroundColor: '#5a4a3a', borderColor: '#4a3a2a', description: 'Case creusée' }
  }
}

// Helper pour lire le mining config synchronisé si disponible
function getCachedMining() {
  try {
    if (typeof window !== 'undefined' && window.__gameDataCache && window.__gameDataCache.mining) {
      return window.__gameDataCache.mining
    }
  } catch (_) {}
  return null
}

// Proxy pour retourner les valeurs depuis le cache (si présent) ou depuis le fallback
export const MINING_CONFIG = new Proxy(fallback, {
  get(target, prop) {
    const cached = getCachedMining()
    if (cached && Object.prototype.hasOwnProperty.call(cached, prop)) {
      return cached[prop]
    }
    return target[prop]
  }
})

// Tenter de synchroniser la config mining depuis l'API si le cache n'est pas présent
export async function syncMiningConfig() {
  try {
    if (typeof window === 'undefined') return
    if (getCachedMining()) return
    const res = await apiGet('/api/game-data/mining')
    // l'endpoint renvoie { success: true, category, data, version } per gameData.controller
    if (res && res.success && res.data) {
      window.__gameDataCache = window.__gameDataCache || {}
      window.__gameDataCache.mining = res.data
    } else if (res && res.category && res.data) {
      // fallback au cas où l'API renvoie la forme category/data
      window.__gameDataCache = window.__gameDataCache || {}
      window.__gameDataCache.mining = res.data
    }
  } catch (err) {
    // ignore network errors — on utilise le fallback
  }
}

// Lancer la tentative asynchrone sans attendre
void syncMiningConfig()

// Fonction utilitaire pour formater une récompense
export function formatReward(reward) {
  if (!reward) return ''
  const [type, amount] = reward.split(':')
  const config = MINING_CONFIG.rewardTypes[type]
  if (!config) return `❓ ${amount}`
  return `${config.icon} ${amount}`
}

// Fonction utilitaire pour obtenir l'icône d'un outil
export function getToolIcon(toolType) {
  const tool = MINING_CONFIG.tools[toolType]
  return tool ? tool.icon : '🔧'
}

// Fonction utilitaire pour obtenir le nom d'un outil
export function getToolName(toolType) {
  const tool = MINING_CONFIG.tools[toolType]
  return tool ? tool.name : 'Outil inconnu'
}
