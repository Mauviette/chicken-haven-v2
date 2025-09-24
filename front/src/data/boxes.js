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

// Import des groupes depuis le fichier chickens.js pour harmonisation
export { groupes } from './chickens.js'

// Fonction utilitaire pour obtenir toutes les poules possibles d'une boîte
export function getPossibleChickensFromBox(box, especeData, unlockedChickens) {
  const possibleChickens = []
  
  box.dropGroups.forEach(group => {
    // Filtrer les poules du groupe qui sont débloquées
    const groupChickens = Object.keys(especeData)
      .filter(id => especeData[id].groupe === group.name)
      .filter(id => unlockedChickens.includes(id) || especeData[id].groupe === 'fondamental') // Les poules fondamentales sont toujours disponibles
    
    possibleChickens.push(...groupChickens)
  })
  
  // Supprimer les doublons
  return [...new Set(possibleChickens)]
}

// Fonction pour simuler l'ouverture d'une boîte
export function openBoxSimulation(box, especeData, unlockedChickens) {
  const results = []
  
  for (const group of box.dropGroups) {
    // Vérifier si ce groupe drop (basé sur la chance)
    const roll = Math.random() * 100
    if (roll <= group.chance) {
      // Obtenir les poules disponibles pour ce groupe
      const availableChickens = Object.keys(especeData)
        .filter(id => especeData[id].groupe === group.name)
        .filter(id => unlockedChickens.includes(id) || especeData[id].groupe === 'fondamental')
      
      if (availableChickens.length > 0) {
        // Choisir aléatoirement les poules selon la quantité
        for (let i = 0; i < group.quantity; i++) {
          const randomIndex = Math.floor(Math.random() * availableChickens.length)
          results.push({
            chickenId: availableChickens[randomIndex],
            groupName: group.name,
            groupDescription: group.description
          })
        }
      }
    }
  }
  
  return results
}
