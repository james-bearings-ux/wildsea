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
    size: null,        // Single selection: { name, stakes, bonuses }
    frame: null,       // Single selection: { name, stakes, bonuses }
    hull: [],          // Multiple selections: [{ name, stakes, bonuses, specials }, ...]
    bite: [],          // Multiple selections: [{ name, stakes, bonuses, specials }, ...]
    engine: [],        // Multiple selections: [{ name, stakes, bonuses, specials }, ...]

    // Ship fittings (all multi-select/optional)
    motifs: [],              // [{ name, stakes, specials }, ...]
    generalAdditions: [],    // Placeholder for future
    bounteousAdditions: [],  // Placeholder for future
    rooms: [],               // Placeholder for future
    armaments: []            // Placeholder for future
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
 * Select or toggle a ship part
 * Size and frame are single-select (replaces existing)
 * Hull, bite, and engine are multi-select (toggle on/off)
 */
export function selectShipPart(partType, partData, renderCallback, ship) {
  const multiSelectParts = ['hull', 'bite', 'engine'];

  if (multiSelectParts.includes(partType)) {
    // Ensure the field is an array (migration from old format)
    if (!Array.isArray(ship[partType])) {
      ship[partType] = ship[partType] ? [ship[partType]] : [];
    }

    // Multi-select: toggle the part on/off
    const existingIndex = ship[partType].findIndex(p => p.name === partData.name);

    if (existingIndex >= 0) {
      // Part already selected, remove it (deselect)
      ship[partType].splice(existingIndex, 1);
    } else {
      // Part not selected, add it
      ship[partType].push(partData);
    }
  } else {
    // Single-select: replace existing selection
    ship[partType] = partData;
  }
}

/**
 * Select or toggle a ship fitting
 * All fittings are multi-select (toggle on/off)
 */
export function selectShipFitting(fittingType, fittingData, renderCallback, ship) {
  // Ensure the field is an array (migration from old format)
  if (!Array.isArray(ship[fittingType])) {
    ship[fittingType] = ship[fittingType] ? [ship[fittingType]] : [];
  }

  // Multi-select: toggle the fitting on/off
  const existingIndex = ship[fittingType].findIndex(f => f.name === fittingData.name);

  if (existingIndex >= 0) {
    // Fitting already selected, remove it (deselect)
    ship[fittingType].splice(existingIndex, 1);
  } else {
    // Fitting not selected, add it
    ship[fittingType].push(fittingData);
  }
}

/**
 * Calculate total stakes spent
 */
export function calculateStakesSpent(ship) {
  let total = 0;

  // Single selections (ship design parts)
  if (ship.size) total += ship.size.stakes;
  if (ship.frame) total += ship.frame.stakes;

  // Multi-selections: ship design parts (arrays)
  if (ship.hull && Array.isArray(ship.hull)) {
    ship.hull.forEach(part => total += part.stakes);
  }
  if (ship.bite && Array.isArray(ship.bite)) {
    ship.bite.forEach(part => total += part.stakes);
  }
  if (ship.engine && Array.isArray(ship.engine)) {
    ship.engine.forEach(part => total += part.stakes);
  }

  // Multi-selections: fittings (arrays)
  if (ship.motifs && Array.isArray(ship.motifs)) {
    ship.motifs.forEach(fitting => total += fitting.stakes);
  }
  if (ship.generalAdditions && Array.isArray(ship.generalAdditions)) {
    ship.generalAdditions.forEach(fitting => total += fitting.stakes);
  }
  if (ship.bounteousAdditions && Array.isArray(ship.bounteousAdditions)) {
    ship.bounteousAdditions.forEach(fitting => total += fitting.stakes);
  }
  if (ship.rooms && Array.isArray(ship.rooms)) {
    ship.rooms.forEach(fitting => total += fitting.stakes);
  }
  if (ship.armaments && Array.isArray(ship.armaments)) {
    ship.armaments.forEach(fitting => total += fitting.stakes);
  }

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

  // Helper function to apply bonuses from a part
  const applyBonuses = (part) => {
    if (part && part.bonuses) {
      part.bonuses.forEach(bonus => {
        ratings[bonus.rating] = (ratings[bonus.rating] || 1) + bonus.value;
      });
    }
  };

  // Apply bonuses from single-selection parts
  applyBonuses(ship.size);
  applyBonuses(ship.frame);

  // Apply bonuses from multi-selection parts (arrays)
  if (ship.hull && Array.isArray(ship.hull)) {
    ship.hull.forEach(applyBonuses);
  }
  if (ship.bite && Array.isArray(ship.bite)) {
    ship.bite.forEach(applyBonuses);
  }
  if (ship.engine && Array.isArray(ship.engine)) {
    ship.engine.forEach(applyBonuses);
  }

  return ratings;
}