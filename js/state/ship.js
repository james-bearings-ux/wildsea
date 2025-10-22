// js/state/ship.js
// Ship data model and state management
// Now using Supabase for real-time multiplayer support

import { supabase } from '../supabaseClient.js';

// Debug flag - only log in development mode
const DEBUG = import.meta.env.DEV;

/**
 * Parse track size from undercrew name
 * Format: " [#-Track]" where # is the track size
 * Example: "Navigator [3-Track]" returns 3
 * @param {string} name - Undercrew name
 * @returns {number} Track size, defaults to 0 if not found
 */
function parseUndercrewTrack(name) {
  const match = name.match(/\[(\d+)-Track\]/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Create a new ship with default values and save to Supabase
 */
export async function createShip(sessionId, name = 'New Ship') {
  const { data, error } = await supabase
    .from('ships')
    .insert([{
      session_id: sessionId,
      name,
      mode: 'creation',
      anticipated_crew_size: 3,
      additional_stakes: 0,
      rating_damage: {
        Armour: [],
        Seals: [],
        Speed: [],
        Saws: [],
        Stealth: [],
        Tilt: []
      },
      size: null,
      frame: null,
      hull: [],
      bite: [],
      engine: [],
      motifs: [],
      general_additions: [],
      bounteous_additions: [],
      rooms: [],
      armaments: [],
      undercrew: {
        officers: [],
        gangs: [],
        packs: []
      },
      undercrew_damage: {},
      cargo: [],
      passengers: [],
      journey: {
        active: false,
        name: '',
        clocks: {
          progress: { max: 6, filled: 0 },
          risk: { max: 6, filled: 0 },
          pathfinding: { max: 6, filled: 0 },
          riot: { max: 6, filled: 0 }
        }
      }
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to create ship:', error);
    throw error;
  }

  return convertFromDB(data);
}

/**
 * Load a ship from Supabase
 */
export async function loadShip(shipId) {
  const { data, error } = await supabase
    .from('ships')
    .select('*')
    .eq('id', shipId)
    .single();

  if (error) {
    console.error(`Failed to load ship ${shipId}:`, error);
    return null;
  }

  const ship = convertFromDB(data);

  // Override mode with per-user preference from localStorage
  const userMode = localStorage.getItem(`wildsea-ship-${shipId}-mode`);
  if (userMode) {
    ship.mode = userMode;
  }

  return ship;
}

/**
 * Save a ship to Supabase
 * Note: Mode IS saved to database as the canonical state, but can be overridden per-user via localStorage
 */
export async function saveShip(ship) {
  if (DEBUG) {
    console.log('[SAVE] Saving ship to database:', ship.id, ship.name, 'at', new Date().toISOString());
  }

  const { error } = await supabase
    .from('ships')
    .update({
      name: ship.name,
      mode: ship.mode, // Save canonical mode (creation/play/upgrade)
      anticipated_crew_size: ship.anticipatedCrewSize,
      additional_stakes: ship.additionalStakes,
      rating_damage: ship.ratingDamage,
      size: ship.size,
      frame: ship.frame,
      hull: ship.hull,
      bite: ship.bite,
      engine: ship.engine,
      motifs: ship.motifs,
      general_additions: ship.generalAdditions,
      bounteous_additions: ship.bounteousAdditions,
      rooms: ship.rooms,
      armaments: ship.armaments,
      undercrew: ship.undercrew,
      undercrew_damage: ship.undercrewDamage,
      cargo: ship.cargo,
      passengers: ship.passengers,
      journey: ship.journey,
      updated_at: new Date().toISOString()
    })
    .eq('id', ship.id);

  if (error) {
    console.error(`[SAVE] Failed to save ship ${ship.id}:`, error);
    throw error;
  }

  if (DEBUG) {
    console.log('[SAVE] Ship saved successfully:', ship.id);
  }
}

/**
 * Delete a ship from Supabase
 */
export async function deleteShip(shipId) {
  const { error } = await supabase
    .from('ships')
    .delete()
    .eq('id', shipId);

  if (error) {
    console.error(`Failed to delete ship ${shipId}:`, error);
    throw error;
  }
}

/**
 * Get all ships from Supabase for a session
 */
export async function getAllShips(sessionId) {
  const { data, error } = await supabase
    .from('ships')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Failed to load ships:', error);
    return [];
  }

  return data.map(convertFromDB);
}

/**
 * Convert database column names to app property names
 */
function convertFromDB(dbShip) {
  return {
    id: dbShip.id,
    mode: dbShip.mode,
    name: dbShip.name,
    anticipatedCrewSize: dbShip.anticipated_crew_size || 3,
    additionalStakes: dbShip.additional_stakes || 0,
    ratingDamage: dbShip.rating_damage || {
      Armour: [],
      Seals: [],
      Speed: [],
      Saws: [],
      Stealth: [],
      Tilt: []
    },
    size: dbShip.size,
    frame: dbShip.frame,
    hull: dbShip.hull || [],
    bite: dbShip.bite || [],
    engine: dbShip.engine || [],
    motifs: dbShip.motifs || [],
    generalAdditions: dbShip.general_additions || [],
    bounteousAdditions: dbShip.bounteous_additions || [],
    rooms: dbShip.rooms || [],
    armaments: dbShip.armaments || [],
    undercrew: dbShip.undercrew || {
      officers: [],
      gangs: [],
      packs: []
    },
    undercrewDamage: dbShip.undercrew_damage || {},
    cargo: dbShip.cargo || [],
    passengers: dbShip.passengers || [],
    journey: dbShip.journey || {
      active: false,
      name: '',
      clocks: {
        progress: { max: 6, filled: 0 },
        risk: { max: 6, filled: 0 },
        pathfinding: { max: 6, filled: 0 },
        riot: { max: 6, filled: 0 }
      }
    }
  };
}

/**
 * Set ship mode
 * Note: Mode is saved to localStorage per-user, not to database
 */
export function setShipMode(mode, renderCallback, ship) {
  ship.mode = mode;

  // Save mode to localStorage for this user only
  localStorage.setItem(`wildsea-ship-${ship.id}-mode`, mode);
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
    // Undercrew not selected, parse track size and add it
    const trackSize = parseUndercrewTrack(undercrewData.name);
    const undercrewWithTrack = {
      ...undercrewData,
      track: trackSize
    };
    ship.undercrew[undercrewType].push(undercrewWithTrack);
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
        // Use nullish coalescing to preserve 0 values (unlike || which treats 0 as falsy)
        ratings[bonus.rating] = (ratings[bonus.rating] ?? 1) + bonus.value;
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

  // Apply bonuses from fittings (arrays)
  if (ship.motifs && Array.isArray(ship.motifs)) {
    ship.motifs.forEach(applyBonuses);
  }
  if (ship.generalAdditions && Array.isArray(ship.generalAdditions)) {
    ship.generalAdditions.forEach(applyBonuses);
  }
  if (ship.bounteousAdditions && Array.isArray(ship.bounteousAdditions)) {
    ship.bounteousAdditions.forEach(applyBonuses);
  }
  if (ship.rooms && Array.isArray(ship.rooms)) {
    ship.rooms.forEach(applyBonuses);
  }
  if (ship.armaments && Array.isArray(ship.armaments)) {
    ship.armaments.forEach(applyBonuses);
  }

  // Apply bonuses from undercrew (nested arrays)
  if (ship.undercrew) {
    if (ship.undercrew.officers && Array.isArray(ship.undercrew.officers)) {
      ship.undercrew.officers.forEach(applyBonuses);
    }
    if (ship.undercrew.gangs && Array.isArray(ship.undercrew.gangs)) {
      ship.undercrew.gangs.forEach(applyBonuses);
    }
    if (ship.undercrew.packs && Array.isArray(ship.undercrew.packs)) {
      ship.undercrew.packs.forEach(applyBonuses);
    }
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
 * Cycle undercrew damage state (default -> burned -> default)
 * Similar to rating damage tracking
 */
export function cycleUndercrewDamage(undercrewName, index, renderCallback, ship) {
  // Ensure the undercrewDamage object exists
  if (!ship.undercrewDamage) {
    ship.undercrewDamage = {};
  }

  // Ensure the damage array for this undercrew exists
  if (!ship.undercrewDamage[undercrewName]) {
    ship.undercrewDamage[undercrewName] = [];
  }

  const damageArray = ship.undercrewDamage[undercrewName];

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

/**
 * Journey mutations
 */

/**
 * Toggle journey active state
 */
export function toggleJourney(renderCallback, ship) {
  if (!ship.journey) {
    ship.journey = {
      active: false,
      name: '',
      clocks: {
        progress: { max: 6, filled: 0 },
        risk: { max: 6, filled: 0 },
        pathfinding: { max: 6, filled: 0 },
        riot: { max: 6, filled: 0 }
      }
    };
  }
  ship.journey.active = !ship.journey.active;
  if (renderCallback) renderCallback();
}

/**
 * Set journey name
 */
export function setJourneyName(name, ship) {
  if (!ship.journey) {
    ship.journey = {
      active: false,
      name: '',
      clocks: {
        progress: { max: 6, filled: 0 },
        risk: { max: 6, filled: 0 },
        pathfinding: { max: 6, filled: 0 },
        riot: { max: 6, filled: 0 }
      }
    };
  }
  ship.journey.name = name;
}

/**
 * Update clock filled ticks
 */
export function updateClock(clockType, filled, renderCallback, ship) {
  if (!ship.journey || !ship.journey.clocks[clockType]) {
    return;
  }
  ship.journey.clocks[clockType].filled = Math.max(0, Math.min(filled, ship.journey.clocks[clockType].max));
  if (renderCallback) renderCallback();
}

/**
 * Set clock max ticks
 */
export function setClockMax(clockType, max, renderCallback, ship) {
  if (!ship.journey || !ship.journey.clocks[clockType]) {
    return;
  }
  ship.journey.clocks[clockType].max = Math.max(1, Math.min(6, max));
  // Ensure filled doesn't exceed new max
  ship.journey.clocks[clockType].filled = Math.min(
    ship.journey.clocks[clockType].filled,
    max
  );
  if (renderCallback) renderCallback();
}

/**
 * Toggle a specific tick in a clock (for clicking individual ticks)
 */
export function toggleClockTick(clockType, tickIndex, renderCallback, ship) {
  if (!ship.journey || !ship.journey.clocks[clockType]) {
    return;
  }

  const clock = ship.journey.clocks[clockType];

  // If clicking on or before the current filled position, unfill to that point
  // If clicking after, fill to that point
  if (tickIndex < clock.filled) {
    clock.filled = tickIndex;
  } else {
    clock.filled = tickIndex + 1;
  }

  if (renderCallback) renderCallback();
}