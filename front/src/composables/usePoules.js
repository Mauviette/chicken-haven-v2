import { ref, computed, onMounted } from 'vue'

const chickenImages = import.meta.glob('@/assets/chickens/**/basic.png', { eager: true })
const hiddenImage = chickenImages['/src/assets/chickens/hidden/basic.png']?.default || ''

// Référentiel local (back-end stocke uniquement les IDs)
export const especeData = {
  'blanchonette': {
    nom: 'Blanchonette',
    talent: 'Chanceuse',
    image: chickenImages['/src/assets/chickens/white/basic.png'].default,
    categorie: 'fusion',
    rarete: 'commune',
    stats: { intelligence: 4, energie: 3, charisme: 3 },
    groupe: 'fondamental'
  },
  'poulette-rousse': {
    nom: 'Poulette Roussette',
    talent: 'Énergétique',
    image: chickenImages['/src/assets/chickens/red/basic.png'].default,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 5, charisme: 2 },
    groupe: 'fondamental',
  },
  'noiraude': {
    nom: 'Noiraude',
    talent: 'Persévérante',
    image: chickenImages['/src/assets/chickens/black/basic.png'].default,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 3, charisme: 4 },
    groupe: 'fondamental',
  },
  'argentine': {
    nom: 'Argentine',
    talent: 'Vive',
    image: chickenImages['/src/assets/chickens/argentine/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 3, energie: 4, charisme: 3 },
    groupe: 'brillant',
  },
  'aubepine': {
    nom: 'Aubépine',
    talent: 'Curieuse',
    image: chickenImages['/src/assets/chickens/aubepine/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 3, charisme: 3 },
    groupe: 'brillant',
  },
  'cendree': {
    nom: 'Cendrée',
    talent: 'Discrète',
    image: chickenImages['/src/assets/chickens/cendree/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 3, charisme: 4 },
    groupe: 'brillant',
  },
  'choco': {
    nom: 'Poulette choco',
    talent: 'Gourmande',
    image: chickenImages['/src/assets/chickens/choco/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 2, energie: 4, charisme: 4 },
    groupe: 'discret',
  },
  'ecailleuse': {
    nom: 'Écailleuse',
    talent: 'Protectrice',
    image: chickenImages['/src/assets/chickens/ecailleuse/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 3, energie: 4, charisme: 3 },
    groupe: 'discret',
  },
  'grisette': {
    nom: 'Grisette',
    talent: 'Maligne',
    image: chickenImages['/src/assets/chickens/grisette/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 4, energie: 3, charisme: 3 },
    groupe: 'discret',
  },
  'queuedepaon': {
    nom: 'Queue de Paon',
    talent: 'Majestueuse',
    image: chickenImages['/src/assets/chickens/queuedepaon/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 3, energie: 3, charisme: 4 },
    groupe: 'chic',
  },
  'rayee': {
    nom: 'Rayée',
    talent: 'Rapide',
    image: chickenImages['/src/assets/chickens/rayee/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 4, energie: 5, charisme: 1 },
    groupe: 'chic',
  },
  'tachetee': {
    nom: 'Tachetée',
    talent: 'Joyeuse',
    image: chickenImages['/src/assets/chickens/tachetee/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 2, charisme: 5 },
    groupe: 'chic',
  },
}

// Référentiel des talents et de leurs effets
export const talentsData = {
  'Chanceuse': {
    description: "Augmente les chances d'obtenir des récompenses rares.",
    effet: (niveau) => `+${25 + niveau * 25}% de chance d’obtenir un objet rare.`,
    maxNiveau: 5,
    icon: '🍀'
  },
  'Énergétique': {
    description: "Finit les missions plus vite.",
    effet: (niveau) => `Finit les missions ${5 + niveau * 5}% plus vite.`,
    maxNiveau: 5,
    icon: '⚡'
  },
  'Persévérante': {
    description: "Se régénère de la fatigue plus vite.",
    effet: (niveau) => `Se régénère ${5 + niveau * 5}% plus vite entre deux missions.`,
    maxNiveau: 5,
    icon: '🏋️'
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
    description: "Consomme moins de nourriture.",
    effet: (niveau) => `Consommation -${niveau * 5}%`,
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
    description: "Attire l'attention lors des concours.",
    effet: (niveau) => `Charisme concours +${niveau * 6}%`,
    maxNiveau: 5,
    icon: '👑'
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
  },
  // ...ajoute d'autres talents si besoin...
}

// Méthodes pour le système de talents
function getTalentInfo(talentName) {
  return talentsData[talentName] || { description: '???', effet: () => '', maxNiveau: 1 }
}

function getTalentLevel(poule) {
  return poule?.niveauTalent || 0
}

export function getTalentLevelRoman(poule) {
  const niveau = getTalentLevel(poule)
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']
  return romanNumerals[niveau - 1] || '???'
}

function canUpgradeTalent(poule) {
  const talentName = especeData[poule.especeId]?.talent
  const max = getTalentInfo(talentName).maxNiveau
  return isTalentUnlocked(poule) && getTalentLevel(poule) < max
}

function upgradeTalent(poule) {
  if (!canUpgradeTalent(poule)) return false
  poule.niveauTalent = (poule.niveauTalent || 0) + 1
  // Ici, tu peux ajouter un appel API pour sauvegarder la montée de niveau côté serveur
  return true
}

export function getTalentEffect(poule) {
  const talentName = especeData[poule.especeId]?.talent
  const niveau = getTalentLevel(poule)
  return getTalentInfo(talentName).effet(niveau)
}

// Fonction utilitaire pour récupérer l'icône d'un talent
export function getIcon(talentName) {
  return talentsData[talentName]?.icon || ''
}

export function getTalentDisplayName(poule) {
  const talentName = especeData[poule.especeId]?.talent
  const icon = getIcon(talentName)
  return `${icon} ${talentName} ${getTalentLevelRoman(poule)}`
}

export function usePoules() {
  const rawPoules = ref([])
  const loading = ref(true)

  async function fetchPoules() {
    try {
      const token = localStorage.getItem('token') // ou autre méthode si différente
      const res = await fetch('/api/poules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      rawPoules.value = data
    } catch (err) {
      console.error('Erreur chargement poules', err)
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchPoules)

  const poules = computed(() => {
    return Object.keys(especeData).map((id) => {
      const fromServer = rawPoules.value.find((p) => p.especeId === id)
      return (
        fromServer || {
          especeId: id,
          quantite: 0,
          niveauTalent: 0,
          statutEnergie: { etat: 'non_obtenue' },
          posteOccupe: null,
        }
      )
    })
  })

  function getImage(id) {
    return especeData[id]?.image || hiddenImage
  }

  function getNom(id) {
    return especeData[id]?.nom || '???'
  }

  function getTalent(id) {
    return especeData[id]?.talent || '???'
  }

  function getCategorie(id) {
    return especeData[id]?.categorie || '???'
  }

  return {
    poules,
    loading,
    especeData,
    talentsData,
    getNom,
    getImage,
    getTalent,
    getCategorie,
    hiddenImage,
    fetchPoules,
    // Ajout pour le système de talents :
    getTalentInfo,
    getTalentLevel,
    canUpgradeTalent,
    upgradeTalent,
    getTalentEffect,
    getIcon,
    getTalentDisplayName,
    getTalentLevelRoman,
  }
}
