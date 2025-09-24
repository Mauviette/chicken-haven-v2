// Données des succès
export const achievementsData = {
  'eggs': {
    id: 'eggs',
    nom: 'œufs',
    nom_singulier: 'œuf',
    icon: '🥚'
  },
  'stock_token': {
    id: 'stock_token',
    nom: 'jeton de stock',
    nom_singulier: 'jeton de stock',
    icon: '📦'
  },
  'production_token': {
    id: 'production_token',
    nom: 'jetons de production',
    nom_singulier: 'jeton de production',
    icon: '⚡'
  },
  'wild_token': {
    id: 'wild_token',
    nom: 'jetons joker',
    nom_singulier: 'jeton joker',
    icon: '🃏'
  }
}

// Fonction pour formater un prix avec la bonne unité
export function formatPrice(price) {
  if (typeof price === 'number') {
    // Prix simple en œufs
    const itemData = achievementsData['eggs']
    return `${price} ${price === 1 ? itemData.nom_singulier : itemData.nom}`
  }
  
  if (typeof price === 'object' && price.type && price.count) {
    const itemData = achievementsData[price.type]
    if (itemData) {
      return `${price.count} ${price.count === 1 ? itemData.nom_singulier : itemData.nom}`
    }
  }
  
  return 'Prix invalide'
}

// Fonction pour obtenir l'icône d'un type de ressource
export function getResourceIcon(resourceType) {
  const itemData = achievementsData[resourceType]
  return itemData ? itemData.icon : '❓'
}