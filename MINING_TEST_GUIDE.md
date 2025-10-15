# Guide de Test - Mini-jeu de Minage

## Tests Backend

### 1. Démarrer le serveur backend
```bash
cd back
npm run dev
```

### 2. Vérifier que les routes sont enregistrées
Le serveur devrait afficher les routes disponibles, incluant :
- GET /api/mining/state
- POST /api/mining/start
- POST /api/mining/dig

### 3. Tests API avec curl ou Postman

#### Obtenir l'état du jeu
```bash
curl -X GET http://localhost:3000/api/mining/state \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Démarrer une partie
```bash
curl -X POST http://localhost:3000/api/mining/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Creuser une case
```bash
curl -X POST http://localhost:3000/api/mining/dig \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"row": 2, "col": 2}'
```

## Tests Frontend

### 1. Démarrer le serveur frontend
```bash
cd front
npm run dev
```

### 2. Connectez-vous à votre compte

### 3. Allez sur la page Production
- L'icône 🪨 devrait apparaître dans la barre des stats d'équipe
- Elle devrait être à droite après les stats (🧠 Intelligence, ⚡ Énergie, ✨ Charisme)

### 4. Cliquer sur l'icône 🪨
Le popup du mini-jeu devrait s'ouvrir avec :
- Titre "⛏️ Mini-jeu de Minage"
- Nombre de jetons en haut à droite
- Bouton "Démarrer (1 🪨)"

### 5. Démarrer une partie
- Cliquer sur "Démarrer"
- Une grille 5x5 devrait apparaître
- Une pile d'outils devrait apparaître à droite

### 6. Tester le gameplay
- **Survol** : Survoler les cases affiche une preview (contour blanc)
- **Clic** : Cliquer creuse la case
  - Avec la pelle 🔨 : Creuse uniquement la case cliquée
  - Avec la pioche ⛏️ : Creuse la case + 4 cases adjacentes (croix)
- **Progression** : Chaque clic consomme un outil (la pile se vide)
- **Visuels** : Les cases changent d'apparence selon leur HP
  - 3 HP = Terre intacte
  - 2 HP = Légères fissures
  - 1 HP = Lourdes fissures
  - 0 HP = Case creusée (texture de roche)
- **Récompenses** : Quand HP = 0 et qu'il y a une récompense, elle s'affiche

### 7. Fin de partie
- Quand tous les outils sont utilisés
- Un écran de résultats s'affiche
- Les récompenses sont listées
- Bouton "Rejouer (1 🪨)" pour recommencer

## Points à vérifier

### Fonctionnalité
- [ ] L'icône 🪨 apparaît dans Production.vue
- [ ] Le popup s'ouvre au clic
- [ ] Le nombre de jetons est affiché correctement
- [ ] Le bouton "Démarrer" fonctionne
- [ ] La grille se génère correctement
- [ ] Les outils s'affichent dans la pile
- [ ] Le survol affiche la preview
- [ ] Le clic creuse les bonnes cases
- [ ] Les visuels changent selon les HP
- [ ] Les récompenses s'affichent
- [ ] L'écran de fin s'affiche
- [ ] Les ressources sont mises à jour

### Sécurité
- [ ] Impossible de creuser sans jeton
- [ ] Les récompenses ne sont pas visibles dans le network tab
- [ ] Les calculs sont faits côté serveur
- [ ] La partie est sauvegardée en DB

### UI/UX
- [ ] Les couleurs sont cohérentes (bois/pierre)
- [ ] Les animations sont fluides
- [ ] Le curseur change selon l'outil
- [ ] La police Fredoka est utilisée
- [ ] Le design est "mignon"
- [ ] Responsive sur mobile

## Bugs potentiels à surveiller

1. **Jetons négatifs** : Vérifier qu'on ne peut pas démarrer avec 0 jeton
2. **Double-clic** : Vérifier qu'un double-clic rapide n'utilise pas 2 outils
3. **Refresh** : Vérifier que la partie reprend après un refresh
4. **Récompenses** : Vérifier que les récompenses sont bien ajoutées
5. **Curseur** : Vérifier que les curseurs personnalisés s'affichent

## Commandes utiles

### Donner des jetons à un utilisateur (MongoDB)
```javascript
db.users.updateOne(
  { username: "test_user" },
  { $set: { "resources.mining_token": 10 } }
)
```

### Voir l'état du jeu d'un utilisateur
```javascript
db.users.findOne(
  { username: "test_user" },
  { miningGame: 1, "resources.mining_token": 1 }
)
```

### Réinitialiser une partie
```javascript
db.users.updateOne(
  { username: "test_user" },
  { $set: { "miningGame.active": false } }
)
```

## Scénarios de test avancés

### Test 1 : Partie complète
1. Démarrer avec 3 jetons
2. Jouer une partie complète
3. Vérifier les récompenses
4. Vérifier qu'il reste 2 jetons

### Test 2 : Refresh pendant une partie
1. Démarrer une partie
2. Creuser quelques cases
3. Rafraîchir la page (F5)
4. Rouvrir le mini-jeu
5. Vérifier que la partie reprend où elle en était

### Test 3 : Récupération d'un jeton
1. Jouer jusqu'à trouver un jeton de minage 🪨
2. Finir la partie
3. Vérifier que le compteur de jetons a augmenté

### Test 4 : Sans jeton
1. Utiliser tous les jetons
2. Essayer d'ouvrir le mini-jeu
3. Vérifier qu'un message d'erreur s'affiche

## Résultat attendu

✅ Le prototype est fonctionnel et joue comme prévu
✅ L'état est sauvegardé côté serveur
✅ Les récompenses sont sécurisées
✅ L'interface est agréable et intuitive
