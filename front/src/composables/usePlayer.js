/**
 * Composable principal pour la gestion du joueur
 * Agrège les sous-modules pour une API unifiée
 */

// État partagé
import {
  eggs,
  stockTokens,
  productionTokens,
  wildTokens,
  chestKeys,
  miningTokens,
  preciousStones,
  rottenTomatoes,
  team,
  artifactSlots,
  level,
  xp,
  xpRequired,
  player,
  cooldowns,
  apocalypse
} from './player/playerState.js'

// Gestionnaires
import { addEggs, spendEggs, setEggs, addTokens, spendTokens, canAfford } from './player/resourcesManager.js'
import { fetchTeam, updateTeam, isInTeam, equipChicken, unequipChicken, replaceTeamMember } from './player/teamManager.js'
import { fetchArtifactSlots, equipArtifact, unequipArtifact } from './player/artifactsManager.js'
import { refreshPlayer, setupEventListeners } from './player/playerSync.js'

export function usePlayer() {
  // Configurer les écouteurs d'événements
  const cleanup = setupEventListeners()

  // Initialiser les données du joueur si pas déjà fait
  if (!player.value && typeof localStorage !== 'undefined' && localStorage.getItem('token')) {
    refreshPlayer().catch(() => {})
  }

  function getLevel() { 
    return level.value 
  }

  return {
    // État réactif
    eggs,
    stockTokens,
    productionTokens,
    wildTokens,
    chestKeys,
    miningTokens,
    preciousStones,
    rottenTomatoes,
    team,
    artifactSlots,
    level,
    xp,
    xpRequired,
    player,
    cooldowns,
    apocalypse,
    
    // Gestion des ressources
    addEggs,
    spendEggs,
    setEggs,
    addTokens,
    spendTokens,
    canAfford,
    getLevel,
    
    // Synchronisation
    refreshPlayer,
    refreshPlayerData: refreshPlayer, // Alias pour compatibilité
    
    // Équipe
    fetchTeam,
    updateTeam,
    isInTeam,
    equipChicken,
    unequipChicken,
    replaceTeamMember,
    
    // Artefacts
    fetchArtifactSlots,
    equipArtifact,
    unequipArtifact
  }
}
