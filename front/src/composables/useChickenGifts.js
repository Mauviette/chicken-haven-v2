// composables/useChickenGifts.js
import { ref, reactive, readonly } from 'vue'
import { apiCallJSON, apiPost } from '@/utils/api'
import { usePlayer } from '@/composables/usePlayer'

// Fonction pour créer l'effet d'apparition d'un cadeau avec particules d'étoiles
const createChickenGiftAppearanceEffect = (position) => {
  if (!position || typeof window === 'undefined') return

  const effectX = position.x
  const effectY = position.y

  // Créer des particules d'étoiles autour de la position du cadeau
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div')
    particle.textContent = '✨'
    particle.style.cssText = `
      position: fixed;
      left: ${effectX}px;
      top: ${effectY}px;
      font-size: 16px;
      pointer-events: none;
      z-index: 9997;
      transform: translateX(-50%) translateY(-50%);
      user-select: none;
      opacity: 0;
    `

    document.body.appendChild(particle)

    // Animation des particules : elles apparaissent et s'éloignent
    const angle = (i * 45) * Math.PI / 180 // 45 degrés entre chaque particule (8 particules)
    const distance = 40 + Math.random() * 30
    const endX = Math.cos(angle) * distance
    const endY = Math.sin(angle) * distance

    particle.animate([
      {
        opacity: 0,
        transform: 'translateX(-50%) translateY(-50%) scale(0) rotate(0deg)',
      },
      {
        opacity: 1,
        transform: 'translateX(-50%) translateY(-50%) scale(1.2) rotate(90deg)',
        offset: 0.3
      },
      {
        opacity: 0,
        transform: `translateX(${endX - 50}%) translateY(${endY - 50}%) scale(0.5) rotate(180deg)`,
      }
    ], {
      duration: 1200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      delay: Math.random() * 200 // Délai aléatoire pour plus de naturel
    })

    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove()
      }
    }, 1400)
  }

  // Petit effet de lueur sur le cadeau lui-même
  const glowEffect = document.createElement('div')
  glowEffect.style.cssText = `
    position: fixed;
    left: ${effectX}px;
    top: ${effectY}px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,215,0,0.3) 50%, transparent 100%);
    pointer-events: none;
    z-index: 9996;
    transform: translateX(-50%) translateY(-50%);
    animation: gift-appear-glow 0.8s ease-out forwards;
  `

  document.body.appendChild(glowEffect)

  setTimeout(() => {
    if (glowEffect.parentNode) {
      glowEffect.remove()
    }
  }, 800)
}

// Ajouter les styles CSS pour les animations de cadeaux
if (typeof document !== 'undefined' && !document.getElementById('chicken-gift-styles')) {
  const style = document.createElement('style')
  style.id = 'chicken-gift-styles'
  style.textContent = `
    @keyframes gift-appear-glow {
      0% {
        opacity: 0;
        transform: translateX(-50%) translateY(-50%) scale(0.5);
      }
      50% {
        opacity: 1;
        transform: translateX(-50%) translateY(-50%) scale(1.2);
      }
      100% {
        opacity: 0;
        transform: translateX(-50%) translateY(-50%) scale(1.5);
      }
    }
  `
  document.head.appendChild(style)
}

// Fonction pour créer l'effet visuel de récompense de cadeau
const createChickenGiftRewardEffect = (reward, position = null) => {
  if (!reward || typeof window === 'undefined') return

  // Déterminer le texte et l'icône selon le type de récompense
  let text = ''
  let icon = ''
  let color = '#FFD700'

  if (reward.type === 'resource') {
    switch (reward.resource) {
      case 'eggs':
        text = `+${reward.amount}`
        icon = '🥚'
        color = '#FFD700'
        break
      case 'stock_tokens':
        text = `+${reward.amount}`
        icon = '🧺'
        color = '#ec864bff'
        break
      case 'production_tokens':
        text = `+${reward.amount}`
        icon = '⚙️'
        color = '#3f3f3fff'
        break
      case 'mining_token':
        text = `+${reward.amount}`
        icon = '🪨'
        color = '#acacacff'
        break
      case 'rotten_tomato':
        text = `+${reward.amount}`
        icon = '🍅'
        color = '#8B4513'
        break
      default:
        text = `+${reward.amount}`
        icon = '🎁'
        color = '#FFD700'
    }
  }

  if (!text) return

  // Rotation aléatoire pour le texte
  const randomRotation = (Math.random() - 0.5) * 40 // Entre -20 et +20 degrés

  // Position : utiliser la position fournie ou le centre de l'écran par défaut
  let effectX, effectY
  if (position && typeof position.x === 'number' && typeof position.y === 'number') {
    effectX = position.x
    effectY = position.y
  } else {
    // Position centrale de l'écran par défaut
    effectX = window.innerWidth / 2
    effectY = window.innerHeight / 2
  }

  // Effet principal du nombre avec icône
  const effectEl = document.createElement('div')
  effectEl.textContent = `${text} ${icon}`
  effectEl.className = 'chicken-gift-reward-effect'
  effectEl.style.cssText = `
    position: fixed;
    left: ${effectX}px;
    top: ${effectY}px;
    font-size: 24px;
    font-weight: 900;
    color: ${color};
    text-shadow: 3px 3px 6px rgba(0,0,0,0.9), 0 0 15px ${color}88;
    pointer-events: none;
    z-index: 9999;
    transform: translateX(-50%) translateY(-50%) rotate(${randomRotation}deg);
    font-family: 'Fredoka', sans-serif;
    letter-spacing: 2px;
    user-select: none;
  `

  document.body.appendChild(effectEl)

  // Créer des particules d'étoiles autour
  for (let i = 0; i < 10; i++) {
    const particle = document.createElement('div')
    particle.textContent = '✨'
    particle.style.cssText = `
      position: fixed;
      left: ${effectX}px;
      top: ${effectY}px;
      font-size: 20px;
      pointer-events: none;
      z-index: 9998;
      transform: translateX(-50%) translateY(-50%);
      user-select: none;
    `

    document.body.appendChild(particle)

    // Animation des particules dans différentes directions
    const angle = (i * 36) * Math.PI / 180 // 36 degrés entre chaque particule (10 particules)
    const distance = 80 + Math.random() * 60
    const endX = Math.cos(angle) * distance
    const endY = Math.sin(angle) * distance

    particle.animate([
      {
        opacity: 0,
        transform: 'translateX(-50%) translateY(-50%) scale(0) rotate(0deg)',
      },
      {
        opacity: 1,
        transform: 'translateX(-50%) translateY(-50%) scale(1.5) rotate(180deg)',
        offset: 0.2
      },
      {
        opacity: 0,
        transform: `translateX(${endX - 50}%) translateY(${endY - 50}%) scale(0.3) rotate(360deg)`,
      }
    ], {
      duration: 2000,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    })

    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove()
      }
    }, 2000)
  }

  // Animation du texte principal
  effectEl.animate([
    {
      opacity: 0,
      transform: `translateX(-50%) translateY(-50%) scale(0.3) rotate(${randomRotation}deg)`,
      filter: 'brightness(2)'
    },
    {
      opacity: 1,
      transform: `translateX(-50%) translateY(-50%) scale(1.6) rotate(${randomRotation}deg)`,
      filter: 'brightness(1.6)',
      offset: 0.25
    },
    {
      opacity: 1,
      transform: `translateX(-50%) translateY(-50%) scale(1.3) rotate(${randomRotation}deg)`,
      filter: 'brightness(1.3)',
      offset: 0.6
    },
    {
      opacity: 0,
      transform: `translateX(-50%) translateY(-50%) scale(0.8) rotate(${randomRotation}deg)`,
      filter: 'brightness(1)'
    }
  ], {
    duration: 2500,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  })

  setTimeout(() => {
    if (effectEl.parentNode) {
      effectEl.remove()
    }
  }, 2500)
}

const activeGifts = ref([])
const isLoading = ref(false)
const lastCheck = ref(0)
const CHECK_INTERVAL = 10000 // Vérifier toutes les 10 secondes (au lieu de 5 pour les tests)

// État réactif pour les cadeaux actifs par poule
const giftsByChicken = reactive({})

// Garder une trace des cadeaux précédents pour détecter les nouveaux
let previousGifts = new Set()

export function useChickenGifts() {
  const { refreshPlayerData } = usePlayer()
  // Vérifier les cadeaux disponibles
  const checkAvailableGifts = async () => {
    try {
      isLoading.value = true
      const response = await apiCallJSON('/api/chicken-gifts/check')

      if (response.gifts) {
        activeGifts.value = response.gifts
        lastCheck.value = Date.now()

        // Mettre à jour l'état par poule
        const newGiftsByChicken = {}
        response.gifts.forEach(gift => {
          newGiftsByChicken[gift.especeId] = gift
        })

        // Détecter les nouveaux cadeaux apparus
        const currentGiftIds = new Set(response.gifts.map(g => g.id))
        const newGiftIds = [...currentGiftIds].filter(id => !previousGifts.has(id))

        // Pour chaque nouveau cadeau, déclencher l'animation d'apparition
        newGiftIds.forEach(giftId => {
          const gift = response.gifts.find(g => g.id === giftId)
          if (gift) {
            // Trouver la position de la poule (si elle est visible)
            const chickenElement = document.querySelector(`[data-espece-id="${gift.especeId}"]`) ||
                                 document.querySelector('.parade-chicken') // Fallback

            if (chickenElement) {
              const rect = chickenElement.getBoundingClientRect()
              const position = {
                x: rect.left + rect.width / 2,
                y: rect.top - 25 // Légèrement au-dessus de la poule
              }
              createChickenGiftAppearanceEffect(position)
            }
          }
        })

        // Mettre à jour la liste des cadeaux précédents
        previousGifts = currentGiftIds

        // Nettoyer l'ancien état et mettre à jour
        Object.keys(giftsByChicken).forEach(especeId => {
          if (!newGiftsByChicken[especeId]) {
            delete giftsByChicken[especeId]
          }
        })

        Object.assign(giftsByChicken, newGiftsByChicken)
      } else {
      }
    } catch (error) {
      console.error('[ChickenGifts:FE] Erreur lors de la vérification des cadeaux:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Collecter un cadeau
  const collectGift = async (especeId, position = null) => {
    try {
      const gift = giftsByChicken[especeId]
      if (!gift) {
        return
      }

      const giftId = gift.id

      const response = await apiPost('/api/chicken-gifts/collect', { giftId, especeId })

      if (response.success) {
        // Supprimer le cadeau de l'état local
        delete giftsByChicken[especeId]
        activeGifts.value = activeGifts.value.filter(g => g.id !== giftId)

        // Afficher l'effet visuel de récompense
        const reward = response.reward
        if (reward) {
          createChickenGiftRewardEffect(reward, position)
        }

        // Rafraîchir les données du joueur (œufs et tokens)
        try {
          await refreshPlayerData()
        } catch (error) {
          console.warn('[ChickenGifts:FE] Erreur lors du rafraîchissement des données joueur:', error)
        }

        // Plus de toast lors de la collecte

        return response
      } else {
      }
    } catch (error) {
      console.error('[ChickenGifts:FE] Erreur lors de la collecte du cadeau:', error)
      if (window.$toast) {
        window.$toast('Erreur lors de la collecte du cadeau', 'error')
      }
      throw error
    }
  }

  // Vérifier si une poule a un cadeau actif
  const hasActiveGift = (especeId) => {
    const hasGift = !!giftsByChicken[especeId]
    return hasGift
  }

  // Obtenir le cadeau actif d'une poule
  const getActiveGift = (especeId) => {
    return giftsByChicken[especeId]
  }

  // Démarrer la vérification périodique
  const startPeriodicCheck = () => {
    const check = async () => {
      if (Date.now() - lastCheck.value >= CHECK_INTERVAL) {
        await checkAvailableGifts()
      }
    }

    // Vérifier immédiatement
    check()

    // Puis vérifier périodiquement
    const intervalId = setInterval(() => {
      check()
    }, CHECK_INTERVAL)

    // Retourner une fonction pour arrêter
    return () => {
      clearInterval(intervalId)
    }
  }

  // Obtenir la configuration des cadeaux
  const getGiftConfig = async () => {
    try {
      const response = await apiCallJSON('/api/chicken-gifts/config')
      return response.config
    } catch (error) {
      console.error('[ChickenGifts:FE] Erreur lors de la récupération de la config:', error)
      return null
    }
  }

  return {
    activeGifts: readonly(activeGifts),
    giftsByChicken: readonly(giftsByChicken),
    isLoading: readonly(isLoading),
    checkAvailableGifts,
    collectGift,
    hasActiveGift,
    getActiveGift,
    startPeriodicCheck,
    getGiftConfig
  }
}