// data/gameData.js
// Configuration des données de jeu côté serveur
// Basé sur les données du front-end (usePoules.js)

export const especeData = {
  'blanchonette': {
    nom: 'Blanchonette',
    description: 'Une poule chanceuse aux plumes blanches pures',
    image: 'chickens/white/basic.png',
    talent: 'Chanceuse',
    groupe: 'fondamental',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 2, charisme: 3 },
    statistiques: {
      ponte: 4,
      incubation: 4,
      energie: 5
    }
  },
  'poulette-rousse': {
    nom: 'Poulette Roussette',
    description: 'Une poule énergétique aux plumes rousses flamboyantes',
    image: 'chickens/red/basic.png',
    talent: 'Énergétique',
    groupe: 'fondamental',
    rarete: 'commune',
    stats: { intelligence: 2, energie: 5, charisme: 2 },
    statistiques: {
      ponte: 6,
      incubation: 3,
      energie: 4
    }
  },
  'noiraude': {
    nom: 'Noiraude',
    description: 'Une poule persévérante aux plumes noires comme la nuit',
    image: 'chickens/black/basic.png',
    talent: 'Persévérante',
    groupe: 'fondamental',
    rarete: 'commune',
    stats: { intelligence: 2, energie: 3, charisme: 4 },
    statistiques: {
      ponte: 5,
      incubation: 3,
      energie: 4
    }
  },
  'argentine': {
    nom: 'Argentine',
    description: 'Une poule vive aux reflets argentés',
    image: 'chickens/argentine/basic.png',
    talent: 'Vive',
    groupe: 'brillant',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 3, charisme: 3 },
    statistiques: {
      ponte: 8,
      incubation: 2,
      energie: 4
    }
  },
  'aubepine': {
    nom: 'Aubépine',
    description: 'Une poule curieuse aux couleurs douces',
    image: 'chickens/aubepine/basic.png',
    talent: 'Curieuse',
    groupe: 'brillant',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 3, charisme: 2 },
    statistiques: {
      ponte: 7,
      incubation: 4,
      energie: 3
    }
  },
  'cendree': {
    nom: 'Cendrée',
    description: 'Une poule discrète aux tons cendrés',
    image: 'chickens/cendree/basic.png',
    talent: 'Discrète',
    groupe: 'brillant',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 2, charisme: 4 },
    statistiques: {
      ponte: 5,
      incubation: 5,
      energie: 3
    }
  },
  'choco': {
    nom: 'Poulette choco',
    description: 'Une poule gourmande aux couleurs chocolatées',
    image: 'chickens/choco/basic.png',
    talent: 'Gourmande',
    groupe: 'discret',
    rarete: 'commune',
    stats: { intelligence: 1, energie: 4, charisme: 4 },
    statistiques: {
      ponte: 9,
      incubation: 3,
      energie: 2
    }
  },
  'ecailleuse': {
    nom: 'Écailleuse',
    description: 'Une poule protectrice aux motifs écaillés sophistiqués',
    image: 'chickens/ecailleuse/basic.png',
    talent: 'Protectrice',
    groupe: 'discret',
    rarete: 'rare',
    stats: { intelligence: 3, energie: 4, charisme: 2 },
    statistiques: {
      ponte: 12,
      incubation: 2,
      energie: 1
    }
  },
  'grisette': {
    nom: 'Grisette',
    description: 'Une poule maligne aux plumes grises',
    image: 'chickens/grisette/basic.png',
    talent: 'Maligne',
    groupe: 'discret',
    rarete: 'commune',
    stats: { intelligence: 5, energie: 1, charisme: 3 },
    statistiques: {
      ponte: 6,
      incubation: 4,
      energie: 4
    }
  },
  'queuedepaon': {
    nom: 'Queue de Paon',
    description: 'Une poule majestueuse aux plumes colorées',
    image: 'chickens/queuedepaon/basic.png',
    talent: 'Majestueuse',
    groupe: 'chic',
    rarete: 'epique',
    stats: { intelligence: 3, energie: 1, charisme: 5 },
    statistiques: {
      ponte: 15,
      incubation: 1,
      energie: 1
    }
  },
  'rayee': {
    nom: 'Rayée',
    description: 'Une poule rapide aux motifs rayés élégants',
    image: 'chickens/rayee/basic.png',
    talent: 'Rapide',
    groupe: 'chic',
    rarete: 'commune',
    stats: { intelligence: 4, energie: 4, charisme: 1 },
    statistiques: {
      ponte: 10,
      incubation: 2,
      energie: 2
    }
  },
  'tachetee': {
    nom: 'Tachetée',
    description: 'Une poule joyeuse aux taches colorées',
    image: 'chickens/tachetee/basic.png',
    talent: 'Joyeuse',
    groupe: 'chic',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 1, charisme: 4 },
    statistiques: {
      ponte: 7,
      incubation: 3,
      energie: 3
    }
  }
}

export const groupes = [
  { 
    name: 'fondamental', 
    description: 'Groupe fondamental', 
    rarityDropChance: [75, 25, 0, 0]
  },
  { 
    name: 'brillant', 
    description: 'Groupe brillant', 
    rarityDropChance: [75, 25, 0, 0]
  },
  { 
    name: 'discret', 
    description: 'Groupe discret', 
    rarityDropChance: [75, 25, 0, 0]
  },
  { 
    name: 'chic', 
    description: 'Groupe chic', 
    rarityDropChance: [75, 20, 5, 0]
  }
]

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
    unlock_level: 3
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
    unlock_level: 5
  }
]