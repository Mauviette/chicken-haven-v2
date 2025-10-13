import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema({
  section: { type: String, required: true},
  price: [
    {count: { type: Number, default: 1 }},
    {item: { type: String, default: "egg" }},
  ],
  reward: [
    {count: { type: Number, default: 1 }},
    {item: { type: String, default: "egg" }},
  ],
  title: {type: String, default: "Oeuf"}

})

const ShopOffer = mongoose.model('ShopOffer', UserSchema)
export default ShopOffer
