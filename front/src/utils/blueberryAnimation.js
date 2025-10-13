// utils/blueberryAnimation.js
// Animation simple de myrtilles qui "volent" d'un point de départ vers l'avatar (ancre #avatar-anchor)

export function flyBlueberriesToAvatar({ count = 1, startRect, duration = 800 } = {}) {
  try {
    let target = document.getElementById('avatar-anchor')
    
    // Fallback: chercher une image avatar visible si l'ancre n'est pas encore montée
    if (!target) {
      const candidate = document.querySelector('img.avatar')
      if (candidate) target = candidate
    }
    if (!target) return

    const targetRect = target.getBoundingClientRect()
    const start = startRect || targetRect // fallback au cas où

    const created = []
    const endX = targetRect.left + targetRect.width / 2
    const endY = targetRect.top + targetRect.height / 2
    const n = Math.min(Math.max(Math.floor(count), 1), 20)
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div')
      el.textContent = '🫐'
      el.style.cssText = `
        position: fixed;
        left: ${start.left + start.width / 2}px;
        top: ${start.top + start.height / 2}px;
        pointer-events: none;
        z-index: 9999;
        font-size: 18px;
        line-height: 1;
        user-select: none;
        transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.8s ease-out;
      `
      document.body.appendChild(el)
      created.push(el)

      // petite dispersion initiale
      const dx0 = (Math.random() - 0.5) * 40
      const dy0 = (Math.random() - 0.5) * 30
      el.style.transform = `translate(${dx0}px, ${dy0}px) scale(1)`

      // voler vers la cible au prochain frame
      setTimeout(() => {
        const dx = endX - (start.left + start.width / 2) - dx0
        const dy = endY - (start.top + start.height / 2) - dy0
        el.style.transform = `translate(${dx}px, ${dy}px) scale(0.5)`
        el.style.opacity = '0'
      }, 50 + i * 100)
    }

    // cleanup
    setTimeout(() => {
      created.forEach(el => {
        if (el.parentNode) {
          el.remove()
        }
      })
    }, duration + 500)
    
  } catch (error) {
    console.error('🫐 Animation error:', error)
  }
}

// Test function for debugging
export function testBlueberryAnimation() {
  flyBlueberriesToAvatar({ count: 3, duration: 2000 })
}
