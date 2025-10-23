import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import pouleRoutes from './routes/poules.routes.js';
import authRoutes from './routes/auth.routes.js';
import productionRoutes from './routes/production.routes.js';
import eggRoutes from './routes/egg.routes.js';
import boxRoutes from './routes/box.routes.js';
import achievementsRoutes from './routes/achievements.routes.js';
import gameDataRoutes from './routes/gameData.routes.js';
import teamRoutes from './routes/team.routes.js';
import userRoutes from './routes/user.routes.js';
import upgradesRoutes from './routes/upgrades.routes.js';
import talentRoutes from './routes/talent.routes.js';
import spawnablesRoutes from './routes/spawnables.routes.js';
import socialRoutes from './routes/social.routes.js';
import miningRoutes from './routes/mining.routes.js';
import chestRoutes from './routes/chest.routes.js';
import chickenGiftsRoutes from './routes/chickenGifts.routes.js';

dotenv.config();
const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Routes
app.use('/api/poules', pouleRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/egg', eggRoutes);
app.use('/api/boxes', boxRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/game-data', gameDataRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upgrades', upgradesRoutes);
app.use('/api/talent', talentRoutes);
app.use('/api/spawnables', spawnablesRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/mining', miningRoutes);
app.use('/api/chest', chestRoutes);
app.use('/api/chicken-gifts', chickenGiftsRoutes);

app.get('/', (req, res) => res.json({ message: 'API Chicken Haven OK 🐔', timestamp: new Date().toISOString() }));
app.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// ⚡ Serveur Plesk
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));

// 🔄 Connexion MongoDB en arrière-plan
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connecté à MongoDB');
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB :', err.message);
    console.log('⚠️ La connexion MongoDB a échoué, mais le serveur tourne quand même.');
  }
})();

// Logs mongoose
mongoose.connection.on('error', err => console.error('❌ Erreur MongoDB :', err.message));
mongoose.connection.on('disconnected', () => console.log('⚠️ MongoDB déconnecté'));
mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnecté'));
