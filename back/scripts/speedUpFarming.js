/**
 * Script pour accélérer les timers de pousse du farming à des fins de test
 * 
 * Usage: node scripts/speedUpFarming.js [username] [minutes]
 * 
 * Exemples:
 *   node scripts/speedUpFarming.js              # Réduit tous les timers de 44 minutes
 *   node scripts/speedUpFarming.js MonPseudo    # Réduit les timers de MonPseudo de 44 minutes
 *   node scripts/speedUpFarming.js MonPseudo 30 # Réduit les timers de MonPseudo de 30 minutes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// Schéma User simplifié pour le script
const userSchema = new mongoose.Schema({
  username: String,
  farming: {
    plantations: [{
      slotIndex: Number,
      vegetableType: String,
      plantedAt: Date,
      readyAt: Date
    }]
  }
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function speedUpFarming(username = null, minutesToSubtract = 44) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    const msToSubtract = minutesToSubtract * 60 * 1000;
    
    // Construire la requête
    const query = { 'farming.plantations': { $exists: true, $ne: [] } };
    if (username) {
      query.username = username;
    }

    // Trouver les utilisateurs avec des plantations
    const users = await User.find(query);
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec des plantations en cours.');
      return;
    }

    console.log(`\n🌱 ${users.length} utilisateur(s) avec des plantations trouvé(s)\n`);

    for (const user of users) {
      const plantations = user.farming?.plantations || [];
      
      if (plantations.length === 0) continue;

      console.log(`👤 ${user.username}:`);
      
      for (const plantation of plantations) {
        const oldPlantedAt = new Date(plantation.plantedAt);
        const oldReadyAt = plantation.readyAt ? new Date(plantation.readyAt) : null;
        
        // Avancer plantedAt dans le passé
        const newPlantedAt = new Date(oldPlantedAt.getTime() - msToSubtract);
        plantation.plantedAt = newPlantedAt;
        
        // Avancer aussi readyAt si présent
        if (oldReadyAt) {
          const newReadyAt = new Date(oldReadyAt.getTime() - msToSubtract);
          plantation.readyAt = newReadyAt;
          console.log(`   🥬 Slot ${plantation.slotIndex} (${plantation.vegetableType || plantation.vegetable})`);
          console.log(`      plantedAt: ${oldPlantedAt.toLocaleString('fr-FR')} → ${newPlantedAt.toLocaleString('fr-FR')}`);
          console.log(`      readyAt:   ${oldReadyAt.toLocaleString('fr-FR')} → ${newReadyAt.toLocaleString('fr-FR')}`);
        } else {
          console.log(`   🥬 Slot ${plantation.slotIndex} (${plantation.vegetableType || plantation.vegetable})`);
          console.log(`      plantedAt: ${oldPlantedAt.toLocaleString('fr-FR')} → ${newPlantedAt.toLocaleString('fr-FR')}`);
        }
      }

      // Sauvegarder les modifications
      await User.updateOne(
        { _id: user._id },
        { $set: { 'farming.plantations': plantations } }
      );
      
      console.log(`   ✅ Timers accélérés de ${minutesToSubtract} minutes\n`);
    }

    console.log('🎉 Terminé !');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Récupérer les arguments
const args = process.argv.slice(2);
const username = args[0] || null;
const minutes = parseInt(args[1]) || 44;

console.log('🚀 Script d\'accélération des timers de farming');
console.log(`📋 Utilisateur: ${username || 'Tous'}`);
console.log(`⏱️  Réduction: ${minutes} minutes\n`);

speedUpFarming(username, minutes);
