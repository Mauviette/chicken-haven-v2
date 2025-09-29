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
    const now = performance.now()
    const endX = targetRect.left + targetRect.width / 2
    const endY = targetRect.top + targetRect.height / 2

    const n = Math.min(Math.max(Math.floor(count), 1), 20)
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div')
      el.textContent = '🫐'
      el.style.position = 'fixed'
      el.style.left = `${start.left + start.width / 2}px`
      el.style.top = `${start.top + start.height / 2}px`
      el.style.pointerEvents = 'none'
      el.style.zIndex = 100000
      el.style.fontSize = '18px'
      el.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out'
      document.body.appendChild(el)
      created.push(el)

      // petite dispersion initiale
      const dx0 = (Math.random() - 0.5) * 30
      const dy0 = (Math.random() - 0.5) * 20
      el.style.transform = `translate(${dx0}px, ${dy0}px)`

      // voler vers la cible au prochain frame
      requestAnimationFrame(() => {
        const dx = endX - (start.left + start.width / 2) - dx0
        const dy = endY - (start.top + start.height / 2) - dy0
        el.style.transform = `translate(${dx}px, ${dy}px) scale(0.6)`
        el.style.opacity = '0'
      })
    }

    // cleanup
    setTimeout(() => {
      created.forEach(el => el.remove())
    }, duration)
  } catch (_) { /* noop */ }
}
