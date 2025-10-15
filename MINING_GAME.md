# Mini-jeu de Minage - Documentation

## Vue d'ensemble

Le mini-jeu de minage permet aux joueurs de creuser une grille pour découvrir des récompenses cachées.

## Fonctionnalités

### Backend (`/back/src`)

- **Modèle** : `models/User.js` - Schéma étendu avec :
  - `resources.mining_token` : Jetons de minage (par défaut : 3)
  - `miningGame` : État de la partie en cours
  
- **Contrôleur** : `controllers/mining.controller.js`
  - `GET /api/mining/state` : Récupère l'état du jeu
  - `POST /api/mining/start` : Démarre une nouvelle partie (coût : 1 jeton)
  - `POST /api/mining/dig` : Creuse une case avec l'outil actuel

- **Routes** : `routes/mining.routes.js`

### Frontend (`/front/src`)

- **Composant** : `components/menu/MiningGame.vue` - Popup du mini-jeu
- **Composable** : `composables/useMining.js` - Gestion de l'état et des appels API
- **Données** : `data/mining.js` - Configuration des outils et récompenses
- **Intégration** : `views/Production.vue` - Icône 🪨 pour ouvrir le mini-jeu

## Configuration du Jeu

### Grille
- Taille : 5x5 cases
- HP par case : 3 (parfaite) → 2 (fissures légères) → 1 (fissures lourdes) → 0 (creusée)
- 40% de chance qu'une case contienne une récompense

### Outils

#### Pelle 🔨
- Dégâts : 3 HP
- Pattern : Case unique
- Description : Frappe directement la case visée

#### Pioche ⛏️
- Dégâts : 2 HP (case centrale) + 1 HP (cases adjacentes)
- Pattern : Croix (+)
- Description : Frappe en croix (4 directions)

### Récompenses Possibles

| Récompense | Icône | Poids | Quantités |
|------------|-------|-------|-----------|
| Œufs | 🥚 | 40% | 10, 25, 50 |
| Jeton de minage | 🪨 | 10% | 1 |
| Jeton de stock | 📦 | 8% | 1 |
| Jeton de production | ⚡ | 2% | 1 |

## Gameplay

1. **Démarrage** : Cliquer sur l'icône 🪨 dans Production → Consomme 1 jeton
2. **Creusage** : Cliquer sur une case pour utiliser l'outil actuel
3. **Preview** : Survol affiche les cases qui seront affectées
4. **Progression** : Chaque clic consomme un outil
5. **Fin de partie** : Quand tous les outils sont utilisés
6. **Récompenses** : Automatiquement ajoutées aux ressources

## Sécurité

- Tous les calculs sont effectués côté serveur
- L'état de la partie est sauvegardé dans la base de données
- Les récompenses ne sont révélées qu'après avoir creusé une case
- Impossible de tricher en inspectant le frontend

## Style Graphique

- Couleurs : Bois (#8b6914), Pierre (#5a4a3a), Paille (#ffc66e)
- Police : Fredoka
- Direction artistique : Mignonne et accueillante
- Animations : Preview interactive des impacts

## Personnalisation

Pour modifier la configuration du jeu, éditer :
- Backend : `back/src/controllers/mining.controller.js` → `MINING_CONFIG`
- Frontend : `front/src/data/mining.js` → `MINING_CONFIG`

⚠️ Important : Les deux configurations doivent rester synchronisées !

## Scripts Utiles

Pour donner des jetons de minage à tous les joueurs :
```javascript
// Dans MongoDB
db.users.updateMany({}, { $set: { "resources.mining_token": 5 } })
```

Pour réinitialiser une partie en cours :
```javascript
db.users.updateOne(
  { username: "nom_utilisateur" }, 
  { $set: { "miningGame.active": false } }
)
```
