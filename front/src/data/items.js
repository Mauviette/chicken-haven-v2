// Données des succès
export const achievementsData = {
  'eggs': {
    id: 'eggs',
    nom: 'œufs',
    nom_singulier: 'œuf',
    icon: '🥚',
    description: 'La monnaie principale de votre ferme. Récoltez-les sur la page de production et utilisez-les pour acheter des boîtes et des améliorations.'
  },
  'stock_token': {
    id: 'stock_token',
    nom: 'jeton de stock',
    nom_singulier: 'jeton de stock',
    icon: '📦',
    description: 'Jetons spéciaux permettant d\'acheter des améliorations de stockage.'
  },
  'production_token': {
    id: 'production_token',
    nom: 'jetons de production',
    nom_singulier: 'jeton de production',
    icon: '⚡',
    description: 'Jetons précieux pour améliorer vos installations de production.'
  },
  'wild_token': {
    id: 'wild_token',
    nom: 'jetons joker',
    nom_singulier: 'jeton joker',
    icon: '🃏',
    description: 'Jetons universels pouvant être utilisés à la place de n\'importe quelle autre jeton.'
  },
  'blueberry': {
    id: 'blueberry',
    nom: 'myrtilles',
    nom_singulier: 'myrtille',
    icon: '🫐',
    description: 'Fruits délicieux qui augmentent votre niveau! Survolez votre icone de profil pour plus d\'infos.'
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

export function formatString(type, count) {
  const itemData = achievementsData[type];
  if (!itemData || typeof count !== 'number') return 'Valeur invalide';
  return `${count} ${count === 1 ? itemData.nom_singulier : itemData.nom}`;
}