import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import pouleRoutes from './routes/poules.routes.js'

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/poules', pouleRoutes);

app.get('/', (req, res) => {
  res.send('API Chicken Haven OK 🐔');
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connecté à MongoDB');
  app.listen(process.env.PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${process.env.PORT}`);
  });
}).catch((err) => console.error('Erreur MongoDB :', err));
