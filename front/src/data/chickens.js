// DEPRECATED - Utilisez useGameData() pour les données synchronisées
import { useGameData } from '@/composables/useGameData.js'

// Export pour compatibilité (DEPRECATED)
export { especeDataLocal as especeData, talentsDataLocal as talentsData } from '@/composables/usePoules.js'

// Fonction pour obtenir les données synchronisées
export function getEspeceData() {
  const { especies } = useGameData()
  return especies.value
}

export function getTalentsData() {
  const { talents } = useGameData()
  return talents.value
}

export function getGroupes() {
  const { groupes } = useGameData()
  return groupes.value
}

// Export des groupes harmonisés avec le back-end (DEPRECATED - utilisez getGroupes())
export const groupes = [
  { name: 'fondamental', description: 'Groupe fondamental', rarityDropChance: [75, 25, 0, 0]},
  { name: 'brillant', description: 'Groupe brillant', rarityDropChance: [75, 25, 0, 0] },
  { name: 'discret', description: 'Groupe discret', rarityDropChance: [75, 25, 0, 0] },
  { name: 'chic', description: 'Groupe chic', rarityDropChance: [75, 20, 5, 0] },
]

// Fonctions utilitaires pour les statistiques de production (utilise les données synchronisées)
export function getProductionStats(especeId) {
  const { getEspeceInfo } = useGameData()
  const espece = getEspeceInfo(especeId)
  
  // Utiliser les statistiques des données synchronisées si disponibles
  if (espece?.statistiques) {
    return espece.statistiques
  }
  
  // Fallback vers les données statiques
  const baseStats = {
    'blanchonette': { ponte: 4, incubation: 4, energie: 5 },
    'poulette-rousse': { ponte: 6, incubation: 3, energie: 4 },
    'noiraude': { ponte: 5, incubation: 3, energie: 4 },
    'argentine': { ponte: 8, incubation: 2, energie: 4 },
    'aubepine': { ponte: 7, incubation: 4, energie: 3 },
    'cendree': { ponte: 5, incubation: 5, energie: 3 },
    'choco': { ponte: 9, incubation: 3, energie: 2 },
    'ecailleuse': { ponte: 12, incubation: 2, energie: 1 },
    'grisette': { ponte: 6, incubation: 4, energie: 4 },
    'queuedepaon': { ponte: 15, incubation: 1, energie: 1 },
    'rayee': { ponte: 10, incubation: 2, energie: 2 },
    'tachetee': { ponte: 7, incubation: 3, energie: 3 }
  }
  
  return baseStats[especeId] || { ponte: 1, incubation: 5, energie: 3 }
}

// Fonctions utilisant les données synchronisées
export function getChickenGroup(especeId) {
  const { getEspeceInfo } = useGameData()
  const espece = getEspeceInfo(especeId)
  return espece?.groupe || 'fondamental'
}

export function getChickenRarity(especeId) {
  const { getEspeceInfo } = useGameData()
  const espece = getEspeceInfo(especeId)
  return espece?.rarete || 'commune'
}
