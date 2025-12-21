// data/sharedGameData.js
// SOURCE UNIQUE DE VÉRITÉ pour toutes les données du jeu
// Ce fichier est la référence principale, le frontend se synchronise avec ces données

// ========================
// VERSION ACTUELLE DU JEU
// ========================
export const CURRENT_GAME_VERSION = '0.0.5'

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
  },
  'oie': {
    nom: 'Oie',
    description: "Une oie majestueuse qui optimise la production en fonction du stockage disponible.",
    image: 'chickens/goose/basic.png',
    talent: 'Optimisatrice',
    groupe: 'fondamental',
    categorie: 'eclosion',
    rarete: 'legendaire',
    stats: { intelligence: 4, energie: 3, charisme: 3 }
  },
  'pouletaro': {
    nom: 'Poule\'taro',
    description: "Une poule mystérieuse capable de manipuler le temps pour maximiser la production. De mieux en mieux...",
    image: 'chickens/pouletaro/basic.png',
    talent: 'Le Monde',
    groupe: 'discret',
    categorie: 'eclosion',
    rarete: 'unique',
    stats: { intelligence: 5, energie: 2, charisme: 3 }
  },
  'barbarian': {
    nom: 'Poule barbare',
    description: "Une poule guerrière qui sacrifie l'intelligence de l'équipe pour renforcer son charisme.",
    image: 'chickens/barbarian/basic.png',
    talent: 'AAAAAAAAAARGH',
    groupe: null,
    categorie: 'eclosion',
    rarete: 'unique',
    stats: { intelligence: 0, energie: 5, charisme: 2 }
  }
}

// ========================
// DONNÉES DES TALENTS
// ========================

export const talentsData = {
  'Chanceuse': {
    description: "Des œufs blancs apparaissent sur l'écran.",
    effet: "Des œufs blancs apparaissent régulièrement, en cliquer un donne votre stockage max x{1+niveau*0.25} œufs.",
    icon: '🍀',
    categories : { based_on : ["stock"], gives : ["eggs", "spawnable"]},
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
            amount: { op: 'mul', args: [ { var: 'stockageMax' }, { op: 'add', args: [ 1, { op: 'mul', args: [ { var: 'niveau' }, 0.25 ] } ] } ] }
          }
        }
      ]
    }
  },
  'Énergétique': {
    description: "Augmente vos revenus en fonction de l'énergie de l'équipe.",
    effet: "+{niveau*0.2} de revenu par seconde pour chaque point d'énergie dans l'équipe.",
    icon: '⚡',
    categories : { based_on : ["energy"], gives : ["production"]},
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
    categories : { based_on : [], gives : ["energy","intelligence"]},
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
    effet: "+{niveau*0.25} de revenu par seconde pour chaque point d'énergie et/ou d'intelligence dans l'équipe.",
    icon: '🏃',
    categories : { based_on : ["energy","intelligence"], gives : ["production"]},
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
              { op: 'add', args: [ 1, { op: 'mul', args: [ { var: 'niveau' }, 0.1 ] } ] },
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
    categories : { based_on : ["charisma"], gives : ["stock"]},
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
    categories : { based_on : [], gives : ["intelligence"]},
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
    effet: "Des chocolats apparaissent, en cliquer un augmente la production et le stockage de {25+niveau*5}% pendant 15s.",
    icon: '🍫',
    categories : { based_on : [], gives : ["spawnable","buff","production"]},
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
            income_multiplier: { op: 'add', args: [ 1.25, { op: 'mul', args: [ { var: 'niveau' }, 0.5 ] } ] },
            storage_multiplier: { op: 'add', args: [ 1.25, { op: 'mul', args: [ { var: 'niveau' }, 0.5 ] } ] }
          }
        }
      ]
    }
  },
  'Protectrice': {
    description: "Augmente la production et le stockage max en fonction de l'intelligence.",
    effet: "Augmente le stockage de {niveau} et la production de {niveau*0.1} par point d'intelligence dans l'équipe.",
    icon: '🛡️',
    categories : { based_on : ["intelligence"], gives : ["stock","production"]},
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
    categories : { based_on : ["ability"], gives : ["intelligence","buff"]},
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
    effet: "+{niveau*5} charisme à toute l'équipe",
    icon: '👑',
    categories : { based_on : [], gives : ["charisma"]},
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'stat_buff',
          target: 'team',
          stats: {
            charisme: { op: 'mul', args: [ { var: 'niveau' }, 5 ] }
          }
        }
      ]
    }
  },
  'Rapide': {
    description: "Cliquez-moi pour augmenter le stockage temporairement.",
    effet: "Cliquez moi pour augmenter le stockage de {25+niveau*15}% pendant 15s. Cooldown 1 minute",
    icon: '💨',
    categories : { based_on : ["ability"], gives : ["stock","buff"]},
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
    categories : { based_on : ["ability"], gives : ["production","buff"]},
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
  },
  'Spaciale': {
    description: "Augmente votre stockage maximum de façon multiplicative.",
    effet: "+{15 + niveau*10}% de stockage (multiplicatif, passif)",
    icon: '🪐',
    categories : { based_on : [], gives : ["stock"]},
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
    effet: "+{1*niveau} de revenu par seconde par point de stat (Intelligence + Énergie + Charisme)",
    icon: '🦆',
    categories : { based_on : ["intelligence","energy","charisma"], gives : ["production"]},
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
              { op: 'mul', args: [ { var: 'niveau' }, 1 ] }
              
            ]
          }
        }
      ]
    }
  },
  'Captivante': {
    description: "Des poussins roses apparaissent sur l'écran.",
    effet: "Des poussins roses apparaissent régulièrement, en cliquer un donne votre charisme actuel x{3+niveau*2} œufs.",
    icon: '🕶️',
    categories : { based_on : ["charisma"], gives : ["eggs","spawnable"]},
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
            amount: { op: 'mul', args: [ { var: 'teamCharisme' }, { op: 'add', args: [ 3, { op: 'mul', args: [ { var: 'niveau' }, 2 ] } ] } ] } }
        }
      ]
    }
  },
  'Optimisatrice': {
    description: "Augmente la production en fonction du stockage maximum.",
    effet: "+{0.1 + niveau*0.025} de production par point de stockage maximum.",
    icon: '🪿',
    categories : { based_on : ["stock"], gives : ["production"]},
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'income_bonus_per_second',
          resource: 'eggs',
          amount: {
            op: 'mul',
            args: [
              { var: 'stockageMax' },
              { op: 'add', args: [ 0.1, { op: 'mul', args: [ { var: 'niveau' }, 0.025 ] } ] }
            ]
          }
        }
      ]
    }
  },
  'Le Monde': {
    description: "Arrête le temps pendant 5s, chaque clic sur l'oeuf produit un pourcentage de la production/s.",
    effet: "Arrête le temps et la production pendant 5s. Pendant ce temps, chaque clic sur l'oeuf produit 25% de la production/s en oeufs. Cooldown 1 min",
    icon: '⏰',
    categories : { based_on : ["ability","production"], gives : ["eggs"]},
    calculation: {
      triggers: [ { type: 'active' } ],
      cooldown_ms: 60000,
      effects: [
        {
          type: 'time_stop_buff',
          duration: 5000,
          click_multiplier_base: 0.25,
          click_penalty_per_click: 0.001
        }
      ]
    }
  },
  'AAAAAAAAAARGH': {
    description: "Sacrifie l'intelligence et le charisme de l'équipe pour renforcer son énergie.",
    effet: "Met le charisme et l'intelligence de l'équipe à zéro, puis ajoute leur somme à l'énergie de l'équipe.",
    icon: '⚔️',
    categories : { based_on : ["charisma","intelligence"], gives : ["energy"]},
    calculation: {
      triggers: [ { type: 'passive' } ],
      effects: [
        {
          type: 'stat_transfer',
          from_stat: 'intelligence',
          to_stat: 'energie',
          operation: 'transfer_all'
        },
        {
          type: 'stat_transfer',
          from_stat: 'charisme',
          to_stat: 'energie',
          operation: 'transfer_all'
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
    rarityDropChance: [75, 24.5, 0, 0.5]
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
    effect: { target: 'clickableEgg.maxIncome', op: 'add' },
    limit: 50
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
    effect: { target: 'clickableEgg.income', op: 'add' },
    limit: 50
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
      [{ type: 'eggs', count: 200 }],
      [{ type: 'eggs', count: 1000000 }, { type: 'precious_stone', count: 10 }],
      [{ type: 'eggs', count: 10000000 }, { type: 'precious_stone', count: 10 },{ type: 'ancient_urn', count: 5 }]
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
      [{ type: 'precious_stone', count: 10 }],
      [{ type: 'precious_stone', count: 10 },{ type: 'ancient_urn', count: 1 }],
      [{ type: 'precious_stone', count: 10 },{ type: 'ancient_urn', count: 3 }]
    ],
    rewards: [2, 3, 4, 5],
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
    { id: 'mining', label: 'Mini-jeu de minage débloqué', icon: '🪨' },
    { id: 'minig_level_dirt', label: 'Espace de minage 1 : Morceau de terre', icon: '🟫' }
  ],
  10: [
    { id: 'hundred_opening', label: 'Ouvertures de boites x100', icon: '📦' },
    { id: 'minig_level_rock', label: 'Espace de minage 2 : Roche dure', icon: '⬛' }
  ],
  15: [
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
  },
  unique: {
    limit: 1,
    egg_cost: [],
    chicken_cost: []
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
  },
  
  // --- Achievements: quests completed
  'quest_finisher_1': {
    id: 'quest_finisher_1',
    nom: 'Quête Accomplie I',
    description: 'Terminez 1 quête',
    icon: '📜',
    objectif: 1,
    type: 'quests_completed',
    reward: { type: 'blueberry', quantite: 2 }
  },
  'quest_finisher_3': {
    id: 'quest_finisher_3',
    nom: 'Quête Accomplie II',
    description: 'Terminez 3 quêtes',
    icon: '📜',
    objectif: 3,
    type: 'quests_completed',
    reward: { type: 'blueberry', quantite: 4 }
  },

  // --- Achievements: unique chickens found
  'unique_chicken_found_1': {
    id: 'unique_chicken_found_1',
    nom: 'Découvreur Unique I',
    description: 'Trouvez 1 poule unique',
    icon: '🔴',
    objectif: 1,
    type: 'unique_chickens',
    reward: { type: 'blueberry', quantite: 3 }
  },
  'unique_chicken_found_2': {
    id: 'unique_chicken_found_2',
    nom: 'Découvreur Unique II',
    description: 'Trouvez 2 poules uniques',
    icon: '🔴',
    objectif: 2,
    type: 'unique_chickens',
    reward: { type: 'blueberry', quantite: 5 }
  },
}

// ========================
// DONNÉES DES QUÊTES
// ========================
export const questsData = {
  'welcome_farmer': {
    id: 'welcome_farmer',
    nom: 'Bienvenue dans le Poulailler',
    description: 'Découvrez les bases de votre nouvelle vie de fermier avicole. Chaque étape vous rapprochera de la maîtrise de votre exploitation.',
    icon: '👋',
    unlock_level: 3,
    steps: [
      {
        id: 'first_eggs',
        description: 'Récoltez des oeufs pour prouver votre talent d\'avicole.',
        challenges: [
          { type: 'eggs_collected', objectif: 1000 }
        ],
        reward: {
          type: 'production_token',
          quantite: 3
        }
      },
      {
        id: 'second_eggs',
        description: 'Récoltez plus d\'oeufs et trouvez des poules rares.',
        challenges: [
          { type: 'eggs_collected', objectif: 2000 },
          { type: 'chicken_rarity_found', rarity: 'rare', objectif: 3 }
        ],
        reward: {
          type: 'stock_token',
          quantite: 2
        }
      },
      {
        id: 'epic_chickens',
        description: 'Trouvez des poules épiques et récoltez des cadeaux de poule.',
        challenges: [
          { type: 'chicken_rarity_found', rarity: 'epique', objectif: 3 },
          { type: 'chicken_gifts_collected', objectif: 10 },
        ],
        reward: {
          type: 'production_token',
          quantite: 3
        }
      },
      {
        id: 'find_legendary_chicken',
        description: 'Trouvez une poule légendaire.',
        challenges: [
          { type: 'chicken_rarity_found', rarity: 'legendaire', objectif: 1 }
        ],
        reward: {
          type: 'stock_token',
          quantite: 4
        }
      }
    ]
  },
  'mining_adventure': {
    id: 'mining_adventure',
    nom: 'L\'Aventure Minière',
    description: 'Découvrez les secrets caillouteux. Le minage vous réserve bien des surprises.',
    icon: '⛏️',
    unlock_level: 5,
    steps: [
      {
        id: 'first_mining_game',
        description: 'Jouez à des parties de minage.',
        challenges: [
          { type: 'mining_games_played', objectif: 3 }
        ],
        reward: {
          type: 'chest_key',
          quantite: 1
        }
      },
      {
        id: 'mining_explorer',
        description: 'Brisez 100 cases.',
        challenges: [
          { type: 'mining_cells_broken', objectif: 100 }
        ],
        reward: {
          type: 'mining_token',
          quantite: 2
        }
      }
    ]
  },
  'no_brained_chicken': {
    id: 'no_brained_chicken',
    nom: 'La poule sans cervelle',
    description: 'Une poule a été aperçue en train de crier autour du poulailler.',
    icon: '🚩',
    unlock_level: 10,
    steps: [
      {
        id: 'no_charisma',
        description: 'Récoltez quelques oeufs et ayez un charisme négatif, ça pourrait peut-être l\'attirer...',
        challenges: [
          { type: 'eggs_collected', objectif: 1000000 },
          { type: 'team_stat_req', req: 'below', stat: 'charisme', num: 0, objectif: 1 }
        ],
        reward: {
          type: 'mining_token',
          quantite: 3
        }
      },
      {
        id: 'prod_and_leg',
        description: 'Trouver 10 poules légendaires et avoir au minimum 300 de production pourrait nous aider à la débusquer.',
        challenges: [
          { type: 'eggs_collected', objectif: 500000 },
          { type: 'chicken_rarity_found', rarity: 'legendaire', objectif: 10 },
          { type: 'production_req', req: 'above', num: 300, objectif: 1 }
        ],
        reward: {
          type: 'stock_token',
          quantite: 10
        }
      },
      {
        id: 'last_scream',
        description: 'Vous entendez des cris de rage pouléenne venant d\'un buisson, récoltez encore quelques oeufs et ayez assez d\'énergie pour la faire venir!',
        challenges: [
          { type: 'eggs_collected', objectif: 2000000 },
          { type: 'team_stat_req', req: 'above', stat: 'energie', num: 50, objectif: 1 }
        ],
        reward: {
          type: 'chicken',
          especeId: 'barbarian',
          quantite: 1
        }
      }
    ]
  },
  'bizarre_adventure': {
    id: 'bizarre_adventure',
    nom: 'Une aventure bizarre',
    description: 'Une poule mystérieuse a été aperçue autour du poulailler.',
    icon: '⏳',
    unlock_level: 10,
    steps: [
      {
        id: '1',
        description: 'Récoltez quelques oeufs et atteignez un gros clic en une fois pour prouver votre force.',
        challenges: [
          { type: 'eggs_collected', objectif: 1000000 },
          { type: 'max_eggs_in_click', objectif: 100000 }
        ],
        reward: {
          type: 'mining_token',
          quantite: 3
        }
      },
      {
        id: '2',
        description: 'Trouver 20 poules épiques et avoir au minimum 300 de production pourrait nous aider à la débusquer.',
        challenges: [
          { type: 'eggs_collected', objectif: 500000 },
          { type: 'chicken_rarity_found', rarity: 'epique', objectif: 25 }
        ],
        reward: {
          type: 'production_token',
          quantite: 10
        }
      },
      {
        id: '3',
        description: 'Vous entendez des bruits venant d\'un buisson, récoltez encore quelques oeufs et ayez assez d\'intelligence pour la faire venir!',
        challenges: [
          { type: 'eggs_collected', objectif: 2000000 },
          { type: 'team_stat_req', req: 'above', stat: 'intelligence', num: 50, objectif: 1 }
        ],
        reward: {
          type: 'chicken',
          especeId: 'pouletaro',
          quantite: 1
        }
      }
    ]
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
  },
  'strange_root': {
    id: 'strange_root',
    nom: 'racines bizarres',
    nom_singulier: 'racine bizarre',
    icon: '🫚',
    description: 'Une racine étrange trouvée dans la roche dure. Utilisée pour acheter des graines bizarroïdes.'
  },
  'ancient_urn': {
    id: 'ancient_urn',
    nom: 'urnes antiques',
    nom_singulier: 'urne antique',
    icon: '🏺',
    description: 'Un petit artefact ancien trouvé dans la roche dure. Sert pour la fabrication et améliorations avancées.'
  },
  'rotten_tomato': {
    id: 'rotten_tomato',
    nom: 'tomates pourries',
    nom_singulier: 'tomate pourrie',
    icon: '🍅',
    description: 'Tomates pourries obtenues en mode apocalypse. Elles n\'ont aucune utilité.'
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
    quests: questsData,
    items: itemsData,
    categories: achievementCategories,
    mining: miningData,
    artifacts: artifactsData,
    farming: farmingData,
    farmingItems: farmingItems
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
  rewardTypes: {
    eggs: { name: 'Œufs', icon: '🥚', color: '#fff9e5' },
    mining_token: { name: 'Jeton de minage', icon: '🪨', color: '#8b6914' },
    stock_token: { name: 'Jeton de stock', icon: '📦', color: '#7a3e10' },
    production_token: { name: 'Jeton de production', icon: '⚙️', color: '#ffc66e' },
    chest_key: { name: 'Clé à coffre', icon: '🗝️', color: '#b8860b' },
    precious_stone: { name: 'Pierre précieuse', icon: '💎', color: '#9370db' },
    rotten_tomato: { name: 'Tomate pourrie', icon: '🍅', color: '#8b0000' },
    strange_root: { name: 'Racine bizarre', icon: '🫚', color: '#8fbf3a' },
    ancient_urn: { name: 'Urne antique', icon: '🏺', color: '#b97a2f' }
  },

  // Pool générique (vieux comportement) - utilisé pour l'espace par défaut si aucun override
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

  // Espaces de minage disponibles (débloqués par niveau)
  spaces: [
    {
      id: 'dirt',
      name: 'Morceau de terre',
      icon: '🌱',
      requiredLevel: 5,
      cost: 1, // jetons de minage
      gridSize: 5,
      defaultHP: 3,
      cellColor: '#634425ff',
      dropChance: 0.4, // probabilité par case (40%)
      // Utilise le rewardPool par défaut
    },
    {
      id: 'hard_rock',
      name: 'Roche dure',
      icon: '🪨',
      requiredLevel: 10,
      cost: 3,
      gridSize: 5,
      defaultHP: 5,
      cellColor: '#9b8f7b',
      dropChance: 0.5,
      rewardPool: [
        { type: 'eggs', amount: 1000, weight: 6 },
        { type: 'eggs', amount: 10000, weight: 1 },
        { type: 'eggs', amount: 100000, weight: 0.1 },
        { type: 'mining_token', amount: 1, weight: 4 },
        { type: 'stock_token', amount: 1, weight: 3 },
        { type: 'production_token', amount: 1, weight: 3 },
        { type: 'chest_key', amount: 1, weight: 8 },
        { type: 'precious_stone', amount: 1, weight: 8, rare:true },
        { type: 'strange_root', amount: 1, weight: 3, rare:true },
        { type: 'ancient_urn', amount: 1, weight: 2, rare:true }
      ]
    }
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
    description: "+2 outils pendant une partie.",
    rarete: 'commune',
    effect: { type: 'increase_tool_count', amount: 2 }
  },
  'ancient-compass': {
    id: 'ancient-compass',
    name: 'Boussole Antique',
    icon: '🧭',
    description: "Chaque case avec récompense a 75% de chance d'être révelée.",
    rarete: 'legendaire',
    effect: { type: 'reveal_rewards', chance: 0.75 }
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
    description: "Les outils infligent +2 dégats à l'endroit cliqué.",
    rarete: 'epique',
    effect: { type: 'increase_tool_damage', amount: 3 }
  },
  'mining-master': {
    id: 'mining-master',
    name: 'Maître mineur',
    icon: '⚒️',
    description: "Les pelles deviennent des marteaux.",
    rarete: 'rare',
    effect: { type: 'tool_change', origin:'shovel', dest:'hammer' }
  },
  'hole-ace': {
    id: 'hole-ace',
    name: 'As du trou',
    icon: '🕳️',
    description: "Chaque pelle se duplique au début de la partie.",
    rarete: 'commune',
    effect: { type: 'when_tool_add_another', detect:'shovel', add:'shovel' }
  },
  'chain-reaction': {
    id: 'chain-reaction',
    name: 'Réaction en Chaîne',
    icon: '💥',
    description: "Briser une case inflige 1 dégât aux 4 cases autour. Peut provoquer des réactions en chaîne.",
    rarete: 'legendaire',
    effect: { type: 'chain_damage', amount: 1 }
  },
  'crack-reveal': {
    id: 'crack-reveal',
    name: 'Révélation des Fissures',
    icon: '🔍',
    description: "Les cases avec récompenses ayant au moins 1 fissure sont révélées.",
    rarete: 'rare',
    effect: { type: 'reveal_cracked_rewards' }
  },
  'fragile-start': {
    id: 'fragile-start',
    name: 'Départ Fragile',
    icon: '🪨',
    description: "Les cases ont 50% de chance de commencer avec 1 fissure (-1 hp).",
    rarete: 'commune',
    effect: { type: 'fragile_grid', chance: 0.5, damage: 1 }
  }
}

// ========================
// CONFIGURATION DU MINI-JEU DE FARMING
// ========================
export const farmingData = {
  // Niveau requis pour débloquer la ferme
  requiredLevel: 10,

  // Grille de la ferme (3x3)
  gridSize: 3,
  defaultUnlockedSlots: 1, // Une seule case débloquée au début

  // Prix pour débloquer une case (placeholder)
  slotUnlockPrice: { type: 'eggs', count: 100 },

  // Cycle météo (en millisecondes) - 12h
  weatherCycleDuration: 12 * 60 * 60 * 1000,

  // Types de météo avec leurs effets sur les légumes
  weatherTypes: {
    sunny: {
      id: 'sunny',
      name: 'Ensoleillé',
      icon: '☀️',
      description: 'Le soleil brille ! Le maïs pousse plus vite, mais les patates souffrent.',
      effects: {
        potato: -0.25,  // -25% vitesse
        carrot: 0,
        corn: 0.25     // +25% vitesse
      }
    },
    cloudy: {
      id: 'cloudy',
      name: 'Nuageux',
      icon: '☁️',
      description: 'Un temps couvert idéal pour les carottes, moins pour le maïs.',
      effects: {
        potato: 0,
        carrot: 0.25,   // +25% vitesse
        corn: -0.25    // -25% vitesse
      }
    },
    rainy: {
      id: 'rainy',
      name: 'Pluvieux',
      icon: '🌧️',
      description: 'La pluie est parfaite pour les patates, mais les carottes n\'aiment pas ça.',
      effects: {
        potato: 0.25,   // +25% vitesse
        carrot: -0.25, // -25% vitesse
        corn: 0
      }
    }
  },

  // Définition des légumes
  vegetables: {
    potato: {
      id: 'potato',
      name: 'Patate',
      namePlural: 'Patates',
      icon: '🥔',
      seedIcon: '🫘',
      growthTime: 3 * 60 * 60 * 1000, // 3 heures en ms
      minReward: 1,
      maxReward: 3,
      minigame: 'minesweeper',
      description: 'Une patate bien ronde qui pousse sous terre.'
    },
    carrot: {
      id: 'carrot',
      name: 'Carotte',
      namePlural: 'Carottes',
      icon: '🥕',
      seedIcon: '🫘',
      growthTime: 3 * 60 * 60 * 1000, // 3 heures en ms
      minReward: 0,
      maxReward: 4,
      minigame: 'risk',
      description: 'Une carotte orange et croquante.'
    },
    corn: {
      id: 'corn',
      name: 'Maïs',
      namePlural: 'Maïs',
      icon: '🌽',
      seedIcon: '🫘',
      growthTime: 3 * 60 * 60 * 1000, // 3 heures en ms
      minReward: 1,
      maxReward: 3,
      minigame: 'falling',
      description: 'Un épi de maïs doré et juteux.'
    }
  },

  // Prix des graines dans la boutique (en strange_root)
  seedPrices: {
    potato: { type: 'strange_root', count: 1, seedsGiven: 2 },
    carrot: { type: 'strange_root', count: 1, seedsGiven: 2 },
    corn: { type: 'strange_root', count: 1, seedsGiven: 2 }
  },

  // Configuration des mini-jeux
  minigames: {
    // Démineur pour les patates
    minesweeper: {
      gridWidth: 6,
      gridHeight: 5,
      minBombs: 3,
      maxBombs: 5,
      timeLimit: 60, // secondes
      // Récompenses: 1 patate par défaut, +1 si terminé à temps, +1 si 0 erreur
    },
    // Choix risqué pour les carottes
    risk: {
      carrotCount: 5,
      bombCount: 1,
      // Le joueur choisit des carottes une à une, peut s'arrêter quand il veut
      // Si bombe: perd tout
    },
    // Grains tombants pour le maïs
    falling: {
      duration: 10, // secondes
      initialSpawnInterval: 750, // ms entre chaque grain au début
      finalSpawnInterval: 400,   // ms à la fin (accélération)
      grainVisibleTime: 1750,    // ms qu'un grain reste à l'écran (1.5-2s)
      // Plus de grains cliqués = plus de maïs récoltés
    }
  }
}

// Items de farming (graines et légumes) pour l'inventaire
export const farmingItems = {
  // Graines magiques
  'potato_seed': {
    id: 'potato_seed',
    nom: 'graines de patate',
    nom_singulier: 'graine de patate',
    icon: '🥔🫘',
    vegetableId: 'potato',
    type: 'seed',
    description: 'Une graine magique qui fait pousser des patates.'
  },
  'carrot_seed': {
    id: 'carrot_seed',
    nom: 'graines de carotte',
    nom_singulier: 'graine de carotte',
    icon: '🥕🫘',
    vegetableId: 'carrot',
    type: 'seed',
    description: 'Une graine magique qui fait pousser des carottes.'
  },
  'corn_seed': {
    id: 'corn_seed',
    nom: 'graines de maïs',
    nom_singulier: 'graine de maïs',
    icon: '🌽🫘',
    vegetableId: 'corn',
    type: 'seed',
    description: 'Une graine magique qui fait pousser du maïs.'
  },
  // Légumes récoltés
  'potato': {
    id: 'potato',
    nom: 'patates',
    nom_singulier: 'patate',
    icon: '🥔',
    type: 'vegetable',
    description: 'Une délicieuse patate de votre ferme.'
  },
  'carrot': {
    id: 'carrot',
    nom: 'carottes',
    nom_singulier: 'carotte',
    icon: '🥕',
    type: 'vegetable',
    description: 'Une belle carotte orange.'
  },
  'corn': {
    id: 'corn',
    nom: 'maïs',
    nom_singulier: 'maïs',
    icon: '🌽',
    type: 'vegetable',
    description: 'Un délicieux épi de maïs.'
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