import mongoose from 'mongoose';

const pouleSchema = new mongoose.Schema({
  nom: String,
  effet: String,
  image: String
});

const Poule = mongoose.model('Poule', pouleSchema);
export default Poule;
