// js/state/ship.js
// Ship data model and state management

/**
 * Generate a unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Create a new ship with default values
 * 
 * NOTE: This is a placeholder structure. The actual ship data model
 * will be provided and should replace this entire structure.
 * 
 * Expected: ~30 data points including:
 * - Attributes that aggregate points from aspects (speed, armor, etc.)
 * - Aspects that add points to attributes
 * - Cargo tracking
 * - Other ship-specific features
 */
export function createShip(name = 'New Ship') {
  return {
    id: generateId(),
    mode: 'creation', // 'creation' | 'play' | 'upgrade'
    name,
    
    // PLACEHOLDER: These will be replaced with actual ship attributes
    attributes: {
      // Example: speed might aggregate points from various aspects
      // { current: number, max: number } for damage tracking?
      // Or { value: number } for point aggregation?
    },
    
    // Ship aspects - similar to character aspects but affect ship attributes
    selectedAspects: [],
    
    // PLACEHOLDER: Other ship data points
    cargo: [],
    // ... approximately 25 more fields to be defined
  };
}

/**
 * Load a ship from localStorage
 */
export function loadShip(shipId) {
  const stored = localStorage.getItem(`wildsea-ship-${shipId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(`Failed to load ship ${shipId}:`, e);
    }
  }
  return null;
}

/**
 * Save a ship to localStorage
 */
export function saveShip(ship) {
  localStorage.setItem(`wildsea-ship-${ship.id}`, JSON.stringify(ship));
}

/**
 * Delete a ship from localStorage
 */
export function deleteShip(shipId) {
  localStorage.removeItem(`wildsea-ship-${shipId}`);
}

/**
 * Get all ships from localStorage
 */
export function getAllShips() {
  const ships = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('wildsea-ship-')) {
      const ship = loadShip(key.replace('wildsea-ship-', ''));
      if (ship) ships.push(ship);
    }
  }
  return ships;
}

/**
 * Set ship mode
 */
export function setShipMode(ship, mode) {
  ship.mode = mode;
  saveShip(ship);
}