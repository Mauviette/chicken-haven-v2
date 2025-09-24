// models/User.js
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  experience : {
    level : { type: Number, default: 1 },
    points: { type: Number, default: 0 },
    required_points: { type: Number, default: 2 },
  },

  settings: {
    sound: { type: Boolean, default: true }
  },

  poulesPossedees: [
    {
      especeId: { type: String, required: true, unique: true },
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
    currentStocked: { type: Number, default: 0 }
  },

  resources : {
    eggs : { type : Number, default: 0},
    stock_token : { type : Number, default: 0},
    production_token : { type : Number, default: 0}
  },

  team: {
    maxSlots: { type : Number, default: 3, unique: true, required: true},
    slot: { 
      especeId : {type : String}
    }
  }

})

const User = mongoose.model('User', UserSchema)
export default User
