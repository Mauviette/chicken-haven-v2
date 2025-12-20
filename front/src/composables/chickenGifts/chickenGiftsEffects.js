// composables/chickenGifts/chickenGiftsEffects.js
// Effets visuels pour les cadeaux de poules

/**
 * Créer l'effet d'apparition d'un cadeau avec particules d'étoiles
 */
export function createChickenGiftAppearanceEffect(position) {
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
    const angle = (i * 45) * Math.PI / 180
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
      delay: Math.random() * 200
    })

    setTimeout(() => {
      if (particle.parentNode) {
        particle.remove()
      }
    }, 1400)
  }

  // Effet de lueur
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

/**
 * Déterminer le texte, icône et couleur pour un type de récompense
 */
function getRewardDisplay(reward) {
  if (!reward || reward.type !== 'resource') return null

  const displays = {
    eggs: { icon: '🥚', color: '#FFD700' },
    stock_tokens: { icon: '🧺', color: '#ec864bff' },
    production_tokens: { icon: '⚙️', color: '#3f3f3fff' },
    mining_token: { icon: '🪨', color: '#acacacff' },
    rotten_tomato: { icon: '🍅', color: '#8B4513' }
  }

  const display = displays[reward.resource] || { icon: '🎁', color: '#FFD700' }
  return {
    text: `+${reward.amount}`,
    icon: display.icon,
    color: display.color
  }
}

/**
 * Créer les particules d'étoiles pour l'effet de récompense
 */
function createRewardParticles(effectX, effectY) {
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

    const angle = (i * 36) * Math.PI / 180
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
}

/**
 * Créer l'élément principal de texte de récompense
 */
function createRewardTextElement(effectX, effectY, display) {
  const randomRotation = (Math.random() - 0.5) * 40

  const effectEl = document.createElement('div')
  effectEl.textContent = `${display.text} ${display.icon}`
  effectEl.className = 'chicken-gift-reward-effect'
  effectEl.style.cssText = `
    position: fixed;
    left: ${effectX}px;
    top: ${effectY}px;
    font-size: 24px;
    font-weight: 900;
    color: ${display.color};
    text-shadow: 3px 3px 6px rgba(0,0,0,0.9), 0 0 15px ${display.color}88;
    pointer-events: none;
    z-index: 9999;
    transform: translateX(-50%) translateY(-50%) rotate(${randomRotation}deg);
    font-family: 'Fredoka', sans-serif;
    letter-spacing: 2px;
    user-select: none;
  `

  document.body.appendChild(effectEl)

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

/**
 * Créer l'effet visuel de récompense de cadeau
 */
export function createChickenGiftRewardEffect(reward, position = null) {
  if (!reward || typeof window === 'undefined') return

  const display = getRewardDisplay(reward)
  if (!display) return

  // Position : fournie ou centre de l'écran par défaut
  let effectX, effectY
  if (position && typeof position.x === 'number' && typeof position.y === 'number') {
    effectX = position.x
    effectY = position.y
  } else {
    effectX = window.innerWidth / 2
    effectY = window.innerHeight / 2
  }

  createRewardTextElement(effectX, effectY, display)
  createRewardParticles(effectX, effectY)
}

/**
 * Initialiser les styles CSS pour les animations de cadeaux
 */
export function initChickenGiftStyles() {
  if (typeof document === 'undefined' || document.getElementById('chicken-gift-styles')) {
    return
  }

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
