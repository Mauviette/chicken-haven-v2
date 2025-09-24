// models/Box.js
import mongoose from 'mongoose'

const BoxSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  price: {
    type: { type: String, required: true }, // 'eggs', 'stock_token', etc.
    count: { type: Number, required: true }
  },
  dropGroups: [{
    name: { type: String, required: true },
    chance: { type: Number, required: true }, // Pourcentage
    quantity: { type: Number, required: true }
  }],
  unlock_level: { type: Number, default: 1 }
})

const Box = mongoose.model('Box', BoxSchema)
export default Box