/**
 * Centralized Game Rules Constants and Validation
 *
 * This file contains all game rule constants, constraints, and validation logic
 * for the Wildsea TTRPG character sheet application.
 *
 * For detailed explanations of these rules, see GAME-RULES.md in the project root.
 *
 * @module constants/game-rules
 */

// ============================================================================
// CHARACTER CREATION BUDGETS
// ============================================================================
// See GAME-RULES.md § "Character Creation" for rationale

/**
 * Character creation budgets and limits
 *
 * Two creation scenarios exist (Old Dog and Young Gun) - see GAME-RULES.md § "Creation Scenarios"
 * These scenarios ONLY affect character creation. Once in play mode, all characters follow
 * the same advancement rules regardless of starting scenario.
 *
 * @constant
 * @type {Object}
 * @property {number} aspects - Must select exactly 4 aspects (1+ from bloodline, origin, post)
 * @property {number} edges - Must select exactly 3 edges from 7 available (PERMANENT - cannot change)
 * @property {number} skillPoints - Total points to distribute (8 points shared between skills and languages, Low Sour doesn't count, creation only)
 * @property {number} resourcesOldDog - Maximum starting resources for Old Dog scenario (6 items)
 * @property {number} resourcesYoungGun - Maximum starting resources for Young Gun scenario (4 items)
 * @property {number} drives - Must have exactly 3 drives
 * @property {number} mires - Must have exactly 3 mires
 * @property {number} maxAspectsAdvancement - Maximum aspects in advancement mode (7)
 */
export const CHARACTER_BUDGETS = {
  aspects: 4,
  edges: 3,                    // Permanent choice - cannot be changed in play or advancement
  skillPoints: 8,              // Only enforced during creation mode
  resourcesOldDog: 6,          // Old Dog scenario (experienced character)
  resourcesYoungGun: 4,        // Young Gun scenario (inexperienced character)
  resources: 6,                // Deprecated: use resourcesOldDog (kept for backwards compatibility)
  drives: 3,
  mires: 3,
  maxAspectsAdvancement: 7
};

/**
 * Rank limits for skills and languages by mode
 * See GAME-RULES.md § "Skills & Languages (8 Points Total)"
 * @constant
 */
export const RANK_LIMITS = {
  creation: {
    min: 0,
    max: 2, // Skills and languages capped at rank 2 during creation
    skillsAndLanguages: 2
  },
  play: {
    min: 0,
    max: 3, // Can advance to rank 3 in play/advancement
    skillsAndLanguages: 3
  },
  advancement: {
    min: 0,
    max: 3,
    skillsAndLanguages: 3
  }
};

/**
 * Default rank for Low Sour language
 * See GAME-RULES.md § "Low Sour (Default Language)"
 * @constant
 */
export const LOW_SOUR_DEFAULT_RANK = 3;

/**
 * Low Sour language cannot be modified in creation mode
 * @constant
 */
export const LOW_SOUR_LOCKED_IN_CREATION = true;

// ============================================================================
// ASPECT MECHANICS
// ============================================================================
// See GAME-RULES.md § "Aspect Mechanics"

/**
 * Track size constraints for aspects
 * See GAME-RULES.md § "Track Size Expansion"
 * @constant
 */
export const TRACK_CONSTRAINTS = {
  minSize: 2,        // Smallest valid track
  maxSize: 8,        // Largest valid track (increased from 5 to 8)
  defaultCreation: null, // Aspects use their defined track size from data
  maxExpansion: 8    // Cannot expand beyond 8 boxes in advancement
};

/**
 * Aspect damage states and their cycle order
 * See GAME-RULES.md § "Damage Tracking (Play Mode)"
 * @constant
 */
export const DAMAGE_STATES = {
  default: 'default',    // Step 1: Unmarked box (default state)
  marked: 'marked',      // Step 2: Marked box (aspect is damaged)
  burned: 'burned',      // Step 3: Burned box (aspect is burned/destroyed)

  // Cycle order for clicking boxes in play mode
  cycleOrder: ['default', 'marked', 'burned']
};

/**
 * Damage type categories
 * See GAME-RULES.md § "Damage Types System"
 * @constant
 */
export const DAMAGE_TYPE_CATEGORIES = {
  dealing: 'Dealing',       // What damage the aspect can deal
  resistance: 'Resistance', // Damage types the aspect resists
  immunity: 'Immunity',     // Damage types the aspect is immune to
  weakness: 'Weakness'      // Damage types the aspect is weak to
};

/**
 * Damage type selection types (from aspects.json)
 * See GAME-RULES.md § "Damage Type Selection Mechanics"
 * @constant
 */
export const DAMAGE_SELECTION_TYPES = {
  choose1: 'Choose 1',           // Player picks 1 damage type
  choose2: 'Choose 2',           // Player picks 2 damage types
  choose3: 'Choose 3',           // Player picks 3 damage types
  choose1from2: 'Choose 1 from', // Player picks 1 from 2 options
  choose1from3: 'Choose 1 from'  // Player picks 1 from 3 options (same value)
};

// ============================================================================
// SHIP CREATION
// ============================================================================
// See GAME-RULES.md § "Ship Creation"

/**
 * Ship creation stakes budget formula constants
 * Formula: 6 (base) + (3 × crew size) + additional stakes
 * See GAME-RULES.md § "Stakes Budget"
 * @constant
 */
export const SHIP_BUDGETS = {
  baseStakes: 6,              // Base stakes for all ships
  stakesPerCrewMember: 3,     // Stakes added per anticipated crew member
  minCrewSize: 0,             // Minimum crew size
  defaultCrewSize: 0,         // Default crew size for new ships
  defaultAdditionalStakes: 0  // Default additional stakes
};

/**
 * Ship rating names
 * See GAME-RULES.md § "Ship Ratings"
 * @constant
 */
export const SHIP_RATINGS = [
  'Armour',
  'Seals',
  'Speed',
  'Saws',
  'Stealth',
  'Tilt'
];

/**
 * Ship rating defaults
 * All ratings start at 1, then bonuses are added from parts/fittings/undercrew
 * @constant
 */
export const SHIP_RATING_DEFAULTS = {
  baseRating: 1, // All ratings start at 1
  minRating: 1,  // Ratings cannot go below 1
  maxRating: null // No explicit maximum (depends on selected parts)
};

/**
 * Ship damage states for ratings and undercrew
 * See GAME-RULES.md § "Ship Damage Tracking"
 * @constant
 */
export const SHIP_DAMAGE_STATES = {
  default: 'default', // Undamaged state
  burned: 'burned',   // Damaged/burned state

  // Cycle order for ratings (toggle between default and burned)
  ratingCycleOrder: ['default', 'burned']
};

/**
 * Journey clock types
 * See GAME-RULES.md § "Journey Mechanics"
 * @constant
 */
export const JOURNEY_CLOCKS = {
  progress: 'progress',       // Progress toward destination
  risk: 'risk',              // Accumulating danger/complications
  pathfinding: 'pathfinding', // Navigation challenges
  riot: 'riot'               // Crew unrest/mutiny
};

/**
 * Journey clock defaults
 * @constant
 */
export const JOURNEY_CLOCK_DEFAULTS = {
  minTicks: 4,    // Minimum clock size
  maxTicks: 12,   // Maximum clock size
  defaultTicks: 6 // Default clock size
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Calculate total skill points spent (skills + languages, excluding Low Sour)
 * See GAME-RULES.md § "Skills & Languages (8 Points Total)"
 * @param {Object<string, number>} skills - Skills object with rank values
 * @param {Object<string, number>} languages - Languages object with rank values
 * @returns {number} Total points spent
 */
export function calculateSkillPointsSpent(skills, languages) {
  const skillPoints = Object.values(skills).reduce((sum, rank) => sum + rank, 0);
  const languagePoints = Object.entries(languages)
    .filter(([name]) => name !== 'Low Sour') // Low Sour doesn't count toward budget
    .reduce((sum, [, rank]) => sum + rank, 0);
  return skillPoints + languagePoints;
}

/**
 * Calculate remaining skill points available
 * @param {Object<string, number>} skills - Skills object
 * @param {Object<string, number>} languages - Languages object
 * @returns {number} Points remaining (can be negative if over budget)
 */
export function calculateRemainingSkillPoints(skills, languages) {
  return CHARACTER_BUDGETS.skillPoints - calculateSkillPointsSpent(skills, languages);
}

/**
 * Check if character meets minimum creation requirements
 * See GAME-RULES.md § "Validation & Error Prevention"
 * @param {Object} character - Character object to validate
 * @returns {Object} Validation result { isValid: boolean, errors: string[] }
 */
export function isCharacterComplete(character) {
  const errors = [];

  // Must have a name
  if (!character.name || character.name.trim() === '') {
    errors.push('Character must have a name');
  }

  // Must select bloodline, origin, and post
  if (!character.bloodline) errors.push('Must select a bloodline');
  if (!character.origin) errors.push('Must select an origin');
  if (!character.post) errors.push('Must select a post');

  // Must have exactly 4 aspects
  if (character.selectedAspects.length !== CHARACTER_BUDGETS.aspects) {
    errors.push(`Must select exactly ${CHARACTER_BUDGETS.aspects} aspects (currently ${character.selectedAspects.length})`);
  }

  // Must have exactly 3 edges
  if (character.selectedEdges.length !== CHARACTER_BUDGETS.edges) {
    errors.push(`Must select exactly ${CHARACTER_BUDGETS.edges} edges (currently ${character.selectedEdges.length})`);
  }

  // Must spend exactly 8 skill points
  const skillPointsSpent = calculateSkillPointsSpent(character.skills, character.languages);
  if (skillPointsSpent !== CHARACTER_BUDGETS.skillPoints) {
    errors.push(`Must spend exactly ${CHARACTER_BUDGETS.skillPoints} skill points (currently ${skillPointsSpent})`);
  }

  // Must have 3 drives
  if (character.drives.filter(d => d.trim() !== '').length !== CHARACTER_BUDGETS.drives) {
    errors.push(`Must have ${CHARACTER_BUDGETS.drives} drives`);
  }

  // Must have 3 mires
  if (character.mires.filter(m => m.text.trim() !== '').length !== CHARACTER_BUDGETS.mires) {
    errors.push(`Must have ${CHARACTER_BUDGETS.mires} mires`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if adding/removing a skill rank is allowed in current mode
 * See GAME-RULES.md § "Skills & Languages" for rank limits
 * @param {Object} character - Character object
 * @param {string} skillName - Name of skill to modify
 * @param {number} delta - Change amount (+1 or -1)
 * @param {boolean} isLanguage - Whether this is a language (affects Low Sour check)
 * @returns {Object} { allowed: boolean, reason: string }
 */
export function canAdjustSkill(character, skillName, delta, isLanguage = false) {
  // Low Sour cannot be modified in creation mode
  if (isLanguage && skillName === 'Low Sour' && character.mode === 'creation') {
    return {
      allowed: false,
      reason: 'Low Sour is locked at rank 3 in creation mode'
    };
  }

  const currentRank = (isLanguage ? character.languages[skillName] : character.skills[skillName]) || 0;
  const newRank = currentRank + delta;
  const limits = RANK_LIMITS[character.mode];

  // Check rank limits
  if (newRank < limits.min) {
    return {
      allowed: false,
      reason: `Rank cannot go below ${limits.min}`
    };
  }

  if (newRank > limits.max) {
    return {
      allowed: false,
      reason: `Rank cannot exceed ${limits.max} in ${character.mode} mode`
    };
  }

  // In creation mode, check budget
  if (character.mode === 'creation' && delta > 0) {
    const remaining = calculateRemainingSkillPoints(character.skills, character.languages);
    if (remaining < delta) {
      return {
        allowed: false,
        reason: `Not enough skill points remaining (${remaining} available)`
      };
    }
  }

  return { allowed: true, reason: '' };
}

/**
 * Check if aspect track can be expanded
 * See GAME-RULES.md § "Track Expansion"
 * @param {Object} aspect - Aspect object with trackSize
 * @returns {Object} { canExpand: boolean, reason: string }
 */
export function canExpandAspectTrack(aspect) {
  if (aspect.trackSize >= TRACK_CONSTRAINTS.maxExpansion) {
    return {
      canExpand: false,
      reason: `Track is already at maximum size (${TRACK_CONSTRAINTS.maxExpansion})`
    };
  }

  return { canExpand: true, reason: '' };
}

/**
 * Calculate ship stakes budget
 * See GAME-RULES.md § "Stakes Budget"
 * Formula: 6 (base) + (3 × crew size) + additional stakes
 * @param {number} crewSize - Anticipated crew size
 * @param {number} additionalStakes - Additional stakes from character aspects/edges
 * @returns {number} Total stakes budget
 */
export function calculateShipStakesBudget(crewSize, additionalStakes = 0) {
  return SHIP_BUDGETS.baseStakes + (crewSize * SHIP_BUDGETS.stakesPerCrewMember) + additionalStakes;
}

/**
 * Calculate total stakes spent on ship parts
 * @param {Array} selectedParts - Array of selected ship part objects
 * @param {Array} selectedFittings - Array of selected fitting objects
 * @param {Array} selectedUndercrew - Array of selected undercrew objects
 * @returns {number} Total stakes spent
 */
export function calculateShipStakesSpent(selectedParts, selectedFittings, selectedUndercrew) {
  const partsCost = selectedParts.reduce((sum, part) => sum + (part.cost || 0), 0);
  const fittingsCost = selectedFittings.reduce((sum, fitting) => sum + (fitting.cost || 0), 0);
  const undercrewCost = selectedUndercrew.reduce((sum, crew) => sum + (crew.cost || 0), 0);
  return partsCost + fittingsCost + undercrewCost;
}

/**
 * Check if ship creation is complete
 * See GAME-RULES.md § "Ship Creation"
 * @param {Object} ship - Ship object to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function isShipComplete(ship) {
  const errors = [];

  // Must have a name
  if (!ship.name || ship.name.trim() === '') {
    errors.push('Ship must have a name');
  }

  // Stakes validation
  const budget = calculateShipStakesBudget(ship.anticipatedCrewSize, ship.additionalStakes);
  const spent = calculateShipStakesSpent(
    ship.selectedParts,
    ship.selectedFittings,
    ship.selectedUndercrew
  );

  if (spent > budget) {
    errors.push(`Stakes budget exceeded: ${spent}/${budget} stakes used`);
  }

  // Should have at least one part selected (soft requirement)
  if (ship.selectedParts.length === 0) {
    errors.push('Ship should have at least one part selected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get damage state cycle position
 * @param {string} currentState - Current damage state
 * @param {Array<string>} cycleOrder - Cycle order array
 * @returns {string} Next state in cycle
 */
export function getNextDamageState(currentState, cycleOrder = DAMAGE_STATES.cycleOrder) {
  const currentIndex = cycleOrder.indexOf(currentState);
  const nextIndex = (currentIndex + 1) % cycleOrder.length;
  return cycleOrder[nextIndex];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Constants
  CHARACTER_BUDGETS,
  RANK_LIMITS,
  LOW_SOUR_DEFAULT_RANK,
  LOW_SOUR_LOCKED_IN_CREATION,
  TRACK_CONSTRAINTS,
  DAMAGE_STATES,
  DAMAGE_TYPE_CATEGORIES,
  DAMAGE_SELECTION_TYPES,
  SHIP_BUDGETS,
  SHIP_RATINGS,
  SHIP_RATING_DEFAULTS,
  SHIP_DAMAGE_STATES,
  JOURNEY_CLOCKS,
  JOURNEY_CLOCK_DEFAULTS,

  // Validation functions
  calculateSkillPointsSpent,
  calculateRemainingSkillPoints,
  isCharacterComplete,
  canAdjustSkill,
  canExpandAspectTrack,
  calculateShipStakesBudget,
  calculateShipStakesSpent,
  isShipComplete,
  getNextDamageState
};
