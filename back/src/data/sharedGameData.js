// data/sharedGameData.js
// SOURCE UNIQUE DE VÉRITÉ pour toutes les données du jeu
// Ce fichier est la référence principale, le frontend se synchronise avec ces données

// ========================
// DONNÉES DES ESPÈCES
// ========================
export const especeData = {
  'blanchonette': {
    nom: 'Blanchonette',
    description: 'Une poule chanceuse aux plumes blanches pures',
    image: 'chickens/white/basic.png',
    talent: 'Chanceuse',
    groupe: 'fondamental',
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 2, charisme: 3 }
  },
  'poulette-rousse': {
    nom: 'Poulette Roussette',
    description: 'Une poule énergétique aux plumes rousses flamboyantes',
    image: 'chickens/red/basic.png',
    talent: 'Énergétique',
    groupe: 'fondamental',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 2, energie: 5, charisme: 2 }
  },
  'noiraude': {
    nom: 'Noiraude',
    description: 'Une poule persévérante aux plumes noires comme la nuit',
    image: 'chickens/black/basic.png',
    talent: 'Persévérante',
    groupe: 'fondamental',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 2, energie: 3, charisme: 4 }
  },
  'argentine': {
    nom: 'Argentine',
    description: 'Une poule vive aux reflets argentés',
    image: 'chickens/argentine/basic.png',
    talent: 'Vive',
    groupe: 'brillant',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 3, charisme: 3 }
  },
  'aubepine': {
    nom: 'Aubépine',
    description: 'Une poule curieuse aux couleurs douces',
    image: 'chickens/aubepine/basic.png',
    talent: 'Curieuse',
    groupe: 'brillant',
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 3, charisme: 2 }
  },
  'cendree': {
    nom: 'Cendrée',
    description: 'Une poule discrète aux tons cendrés',
    image: 'chickens/cendree/basic.png',
    talent: 'Discrète',
    groupe: 'brillant',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 2, charisme: 4 }
  },
  'choco': {
    nom: 'Poulette choco',
    description: 'Une poule gourmande aux couleurs chocolatées',
    image: 'chickens/choco/basic.png',
    talent: 'Gourmande',
    groupe: 'discret',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 1, energie: 4, charisme: 4 }
  },
  'ecailleuse': {
    nom: 'Écailleuse',
    description: 'Une poule protectrice aux motifs écaillés sophistiqués',
    image: 'chickens/ecailleuse/basic.png',
    talent: 'Protectrice',
    groupe: 'discret',
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 3, energie: 4, charisme: 2 }
  },
  'grisette': {
    nom: 'Grisette',
    description: 'Une poule maligne aux plumes grises',
    image: 'chickens/grisette/basic.png',
    talent: 'Maligne',
    groupe: 'discret',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 5, energie: 1, charisme: 3 }
  },
  'queuedepaon': {
    nom: 'Queue de Paon',
    description: 'Une poule majestueuse aux plumes colorées',
    image: 'chickens/queuedepaon/basic.png',
    talent: 'Majestueuse',
    groupe: 'chic',
    categorie: 'eclosion',
    rarete: 'epique',
    stats: { intelligence: 3, energie: 1, charisme: 5 }
  },
  'rayee': {
    nom: 'Rayée',
    description: 'Une poule rapide aux motifs rayés élégants',
    image: 'chickens/rayee/basic.png',
    talent: 'Rapide',
    groupe: 'chic',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 4, energie: 4, charisme: 1 }
  },
  'tachetee': {
    nom: 'Tachetée',
    description: 'Une poule joyeuse aux taches colorées',
    image: 'chickens/tachetee/basic.png',
    talent: 'Joyeuse',
    groupe: 'chic',
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 1, charisme: 4 }
  }
}

// ========================
// DONNÉES DES TALENTS
// ========================

//POUR L'INSTANT NE FAIRE QUE LES 3 PREMIERS
export const talentsData = {
  'Chanceuse': {
    description: "Lors des récoltes, a une petite chance de fait pleuvoir des oeufs.",
    effet: (niveau) => `Pour chaque oeuf récolté, 1% de chance de gagner votre stockage max x${niveau} en oeufs.`,
    nivType : 'basic',
    icon: '🍀',
    calculation: {
      combine: 'linear',
      triggers: [
        { type: 'on_egg_harvest' }
      ],
      conditions: [
        { type: 'random_chance', value: 0.01 }
      ],
      effects: [
        { type: 'visual_effect', effect: 'egg_rain', amount: 15 },
        {
          type: 'resource',
          resource: 'eggs',
          amount: { op: 'mul', args: [ { var: 'niveau' }, { var: 'stockageMax' } ] }
        }
      ]
    }
  },
  'Énergétique': {
    description: "Augmente vos revenus en fonction de l'énergie de l'équipe.",
    effet: (niveau) => `+${niveau * 0.2} de revenu par seconde pour chaque point d'énergie dans l'équipe.`,
    nivType : 'basic',
    icon: '⚡',
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'income_bonus_per_second',
          resource: 'eggs',
          amount: {
            op: 'mul',
            args: [
              { var: 'teamEnergy' },
              { op: 'mul', args: [ { var: 'niveau' }, 0.2 ] }
            ]
          }
        }
      ]
    }
  },
  'Persévérante': {
    description: "Augmente l'énergie et l'intelligence de l'équipe.",
    effet: (niveau) => `+${niveau} énergie et intelligence à toutes les poules de l'équipe.`,
    nivType : 'basic',
    icon: '🏋️',
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'stat_buff',
          target: 'team',
          stats: {
            energie: { op: 'add', args: [ { var: 'niveau' } ] },
            intelligence: { op: 'add', args: [ { var: 'niveau' } ] }
          }
        }
      ]
    }
  },
  'Vive': {
    description: "Termine les missions plus rapidement.",
    effet: (niveau) => `Vitesse de mission +${niveau * 8}%`,
    maxNiveau: 5,
    icon: '🏃'
  },
  'Curieuse': {
    description: "Découvre plus d'événements spéciaux.",
    effet: (niveau) => `+${niveau * 3}% d'événements spéciaux`,
    maxNiveau: 5,
    icon: '🔎'
  },
  'Discrète': {
    description: "Moins de risques lors des missions risquées.",
    effet: (niveau) => `Risque réduit de ${niveau * 6}%`,
    maxNiveau: 5,
    icon: '🕵️'
  },
  'Gourmande': {
    description: "Augmente le revenu en fonction du stockage max.",
    effet: (niveau) => `Augmente le revenu de ${niveau * 0.05} par stockage.`,
    maxNiveau: 5,
    icon: '🍗'
  },
  'Protectrice': {
    description: "Protège les autres poules lors d'événements.",
    effet: (niveau) => `Protection +${niveau * 7}%`,
    maxNiveau: 5,
    icon: '🛡️'
  },
  'Maligne': {
    description: "Résout les énigmes plus facilement.",
    effet: (niveau) => `+${niveau * 4}% de réussite aux énigmes`,
    maxNiveau: 5,
    icon: '🧠'
  },
  'Majestueuse': {
    description: "Augmente le charisme.",
    effet: (niveau) => `+${niveau * 5} charisme`,
    nivType : 'basic',
    icon: '👑',
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'stat_buff',
          target: 'me',
          stats: {
            energie:
              { op: 'mul', args: [ { var: 'niveau' }, 5 ] }
        }
      }
      ]
    }
  },
  'Rapide': {
    description: "Se déplace plus vite.",
    effet: (niveau) => `Vitesse +${niveau * 10}%`,
    maxNiveau: 5,
    icon: '💨'
  },
  'Joyeuse': {
    description: "Augmente le moral du poulailler.",
    effet: (niveau) => `Moral +${niveau * 2}`,
    maxNiveau: 5,
    icon: '🎉'
  }
}

// ========================
// DONNÉES DES GROUPES
// ========================
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

// ========================
// DONNÉES DES BOÎTES
// ========================
export const boxesData = [
  {
    id: 1,
    name: 'Carton de Base',
    description: 'Contient une poule de base garantie',
    icon: '📦',
    price: { type: 'eggs', count: 25 },
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
    price: { type: 'eggs', count: 75 },
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
    price: { type: 'eggs', count: 150 },
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

// ========================
// AMÉLIORATIONS (UPGRADES)
// ========================
// Source de vérité centrale pour les améliorations, coûts et effets appliqués côté serveur
export const upgradesData = [
  {
    id: 1,
    name: 'Améliorer le stockage',
    description: 'Augmente la capacité de stockage des œufs',
    icon: '🏠',
    priceType: 'stock_token',
    costs: [1, 1, 2, 2, 3, 4, 5, 8],
    rewards: [5, 5, 10, 10, 15, 20, 25, 40],
    effectTemplate: '+{reward} œufs de stockage maximum',
    maxLevel: null,
    // Effet appliqué côté serveur à l'achat: ajoute reward au maxIncome
    effect: { target: 'clickableEgg.maxIncome', op: 'add' }
  },
  {
    id: 2,
    name: 'Production Premium',
    description: 'Améliore la productivité des œufs par seconde',
    icon: '🌾',
    priceType: 'production_token',
    costs: [1, 1, 2, 2, 3, 4, 5, 8],
    rewards: [0.5, 0.5, 1, 1, 1.5, 2, 2.5, 4],
    effectTemplate: '+{reward} œuf(s) produit(s) par seconde',
    maxLevel: null,
    // Effet appliqué côté serveur à l'achat: ajoute reward à income de base
    effect: { target: 'clickableEgg.income', op: 'add' }
  }
]

// ========================
// DÉBLOCAGES PAR NIVEAU
// ========================
// Centralise ce qui se débloque à chaque niveau (ex: fonctionnalités UI)
export const levelUnlocks = {
  2: [
    { id: 'market', label: 'Marché débloqué', icon: '🛒' }
  ],
  3: [
    // Ajouter ici d'autres déblocages de niveau si besoin
  ]
}

// ========================
// RÉCOMPENSES PAR NIVEAU
// ========================
// Définition explicite des récompenses par niveau (au lieu de les générer dynamiquement)
// Exemple basé sur les règles précédentes: pair → production_token, impair (>1) → stock_token
export const levelRewards = {
  3: [ { type: 'production_token', count: 1 } ],
  4: [ { type: 'stock_token', count: 1 } ],
  5: [ { type: 'production_token', count: 1 } ],
  6: [ { type: 'stock_token', count: 1 } ]
  // Ajoutez d'autres niveaux selon la progression désirée
}

export const talentLevelUpgradeCost = {
  basic : { 
    limit: 10, 
    egg_cost : [100, 2000, 5000, 10000, 50000, 100000, 500000, 1000000, 10000000],
    chicken_cost : [2, 4, 8, 16, 32, 64, 128, 256, 512]
  }
}

// ========================
// DONNÉES DES SUCCÈS
// ========================
export const achievementsData = {
  'first_eggs': {
    id: 'first_eggs',
    nom: 'Premiers Œufs',
    description: 'Récoltez vos 15 premiers œufs',
    icon: '🥚',
    objectif: 15,
    type: 'eggs',
    reward: {
      type: 'blueberry',
      quantite: 2
    }
  },
  'egg_collector': {
    id: 'egg_collector',
    nom: 'Collectionneur d\'Œufs',
    description: 'Récoltez 100 œufs au total',
    icon: '🎯',
    objectif: 100,
    type: 'eggs',
    reward: {
      type: 'blueberry',
      quantite: 1
    }
  },
  'egg_master': {
    id: 'egg_master',
    nom: 'Maître des Œufs',
    description: 'Récoltez 1000 œufs au total',
    icon: '👑',
    objectif: 1000,
    type: 'eggs',
    reward: {
      type: 'blueberry',
      quantite: 1
    }
  },
  'egg_king': {
    id: 'egg_king',
    nom: 'Roi des Œufs',
    description: 'Récoltez 10000 œufs au total',
    icon: '👑',
    objectif: 10000,
    type: 'eggs',
    reward: {
      type: 'blueberry',
      quantite: 1
    }
  },
  'first_chicken': {
    id: 'first_chicken',
    nom: 'Première Poule',
    description: 'Obtenez votre première poule',
    icon: '🐔',
    objectif: 1,
    type: 'chickens',
    reward: {
      type: 'blueberry',
      quantite: 1
    }
  },
  'chicken_collector': {
    id: 'chicken_collector',
    nom: 'Éleveur Débutant',
    description: 'Possédez 5 poules différentes',
    icon: '🐓',
    objectif: 5,
    type: 'chickens',
    reward: {
      type: 'blueberry',
      quantite: 1
    }
  },
  'talent_apprentice': {
    id: 'talent_apprentice',
    nom: 'Apprenti Talent',
    description: 'Améliorez une poule au niveau 3',
    icon: '⭐',
    objectif: 3,
    type: 'talent_level',
    reward: {
      type: 'blueberry',
      quantite: 2
    }
  },
  'talent_expert': {
    id: 'talent_expert',
    nom: 'Expert Talent',
    description: 'Améliorez une poule au niveau 5',
    icon: '🌟',
    objectif: 5,
    type: 'talent_level',
    reward: {
      type: 'blueberry',
      quantite: 3
    }
  },
  'talent_master': {
    id: 'talent_master',
    nom: 'Maître Talent',
    description: 'Améliorez une poule au niveau 8',
    icon: '✨',
    objectif: 8,
    type: 'talent_level',
    reward: {
      type: 'blueberry',
      quantite: 5
    }
  },
  'avatar_changed': {
    id: 'avatar_changed',
    nom: 'Nouveau Look',
    description: 'Changez votre avatar pour la première fois',
    icon: '👤',
    objectif: 1,
    type: 'avatar_change',
    reward: {
      type: 'stock_token',
      quantite: 1
    }
  },
  'box_opener': {
    id: 'box_opener',
    nom: 'Collectionneur de Boîtes',
    description: 'Ouvrez 10 boîtes au total',
    icon: '📦',
    objectif: 10,
    type: 'boxes_opened',
    reward: {
      type: 'blueberry',
      quantite: 2
    }
  },
  'box_enthusiast': {
    id: 'box_enthusiast',
    nom: 'Amateur de Boîtes',
    description: 'Ouvrez 50 boîtes au total',
    icon: '📦',
    objectif: 50,
    type: 'boxes_opened',
    reward: {
      type: 'blueberry',
      quantite: 5
    }
  },
  'box_master': {
    id: 'box_master',
    nom: 'Maître des Boîtes',
    description: 'Ouvrez 100 boîtes au total',
    icon: '📦',
    objectif: 100,
    type: 'boxes_opened',
    reward: {
      type: 'blueberry',
      quantite: 10
    }
  }
}

// ========================
// DONNÉES DES RESSOURCES
// ========================
export const itemsData = {
  'eggs': {
    id: 'eggs',
    nom: 'œufs',
    nom_singulier: 'œuf',
    icon: '🥚'
  },
  'stock_token': {
    id: 'stock_token',
    nom: 'jetons de stock',
    nom_singulier: 'jeton de stock',
    icon: '📦'
  },
  'production_token': {
    id: 'production_token',
    nom: 'jetons de production',
    nom_singulier: 'jeton de production',
    icon: '⚡'
  },
  'wild_token': {
    id: 'wild_token',
    nom: 'jetons joker',
    nom_singulier: 'jeton joker',
    icon: '🃏'
  },
  'blueberry': {
    id: 'blueberry',
    nom: 'myrtilles',
    nom_singulier: 'myrtille',
    icon: '🫐'
  }
}

// ========================
// CATÉGORIES DE SUCCÈS
// ========================
export const achievementCategories = {
  'eggs': {
    nom: 'Œufs',
    icon: '🥚',
    color: '#FFD700'
  },
  'chickens': {
    nom: 'Poules',
    icon: '🐔',
    color: '#FF6B35'
  },
  'production': {
    nom: 'Production',
    icon: '⚒️',
    color: '#4ECDC4'
  },
  'boxes': {
    nom: 'Boîtes',
    icon: '📦',
    color: '#9C27B0'
  },
  'talent_level': {
    nom: 'Talents',
    icon: '⭐',
    color: '#E91E63'
  },
  'avatar_change': {
    nom: 'Personnalisation',
    icon: '👤',
    color: '#795548'
  },
  'boxes_opened': {
    nom: 'Ouvertures',
    icon: '📦',
    color: '#673AB7'
  }
}

// ========================
// VERSION DES DONNÉES
// ========================
export const DATA_VERSION = '1.0.0'
export const LAST_UPDATED = new Date().toISOString()

// ========================
// FONCTIONS UTILITAIRES
// ========================
export function getAllGameData() {
  return {
    version: DATA_VERSION,
    lastUpdated: LAST_UPDATED,
    especies: especeData,
    talents: talentsData,
    talentLevelUpgradeCost,
    groupes,
    boxes: boxesData,
    upgrades: upgradesData,
    levelUnlocks,
    levelRewards,
    achievements: achievementsData,
    items: itemsData,
    categories: achievementCategories
  }
}

// Fonction pour formater un prix avec la bonne unité
export function formatPrice(price) {
  if (typeof price === 'number') {
    const itemData = itemsData['eggs']
    return `${price} ${price === 1 ? itemData.nom_singulier : itemData.nom}`
  }
  
  if (typeof price === 'object' && price.type && price.count) {
    const itemData = itemsData[price.type]
    if (itemData) {
      return `${price.count} ${price.count === 1 ? itemData.nom_singulier : itemData.nom}`
    }
  }
  
  return 'Prix invalide'
}

// Fonction pour obtenir l'icône d'un type de ressource
export function getResourceIcon(resourceType) {
  const itemData = itemsData[resourceType]
  return itemData ? itemData.icon : '❓'
}

export function formatString(type, count) {
  const itemData = itemsData[type]
  if (!itemData || typeof count !== 'number') return 'Valeur invalide'
  return `${count} ${count === 1 ? itemData.nom_singulier : itemData.nom}`
}