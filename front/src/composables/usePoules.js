import { ref, computed, onMounted } from 'vue'
import { useGameData } from './useGameData.js'

const chickenImages = import.meta.glob('@/assets/chickens/**/basic.png', { eager: true })
const hiddenImage = chickenImages['/src/assets/chickens/hidden/basic.png']?.default || ''

// DEPRECATED - Utilisez useGameData() pour les données synchronisées
export const especeDataLocal = {
  'blanchonette': {
    nom: 'Blanchonette',
    talent: 'Chanceuse',
    image: chickenImages['/src/assets/chickens/white/basic.png'].default,
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 2, charisme: 3 },
    groupe: 'fondamental'
  },
  'poulette-rousse': {
    nom: 'Poulette Roussette',
    talent: 'Énergétique',
    image: chickenImages['/src/assets/chickens/red/basic.png'].default,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 2, energie: 5, charisme: 2 },
    groupe: 'fondamental',
  },
  'noiraude': {
    nom: 'Noiraude',
    talent: 'Persévérante',
    image: chickenImages['/src/assets/chickens/black/basic.png'].default,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 2, energie: 3, charisme: 4 },
    groupe: 'fondamental',
  },
  'argentine': {
    nom: 'Argentine',
    talent: 'Vive',
    image: chickenImages['/src/assets/chickens/argentine/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 3, charisme: 3 },
    groupe: 'brillant',
  },
  'aubepine': {
    nom: 'Aubépine',
    talent: 'Curieuse',
    image: chickenImages['/src/assets/chickens/aubepine/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 3, charisme: 2 },
    groupe: 'brillant',
  },
  'cendree': {
    nom: 'Cendrée',
    talent: 'Discrète',
    image: chickenImages['/src/assets/chickens/cendree/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 3, energie: 2, charisme: 4 },
    groupe: 'brillant',
  },
  'choco': {
    nom: 'Poulette choco',
    talent: 'Gourmande',
    image: chickenImages['/src/assets/chickens/choco/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 1, energie: 4, charisme: 4 },
    groupe: 'discret',
  },
  'ecailleuse': {
    nom: 'Écailleuse',
    talent: 'Protectrice',
    image: chickenImages['/src/assets/chickens/ecailleuse/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 3, energie: 4, charisme: 2 },
    groupe: 'discret',
  },
  'grisette': {
    nom: 'Grisette',
    talent: 'Maligne',
    image: chickenImages['/src/assets/chickens/grisette/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 5, energie: 1, charisme: 3 },
    groupe: 'discret',
  },
  'queuedepaon': {
    nom: 'Queue de Paon',
    talent: 'Majestueuse',
    image: chickenImages['/src/assets/chickens/queuedepaon/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'epique',
    stats: { intelligence: 3, energie: 1, charisme: 5 },
    groupe: 'chic',
  },
  'rayee': {
    nom: 'Rayée',
    talent: 'Rapide',
    image: chickenImages['/src/assets/chickens/rayee/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'commune',
    stats: { intelligence: 4, energie: 4, charisme: 1 },
    groupe: 'chic',
  },
  'tachetee': {
    nom: 'Tachetée',
    talent: 'Joyeuse',
    image: chickenImages['/src/assets/chickens/tachetee/basic.png']?.default || hiddenImage,
    categorie: 'eclosion',
    rarete: 'rare',
    stats: { intelligence: 4, energie: 1, charisme: 4 },
    groupe: 'chic',
  },
}

// DEPRECATED - Utilisez useGameData() pour les données synchronisées
export const talentsDataLocal = {
  'Chanceuse': {
    description: "Lors des récoltes, a une petite chance de fait pleuvoir des oeufs.",
    effet: (niveau) => `Pour chaque oeuf récolté, 1% de chance de gagner votre stockage max x${niveau} en oeufs.`,
    calc: { req: [ 'niveau', 'maxStockage' ],
            print: (calcul) => `Pour chaque oeuf récolté, 1% de chance de gagner ${calcul} oeufs`,
            type: {
              trigger : 'harvest',
              chance : true,
              reward: 'egg_rain',
              calcul: (niveau, maxStockage) => niveau * maxStockage,
            }
    },
    maxNiveau: 10,
    icon: '🍀'
  },
  'Énergétique': {
    description: "Augmente vos revenus en fonction de l'énergie de l'équipe.",
    effet: (niveau) => `+${niveau * 0.2} de revenu par seconde pour chaque point d'énergie dans l'équipe.`,
    calc: { req: [ 'energieEquipe', 'niveau' ],
            print: (revenu) => `+${revenu}/s`,
            type: {
              trigger : 'always',
              chance : false,
              reward: 'income',
              calcul: (niveau, energieEquipe) => energieEquipe * 0.2 * niveau,
            }
    },
    maxNiveau: 10,
    icon: '⚡'
  },
  'Persévérante': {
    description: "Augmente l'énergie et l'intelligence de l'équipe.",
    effet: (niveau) => `+${niveau} énergie et intelligence à toutes les poules de l'équipe.`,
    calc: { req: [ 'niveau' ],
            calcul: (niveau) => niveau,
            type: {
              trigger : 'always',
              chance : false,
              reward: 'buff',
              target: 'team',
              stats : ['intelligence', 'charisme'],
              print: (niveau) => `+${niveau} énergie et intelligence à toutes les poules de l'équipe.`,
            }
    },
    maxNiveau: 10,
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
}

// Méthodes pour le système de talents (utilise les données synchronisées)
function getTalentLevel(poule) {
  if (!poule) return 0
  // Si la poule est possédée mais que le niveau n'est pas encore connu côté client, assumer niveau 1
  const missingOrZero = (poule.niveauTalent == null || poule.niveauTalent === 0)
  if (missingOrZero) {
    // 1) possédée: niveau 1 par défaut
    if (poule.quantite > 0) return 1
    // 2) ou bien déjà équipée dans l'équipe (juste après un equip avant refresh poules)
    try {
      const slots = Array.isArray(window.__teamSlotsCached) ? window.__teamSlotsCached : []
      if (slots.some(s => s?.especeId === poule.especeId)) return 1
    } catch (_) {}
  }
  return poule.niveauTalent || 0
}

function isTalentUnlocked(poule) {
  // Pour l'instant, considérons que le talent est débloqué si la poule est possédée
  return poule && poule.quantite > 0
}

export function getTalentLevelRoman(poule) {
  const niveau = getTalentLevel(poule)
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']
  return romanNumerals[niveau - 1] || '???'
}

// Fonctions exportées qui utilisent les données locales comme fallback
export function getTalentEffect(poule) {
  try {
    // Utiliser les données locales comme fallback
    const espece = especeDataLocal[poule.especeId]
    const niveau = getTalentLevel(poule)
    const talentInfo = talentsDataLocal[espece?.talent]
    return talentInfo?.effet ? talentInfo.effet(niveau) : '???'
  } catch (error) {
    console.error('Erreur getTalentEffect:', error)
    return '???'
  }
}

// Fonction utilitaire pour récupérer l'icône d'un talent
export function getIcon(talentName) {
  try {
    const talentInfo = talentsDataLocal[talentName]
    return talentInfo?.icon || ''
  } catch (error) {
    console.error('Erreur getIcon:', error)
    return ''
  }
}

export function getTalentDisplayName(poule) {
  try {
    // Utiliser les données locales comme fallback
    const espece = especeDataLocal[poule.especeId]
    const talentName = espece?.talent
    const talentInfo = talentsDataLocal[talentName]
    const icon = talentInfo?.icon || ''
    return `${icon} ${talentName} ${getTalentLevelRoman(poule)}`
  } catch (error) {
    console.error('Erreur getTalentDisplayName:', error)
    return '??? ???'
  }
}

export function usePoules() {
  const rawPoules = ref([])
  const loading = ref(true)
  
  // Utiliser les données synchronisées
  const { especies, talents, getEspeceInfo, getTalentInfo } = useGameData()

  async function fetchPoules() {
    try {
      const token = localStorage.getItem('token')
      
      const res = await fetch('/api/poules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      const data = await res.json()
      rawPoules.value = data
    } catch (err) {
      console.error('Erreur chargement poules:', err)
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchPoules)

  const poules = computed(() => {
    // Accéder correctement aux données d'espèces
    const especiesData = especies.value || {}
    return Object.keys(especiesData).map((id) => {
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
    const especiesData = especies.value || {}
    const espece = especiesData[id]
    if (espece?.image) {
      // Convertir le chemin backend vers le chemin frontend
      const frontendPath = `/src/assets/${espece.image}`
      return chickenImages[frontendPath]?.default || hiddenImage
    }
    return hiddenImage
  }

  function getNom(id) {
    const especiesData = especies.value || {}
    const espece = especiesData[id]
    return espece?.nom || '???'
  }

  function getTalent(id) {
    const especiesData = especies.value || {}
    const espece = especiesData[id]
    return espece?.talent || '???'
  }

  function getCategorie(id) {
    const especiesData = especies.value || {}
    const espece = especiesData[id]
    return espece?.categorie || '???'
  }

  // Fonctions locales du composable pour les talents
  function getTalentInfoLocal(talentName) {
    const talentsData = talents.value || {}
    return talentsData[talentName] || null
  }

  function canUpgradeTalent(poule) {
    const especiesData = especies.value || {}
    const talentsData = talents.value || {}
    const espece = especiesData[poule.especeId]
    const talentInfo = talentsData[espece?.talent]
    const max = talentInfo?.maxNiveau || 1
    return isTalentUnlocked(poule) && getTalentLevel(poule) < max
  }

  function upgradeTalent(poule) {
    if (!canUpgradeTalent(poule)) return false
    poule.niveauTalent = (poule.niveauTalent || 0) + 1
    // Ici, tu peux ajouter un appel API pour sauvegarder la montée de niveau côté serveur
    return true
  }

  // Versions composable des fonctions de talent (utilisent les données synchronisées)
  function getTalentEffectSync(poule) {
    try {
      const especiesData = especies.value || {}
      const talentsData = talents.value || {}
      const espece = especiesData[poule.especeId]
      const niveau = getTalentLevel(poule)
      const talentName = espece?.talent
      const calc = talentsData[talentName]?.calculation

      // Petit évaluateur d'expressions (miroir minimal du serveur)
      function evalExpr(expr, ctx) {
        if (expr == null) return 0
        if (typeof expr === 'number') return expr
        if (typeof expr === 'string') return Number.isFinite(ctx[expr]) ? ctx[expr] : (ctx[expr] ?? 0)
        if (typeof expr === 'object') {
          if (Object.prototype.hasOwnProperty.call(expr, 'var')) {
            const v = expr.var
            return Number.isFinite(ctx[v]) ? ctx[v] : (ctx[v] ?? 0)
          }
          const op = expr.op
          const args = Array.isArray(expr.args) ? expr.args : []
          const vals = args.map(a => evalExpr(a, ctx))
          switch (op) {
            case 'add': return vals.reduce((a, b) => a + b, 0)
            case 'sub': return vals.slice(1).reduce((a, b) => a - b, vals[0] || 0)
            case 'mul': return vals.reduce((a, b) => a * b, 1)
            case 'div': return vals.slice(1).reduce((a, b) => (b === 0 ? a : a / b), vals[0] || 0)
            case 'min': return Math.min(...vals)
            case 'max': return Math.max(...vals)
            default: return 0
          }
        }
        return 0
      }

      // 1) Essayer d'interpréter un bonus de revenu passif (Énergétique) via le DSL
      if (calc && Array.isArray(calc.effects)) {
        const incomeEff = calc.effects.find(e => e?.type === 'income_bonus_per_second')
        if (incomeEff?.amount != null) {
          const perEnergy = evalExpr(incomeEff.amount, { niveau, teamEnergy: 1 })
          const fmt = Number.isInteger(perEnergy) ? `${perEnergy}` : perEnergy.toFixed(1)
          return `+${fmt} de revenu par seconde pour chaque point d'énergie dans l'équipe.`
        }
      }

      // 2) Essayer d'interpréter un stat_buff générique
      if (calc && Array.isArray(calc.effects)) {
        const ctx = { niveau }
        const deltas = { intelligence: 0, energie: 0, charisme: 0 }
        for (const eff of calc.effects) {
          if (!eff || eff.type !== 'stat_buff') continue
          if (eff.target && eff.target !== 'team') continue
          const stats = eff.stats || {}
          for (const key of ['intelligence', 'energie', 'charisme']) {
            if (stats[key] != null) {
              deltas[key] += Number(evalExpr(stats[key], ctx)) || 0
            }
          }
        }
        const parts = []
        if (deltas.intelligence) parts.push(`+${deltas.intelligence} intelligence`)
        if (deltas.energie) parts.push(`+${deltas.energie} énergie`)
        if (deltas.charisme) parts.push(`+${deltas.charisme} charisme`)
        if (parts.length) {
          return `${parts.join(' et ')} à toutes les poules de l'équipe.`
        }
      }

      // 3) Sinon, préférer un texte d'effet plutôt que la description
      //    a) Fallback local (fonctions non sérialisables côté backend)
      const localInfo = talentsDataLocal[talentName]
      if (localInfo && typeof localInfo.effet === 'function') {
        return localInfo.effet(niveau)
      }
      //    b) Si par exception le backend expose une fonction effet, l'utiliser
      const tInfo = talentsData[talentName]
      if (tInfo && typeof tInfo.effet === 'function') {
        return tInfo.effet(niveau)
      }
      //    c) Dernier recours: description (locale ou backend)
      return (localInfo?.description || tInfo?.description || '???')
    } catch (error) {
      console.error('Erreur getTalentEffectSync:', error)
      return '???'
    }
  }

  function getTalentDisplayNameSync(poule) {
    try {
      const especiesData = especies.value || {}
      const talentsData = talents.value || {}
      const espece = especiesData[poule.especeId]
      const talentName = espece?.talent
      const talentInfo = talentsData[talentName]
      const icon = talentInfo?.icon || ''
      return `${icon} ${talentName} ${getTalentLevelRoman(poule)}`
    } catch (error) {
      console.error('Erreur getTalentDisplayNameSync:', error)
      return '??? ???'
    }
  }

  return {
    poules,
    loading,
    // Données synchronisées (utilisez useGameData directement pour accéder aux dernières données)
    especies,
    talents,
    // Fonctions utilitaires
    getNom,
    getImage,
    getTalent,
    getCategorie,
    hiddenImage,
    fetchPoules,
    refreshPoules: fetchPoules, // Alias pour compatibilité
    // Système de talents :
    getTalentInfo: getTalentInfoLocal,
    getTalentLevel,
    canUpgradeTalent,
    upgradeTalent,
    getTalentEffect,
    getIcon,
    getTalentDisplayName,
    getTalentLevelRoman,
    // Versions synchronisées (à utiliser dans les composants)
    getTalentEffectSync,
    getTalentDisplayNameSync,
    // Données locales (DEPRECATED - à supprimer)
    especeData: especeDataLocal,
    talentsData: talentsDataLocal,
  }
}
