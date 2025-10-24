// Données des boîtes de poules
export const boxesData = [
  {
    id: 1,
    name: 'Carton de Base',
    description: 'Contient une poule de base garantie',
    icon: '📦',
    price: {type: 'eggs', count: 25},
    dropGroups: [
      {
        name: 'fondamental',
        chance: 100,
        quantity: 1
      }
    ],
  },
  {
    id: 2,
    name: 'Boîte Brillante',
    description: 'Contient une poule du groupe fondamental, brillant ou discret',
    icon: '✨',
    price: {type: 'eggs', count: 75},
    dropGroups: [
      {
        name: 'fondamental',
        chance: 40,
        quantity: 1
      },
      {
        name: 'brillant',
        chance: 30,
        quantity: 1
      },
      {
        name: 'discret',
        chance: 30,
        quantity: 1
      }
    ],
    unlock_level : 3
  },
  {
    id: 4,
    name: 'Coffret Chic',
    description: 'Contient une poule du groupe chic',
    icon: '💎',
    price: {type: 'eggs', count: 150},
    dropGroups: [
      {
        name: 'chic',
        chance: 100,
        quantity: 1
      }
    ],
    unlock_level : 5
  }
]

// DEPRECATED - Utilisez useGameData() pour les données synchronisées
// import { useGameData } from '@/composables/useGameData.js'

// Import des groupes depuis le fichier chickens.js pour harmonisation (DEPRECATED)
// export { groupes } from './chickens.js'

// Fonction utilitaire pour obtenir toutes les poules possibles d'une boîte (DEPRECATED - utilisez les données synchronisées)
// export function getPossibleChickensFromBox(box, especeData, unlockedChickens) { ... }

// Nouvelle fonction utilisant les données synchronisées
// export function getPossibleChickensFromBoxSync(box, unlockedChickens) {
//   const { especies } = useGameData()
//   return getPossibleChickensFromBox(box, especies.value, unlockedChickens)
// }

// Fonction pour simuler l'ouverture d'une boîte (DEPRECATED - utilisez les données synchronisées)
// export function openBoxSimulation(box, especeData, unlockedChickens) { ... }

// Nouvelle fonction utilisant les données synchronisées
// export function openBoxSimulationSync(box, unlockedChickens) {
//   const { especies } = useGameData()
//   return openBoxSimulation(box, especies.value, unlockedChickens)
// }
