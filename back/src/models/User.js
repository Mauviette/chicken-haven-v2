// models/User.js
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

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
  ]
})

const User = mongoose.model('User', UserSchema)
export default User
