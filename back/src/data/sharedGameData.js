// data/sharedGameData.js
// SOURCE UNIQUE DE VÉRITÉ pour toutes les données du jeu
// Ce fichier est la référence principale, le frontend se synchronise avec ces données

// ========================
// VERSION ACTUELLE DU JEU
// ========================
export const CURRENT_GAME_VERSION = '0.0.3'

// ========================
// DONNÉES DES ESPÈCES
// ========================
export const especeData = {
  'blanchonette': {
    nom: 'Blanchonette',
    description: 'Une poule aux plumes blanches pures. Elle dit qu\'elle travaille dur pour ses oeufs, mais elle les trouve par hasard.',
    image: 'chickens/white/basic.png',
    talent: 'Chanceuse',
    groupe: 'fondamental',
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 2, charisme: 3 }
  },
  'poulette-rousse': {
    nom: 'Poulette Roussette',
    description: 'Une poule énergétique aux plumes rousses. C\'était la première poule du poulailler.',
    image: 'chickens/red/basic.png',
    talent: 'Énergétique',
    groupe: 'fondamental',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 2, energie: 5, charisme: 2 }
  },
  'noiraude': {
    nom: 'Noiraude',
    description: 'Une poule persévérante aux plumes noires comme la nuit. Elle passe son temps à motiver les autres membres du poulailler.',
    image: 'chickens/black/basic.png',
    talent: 'Persévérante',
    groupe: 'fondamental',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 4, energie: 3, charisme: 2 }
  },
  'argentine': {
    nom: 'Argentine',
    description: 'Une poule vive aux reflets argentés, certaines poules s\'en servent comme miroir.',
    image: 'chickens/argentine/basic.png',
    talent: 'Vive',
    groupe: 'brillant',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 3, charisme: 3 }
  },
  'aubepine': {
    nom: 'Aubépine',
    description: 'Une poule curieuse aux couleurs douces. Elle est sociable et dit bonjour à toutes les poules tous les matins.',
    image: 'chickens/aubepine/basic.png',
    talent: 'Curieuse',
    groupe: 'brillant',
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 2, energie: 3, charisme: 4 }
  },
  'cendree': {
    nom: 'Cendrée',
    description: 'Une poule discrète aux tons cendrés, silencieuse mais au coeur pur.',
    image: 'chickens/cendree/basic.png',
    talent: 'Discrète',
    groupe: 'brillant',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 5, energie: 2, charisme: 2 }
  },
  'choco': {
    nom: 'Poulette choco',
    description: 'Une poule gourmande aux couleurs chocolatées. Elle a le sens du goût et sait ce qui est bon.',
    image: 'chickens/choco/basic.png',
    talent: 'Gourmande',
    groupe: 'discret',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 1, energie: 4, charisme: 4 }
  },
  'ecailleuse': {
    nom: 'Écailleuse',
    description: 'Une poule aux motifs écaillés. Elle veille sur le poulailler.',
    image: 'chickens/ecailleuse/basic.png',
    talent: 'Protectrice',
    groupe: 'discret',
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 3, energie: 4, charisme: 2 }
  },
  'grisette': {
    nom: 'Grisette',
    description: 'Une poule maligne aux plumes grises. Elle aime apprendre des choses aux autres poules.',
    image: 'chickens/grisette/basic.png',
    talent: 'Maligne',
    groupe: 'discret',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 5, energie: 1, charisme: 3 }
  },
  'queuedepaon': {
    nom: 'Queue de Paon',
    description: 'Une poule majestueuse aux plumes colorées. Elle passe son temps à se pavaner.',
    image: 'chickens/queuedepaon/basic.png',
    talent: 'Majestueuse',
    groupe: 'chic',
    categorie: 'eclosion',
    rarete: 'epique',
    stats: { intelligence: 3, energie: 1, charisme: 5 }
  },
  'rayee': {
    nom: 'Rayée',
    description: 'Une poule rapide aux motifs rayés élégants. On la voit souvent courir partout.',
    image: 'chickens/rayee/basic.png',
    talent: 'Rapide',
    groupe: 'chic',
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 5, charisme: 1 }
  },
  'tachetee': {
    nom: 'Tachetée',
    description: 'Une poule joyeuse aux taches colorées. Elle boit du lait pour renforcer ses os.',
    image: 'chickens/tachetee/basic.png',
    talent: 'Joyeuse',
    groupe: 'chic',
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 1, charisme: 4 }
  },
  'space': {
    nom: 'Poulette galactique',
    description: "Une poule venue des étoiles, qui distord la réalité pour avoir plus de graines à midi.", 
    image: 'chickens/space/basic.png',
    talent: 'Spaciale',
    groupe: 'chic',
    categorie: 'eclosion',
    rarete: 'legendaire',
    stats: { intelligence: 4, energie: 4, charisme: 4 }
  },
  'duck': {
    nom: 'Canard',
    description: "Un canard infiltré, cependant très productif pour le poulailler.", 
    image: 'chickens/duck/basic.png',
    talent: 'Canard',
    groupe: 'discret',
    categorie: 'eclosion',
    rarete: 'epique',
    stats: { intelligence: 2, energie: 3, charisme: 2 }
  },
  'crete': {
    nom: 'Poulette à crête',
    description: "Une poulette attirant l'attention et remuant sa crête à tout va.", 
    image: 'chickens/crete/basic.png',
    talent: 'Captivante',
    groupe: 'discret',
    categorie: 'eclosion',
    rarete: 'epique',
    stats: { intelligence: 2, energie: 2, charisme: 5 }
  }
}

// ========================
// DONNÉES DES TALENTS
// ========================

export const talentsData = {
  'Chanceuse': {
    description: "Des œufs blancs apparaissent sur l'écran.",
    effet: "Des œufs blancs apparaissent régulièrement, en cliquer un donne votre stockage max x{1+niveau*0.5} œufs.",
    icon: '🍀',
    calculation: {
      combine: 'not_linear',
      triggers: [
        { type: 'spawner' }
      ],
      effects: [
        {
          type: 'spawn_clickable',
          spawner_id: 'white_egg',
          icon: '🥚',
          style: 'white-egg',
          reward: {
            type: 'resource',
            resource: 'eggs',
            amount: { op: 'mul', args: [ { var: 'stockageMax' }, { op: 'add', args: [ 1, { op: 'mul', args: [ { var: 'niveau' }, 0.5 ] } ] } ] }
          }
        }
      ]
    }
  },
  'Énergétique': {
    description: "Augmente vos revenus en fonction de l'énergie de l'équipe.",
    effet: "+{niveau*0.2} de revenu par seconde pour chaque point d'énergie dans l'équipe.",
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
    effet: "+{niveau} énergie et intelligence à toutes les poules de l'équipe.",
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
    description: "Augmente les revenus en fonction de l'intelligence ou de l'énergie de l'équipe.",
    effet: "{niveau*0.1} de revenu par seconde pour chaque point d'énergie ou d'intelligence dans l'équipe.",
    icon: '🏃',
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'income_bonus_per_second',
          resource: 'eggs',
          amount: {
            op: 'mul',
            args: [
              { op: 'add', args: [ { var: 'teamEnergy' }, { var: 'teamIntelligence' } ] },
              { op: 'mul', args: [ { var: 'niveau' }, 0.1 ] }
            ]
          }
        }
      ]
    }
  },
  'Curieuse': {
    description: "Augmente le stockage en fonction du charisme",
    effet: "+{niveau*2} de stockage par point de charisme",
    nivType: 'basic',
    icon: '🔎',
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'storage_bonus',
          resource: 'eggs',
          amount: {
            op: 'mul',
            args: [
              { var: 'teamCharisme' },
              { op: 'mul', args: [ { var: 'niveau' }, 2 ] }
            ]
          }
        }
      ]
    }
  },
  'Discrète': {
    description: "Augmente l'intelligence mais baisse le charisme des poules de l'équipe.",
    effet: "+{niveau*2} intelligence et -{niveau*1} charisme à toute l'équipe.",
    nivType: 'basic',
    icon: '🕵️',
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'stat_buff',
          target: 'team',
          stats: {
            intelligence: { op: 'mul', args: [ { var: 'niveau' }, 2 ] },
            charisme: { op: 'mul', args: [ { var: 'niveau' }, -1 ] }
          }
        }
      ]
    }
  },
  'Gourmande': {
    description: "Des chocolats apparaissent sur l'écran qui augmentent la production et le stockage lorsque cliqués.",
    effet: "Des chocolats apparaissent, en cliquer un augmente la production et le stockage de {25+niveau*15}% pendant 15s.",
    icon: '🍫',
    calculation: {
      combine: 'not_linear',
      triggers: [
        { type: 'spawner' }
      ],
      effects: [
        {
          type: 'spawn_clickable',
          spawner_id: 'chocolate',
          icon: '🍫',
          style: 'chocolate',
          reward: {
            type: 'buff',
            buff_type: 'income_storage_multiplier',
            duration: 15000,
            income_multiplier: { op: 'add', args: [ 1.25, { op: 'mul', args: [ { var: 'niveau' }, 0.15 ] } ] },
            storage_multiplier: { op: 'add', args: [ 1.25, { op: 'mul', args: [ { var: 'niveau' }, 0.15 ] } ] }
          }
        }
      ]
    }
  },
  'Protectrice': {
    description: "Augmente la production et le stockage max en fonction de l'intelligence.",
    effet: "Augmente le stockage de {niveau} et la production de {niveau*0.1} par point d'intelligence dans l'équipe.",
    icon: '🛡️',
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'income_bonus_per_second',
          resource: 'eggs',
          amount: {
            op: 'mul',
            args: [
              { var: 'teamIntelligence' },
              { op: 'mul', args: [ { var: 'niveau' }, 0.1 ] }
            ]
          }
        },
        {
          type: 'storage_bonus',
          resource: 'eggs',
          amount: {
            op: 'mul',
            args: [
              { var: 'teamIntelligence' },
              { var: 'niveau' }
            ]
          }
        }
      ]
    }
  },
  'Maligne': {
    description: "Cliquez-moi pour augmenter l'intelligence temporairement.",
    effet: "Cliquez moi pour augmenter l'intelligence globale de {50+niveau*25}% pendant 20s. Cooldown 1 minute", //Clic se fait sur TeamParadeChicken
    icon: '🧠',
    calculation: {
      triggers: [ { type: 'active' } ],
      cooldown_ms: 60000,
      effects: [
        {
          type: 'apply_stat_multiplier',
          target: 'team',
          duration: 20000,
          stats: {
            intelligence: { op: 'add', args: [ 1.5, { op: 'mul', args: [ { var: 'niveau' }, 0.25 ] } ] }
          }
        }
      ]
    }
  },
  'Majestueuse': {
    description: "Augmente le charisme.",
    effet: "+{niveau*10} charisme",
    icon: '👑',
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'stat_buff',
          target: 'me',
          stats: {
            charisme: { op: 'mul', args: [ { var: 'niveau' }, 10 ] }
          }
        }
      ]
    }
  },
  'Rapide': {
    description: "Cliquez-moi pour augmenter le stockage temporairement.",
    effet: "Cliquez moi pour augmenter le stockage de {25+niveau*15}% pendant 15s. Cooldown 1 minute",
    icon: '💨',
    calculation: {
      triggers: [ { type: 'active' } ],
      cooldown_ms: 60000,
      effects: [
        {
          type: 'apply_buff',
          buff_type: 'storage',
          duration: 15000,
          amount: { op: 'add', args: [ 1.25, { op: 'mul', args: [ { var: 'niveau' }, 0.15 ] } ] }
        }
      ]
    }
  },
  'Joyeuse': {
    description: "Cliquez-moi pour augmenter les revenus temporairement.",
    effet: "Cliquez moi pour augmenter le revenu de {100+niveau*50}% pendant 10s. Cooldown 1 minute",
    icon: '🎉',
    calculation: {
      triggers: [ { type: 'active' } ],
      cooldown_ms: 60000,
      effects: [
        {
          type: 'apply_buff',
          buff_type: 'income_multiplier',
          duration: 10000,
          amount: { op: 'add', args: [ 2, { op: 'mul', args: [ { var: 'niveau' }, 0.5 ] } ] } 
        }
      ]
    }
  }
  ,
  'Spaciale': {
    description: "Augmente votre stockage maximum de façon multiplicative.",
    effet: "+{15 + niveau*10}% de stockage (multiplicatif, passif)",
    icon: '🪐',
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'storage_multiplier',
          amount: { op: 'add', args: [ 1.15, { op: 'mul', args: [ { var: 'niveau' }, 0.10 ] } ] }
        }
      ]
    }
  },
  'Canard': {
    description: "Augmente le revenu par seconde en fonction de TOUTES les stats d'équipe.",
    effet: "+{0.1*niveau} /s par point de stat (Intelligence + Énergie + Charisme)",
    icon: '🦆',
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'income_bonus_per_second',
          resource: 'eggs',
          amount: {
            op: 'mul',
            args: [
              { op: 'add', args: [ { var: 'teamEnergy' }, { var: 'teamIntelligence' }, { var: 'teamCharisme' } ] },
              { op: 'mul', args: [ { var: 'niveau' }, 0.1 ] }
            ]
          }
        }
      ]
    }
  },
  'Captivante': {
    description: "Des poussins roses apparaissent sur l'écran.",
    effet: "Des poussins roses apparaissent régulièrement, en cliquer un donne votre charisme actuel x{2+niveau*1.5} œufs.",
    icon: '🕶️',
    calculation: {
      combine: 'not_linear',
      triggers: [
        { type: 'spawner' }
      ],
      effects: [
        {
          type: 'spawn_clickable',
          spawner_id: 'pink_egg',
          icon: '🐣',
          style: 'pink_egg',
          reward: {
            type: 'resource',
            resource: 'eggs',
            amount: { op: 'mul', args: [ { var: 'teamCharisme' }, { op: 'add', args: [ 2, { op: 'mul', args: [ { var: 'niveau' }, 1.5 ] } ] } ] } }
        }
      ]
    }
  }
}

// ========================
// DONNÉES DES GROUPES
// ========================
export const groupes = [
  { 
    name: 'fondamental', 
    description: 'Poule du groupe fondamental', 
    rarityDropChance: [75, 25, 0, 0]
  },
  { 
    name: 'brillant', 
    description: 'Poule du groupe brillant', 
    rarityDropChance: [75, 25, 0, 0]
  },
  { 
    name: 'discret', 
    description: 'Poule du groupe discret', 
    rarityDropChance: [65, 25, 10, 0]
  },
  { 
    name: 'chic', 
    description: 'Poule du groupe chic', 
    rarityDropChance: [64, 25, 10, 1]
  },
  {
    name: 'artifacts',
    description: 'Artefacts de minage',
    type: 'artifacts',
    rarityDropChance: [40, 38, 20, 2]
  },
  {
    name: 'eggs_bonus',
    description: 'Œufs',
    type: 'items',
    items: [
      { id: 'eggs', amount: 100, weight: 60 },
      { id: 'eggs', amount: 250, weight: 30 },
      { id: 'eggs', amount: 500, weight: 10 }
    ]
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
        name: 'discret',
        chance: 60,
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
        chance: 50,
        quantity: 1
      },
      {
        name: 'brillant',
        chance: 50,
        quantity: 1
      },
    ],
    unlock_level: 4
  },
  {
    id: 5,
    name: 'Coffre de Trésors',
    description: 'Contient un artefact de minage que vous ne possédez pas encore, ou des œufs',
    icon: '🗝️',
    price: { type: 'chest_key', count: 1 },
    category: 'artifacts',
    dropGroups: [
      {
        name: 'artifacts',
        chance: 70,
        quantity: 1
      },
      {
        name: 'eggs_bonus',
        chance: 30,
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
    rewards: [5, 10, 20, 30, 45, 60, 90, 200],
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
    rewards: [0.5, 1, 1.5, 2, 3, 5, 8, 10],
    effectTemplate: '+{reward} œuf(s) produit(s) par seconde',
    maxLevel: null,
    // Effet appliqué côté serveur à l'achat: ajoute reward à income de base
    effect: { target: 'clickableEgg.income', op: 'add' }
  }
]

// ========================
// AGRANDISSEMENTS (EXPANSIONS)
// ========================
// Améliorations spéciales pour agrandir l'équipe et les emplacements d'artéfacts
// Maintenant fonctionnent comme des améliorations en chaîne avec niveaux progressifs
export const expansionsData = [
  {
    id: 'team_slot',
    name: 'Emplacements d\'équipe',
    description: 'Augmente le nombre d\'emplacements pour votre équipe de poules',
    icon: '🐔',
    category: 'team',
    costs: [
      [{ type: 'eggs', count: 50 }],
      [{ type: 'eggs', count: 500 }],
      [{ type: 'eggs', count: 1000000 }, { type: 'precious_stone', count: 10 }]
    ],
    rewards: [2, 3, 4],
    effectTemplate: '{reward} emplacements d\'équipe',
    maxLevel: null,
    unlock_level: 1
  },
  {
    id: 'artifact_slot',
    name: 'Emplacements d\'artéfact',
    description: 'Augmente le nombre d\'emplacements pour équiper des artéfacts de minage',
    icon: '💎',
    category: 'artifacts',
    costs: [
      [{ type: 'precious_stone', count: 1 }],
      [{ type: 'precious_stone', count: 10 }]
    ],
    rewards: [2, 3],
    effectTemplate: '{reward} emplacements d\'artéfact',
    maxLevel: null,
    unlock_level: 5
  }
]

// ========================
// DÉBLOCAGES PAR NIVEAU
// ========================
// Centralise ce qui se débloque à chaque niveau
export const levelUnlocks = {
  2: [
    { id: 'market', label: 'Marché débloqué', icon: '🛒' }
  ],
  3: [
    { id: 'social', label: 'Social débloqué', icon: '👥' },
    { id: 'shiny_box', label: 'Boîte brillante débloquée', icon: '✨' }
  ],
  4: [
    { id: 'noble_box', label: 'Coffret chic débloqué', icon: '💎' }
  ],
  5: [
    { id: 'mining', label: 'Mini-jeu de minage débloqué', icon: '🪨' }
  ],
  10: [
    { id: 'hundred_opening', label: 'Ouvertures de boites x100', icon: '📦' }
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
  5: [ { type: 'production_token', count: 2 }, { type: 'mining_token', count: 3 } ],
  6: [ { type: 'stock_token', count: 2 }, { type: 'mining_token', count: 3 } ],
  7: [ { type: 'production_token', count: 3 }, { type: 'mining_token', count: 3 } ],
  8: [ { type: 'stock_token', count: 3 }, { type: 'mining_token', count: 3 } ],
  9: [ { type: 'production_token', count: 5 }, { type: 'mining_token', count: 3 } ],
  10: [ { type: 'stock_token', count: 5 }, { type: 'mining_token', count: 3 } ],
  11: [ { type: 'production_token', count: 6 }, { type: 'mining_token', count: 5 } ],
  12: [ { type: 'stock_token', count: 6 }, { type: 'mining_token', count: 5 } ],
}

export const talentLevelUpgradeCost = {
  commune : { 
    limit: 10, 
    egg_cost : [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000],
    chicken_cost : [2, 4, 8, 16, 32, 64, 128, 256, 512]
  },
  rare: {
    limit: 9,
    egg_cost : [100, 1000, 5000, 10000, 50000, 100000, 750000, 5000000],
    chicken_cost : [2, 4, 8, 16, 32, 64, 128, 256]
  },
  epique: {
    limit: 8,
    egg_cost : [100, 1000, 5000, 50000, 100000, 750000, 5000000],
    chicken_cost : [2, 4, 8, 16, 32, 64, 128]
  },
  legendaire: {
    limit: 6,
    egg_cost: [10000, 25000, 50000, 100000, 5000000],
    chicken_cost: [2, 4, 8, 16, 32]
  }
}

// ========================
// DONNÉES DES SUCCÈS
// ========================
export const achievementsData = {
  'first_eggs': {
    id: 'first_eggs',
    nom: 'Premiers Œufs',
    description: 'Récoltez vos 25 premiers œufs',
    icon: '🥚',
    objectif: 25,
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
      quantite: 2
    }
  },
  'egg_master': {
    id: 'egg_master',
    nom: 'Maître des Œufs',
    description: 'Récoltez 1000 œufs au total',
    icon: '🥚',
    objectif: 1000,
    type: 'eggs',
    reward: {
      type: 'blueberry',
      quantite: 3
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
      quantite: 5
    }
  },
  'egg_god': {
    id: 'egg_god',
    nom: 'Dieu des Œufs',
    description: 'Récoltez 100000 œufs au total',
    icon: '🥚',
    objectif: 100000,
    type: 'eggs',
    reward: {
      type: 'blueberry',
      quantite: 10
    }
  },
  'first_chicken': {
    id: 'first_chicken',
    nom: 'Première Poule',
    description: 'Obtenez votre première poule',
    icon: '🐓',
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
      quantite: 2
    }
  },
  'chicken_interested': {
    id: 'chicken_interested',
    nom: 'Éleveur Interessé',
    description: 'Possédez 10 poules différentes',
    icon: '🐓',
    objectif: 10,
    type: 'chickens',
    reward: {
      type: 'blueberry',
      quantite: 3
    }
  },
  'talent_apprentice': {
    id: 'talent_apprentice',
    nom: 'Apprenti Talent',
    description: 'Améliorez une poule au niveau 2',
    icon: '⭐',
    objectif: 2,
    type: 'talent_level',
    reward: {
      type: 'blueberry',
      quantite: 2
    }
  },
  'talent_expert': {
    id: 'talent_expert',
    nom: 'Expert Talent',
    description: 'Améliorez une poule au niveau 3',
    icon: '🌟',
    objectif: 3,
    type: 'talent_level',
    reward: {
      type: 'blueberry',
      quantite: 3
    }
  },
  'talent_master': {
    id: 'talent_master',
    nom: 'Maître Talent',
    description: 'Améliorez une poule au niveau 5',
    icon: '✨',
    objectif: 5,
    type: 'talent_level',
    reward: {
      type: 'blueberry',
      quantite: 5
    }
  },
  'avatar_changed': {
    id: 'avatar_changed',
    nom: 'Nouveau Look',
    description: 'Changez votre avatar.',
    icon: '🖼️',
    objectif: 1,
    type: 'avatar_change',
    reward: {
      type: 'stock_token',
      quantite: 1
    }
  },
  'name_changed': {
    id: 'name_changed',
    nom: 'Nouveau Moi',
    description: 'Changez votre pseudo.',
    icon: '👤',
    objectif: 1,
    type: 'name_change',
    reward: {
      type: 'production_token',
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
      quantite: 3
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
      quantite: 5
    }
  },
  'chicken_gifts_5': {
    id: 'chicken_gifts_5',
    nom: 'Collectionneur de Cadeaux',
    description: 'Collectez 5 cadeaux de poules',
    icon: '🎁',
    objectif: 5,
    type: 'chickenGiftsCollected',
    reward: {
      type: 'blueberry',
      quantite: 2
    }
  },
  'chicken_gifts_25': {
    id: 'chicken_gifts_25',
    nom: 'Maître des Cadeaux',
    description: 'Collectez 25 cadeaux de poules',
    icon: '🎁',
    objectif: 25,
    type: 'chickenGiftsCollected',
    reward: {
      type: 'blueberry',
      quantite: 3
    }
  },
  'chicken_gifts_100': {
    id: 'chicken_gifts_100',
    nom: 'Légende des Cadeaux',
    description: 'Collectez 100 cadeaux de poules',
    icon: '🎁',
    objectif: 100,
    type: 'chickenGiftsCollected',
    reward: {
      type: 'blueberry',
      quantite: 5
    }
  },
  'chicken_abilities_5': {
    id: 'chicken_abilities_5',
    nom: 'Maître des Capacités',
    description: 'Utilisez les capacités de vos poules 5 fois',
    icon: '⚡',
    objectif: 5,
    type: 'chickenAbilitiesUsed',
    reward: {
      type: 'blueberry',
      quantite: 2
    }
  },
  'chicken_abilities_25': {
    id: 'chicken_abilities_25',
    nom: 'Expert des Capacités',
    description: 'Utilisez les capacités de vos poules 25 fois',
    icon: '🌟',
    objectif: 25,
    type: 'chickenAbilitiesUsed',
    reward: {
      type: 'blueberry',
      quantite: 3
    }
  },
  'team_stat_50': {
    id: 'team_stat_50',
    nom: 'Équipe Solide',
    description: 'Atteignez au moins 50 points dans une stat d\'équipe',
    icon: '💪',
    objectif: 50,
    type: 'team_stats',
    reward: {
      type: 'blueberry',
      quantite: 2
    }
  },
  'team_stat_100': {
    id: 'team_stat_100',
    nom: 'Équipe Puissante',
    description: 'Atteignez au moins 100 points dans une stat d\'équipe',
    icon: '🔥',
    objectif: 100,
    type: 'team_stats',
    reward: {
      type: 'blueberry',
      quantite: 3
    }
  },
  'team_stat_200': {
    id: 'team_stat_200',
    nom: 'Équipe Légendaire',
    description: 'Atteignez au moins 200 points dans une stat d\'équipe',
    icon: '⭐',
    objectif: 200,
    type: 'team_stats',
    reward: {
      type: 'blueberry',
      quantite: 10
    }
  },
  'mega_click_500': {
    id: 'mega_click_500',
    nom: 'Récolte Généreuse',
    description: 'Récoltez 500 œufs en un clic',
    icon: '🥚',
    objectif: 500,
    type: 'mega_click',
    reward: {
      type: 'blueberry',
      quantite: 3
    }
  },
  'mega_click_1000': {
    id: 'mega_click_1000',
    nom: 'Récolte Massive',
    description: 'Récoltez 1000 œufs en un clic',
    icon: '🍳',
    objectif: 1000,
    type: 'mega_click',
    reward: {
      type: 'blueberry',
      quantite: 5
    }
  },
  'mega_click_5000': {
    id: 'mega_click_5000',
    nom: 'Récolte Titanesque',
    description: 'Récoltez 5000 œufs en un clic',
    icon: '🌟',
    objectif: 5000,
    type: 'mega_click',
    reward: {
      type: 'blueberry',
      quantite: 10
    }
  },
  'mining_artifact_1': {
    id: 'mining_artifact_1',
    nom: 'Premier Artefact',
    description: 'Trouvez votre premier artefact de minage',
    icon: '🪨',
    objectif: 1,
    type: 'mining_artifacts',
    reward: {
      type: 'blueberry',
      quantite: 1
    }
  },
  'mining_artifact_3': {
    id: 'mining_artifact_3',
    nom: 'Collectionneur d\'Artefacts',
    description: 'Trouvez 3 artefacts de minage différents',
    icon: '💎',
    objectif: 3,
    type: 'mining_artifacts',
    reward: {
      type: 'blueberry',
      quantite: 3
    }
  },
  'mining_artifact_5': {
    id: 'mining_artifact_5',
    nom: 'Maître des Artefacts',
    description: 'Trouvez 5 artefacts de minage différents',
    icon: '⭐',
    objectif: 5,
    type: 'mining_artifacts',
    reward: {
      type: 'blueberry',
      quantite: 5
    }
  },
  'mining_cells_10': {
    id: 'mining_cells_10',
    nom: 'Mineur Débutant',
    description: 'Brisez 50 cases au total en minage',
    icon: '⛏️',
    objectif: 50,
    type: 'mining_cells',
    reward: {
      type: 'blueberry',
      quantite: 1
    }
  },
  'mining_cells_25': {
    id: 'mining_cells_25',
    nom: 'Mineur Expérimenté',
    description: 'Brisez 100 cases au total en minage',
    icon: '⚒️',
    objectif: 100,
    type: 'mining_cells',
    reward: {
      type: 'blueberry',
      quantite: 3
    }
  },
  'mining_cells_100': {
    id: 'mining_cells_100',
    nom: 'Mineur Légendaire',
    description: 'Brisez 250 cases au total en minage',
    icon: '💥',
    objectif: 250,
    type: 'mining_cells',
    reward: {
      type: 'blueberry',
      quantite: 5
    }
  },
  'mining_no_reward': {
    id: 'mining_no_reward',
    nom: 'Malchance',
    description: 'Finissez une grille de minage sans avoir collecté de récompense',
    icon: '😞',
    objectif: 1,
    type: 'mining_no_reward',
    reward: {
      type: 'chest_key',
      quantite: 3
    }
  },
  'mining_full_grid': {
    id: 'mining_full_grid',
    nom: 'Mineur Expert',
    description: 'Cassez toutes les cases d\'une grille de 5x5',
    icon: '💎',
    objectif: 25,
    type: 'mining_best_cells_in_game',
    reward: {
      type: 'chest_key',
      quantite: 5
    }
  }
}

export const itemsData = {
  'eggs': {
    id: 'eggs',
    nom: 'œufs',
    nom_singulier: 'œuf',
    icon: '🥚',
    description: 'La monnaie principale de votre ferme. Récoltez-les sur la page de production et utilisez-les pour acheter des boîtes et améliorer vos poules.'
  },
  'stock_token': {
    id: 'stock_token',
    nom: 'jetons de stock',
    nom_singulier: 'jeton de stock',
    icon: '🧺',
    description: 'Jetons permettant d\'acheter des améliorations de stockage.'
  },
  'production_token': {
    id: 'production_token',
    nom: 'jetons de production',
    nom_singulier: 'jeton de production',
    icon: '⚙️',
    description: 'Jetons permettant d\'acheter des améliorations de production.'
  },
  'mining_token': {
    id: 'mining_token',
    nom: 'jetons de minage',
    nom_singulier: 'jeton de minage',
    icon: '🪨',
    description: 'Jetons nécessaires pour démarrer une partie de minage et découvrir des trésors souterrains.'
  },
  'chest_key': {
    id: 'chest_key',
    nom: 'clés à coffre',
    nom_singulier: 'clé à coffre',
    icon: '🗝️',
    description: 'Clés spéciales permettant d\'ouvrir des coffres de trésors contenant des artefacts de minage. Peuvent être obtenus en minant.'
  },
  'blueberry': {
    id: 'blueberry',
    nom: 'myrtilles',
    nom_singulier: 'myrtille',
    icon: '🫐',
    description: 'Fruits délicieux qui augmentent votre niveau! Survolez votre icone de profil pour plus d\'infos.'
  },
  'precious_stone': {
    id: 'precious_stone',
    nom: 'pierres précieuses',
    nom_singulier: 'pierre précisue',
    icon: '💎',
    description: 'Pierre rare obtenue en minant, permet de trouver de nouvelles poules et d\'améliorer son équipe.'
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
  'name_change': {
    nom: 'Personnalisation',
    icon: '👤',
    color: '#795548'
  },
  'boxes_opened': {
    nom: 'Ouvertures',
    icon: '📦',
    color: '#673AB7'
  },
  'team_stats': {
    nom: 'Équipe',
    icon: '💪',
    color: '#FF5722'
  },
  'mega_click': {
    nom: 'Récolte',
    icon: '🥚',
    color: '#FFC107'
  },
  'mining_artifacts': {
    nom: 'Artefacts',
    icon: '🪨',
    color: '#8B4513'
  },
  'mining_cells': {
    nom: 'Minage',
    icon: '⛏️',
    color: '#696969'
  },
  'mining_no_reward': {
    nom: 'Malchance',
    icon: '😞',
    color: '#FF6347'
  },
  'mining_full_grid': {
    nom: 'Expertise',
    icon: '💎',
    color: '#FFD700'
  },
  'chickenGiftsCollected': {
    nom: 'Cadeaux',
    icon: '🎁',
    color: '#FF69B4'
  },
  'chickenAbilitiesUsed': {
    nom: 'Capacités',
    icon: '⚡',
    color: '#FFD700'
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
    version: CURRENT_GAME_VERSION,
    lastUpdated: LAST_UPDATED,
    especies: especeData,
    talents: talentsData,
    talentLevelUpgradeCost,
    groupes,
    boxes: boxesData,
    upgrades: upgradesData,
    expansions: expansionsData,
    levelUnlocks,
    levelRewards,
    achievements: achievementsData,
    items: itemsData,
    categories: achievementCategories,
    mining: miningData,
    artifacts: artifactsData
  }
}

// ========================
// CONFIGURATION DU MINI-JEU DE MINAGE
// ========================
export const miningData = {
  gridSize: 5,
  defaultHP: 3,
  tools: {
    shovel: {
      name: 'Pelle',
      icon: '🪚',
      desc: 'Inflige 3 dégâts sur une case',
      damage: 3,
      pattern: 'single',
      secondary_damage: 1,
      animation: 'mining'
    },
    pickaxe: {
      name: 'Pioche',
      icon: '⛏️',
      desc: 'Inflige 2 dégâts sur la case ciblée et 1 dégât sur les cases adjacentes',
      damage: 2,
      pattern: 'cross',
      secondary_damage: 1,
      animation: 'mining'
    },
    hammer: {
      name: 'Marteau',
      icon: '🔨',
      desc: 'Inflige 1 dégât au centre et 1 dégât aux cases voisines (3x3)',
      damage: 1,
      pattern: 'square',
      secondary_damage: 1,
      animation: 'mining'
    },
    dynamite: {
      name: 'Dynamite',
      icon: '🧨',
      desc: 'BOOM! (en croix)',
      damage: 3,
      pattern: 'cross',
      secondary_damage: 3,
      animation: 'explosion'
    },
    bomb: {
      name: 'Bombe',
      icon: '💣',
      desc: 'BOOOOOOM! (3x3)',
      damage: 3,
      pattern: 'square',
      secondary_damage: 3,
      animation: 'explosion'
    }
  },
  rewardPool: [
    { type: 'eggs', amount: 25, weight: 29 },
    { type: 'eggs', amount: 50, weight: 20 },
    { type: 'eggs', amount: 100, weight: 6 },
    { type: 'eggs', amount: 1000, weight: 1 },
    { type: 'eggs', amount: 10000, weight: 0.1 },
    { type: 'mining_token', amount: 1, weight: 2 },
    { type: 'stock_token', amount: 1, weight: 3 },
    { type: 'production_token', amount: 1, weight: 3 },
    { type: 'chest_key', amount: 1, weight: 10 },
    { type: 'precious_stone', amount: 1, weight: 3, rare:true }
  ],
  toolPool: [
    { type: 'shovel', weight: 33 },
    { type: 'pickaxe', weight: 33 },
    { type: 'hammer', weight: 33 },
    { type: 'dynamite', weight: 1 }
  ],
  toolsCount: 6
}

// ========================
// ARTÉFACTS DE MINAGE
// Liste d'artefacts utilisables pendant une partie de minage.
// Chaque artefact a un effet passif appliqué lorsqu'il est équipé pour une partie.
// Structure similaire aux espèces: id, name, icon, description, rarity, effect
export const artifactsData = {
  'lucky-shard': {
    id: 'lucky-shard',
    name: 'Fragment de Chance',
    icon: '🍀',
    description: "Augmente légèrement la probabilité d'obtenir une récompense dans chaque case.",
    rarete: 'commune',
    effect: { type: 'increase_reward_chance', amount: 0.1 }
  },
  'smith-glyph': {
    id: 'smith-glyph',
    name: 'Glyphe du Forgeron',
    icon: '🔧',
    description: "+1 outil pendant une partie.",
    rarete: 'commune',
    effect: { type: 'increase_tool_count', amount: 1 }
  },
  'ancient-compass': {
    id: 'ancient-compass',
    name: 'Boussole Antique',
    icon: '🧭',
    description: "Chaque case avec récompense a 50% de chance d'être révelée.",
    rarete: 'legendaire',
    effect: { type: 'reveal_rewards', chance: 0.5 }
  },
  'explosive-fan': {
    id: 'explosive-fan',
    name: 'Fan d\'explosif',
    icon: '🧨',
    description: "Le dernier outil est toujours une dynamite.",
    rarete: 'rare',
    effect: { type: 'last_dynamite' }
  },
  'pyromaniac': {
    id: 'pyromaniac',
    name: 'Pyromane',
    icon: '💣',
    description: "Les dynamites deviennent des bombes, qui affectent une zone de 3x3.",
    rarete: 'epique',
    effect: { type: 'tool_change', origin:'dynamite', dest:'bomb' }
  },
  'reinforced-handle': {
    id: 'reinforced-handle',
    name: 'Manche Renforcé',
    icon: '🪓',
    description: "Les outils infligent +1 dégat à l'endroit cliqué.",
    rarete: 'epique',
    effect: { type: 'increase_tool_damage', amount: 1 }
  },
  'mining-master': {
    id: 'mining-master',
    name: 'Maître mineur',
    icon: '⚒️',
    description: "Les pelles deviennent des pioches.",
    rarete: 'rare',
    effect: { type: 'tool_change', origin:'shovel', dest:'pickaxe' }
  },
  'hole-ace': {
    id: 'hole-ace',
    name: 'As du trou',
    icon: '🕳️',
    description: "Chaque pelle se duplique au début de la partie.",
    rarete: 'commune',
    effect: { type: 'when_tool_add_another', detect:'shovel', add:'shovel' }
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