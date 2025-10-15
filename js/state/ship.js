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

    // Additional stakes earned during play (adds to budget)
    additionalStakes: 0,

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
    generalAdditions: [],    // [{ name, stakes, specials }, ...]
    bounteousAdditions: [],  // [{ name, stakes, specials }, ...]
    rooms: [],               // [{ name, stakes, specials }, ...]
    armaments: [],           // [{ name, stakes, specials }, ...]

    // Undercrew (all multi-select/optional)
    undercrew: {
      officers: [],          // [{ name, stakes, specials }, ...]
      gangs: [],             // [{ name, stakes, specials }, ...]
      packs: []              // [{ name, stakes, specials }, ...]
    },

    // Cargo (arbitrary list of named items, similar to character salvage)
    cargo: [],               // [{ id, name }, ...]

    // Passengers (arbitrary list of named items, parallel to cargo)
    passengers: []           // [{ id, name }, ...]
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
 * Update ship name
 */
export function updateShipName(name, ship) {
  ship.name = name;
}

/**
 * Update anticipated crew size
 */
export function updateAnticipatedCrewSize(size, renderCallback, ship) {
  ship.anticipatedCrewSize = Math.max(1, parseInt(size) || 1);
}

/**
 * Update additional stakes
 */
export function updateAdditionalStakes(stakes, renderCallback, ship) {
  ship.additionalStakes = Math.max(0, parseInt(stakes) || 0);
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
 * Select or toggle undercrew
 * All undercrew are multi-select (toggle on/off)
 */
export function selectShipUndercrew(undercrewType, undercrewData, renderCallback, ship) {
  // Ensure the undercrew object exists
  if (!ship.undercrew) {
    ship.undercrew = {
      officers: [],
      gangs: [],
      packs: []
    };
  }

  // Ensure the specific undercrew type is an array
  if (!Array.isArray(ship.undercrew[undercrewType])) {
    ship.undercrew[undercrewType] = [];
  }

  // Multi-select: toggle the undercrew on/off
  const existingIndex = ship.undercrew[undercrewType].findIndex(u => u.name === undercrewData.name);

  if (existingIndex >= 0) {
    // Undercrew already selected, remove it (deselect)
    ship.undercrew[undercrewType].splice(existingIndex, 1);
  } else {
    // Undercrew not selected, add it
    ship.undercrew[undercrewType].push(undercrewData);
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

  // Multi-selections: undercrew (nested arrays)
  if (ship.undercrew) {
    if (ship.undercrew.officers && Array.isArray(ship.undercrew.officers)) {
      ship.undercrew.officers.forEach(officer => total += officer.stakes);
    }
    if (ship.undercrew.gangs && Array.isArray(ship.undercrew.gangs)) {
      ship.undercrew.gangs.forEach(gang => total += gang.stakes);
    }
    if (ship.undercrew.packs && Array.isArray(ship.undercrew.packs)) {
      ship.undercrew.packs.forEach(pack => total += pack.stakes);
    }
  }

  return total;
}

/**
 * Calculate total stakes budget (6 base + 3 per crew member + additional stakes)
 */
export function calculateStakesBudget(ship) {
  const baselineBudget = 6 + (ship.anticipatedCrewSize * 3);
  const additionalStakes = ship.additionalStakes || 0;
  return baselineBudget + additionalStakes;
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

/**
 * Cycle rating damage state (default -> burned -> default)
 * Similar to aspect damage but simpler (only two states)
 */
export function cycleRatingDamage(rating, index, renderCallback, ship) {
  // Ensure the damage array exists
  if (!ship.ratingDamage[rating]) {
    ship.ratingDamage[rating] = [];
  }

  const damageArray = ship.ratingDamage[rating];

  // Get current state (default if undefined)
  const currentState = damageArray[index] || 'default';

  // Cycle: default -> burned -> default
  if (currentState === 'default') {
    damageArray[index] = 'burned';
  } else {
    damageArray[index] = 'default';
  }
}

/**
 * Cargo mutations (similar to character resource management)
 */

/**
 * Add a new cargo item
 */
export function addCargo(renderCallback, ship) {
  if (!ship.cargo) {
    ship.cargo = [];
  }
  ship.cargo.push({
    id: Date.now().toString(),
    name: ''
  });
  renderCallback();
}

/**
 * Update cargo item name
 */
export function updateCargoName(id, name, ship) {
  if (!ship.cargo) {
    ship.cargo = [];
  }
  const cargoItem = ship.cargo.find(c => c.id === id);
  if (cargoItem) {
    cargoItem.name = name;
  }
}

/**
 * Remove a cargo item
 */
export function removeCargo(id, renderCallback, ship) {
  if (!ship.cargo) {
    ship.cargo = [];
  }
  const index = ship.cargo.findIndex(c => c.id === id);
  if (index >= 0) {
    ship.cargo.splice(index, 1);
    renderCallback();
  }
}

/**
 * Passengers mutations (parallel to cargo management)
 */

/**
 * Add a new passenger item
 */
export function addPassenger(renderCallback, ship) {
  if (!ship.passengers) {
    ship.passengers = [];
  }
  ship.passengers.push({
    id: Date.now().toString(),
    name: ''
  });
  renderCallback();
}

/**
 * Update passenger item name
 */
export function updatePassengerName(id, name, ship) {
  if (!ship.passengers) {
    ship.passengers = [];
  }
  const passenger = ship.passengers.find(p => p.id === id);
  if (passenger) {
    passenger.name = name;
  }
}

/**
 * Remove a passenger item
 */
export function removePassenger(id, renderCallback, ship) {
  if (!ship.passengers) {
    ship.passengers = [];
  }
  const index = ship.passengers.findIndex(p => p.id === id);
  if (index >= 0) {
    ship.passengers.splice(index, 1);
    renderCallback();
  }
}