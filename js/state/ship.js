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
 */
export function createShip(name = 'New Ship') {
  return {
    id: generateId(),
    mode: 'creation', // 'creation' | 'play' | 'upgrade'
    name,

    // Anticipated crew size affects stakes budget
    anticipatedCrewSize: 3,

    // Ship ratings - all start at 1
    ratings: {
      Armour: 1,
      Seals: 1,
      Speed: 1,
      Saws: 1,
      Stealth: 1,
      Tilt: 1
    },

    // Damage states for each rating (array of boxes, empty = undamaged)
    ratingDamage: {
      Armour: [],
      Seals: [],
      Speed: [],
      Saws: [],
      Stealth: [],
      Tilt: []
    },

    // Ship design elements (selected parts)
    size: null,        // { name, stakes, bonuses }
    frame: null,       // { name, stakes, bonuses }
    hull: null,        // { name, stakes, bonuses, specials }
    bite: null,        // { name, stakes, bonuses, specials }
    engine: null,      // { name, stakes, bonuses, specials }

    // Ship fittings
    motif: null,       // { name, stakes, specials }

    // Additional fittings will be added later
    // crew-quarters, rooms, etc.
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
export function setShipMode(mode, renderCallback, ship) {
  ship.mode = mode;
}

/**
 * Update anticipated crew size
 */
export function updateAnticipatedCrewSize(size, renderCallback, ship) {
  ship.anticipatedCrewSize = Math.max(1, parseInt(size) || 1);
}

/**
 * Select a ship part (size, frame, hull, bite, engine)
 */
export function selectShipPart(partType, partData, renderCallback, ship) {
  ship[partType] = partData;
}

/**
 * Calculate total stakes spent
 */
export function calculateStakesSpent(ship) {
  let total = 0;
  if (ship.size) total += ship.size.stakes;
  if (ship.frame) total += ship.frame.stakes;
  if (ship.hull) total += ship.hull.stakes;
  if (ship.bite) total += ship.bite.stakes;
  if (ship.engine) total += ship.engine.stakes;
  if (ship.motif) total += ship.motif.stakes;
  return total;
}

/**
 * Calculate total stakes budget (6 base + 3 per crew member)
 */
export function calculateStakesBudget(ship) {
  return 6 + (ship.anticipatedCrewSize * 3);
}

/**
 * Calculate ship ratings based on selected parts
 */
export function calculateShipRatings(ship) {
  const ratings = {
    Armour: 1,
    Seals: 1,
    Speed: 1,
    Saws: 1,
    Stealth: 1,
    Tilt: 1
  };

  // Apply bonuses from all selected parts
  const parts = [ship.size, ship.frame, ship.hull, ship.bite, ship.engine];
  parts.forEach(part => {
    if (part && part.bonuses) {
      part.bonuses.forEach(bonus => {
        ratings[bonus.rating] = (ratings[bonus.rating] || 1) + bonus.value;
      });
    }
  });

  return ratings;
}