// js/state/character.js
// Character data model and state management

import { loadGameData } from '../data/loader.js';

/**
 * Generate a unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Create a new character with default values
 */
export function createCharacter(name = 'New Character', bloodline = 'Tzelicrae', origin = 'Ridgeback', post = 'Mesmer') {
  const gameData = loadGameData();
  
  return {
    id: generateId(),
    mode: 'creation',
    name,
    bloodline,
    origin,
    post,
    selectedAspects: [],
    selectedEdges: [],
    skills: {},
    languages: { 'Low Sour': 3 },
    milestones: [],
    drives: ['', '', ''],
    mires: [
      { text: '', checkbox1: false, checkbox2: false },
      { text: '', checkbox1: false, checkbox2: false },
      { text: '', checkbox1: false, checkbox2: false }
    ],
    resources: {
      charts: [],
      salvage: [],
      specimens: [],
      whispers: []
    }
  };
}

/**
 * Load a character from localStorage
 */
export function loadCharacter(characterId) {
  const stored = localStorage.getItem(`wildsea-character-${characterId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(`Failed to load character ${characterId}:`, e);
    }
  }
  return null;
}

/**
 * Save a character to localStorage
 */
export function saveCharacter(character) {
  localStorage.setItem(`wildsea-character-${character.id}`, JSON.stringify(character));
}

/**
 * Delete a character from localStorage
 */
export function deleteCharacter(characterId) {
  localStorage.removeItem(`wildsea-character-${characterId}`);
}

/**
 * Get all characters from localStorage
 */
export function getAllCharacters() {
  const characters = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('wildsea-character-')) {
      const character = loadCharacter(key.replace('wildsea-character-', ''));
      if (character) characters.push(character);
    }
  }
  return characters;
}

/**
 * Set character mode
 */
export function setCharacterMode(character, mode) {
  character.mode = mode;
  saveCharacter(character);
}

// ... rest of the character-specific functions remain the same,
// but they now operate on a character object passed as parameter
// instead of a global character variable