/**
 * Game data loader module
 * Handles loading and caching of JSON game data files
 */

let GAME_DATA = {};

/**
 * Load all game data from JSON files
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function loadGameData() {
  try {
    // Use Vite's base URL for proper path resolution in production
    const base = import.meta.env.BASE_URL;
    const [constants, aspects, resources, shipParts] = await Promise.all([
      fetch(`${base}data/game-constants.json`).then(r => r.json()),
      fetch(`${base}data/aspects-enhanced.json`).then(r => r.json()), // Using enhanced aspects with damage type metadata
      fetch(`${base}data/resources.json`).then(r => r.json()),
      fetch(`${base}data/ship-parts.json`).then(r => r.json())
    ]);

    GAME_DATA = {
      ...constants,
      aspects: aspects,
      startingResources: resources,
      shipParts: shipParts
    };

    return true;
  } catch (error) {
    console.error('Failed to load game data:', error);
    return false;
  }
}

/**
 * Get the loaded game data
 * @returns {Object} The game data object
 */
export function getGameData() {
  return GAME_DATA;
}
