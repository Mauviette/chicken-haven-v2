// Configuration du mini-jeu de minage (côté frontend)
// Ces données sont principalement pour l'affichage et doivent correspondre au backend

export const MINING_CONFIG = {
  gridSize: 5,
  defaultHP: 3,
  
  // Configuration des outils
  tools: {
    shovel: {
      name: 'Pelle',
      icon: '🔨',
      damage: 3,
      pattern: 'single',
      description: 'Inflige 3 dégâts sur une case'
    },
    pickaxe: {
      name: 'Pioche',
      icon: '⛏️',
      damage: 2,
      pattern: 'cross',
      description: 'Inflige 2 dégâts sur la case ciblée et 1 dégât sur les cases adjacentes'
    }
  },

  // Types de récompenses possibles
  rewardTypes: {
    eggs: {
      name: 'Œufs',
      icon: '🥚',
      color: '#fff9e5'
    },
    mining_token: {
      name: 'Jeton de minage',
      icon: '🪨',
      color: '#8b6914'
    },
    stock_token: {
      name: 'Jeton de stock',
      icon: '📦',
      color: '#7a3e10'
    },
    production_token: {
      name: 'Jeton de production',
      icon: '⚡',
      color: '#ffc66e'
    }
  },

  // Visuels des cases selon leur état
  cellStates: {
    intact: {
      hp: 3,
      backgroundColor: '#8b6914',
      borderColor: '#a17e1a',
      description: 'Case intacte'
    },
    crackedLight: {
      hp: 2,
      backgroundColor: '#8b6914',
      borderColor: '#a17e1a',
      description: 'Légères fissures'
    },
    crackedHeavy: {
      hp: 1,
      backgroundColor: '#8b6914',
      borderColor: '#a17e1a',
      description: 'Lourdes fissures'
    },
    dug: {
      hp: 0,
      backgroundColor: '#5a4a3a',
      borderColor: '#4a3a2a',
      description: 'Case creusée'
    }
  }
}

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
