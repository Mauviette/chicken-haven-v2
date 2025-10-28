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