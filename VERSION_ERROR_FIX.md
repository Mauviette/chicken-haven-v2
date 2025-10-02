# Fix pour les conflits de version MongoDB (VersionError)

## Problème
Erreur fréquente lors d'opérations simultanées sur le même document utilisateur :
```
VersionError: No matching document found for id "..." version XXX modifiedPaths "..."
```

## Cause
- Plusieurs requêtes modifient le même document utilisateur en parallèle
- MongoDB utilise un système de versioning optimiste pour éviter les corruptions
- Quand deux opérations tentent de sauvegarder des versions différentes du même document, l'une échoue

## Solution implémentée

### 1. Utilitaire de retry (`utils/mongoUtils.js`)
- `executeWithRetry()` : Retry automatique pour toute opération
- `saveWithRetry()` : Retry spécifique pour la sauvegarde de documents

### 2. Stratégie
- **Retry automatique** : Jusqu'à 3 tentatives avec délai exponentiel
- **Reload automatique** : Recharge le document depuis la DB à chaque tentative
- **Opérations atomiques** : Regroupement des modifications en une seule transaction

### 3. Contrôleurs mis à jour
- ✅ `box.controller.js` : Opération atomique complète pour l'ouverture de boîtes
- ✅ `spawnables.controller.js` : Retry sur toutes les sauvegardes utilisateur
- ✅ `egg.controller.js` : Retry sur les clics d'œufs
- 🔄 Autres contrôleurs à mettre à jour si nécessaire

### 4. Avantages
- **Transparence** : L'utilisateur ne voit plus les erreurs de conflit
- **Robustesse** : Les opérations simultanées fonctionnent maintenant
- **Performance** : Pas d'impact sur les cas normaux (sans conflit)

## Usage

```javascript
import { saveWithRetry, executeWithRetry } from '../utils/mongoUtils.js'

// Sauvegarde simple avec retry
await saveWithRetry(user)

// Opération complexe avec retry
await executeWithRetry(async () => {
  const user = await User.findById(userId)
  user.someField = newValue
  await user.save()
  return user
}, 3, 'Update user field')
```

## Tests
Pour reproduire le problème (avant fix) :
1. Ouvrir plusieurs boîtes très rapidement
2. Cliquer sur l'œuf et des spawnables simultanément
3. Utiliser plusieurs onglets avec le même compte