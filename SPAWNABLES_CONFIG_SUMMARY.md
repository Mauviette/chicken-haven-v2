# Système de Spawnables Configurable

## Changements effectués

### 🚫 **Suppression de la limite globale**
- Retiré `MAX_SPAWNABLES_PER_USER = 30`
- Chaque type de spawnable a maintenant sa propre limite

### ⚙️ **Configuration complète par constantes**

#### **Configuration globale :**
```javascript
const GLOBAL_SPAWN_RATE = 1.0           // Taux de spawn global (100%)
const SPAWNABLE_LIFETIME = 30000        // Durée de vie (30 secondes)
const CLEANUP_INTERVAL = 5000           // Nettoyage (5 secondes)
```

#### **Configuration par type d'objet :**
```javascript
const SPAWNABLE_TYPE_CONFIG = {
  white_egg: {
    baseSpawnRate: 1.0,        // Taux de base
    maxActivePerUser: 5,       // Limite par utilisateur
    cooldownMultiplier: 1.0,   // Multiplicateur cooldown
    priorityWeight: 1.0        // Poids de priorité
  },
  chocolate: {
    baseSpawnRate: 0.7,        // Plus rare
    maxActivePerUser: 3,       
    cooldownMultiplier: 1.5,   // Cooldown plus long
    priorityWeight: 2.0        // Plus prioritaire
  },
  golden_egg: {
    baseSpawnRate: 0.3,        // Très rare
    maxActivePerUser: 1,       
    cooldownMultiplier: 3.0,   // Cooldown très long
    priorityWeight: 5.0        // Très prioritaire
  }
}
```

#### **Configuration par talent :**
```javascript
const TALENT_SPAWN_CONFIG = {
  // Exemples de surcharges par talent
  // 'nom_du_talent': {
  //   spawnRateMultiplier: 1.5,
  //   cooldownMultiplier: 0.8,
  //   maxActiveOverride: 10
  // }
}
```

### 🎯 **Nouvelles fonctionnalités**

1. **Limites individuelles** : Chaque type d'objet a sa limite propre
2. **Multiplicateurs configurables** : Cooldowns et taux personnalisables
3. **Système de priorité** : Les objets rares ont la priorité
4. **Configuration par talent** : Surcharges possibles par talent
5. **API de configuration** : `GET /api/spawnables/config`
6. **Logging amélioré** : Affiche les taux et types utilisés

### 📊 **Nouvelle route API**
```
GET /api/spawnables/config
```
Retourne la configuration complète du système de spawnables.

### 📁 **Fichier de configuration d'exemple**
Créé `back/src/config/spawnables.config.js` avec :
- Exemples de configurations avancées
- Presets pour différentes difficultés
- Documentation complète
- Configurations événementielles

### 🔧 **Comment personnaliser**

1. **Modifier les taux globaux** :
   ```javascript
   const GLOBAL_SPAWN_RATE = 0.5  // Réduire à 50%
   ```

2. **Ajouter un nouveau type** :
   ```javascript
   SPAWNABLE_TYPE_CONFIG.my_item = {
     baseSpawnRate: 0.2,
     maxActivePerUser: 2,
     cooldownMultiplier: 2.0,
     priorityWeight: 3.0
   }
   ```

3. **Configurer un talent spécial** :
   ```javascript
   TALENT_SPAWN_CONFIG.super_talent = {
     spawnRateMultiplier: 2.0,
     cooldownMultiplier: 0.5,
     maxActiveOverride: 15
   }
   ```

### 🛡️ **Anti-exploit conservé**
- Le système reste entièrement basé sur la base de données
- Aucun cache mémoire utilisé
- Impossible d'exploiter avec plusieurs onglets

### 📈 **Avantages**
- ✅ Configuration flexible sans redémarrage
- ✅ Équilibrage fin par type d'objet
- ✅ Gestion des événements spéciaux possible
- ✅ Logs détaillés pour le debug
- ✅ API pour monitoring en temps réel
- ✅ Documentation complète

Le système est maintenant entièrement configurable et facilement extensible !