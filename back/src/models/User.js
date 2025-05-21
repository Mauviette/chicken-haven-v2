// models/User.js
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  level : { type: Number, default: 1 },
  experience: { type: Number, default: 0 },

  settings: {
    sound: { type: Boolean, default: true }
  },

  poulesPossedees: [
    {
      especeId: { type: String, required: true },
      quantite: { type: Number, default: 0 },
      niveauTalent: { type: Number, default: 0 },
      statutEnergie: {
        etat: { type: String, default: 'non_obtenue' },
        heureDisponible: { type: Date, default: null },
      },
      posteOccupe: { type: String, default: null },
    }
  ],

  postesActifs: [
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
  ]

})

const User = mongoose.model('User', UserSchema)
export default User
