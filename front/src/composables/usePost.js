import { ref } from 'vue'

const rawPostes = [
  {
    id: 'couveuse',
    nom: 'Couveuse',
    icone: '🥚',
    stat: 'charisme',
    duree: 120,
    slots: 2,
    debloque: true,
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
    duree: 90,
    slots: 3,
    debloque: true,
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
    debloque: false, // à débloquer plus tard
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

export function usePost() {
  const postes = ref(rawPostes)

  function getPosteById(id) {
    return postes.value.find(p => p.id === id)
  }

  return {
    postes,
    getPosteById
  }
}
