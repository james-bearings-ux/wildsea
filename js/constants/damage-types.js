/**
 * Damage Types and Immunity Constants
 * Based on provisional-damage-type-list.txt and aspects.json analysis
 */

/**
 * All damage types that can be dealt, resisted, or cause weakness
 * Sorted alphabetically for consistency
 */
export const DAMAGE_TYPES = [
  'Acid',
  'Blast',
  'Blunt',
  'Flame',
  'Frost',     // Note: "Cold" is a synonym that appears in some aspects, converted to "Frost" during parsing
  'Hewing',
  'Keen',
  'Salt',
  'Serrated',
  'Spike',
  'Toxin',
  'Volt'
];

/**
 * Damage type synonyms/aliases
 * Maps alternate names to canonical damage type names
 */
export const DAMAGE_TYPE_ALIASES = {
  'cold': 'Frost'
};

/**
 * Damage type descriptions for tooltips
 * Based on damage-type-descriptions.txt
 */
export const DAMAGE_TYPE_DESCRIPTIONS = {
  'Blunt': {
    subtitle: 'Crushing damage',
    description: 'Good at stunning and breaking. This might come from a club, hammer, or tail swipe, or impact with an object or the ground at high speed. It could cause bruising or leave a target with broken bones.'
  },
  'Keen': {
    subtitle: 'Cutting damage',
    description: 'Good at slicing and bleeding. This might come from a cutlass, claw, or sharp-edged leaf, and will likely leave wounds that need bandaging to prevent heavy blood loss.'
  },
  'Spike': {
    subtitle: 'Piercing damage',
    description: 'Good at penetrating and impaling. This might come from a spearhead, arrow, or bite, or high-speed impact with a sturdy branch at the wrong angle. Lasting damage to internal organs is a real possibility.'
  },
  'Hewing': {
    subtitle: 'Chopping damage',
    description: 'Good at splitting and breaking. This might come from an axe or the claws of a particularly powerful creature, and hewing injuries are likely to come in the form of lost limbs and bone breaks.'
  },
  'Serrated': {
    subtitle: 'Sawing damage',
    description: 'Good at ripping and tearing. This might come from a jagserry, sawtooth prow, or any other kind of serrated edge, and will leave ragged-edged wounds that scar prominently.'
  },
  'Toxin': {
    subtitle: 'Poison damage',
    description: 'Good at sickening and confusing. This might come from tainted food or plant venom, and will usually cause illnesses and short-term loss of senses.'
  },
  'Acid': {
    subtitle: 'Corrosive damage',
    description: 'Good at melting and searing. This might come from... well, acid (and other caustic or corrosive substances). It\'s likely to disfigure or blind, even if only temporarily, or dull and damage nerves.'
  },
  'Blast': {
    subtitle: 'Explosive damage',
    description: 'Good at stunning and shattering. This might come from gunshots, massive sounds, or the impact of nearby detonations, such as from cannon fire. Likely to leave a sufferer dazed, confused, deafened, and staggering, and can definitely break bones.'
  },
  'Volt': {
    subtitle: 'Electrical damage',
    description: 'Good at shocking and paralysing. This might come from lightning strikes or electrically charged weapons, and is likely to temporarily knock an individual out as well as leaving burns.'
  },
  'Frost': {
    subtitle: 'Cold damage',
    description: 'Good at slowing and freezing. This is most likely to be an environmental threat, caused by winter winds and exposure, but some creatures can manipulate cryonic glands as a weapon. Causes shivering, numbness, and invites future illnesses.'
  },
  'Salt': {
    subtitle: 'Crystalline damage',
    description: 'Good at drying and banishing. This might come from spirits or dessicants, and can leave weird and arcane complications or rough, tender skin.'
  },
  'Flame': {
    subtitle: 'Forbidden damage that burns, melts, and inspires fear',
    description: 'Comes from fire, or occasionally searing liquids.'
  }
};

/**
 * Non-damage conditions and hazards that can be resisted or grant immunity
 */
export const HAZARD_CONDITIONS = [
  'bad air',
  'airborne spores',
  'bites and stings',
  'crezzerin effects',
  'diseases',
  'hallucinations',
  'infections',
  'mesmerics',
  'mental compulsions',
  'poisons',
  'sickness',
  'traps'
];

/**
 * Range types for damage dealing
 */
export const DAMAGE_RANGES = {
  CQ: 'CQ',  // Close Quarters
  LR: 'LR',  // Long Range
  UR: 'UR'   // Undercrew (rare)
};

/**
 * Categories for damage type interactions
 */
export const DAMAGE_CATEGORIES = {
  DEALING: 'dealing',          // This aspect deals damage
  RESISTANCE: 'resistance',     // This aspect provides resistance to damage
  IMMUNITY: 'immunity',         // This aspect provides complete immunity
  WEAKNESS: 'weakness'          // This aspect causes vulnerability/weakness
};

/**
 * Selection types for damage type choices
 */
export const SELECTION_TYPES = {
  FIXED: 'fixed',      // No choice - damage types are predetermined
  CHOOSE: 'choose'     // Player must choose from a list
};

/**
 * Check if a string is a valid damage type
 * @param {string} type - The type to check (case-insensitive)
 * @returns {boolean}
 */
export function isValidDamageType(type) {
  const normalized = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  return DAMAGE_TYPES.includes(normalized);
}

/**
 * Get description for a damage type (for tooltips)
 * @param {string} type - The damage type
 * @returns {object|null} - Object with subtitle and description, or null if not found
 */
export function getDamageTypeDescription(type) {
  const normalized = normalizeDamageType(type);
  return DAMAGE_TYPE_DESCRIPTIONS[normalized] || null;
}

/**
 * Normalize damage type capitalization and handle aliases
 * @param {string} type - The damage type
 * @returns {string} - Capitalized canonical version (e.g., "keen" -> "Keen", "cold" -> "Frost")
 */
export function normalizeDamageType(type) {
  const lowercased = type.toLowerCase();

  // Check if this is an alias and convert to canonical name
  if (DAMAGE_TYPE_ALIASES[lowercased]) {
    return DAMAGE_TYPE_ALIASES[lowercased];
  }

  // Standard capitalization
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Parse damage types from a description string
 * Looks for patterns like "chosen from the following list: X, Y, Z"
 * Returns all matches found (aspect can have multiple categories)
 * @param {string} description - The aspect description
 * @returns {Array|null} - Array of parsed damage type objects, or null if none found
 */
export function parseDamageTypesFromDescription(description) {
  const matches = [];

  // Pattern: "resistant to X damage types, chosen from the following list: A, B, C"
  const choosePattern = /resistant to (\w+) damage types?,\s*chosen from the following list:\s*([^.]+)/i;
  const chooseMatch = description.match(choosePattern);

  if (chooseMatch) {
    const count = chooseMatch[1].toLowerCase();
    const countMap = { 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5 };
    const chooseCount = countMap[count] || parseInt(count) || 3;

    const typeList = chooseMatch[2]
      .split(',')
      .map(t => t.trim())
      .map(normalizeDamageType)
      .filter(t => t.length > 0);

    matches.push({
      category: DAMAGE_CATEGORIES.RESISTANCE,
      selectionType: SELECTION_TYPES.CHOOSE,
      chooseCount,
      options: typeList
    });
  }

  // Pattern: "resistant/resistance to <damage type> damage" (fixed, no choice)
  const resistancePattern = /resistan(?:t|ce) to ([a-z]+(?:\s+(?:and|or)\s+[a-z]+)*)\s+damage/i;
  const resistanceMatch = description.match(resistancePattern);

  if (resistanceMatch) {
    const typeString = resistanceMatch[1];

    // Handle multiple types with "and" or "or"
    const types = typeString
      .split(/\s+(?:and|or)\s+/)
      .map(normalizeDamageType);

    matches.push({
      category: DAMAGE_CATEGORIES.RESISTANCE,
      selectionType: SELECTION_TYPES.FIXED,
      options: types
    });
  }

  // Pattern: "deals CQ/LR/UR <damage type> damage"
  const dealsPattern = /deals\s+(CQ|LR|UR)\s+([a-z]+(?:\s+(?:and|or)\s+[a-z]+)*)\s+damage/i;
  const dealsMatch = description.match(dealsPattern);

  if (dealsMatch) {
    const range = dealsMatch[1].toUpperCase();
    const typeString = dealsMatch[2];

    // Both "and" and "or" mean the damage types are available (not a choice)
    // "or" means the player can choose which to use during play, but both are inherent to the aspect
    // Only aspects with explicit "choose" language require permanent selection
    const types = typeString
      .split(/\s+(?:and|or)\s+/)
      .map(normalizeDamageType);

    matches.push({
      category: DAMAGE_CATEGORIES.DEALING,
      selectionType: SELECTION_TYPES.FIXED,
      chooseCount: null,
      options: types,
      range
    });
  }

  // Pattern: "weakness/weak to <damage type(s)>" - handles comma-separated lists
  const weaknessPattern = /weak(?:ness)? to ([a-z]+(?:(?:,\s*| and | or )[a-z]+)*)(?: damage)?/i;
  const weaknessMatch = description.match(weaknessPattern);

  if (weaknessMatch) {
    const typeString = weaknessMatch[1];

    // Handle comma-separated lists and "and"/"or"
    const types = typeString
      .split(/(?:,\s*| and | or )+/)
      .map(normalizeDamageType)
      .filter(t => t.length > 0);

    matches.push({
      category: DAMAGE_CATEGORIES.WEAKNESS,
      selectionType: SELECTION_TYPES.FIXED,
      options: types
    });
  }

  // Pattern: "immune to <damage type(s)>" - handles comma-separated lists
  const immunityPattern = /immune to ([a-z]+(?:(?:,\s*| and | or )[a-z]+)*)(?: damage)?/i;
  const immunityMatch = description.match(immunityPattern);

  if (immunityMatch) {
    const typeString = immunityMatch[1];

    // Handle comma-separated lists and "and"/"or"
    const types = typeString
      .split(/(?:,\s*| and | or )+/)
      .map(normalizeDamageType)
      .filter(t => t.length > 0);

    matches.push({
      category: DAMAGE_CATEGORIES.IMMUNITY,
      selectionType: SELECTION_TYPES.FIXED,
      options: types
    });
  }

  return matches.length > 0 ? matches : null;
}
