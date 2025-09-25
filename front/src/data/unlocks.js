// Définir ici ce qui se débloque à chaque niveau
// Exemple: niveau 2 -> Marché
export const levelUnlocks = {
  2: [
    { id: 'market', label: 'Marché débloqué', icon: '🛒' }
  ],
  3: [
  ],
  // Ajoutez d'autres niveaux selon la progression de votre jeu
}

export function getUnlocksBetween(from, to) {
  const unlocked = []
  for (let lvl = Math.max(1, from + 1); lvl <= to; lvl++) {
    if (levelUnlocks[lvl]) unlocked.push(...levelUnlocks[lvl])
  }
  return unlocked
}
