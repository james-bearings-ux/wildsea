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
    const [constants, aspects, resources, shipParts] = await Promise.all([
      fetch('data/game-constants.json').then(r => r.json()),
      fetch('data/aspects.json').then(r => r.json()),
      fetch('data/resources.json').then(r => r.json()),
      fetch('data/ship-parts.json').then(r => r.json())
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
