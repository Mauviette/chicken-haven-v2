// models/User.js
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  // Public profile identifier (6-char uppercase hex)
  profileId: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  experience : {
    level : { type: Number, default: 1 },
    points: { type: Number, default: 0 },
    required_points: { type: Number, default: 2 },
  },

  settings: {
    sound: { type: Boolean, default: true },
    animations: { type: Boolean, default: true },
    volume: { type: Number, default: 100 }
  },

  // Avatar URL or key
  avatar: { type: String, default: '' },

  // Last activity for online status
  lastSeen: { type: Date, default: () => new Date() },

  poulesPossedees: [
    {
      especeId: { type: String, required: true },
      quantite: { type: Number, default: 1 },
      niveauTalent: { type: Number, default: 1 },
      new: {type: Boolean, default: true}
    }
  ],

  /*postesActifs: [
    {
      type: { type: String, required: true }, // ex: "poulailler", "incubateur", etc.
      slotId: { type: Number, required: true }, // ex: 0, 1, 2 pour les slots disponibles
      especeId: { type: String, default: null }, // poule actuellement assignée
      dateDebut: { type: Date, default: null },
      dateFin: { type: Date, default: null },
      recompenseDisponible: { type: Boolean, default: false }, // true si le joueur peut cliquer pour collecter
      recompenses: [
        {
          type: String,
          quantite: Number,
          rare: { type: Boolean, default: false }
        }
      ]
    }
  ],*/

  clickableEgg: {
    lastClick: { type: Date },
    income: { type: Number, default: 1 },
    maxIncome: { type: Number, default: 10 },
    currentStocked: { type: Number, default: 0 },
  },

  buffs: [
    {
      origin: { type: String, default: 'Inconnu' },
      buff_type: { type: String, default: 'income' },
      lasts_until: { type: Date, default: () => new Date() },
      buff: {
        operation: { type: String, default: 'mult' },
        amount: { type: String, default: '1.5' },
      }
    }
  ],

  // Cooldowns génériques des talents actifs (clé libre -> Date ISO de disponibilité)
  cooldowns: {
    type: mongoose.Schema.Types.Mixed,
    default: function () { return {} }
  },

  resources : {
    eggs : { type : Number, default: 0},
    stock_token : { type : Number, default: 0},
    production_token : { type : Number, default: 0}
  },

  // Niveaux d'améliorations par ID (ex: { '1': 2, '2': 5 })
  upgrades: {
    type: mongoose.Schema.Types.Mixed,
    default: function () { return {} }
  },

  // Système de succès - schéma flexible pour gérer les migrations
  achievements: {
    type: mongoose.Schema.Types.Mixed,
    default: function() {
      return {
        progress: {
          totalEggsCollected: 0,
          totalChickensOwned: 0,
          totalProductionCompleted: 0,
          totalBoxesOpened: 0,
          maxEggsInOneClick: 0,
          avatarChanged: 0
        },
        completed: [],
        lastChecked: new Date()
      }
    }
  },

  team: {
    maxSlots: { type: Number, default: 3, required: true },
    slots: [
      {
        especeId: { type: String, default: null }
      }
    ]
  },

  // Spawnables actifs pour éviter l'exploit multi-onglets
  activeSpawnables: [
    {
      spawnerId: { type: String, required: true },
      spawnableId: { type: String, required: true },
      talentName: { type: String, required: true },
      especeId: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true }
    }
  ],

  // Derniers spawns par spawner pour gérer les cooldowns
  lastSpawns: {
    type: Map,
    of: Date,
    default: new Map()
  }

}, { timestamps: true })

const User = mongoose.model('User', UserSchema)
export default User
