// js/main.js
import { loadGameData } from './data/loader.js';
import { 
  loadSession, 
  createSession, 
  saveSession,
  addCharacterToSession 
} from './state/session.js';
import {
  createCharacter,
  loadCharacter,
  saveCharacter
} from './state/character.js';
import {
  createShip,
  loadShip,
  saveShip
} from './state/ship.js';
import { renderCreationMode } from './rendering/creation-mode.js';
import { renderPlayMode } from './rendering/play-mode.js';
import { renderAdvancementMode } from './rendering/advancement-mode.js';

// Global state
let gameData = null;
let session = null;
let characters = {}; // Map of characterId -> character object
let ship = null;

/**
 * Initialize the application
 */
function init() {
  // Load game data
  gameData = loadGameData();
  
  // Load or create session
  session = loadSession();
  if (!session) {
    // New user - create default session with one character
    session = createSession('My Crew');
    
    const character = createCharacter();
    saveCharacter(character);
    addCharacterToSession(session, character.id);
    
    saveSession(session);
  }
  
  // Load active characters
  for (const characterId of session.activeCharacterIds) {
    const character = loadCharacter(characterId);
    if (character) {
      characters[characterId] = character;
    }
  }
  
  // Load active ship if it exists
  if (session.activeShipId) {
    ship = loadShip(session.activeShipId);
  }
  
  // Set up event delegation
  setupEventDelegation();
  
  // Initial render
  render();
}

/**
 * Main render function
 */
function render() {
  if (session.activeView === 'ship' && ship) {
    // TODO: Render ship sheet when implemented
    console.log('Ship view not yet implemented');
    return;
  }
  
  // Render active character
  const activeCharacter = characters[session.activeCharacterId];
  if (!activeCharacter) {
    console.error('No active character found');
    return;
  }
  
  const app = document.getElementById('app');
  
  if (activeCharacter.mode === 'creation') {
    renderCreationMode(app, activeCharacter, gameData);
  } else if (activeCharacter.mode === 'play') {
    renderPlayMode(app, activeCharacter, gameData);
  } else if (activeCharacter.mode === 'advancement') {
    renderAdvancementMode(app, activeCharacter, gameData);
  }
}

// ... rest of event handling functions
// They now need to:
// 1. Get the active character from session
// 2. Modify that character
// 3. Save both the character and session