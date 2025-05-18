````md
# 🐔 Chicken Haven – Backend API

API Express + MongoDB pour le jeu web **Chicken Haven**.

## 🚀 Démarrage

### 1. Installer les dépendances

```bash
npm install
````

### 2. Variables d’environnement

Créer un fichier `.env` à la racine :

```
PORT=3001
MONGO_URI=mongodb://localhost:27017/chicken-haven
JWT_SECRET=supersecretkey
```

### 3. Lancer le serveur

```bash
npm run dev
```

> Le serveur tourne par défaut sur [http://localhost:3001/](http://localhost:3001/)

---

## 📁 Structure

```
src/
├── controllers/
│   └── poules.controller.js
├── middleware/
│   └── auth.middleware.js
├── models/
│   └── User.js
├── routes/
│   ├── auth.routes.js
│   └── poules.routes.js
└── index.js
```

---

## 🔐 Authentification

* JWT (JSON Web Token) dans le header `Authorization: Bearer <token>`
* Requis pour toutes les routes protégées (ex: `/api/poules`)

---

## 📌 Routes disponibles

### 📦 Auth

| Méthode | Route                | Description             |
| ------- | -------------------- | ----------------------- |
| POST    | `/api/auth/login`    | Connexion utilisateur   |
| POST    | `/api/auth/register` | Inscription utilisateur |

**Body JSON** pour les deux :

```json
{
  "username": "poulefan",
  "password": "123456"
}
```

---

### 🐣 Poules

> Nécessite d’être connecté via JWT

| Méthode | Route                   | Description                                     |
| ------- | ----------------------- | ----------------------------------------------- |
| GET     | `/api/poules`           | Récupère les poules possédées par l’utilisateur |
| POST    | `/api/poules`           | Ajoute ou met à jour une poule                  |
| PUT     | `/api/poules/:especeId` | Met à jour partiellement une poule spécifique   |

#### Exemple de body POST :

```json
{
  "especeId": "poulette-rousse",
  "quantite": 2,
  "niveauTalent": 1,
  "statutEnergie": {
    "etat": "disponible",
    "heureDisponible": null
  },
  "posteOccupe": null
}
```

#### Exemple de body PUT :

```json
{
  "statutEnergie": {
    "etat": "fatiguee",
    "heureDisponible": "2025-05-20T12:00:00Z"
  }
}
```

---

## 🧠 Données stockées (Modèle User)

```js
{
  username: String,
  password: String,
  settings: {
    sound: Boolean
  },
  poulesPossedees: [
    {
      especeId: String,
      quantite: Number,
      niveauTalent: Number,
      statutEnergie: {
        etat: String,
        heureDisponible: Date
      },
      posteOccupe: String | null
    }
  ]
}
```

---

## 🛠️ Dépendances principales

* `express`
* `mongoose`
* `cors`
* `dotenv`
* `jsonwebtoken`
* `bcrypt`

---

## ✉️ Contact

Développé par l'équipe Chicken Haven 🐣

```

Souhaites-tu une version en anglais ou avec des exemples curl/Postman supplémentaires ?
```
