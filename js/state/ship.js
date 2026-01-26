/**
 * Ship state management module
 * Handles ship data and all mutation functions
 * Now using Supabase for real-time multiplayer support
 */

import { supabase } from '../supabaseClient.js';

// Debug flag - only log in development mode
const DEBUG = import.meta.env.DEV;

/**
 * Parse track size from undercrew name
 * Format: " [#-Track]" where # is the track size
 * @param {string} name - Undercrew name (e.g., "Navigator [3-Track]")
 * @returns {number} Track size, defaults to 0 if not found
 * @private
 * @example
 * parseUndercrewTrack("Navigator [3-Track]") // returns 3
 * parseUndercrewTrack("Crew Member") // returns 0
 */
function parseUndercrewTrack(name) {
  const match = name.match(/\[(\d+)-Track\]/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Create a new ship with default values and save to Supabase
 * Creates ship in creation mode with empty arrays for all ship parts
 * Initializes rating damage tracks, undercrew, journey clocks
 * @param {string} sessionId - Session ID to associate ship with
 * @param {string} [name='New Ship'] - Ship name
 * @returns {Promise<Object>} Newly created ship object (converted from DB format)
 * @throws {Error} If database insert fails
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
      factions: [],
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
 * Load a ship from Supabase by ID
 * Converts database format to app format
 * Overrides mode with user's localStorage preference if available
 * @param {string} shipId - Ship ID to load
 * @returns {Promise<Object|null>} Ship object or null if not found/error
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
 * Mode IS saved to database as canonical state, but can be overridden per-user via localStorage
 * Updates the updated_at timestamp automatically
 * @param {Object} ship - Ship object to save
 * @returns {Promise<void>}
 * @throws {Error} If database update fails
 */
export async function saveShip(ship) {
  if (DEBUG) {
    console.log('[SAVE] Saving ship to database:', ship.id, ship.name, 'at', new Date().toISOString());
  }

  // ========================================================================
  // COLUMN NAME MAPPING: camelCase → snake_case
  // ========================================================================
  // This is the inverse transformation of convertFromDB()
  // Application uses camelCase (JavaScript): anticipatedCrewSize, generalAdditions
  // Database expects snake_case (PostgreSQL): anticipated_crew_size, general_additions
  //
  // Note: We don't need a separate convertToDB() function because the mapping
  // is straightforward and happens inline during the database update.
  //
  // Mapping table:
  // - anticipatedCrewSize  → anticipated_crew_size
  // - additionalStakes     → additional_stakes
  // - ratingDamage         → rating_damage
  // - generalAdditions     → general_additions
  // - bounteousAdditions   → bounteous_additions
  // - undercrewDamage      → undercrew_damage
  // - updated_at           → Auto-generated timestamp (not in ship object)

  const { error } = await supabase
    .from('ships')
    .update({
      // Identity fields (same in DB and app)
      name: ship.name,
      mode: ship.mode,                                     // Save canonical mode (creation/play/upgrade)

      // Column name mapping: camelCase → snake_case
      anticipated_crew_size: ship.anticipatedCrewSize,   // App: anticipatedCrewSize
      additional_stakes: ship.additionalStakes,           // App: additionalStakes
      rating_damage: ship.ratingDamage,                   // App: ratingDamage

      // Ship parts (no mapping needed, same in DB and app)
      size: ship.size,
      frame: ship.frame,
      hull: ship.hull,
      bite: ship.bite,
      engine: ship.engine,
      motifs: ship.motifs,

      // Column name mapping: camelCase → snake_case
      general_additions: ship.generalAdditions,           // App: generalAdditions
      bounteous_additions: ship.bounteousAdditions,       // App: bounteousAdditions

      // No mapping needed (same in DB and app)
      rooms: ship.rooms,
      armaments: ship.armaments,
      undercrew: ship.undercrew,

      // Column name mapping: camelCase → snake_case
      undercrew_damage: ship.undercrewDamage,             // App: undercrewDamage

      // No mapping needed (same in DB and app)
      cargo: ship.cargo,
      passengers: ship.passengers,
      factions: ship.factions,
      journey: ship.journey,

      // Database metadata (auto-generated)
      updated_at: new Date().toISOString()                // Timestamp for last modification
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
 * @param {string} shipId - Ship ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If database delete fails
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
 * Converts all ships from database format to app format
 * @param {string} sessionId - Session ID to fetch ships for
 * @returns {Promise<Array<Object>>} Array of ship objects (empty array if error)
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
 * Converts database ship format to application format
 *
 * Performs two key transformations:
 * 1. **Column name mapping**: snake_case (DB) → camelCase (app)
 * 2. **Default initialization**: Missing fields → sensible defaults
 *
 * Unlike character convertFromDB, ship conversion has no data migrations
 * (ship schema has been stable since introduction)
 *
 * @param {Object} dbShip - Ship data from database with snake_case columns
 * @returns {Object} Ship object ready for application use with camelCase properties
 *
 * @example
 * // Database format (snake_case):
 * {
 *   id: "ship123",
 *   anticipated_crew_size: 3,
 *   general_additions: [...],
 *   undercrew_damage: {}
 * }
 *
 * // Application format (camelCase):
 * {
 *   id: "ship123",
 *   anticipatedCrewSize: 3,
 *   generalAdditions: [...],
 *   undercrewDamage: {}
 * }
 */
function convertFromDB(dbShip) {
  // ========================================================================
  // COLUMN NAME MAPPING & DEFAULT INITIALIZATION
  // ========================================================================
  // Database uses snake_case (PostgreSQL): anticipated_crew_size, general_additions
  // Application uses camelCase (JavaScript): anticipatedCrewSize, generalAdditions
  //
  // Default initialization ensures all properties exist even if missing from DB

  return {
    // Identity fields (no defaults needed, always present)
    id: dbShip.id,
    mode: dbShip.mode,
    name: dbShip.name,

    // Stakes budget calculation fields
    // See GAME-RULES.md § "Stakes Budget" for formula
    anticipatedCrewSize: dbShip.anticipated_crew_size || 3,  // DB: anticipated_crew_size (default: 3 crew)
    additionalStakes: dbShip.additional_stakes || 0,         // DB: additional_stakes (default: 0 bonus)

    // Rating damage tracking (6 ratings, each with array of damage states)
    ratingDamage: dbShip.rating_damage || {                  // DB: rating_damage (default: empty arrays)
      Armour: [],
      Seals: [],
      Speed: [],
      Saws: [],
      Stealth: [],
      Tilt: []
    },

    // Ship parts (Size and Frame are single-select, others are multi-select arrays)
    size: dbShip.size,                                       // DB: size (single selection)
    frame: dbShip.frame,                                     // DB: frame (single selection)
    hull: dbShip.hull || [],                                 // DB: hull (multi-select array)
    bite: dbShip.bite || [],                                 // DB: bite (multi-select array)
    engine: dbShip.engine || [],                             // DB: engine (multi-select array)

    // Ship fittings (all multi-select arrays)
    motifs: dbShip.motifs || [],                             // DB: motifs
    generalAdditions: dbShip.general_additions || [],        // DB: general_additions
    bounteousAdditions: dbShip.bounteous_additions || [],    // DB: bounteous_additions
    rooms: dbShip.rooms || [],                               // DB: rooms
    armaments: dbShip.armaments || [],                       // DB: armaments

    // Undercrew (organized by type: officers, gangs, packs)
    undercrew: dbShip.undercrew || {                         // DB: undercrew (default: empty arrays)
      officers: [],
      gangs: [],
      packs: []
    },
    undercrewDamage: dbShip.undercrew_damage || {},          // DB: undercrew_damage (default: empty object)

    // Ship cargo and passengers
    cargo: dbShip.cargo || [],                               // DB: cargo (default: empty array)
    passengers: dbShip.passengers || [],                     // DB: passengers (default: empty array)

    // Faction reputation tracking (name and reputation 0-3)
    factions: dbShip.factions || [],                         // DB: factions (default: empty array)

    // Journey tracking (progress clocks for active journeys)
    // See GAME-RULES.md § "Journey Mechanics"
    journey: dbShip.journey || {                             // DB: journey (default: inactive journey)
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
 * Ship mutations
 */

/**
 * Set ship mode (creation, play, or upgrade)
 * Mode is saved to localStorage per-user (not synced to database)
 * This allows each user to view the same ship in different modes independently
 * @param {string} mode - New mode ("creation", "play", or "upgrade")
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.mode - Sets new mode
 * @mutates localStorage - Saves mode preference for this user and ship
 */
export function setShipMode(mode, renderCallback, ship) {
  ship.mode = mode;

  // Save mode to localStorage for this user only
  localStorage.setItem(`wildsea-ship-${ship.id}-mode`, mode);
}

/**
 * Update ship name
 * @param {string} name - New ship name
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.name - Sets new ship name
 */
export function updateShipName(name, ship) {
  ship.name = name;
}

/**
 * Update anticipated crew size (affects stakes budget calculation)
 * Constrains value to minimum of 1
 * @param {number|string} size - New crew size (will be parsed and constrained)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.anticipatedCrewSize - Sets new crew size (minimum 1)
 */
export function updateAnticipatedCrewSize(size, renderCallback, ship) {
  ship.anticipatedCrewSize = Math.max(1, parseInt(size) || 1);
}

/**
 * Update additional stakes (affects stakes budget calculation)
 * Constrains value to minimum of 0
 * @param {number|string} stakes - Additional stakes to add (will be parsed and constrained)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.additionalStakes - Sets additional stakes (minimum 0)
 */
export function updateAdditionalStakes(stakes, renderCallback, ship) {
  ship.additionalStakes = Math.max(0, parseInt(stakes) || 0);
}

/**
 * Select or toggle a ship part (creation mode)
 * Size and frame are single-select (replaces existing selection)
 * Hull, bite, and engine are multi-select (toggle on/off)
 * @param {string} partType - Part type ("size", "frame", "hull", "bite", or "engine")
 * @param {Object} partData - Part object from game data
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship[partType] - Single-select: replaces value; Multi-select: toggles in array
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
 * Select or toggle a ship fitting (creation mode)
 * All fittings are multi-select (toggle on/off)
 * Fitting types: motifs, generalAdditions, bounteousAdditions, rooms, armaments
 * @param {string} fittingType - Fitting type (e.g., "motifs", "rooms", "armaments")
 * @param {Object} fittingData - Fitting object from game data
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship[fittingType] - Toggles fitting in array (adds if missing, removes if present)
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
 * Select or toggle ship undercrew (creation mode)
 * All undercrew are multi-select (toggle on/off)
 * Undercrew types: officers, gangs, packs
 * Automatically parses track size from undercrew name (e.g., "[3-Track]")
 * @param {string} undercrewType - Undercrew type ("officers", "gangs", or "packs")
 * @param {Object} undercrewData - Undercrew object from game data
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.undercrew[undercrewType] - Toggles undercrew in array with parsed track size
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
 * Calculate total stakes spent on ship parts, fittings, and undercrew
 * Sums stakes from all selected items across all categories
 * @param {Object} ship - Ship object to calculate from
 * @returns {number} Total stakes spent
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
 * Calculate total stakes budget for ship creation
 *
 * Formula: 6 (base) + (3 × anticipated crew size) + additional stakes
 *
 * The base of 6 represents minimal ship viability. Each crew member adds 3 stakes,
 * reflecting the resources and modifications needed to support them. Additional stakes
 * can come from character aspects/edges that grant ship-building bonuses.
 *
 * See GAME-RULES.md § "Stakes Budget" for detailed rationale.
 *
 * @param {Object} ship - Ship object with anticipatedCrewSize and additionalStakes
 * @returns {number} Total stakes budget available
 * @example
 * // Ship with crew size 3, no additional stakes
 * calculateStakesBudget({ anticipatedCrewSize: 3, additionalStakes: 0 }) // returns 15
 */
export function calculateStakesBudget(ship) {
  // Base stakes: 6 (minimum for a functioning ship)
  // Crew scaling: 3 stakes per anticipated crew member
  // See GAME-RULES.md § "Stakes Budget"
  const baselineBudget = 6 + (ship.anticipatedCrewSize * 3);
  const additionalStakes = ship.additionalStakes || 0;
  return baselineBudget + additionalStakes;
}

/**
 * Calculate ship ratings based on selected parts, fittings, and undercrew
 *
 * All ratings start at 1 (baseline competency for any ship), then bonuses
 * from selected items are summed. This ensures ships have minimum capability
 * in all areas before modifications.
 *
 * Ratings: Armour, Seals, Speed, Saws, Stealth, Tilt
 * See GAME-RULES.md § "Ship Ratings" for detailed explanation.
 *
 * @param {Object} ship - Ship object with selected parts
 * @returns {Object} Object with rating names as keys and calculated values
 * @example
 * calculateShipRatings(ship) // returns { Armour: 3, Seals: 2, Speed: 4, Saws: 2, Stealth: 1, Tilt: 1 }
 */
export function calculateShipRatings(ship) {
  // All ratings start at 1 (baseline ship capability)
  // See GAME-RULES.md § "Ship Ratings"
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
 * Cycle rating damage box through states (play mode only)
 * Simpler than aspect damage - only 2 states: default → burned → default
 * @param {string} rating - Rating name ("Armour", "Seals", "Speed", "Saws", "Stealth", or "Tilt")
 * @param {number} index - Index of damage box to cycle (0-based)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.ratingDamage[rating][index] - Cycles between 'default' and 'burned'
 */
export function cycleRatingDamage(rating, index, renderCallback, ship) {
  // Ensure the damage array exists
  if (!ship.ratingDamage[rating]) {
    ship.ratingDamage[rating] = [];
  }

  const damageArray = ship.ratingDamage[rating];

  // Get current state (default if undefined)
  const currentState = damageArray[index] || 'default';

  // Ship ratings use simpler damage: default ↔ burned (no "marked" state)
  // Unlike character aspects which have 3 states (default → marked → burned)
  // See GAME-RULES.md § "Ship Damage Tracking"
  if (currentState === 'default') {
    damageArray[index] = 'burned';
  } else {
    damageArray[index] = 'default';
  }
}

/**
 * Cycle undercrew damage box through states (play mode only)
 * Cycles: default → burned → default
 * @param {string} undercrewName - Undercrew name (used as key in undercrewDamage object)
 * @param {number} index - Index of damage box to cycle (0-based)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.undercrewDamage[undercrewName][index] - Cycles between 'default' and 'burned'
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
 * Cargo mutations
 */

/**
 * Add a new blank cargo item to ship
 * Creates cargo with unique ID and empty name
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.cargo - Pushes new cargo object to array
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
 * @param {string} id - Cargo item ID
 * @param {string} name - New cargo name
 * @param {Object} ship - Ship object to mutate
 * @mutates cargoItem.name - Sets new cargo name
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
 * Remove a cargo item by ID
 * @param {string} id - Cargo item ID to delete
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.cargo - Removes cargo from array
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
 * Passenger mutations
 */

/**
 * Add a new blank passenger to ship
 * Creates passenger with unique ID and empty name
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.passengers - Pushes new passenger object to array
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
 * Update passenger name
 * @param {string} id - Passenger ID
 * @param {string} name - New passenger name
 * @param {Object} ship - Ship object to mutate
 * @mutates passenger.name - Sets new passenger name
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
 * Remove a passenger by ID
 * @param {string} id - Passenger ID to delete
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.passengers - Removes passenger from array
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
 * Faction reputation mutations
 */

/**
 * Add a new blank faction to ship
 * Creates faction with unique ID, empty name, and reputation of 0
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.factions - Pushes new faction object to array
 */
export function addFaction(renderCallback, ship) {
  if (!ship.factions) {
    ship.factions = [];
  }
  ship.factions.push({
    id: Date.now().toString(),
    name: '',
    reputation: 0
  });
  renderCallback();
}

/**
 * Update faction name
 * @param {string} id - Faction ID
 * @param {string} name - New faction name
 * @param {Object} ship - Ship object to mutate
 * @mutates faction.name - Sets new faction name
 */
export function updateFactionName(id, name, ship) {
  if (!ship.factions) {
    ship.factions = [];
  }
  const faction = ship.factions.find(f => f.id === id);
  if (faction) {
    faction.name = name;
  }
}

/**
 * Update faction reputation value (0-3)
 * @param {string} id - Faction ID
 * @param {number} reputation - New reputation value (0-3)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates faction.reputation - Sets new reputation value (constrained to 0-3)
 */
export function updateFactionReputation(id, reputation, renderCallback, ship) {
  if (!ship.factions) {
    ship.factions = [];
  }
  const faction = ship.factions.find(f => f.id === id);
  if (faction) {
    faction.reputation = Math.max(0, Math.min(3, parseInt(reputation) || 0));
    renderCallback();
  }
}

/**
 * Remove a faction by ID
 * @param {string} id - Faction ID to delete
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.factions - Removes faction from array
 */
export function removeFaction(id, renderCallback, ship) {
  if (!ship.factions) {
    ship.factions = [];
  }
  const index = ship.factions.findIndex(f => f.id === id);
  if (index >= 0) {
    ship.factions.splice(index, 1);
    renderCallback();
  }
}

/**
 * Journey mutations
 */

/**
 * Toggle journey active/inactive state
 * When activated, initializes journey with 4 clocks if needed
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.journey.active - Toggles boolean state
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
 * @param {string} name - New journey name
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.journey.name - Sets new journey name
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
 * Update journey clock filled ticks directly
 * Constrains value between 0 and clock's max
 * @param {string} clockType - Clock type ("progress", "risk", "pathfinding", or "riot")
 * @param {number} filled - New filled value (will be constrained to 0-max)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.journey.clocks[clockType].filled - Sets new filled value
 */
export function updateClock(clockType, filled, renderCallback, ship) {
  if (!ship.journey || !ship.journey.clocks[clockType]) {
    return;
  }
  ship.journey.clocks[clockType].filled = Math.max(0, Math.min(filled, ship.journey.clocks[clockType].max));
  if (renderCallback) renderCallback();
}

/**
 * Set journey clock maximum ticks
 * Constrains value between 1-6, adjusts filled value if it exceeds new max
 * @param {string} clockType - Clock type ("progress", "risk", "pathfinding", or "riot")
 * @param {number} max - New max value (will be constrained to 1-6)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.journey.clocks[clockType].max - Sets new max value
 * @mutates ship.journey.clocks[clockType].filled - Reduces to new max if exceeded
 */
export function setClockMax(clockType, max, renderCallback, ship) {
  if (!ship.journey || !ship.journey.clocks[clockType]) {
    return;
  }
  // Journey clocks constrained to 1-6 segments (typical game clock size range)
  // Prevents clocks from becoming too small (ineffective) or too large (tedious)
  // See GAME-RULES.md § "Journey Mechanics"
  ship.journey.clocks[clockType].max = Math.max(1, Math.min(6, max));
  // Ensure filled doesn't exceed new max
  ship.journey.clocks[clockType].filled = Math.min(
    ship.journey.clocks[clockType].filled,
    max
  );
  if (renderCallback) renderCallback();
}

/**
 * Toggle a specific tick in a journey clock (for clicking individual tick segments)
 * Click before filled: unfills to that position
 * Click at or after filled: fills to that position + 1
 * @param {string} clockType - Clock type ("progress", "risk", "pathfinding", or "riot")
 * @param {number} tickIndex - Index of tick to toggle (0-based)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} ship - Ship object to mutate
 * @mutates ship.journey.clocks[clockType].filled - Updates filled value based on click position
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