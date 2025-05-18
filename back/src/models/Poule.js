// models/Poule.js
import mongoose from 'mongoose'


const PouleSchema = new mongoose.Schema({
  especeId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantite: { type: Number, default: 0 },
  niveauTalent: { type: Number, default: 0 },
  statutEnergie: {
    etat: { type: String, enum: ['non_obtenue', 'disponible', 'en mission', 'fatiguee'], default: 'non_obtenue' },
    heureDisponible: { type: Date, default: null },
  },
  posteOccupe: { type: String, default: null }
}, { timestamps: true })


export default PouleSchema