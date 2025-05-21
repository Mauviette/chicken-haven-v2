import { ref } from 'vue'

const rawPostes = [
  {
    id: 'couveuse',
    nom: 'Couveuse',
    icone: '🥚',
    stat: 'charisme',
    duree: 10,
    slots: 5,
    recompenses: [
      {
        nom: 'Œufs dorés',
        type: 'resource',
        min: 6,
        max: 10,
        rare: false
      },
      {
        nom: 'Fragment magique',
        type: 'objet',
        min: 1,
        max: 1,
        rare: true,
        chance: 8
      }
    ]
  },
  {
    id: 'pondoir',
    nom: 'Pondoir',
    icone: '🍳',
    stat: 'energie',
    duree: 30,
    slots: 3,
    recompenses: [
      {
        nom: 'Œufs frais',
        type: 'resource',
        min: 8,
        max: 12,
        rare: false
      }
    ]
  },
  {
    id: 'champ',
    nom: 'Champ',
    icone: '🌾',
    stat: 'intelligence',
    duree: 150,
    slots: 1,
    recompenses: [
      {
        nom: 'Plumes légères',
        type: 'resource',
        min: 4,
        max: 6,
        rare: false
      },
      {
        nom: 'Plume ancienne',
        type: 'objet',
        min: 1,
        max: 1,
        rare: true,
        chance: 5
      }
    ]
  }
]

const postesDuJoueur = [
  {
    type: "couveuse",
    slotId: 0,
    especeId: "poulette-rousse",
    dateDebut: "2025-05-18T10:00:00Z",
    dateFin: "2025-05-18T14:00:00Z",
    recompenseDisponible: true,
    recompenses: [  // Inconnu avant la fin de la production
      { type: "oeuf", quantite: 6, rare: false }, 
      { type: "objet", quantite: 1, rare: true }
    ]
  },
  {
    type: "couveuse",
    slotId: 1,
    especeId: null, // slot libre
    dateDebut: null,
    dateFin: null,
    recompenseDisponible: false,
    recompenses: []
  },
  {
    type: "couveuse",
    slotId: 2,
    especeId: "noiraude",
    dateDebut: "2025-05-18T10:00:00Z",
    dateFin: "2025-05-24T14:00:00Z",
    recompenseDisponible: true,
    recompenses: [  // Inconnu avant la fin de la production
      { type: "oeuf", quantite: 6, rare: false }, 
      { type: "objet", quantite: 1, rare: true }
    ]
  },


  {
    type: "pondoir",
    slotId: 0,
    especeId: "argentine",
    dateDebut: "2025-05-21T15:00:00Z",
    dateFin: "2025-05-21T16:00:00Z",
    recompenseDisponible: true,
    recompenses: [  // Inconnu avant la fin de la production
      { type: "oeuf", quantite: 8, rare: false }, 
      { type: "objet", quantite: 1, rare: true }
    ]
  }
]

const postes = ref(rawPostes)
const postesDuJoueurRef = ref(postesDuJoueur)

function getPosteById(id) {
  return postes.value.find(p => p.id === id)
}

// Accès aux postes du joueur
function getPostesDuJoueur() {
  return postesDuJoueurRef.value
}

// Pour modifier les postes du joueur (exemple : assigner une poule)
function setPostesDuJoueur(newPostes) {
  postesDuJoueurRef.value = newPostes
}

function isEnCours(slot) {
  return slot.dateDebut && new Date(slot.dateFin) > new Date()
}

function getTempsRestant(slot) {
  const fin = new Date(slot.dateFin)
  const maintenant = new Date()
  return Math.max(0, fin - maintenant)
}

function getSlotsParType(type) {
  return postesDuJoueurRef.value.filter(s => s.type === type)
}

export function usePost() {
  return {
    postes,
    getPosteById,
    postesDuJoueur: postesDuJoueurRef,
    getPostesDuJoueur,
    setPostesDuJoueur,
    isEnCours,
    getTempsRestant
  }
}
