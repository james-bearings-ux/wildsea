/**
 * Character state management module
 * Handles character data and all mutation functions
 * Now using Supabase for real-time multiplayer support
 */

import { getGameData } from '../data/loader.js';
import { supabase } from '../supabaseClient.js';
import { parseDamageTypesFromDescription } from '../constants/damage-types.js';
import { TRACK_CONSTRAINTS } from '../constants/game-rules.js';

// Debug flag - only log in development mode
const DEBUG = import.meta.env.DEV;

/**
 * Character creation budgets and limits
 *
 * These values define the core constraints that don't vary by scenario.
 * See GAME-RULES.md § "Character Creation" for detailed rationale.
 *
 * @constant
 * @type {Object}
 * @property {number} edges - Maximum edges to select (3 from 7 available)
 *   Forces meaningful choices about character specialization. See GAME-RULES.md § "Edges"
 * @property {number} maxAspectsAdvancement - Maximum aspects in advancement mode (7)
 *   Allows growth beyond creation limits while maintaining balance. See GAME-RULES.md § "Advancement"
 */
export const BUDGETS = {
  edges: 3,
  maxAspectsAdvancement: 7
};

/**
 * Scenario-specific budgets for character creation
 *
 * The Wildsea offers two creation scenarios with vastly different starting capabilities.
 * See GAME-RULES.md § "Creation Scenarios" for detailed rationale.
 *
 * @constant
 * @type {Object}
 */
export const SCENARIO_BUDGETS = {
  'old dog': {
    name: 'Old Dog',
    description: 'Experienced character ready for dangerous adventures',
    aspects: 6,
    skillPoints: 15,
    resources: 6
  },
  'young gun': {
    name: 'Young Gun',
    description: 'Inexperienced character just starting their journey',
    aspects: 4,
    skillPoints: 8,
    resources: 4
  }
};

/**
 * Get the budget limits for a character based on their scenario
 * @param {Object} character - Character object with scenario property
 * @returns {Object} Budget object with aspects, skillPoints, edges, resources, maxAspectsAdvancement
 */
export function getBudgets(character) {
  const scenario = character.scenario || 'old dog';
  const scenarioBudgets = SCENARIO_BUDGETS[scenario];

  return {
    aspects: scenarioBudgets.aspects,
    skillPoints: scenarioBudgets.skillPoints,
    edges: BUDGETS.edges,
    resources: scenarioBudgets.resources,
    maxAspectsAdvancement: BUDGETS.maxAspectsAdvancement
  };
}

/**
 * Create a new character with default values and save to Supabase
 * Creates character in creation mode with default bloodline/origin/post
 * Initializes all arrays and objects to empty/default states
 * @param {string} sessionId - Session ID to associate character with
 * @param {string} [name='Unnamed Character'] - Character name
 * @param {string} [bloodline='Tzelicrae'] - Starting bloodline
 * @param {string} [origin='Ridgeback'] - Starting origin
 * @param {string} [post='Mesmer'] - Starting post
 * @returns {Promise<Object>} Newly created character object (converted from DB format)
 * @throws {Error} If database insert fails
 */
export async function createCharacter(sessionId, name = 'Unnamed Character', bloodline = 'Tzelicrae', origin = 'Ridgeback', post = 'Mesmer') {
  const { data, error } = await supabase
    .from('characters')
    .insert([{
      session_id: sessionId,
      name,
      mode: 'creation',
      scenario: 'old dog', // Default to Old Dog scenario
      bloodline,
      origin,
      post,
      selected_aspects: [],
      selected_edges: [],
      skills: {},
      // Low Sour starts at rank 3 and doesn't count toward skill point budget
      // See GAME-RULES.md § "Low Sour (Default Language)"
      languages: { 'Low Sour': 3 },
      drives: ['', '', ''],
      mires: [
        { text: '', checkbox1: false, checkbox2: false },
        { text: '', checkbox1: false, checkbox2: false },
        { text: '', checkbox1: false, checkbox2: false }
      ],
      milestones: [],
      tasks: [],
      notes: '',
      resources: {
        charts: [],
        salvage: [],
        specimens: [],
        whispers: []
      },
      journey_role: ''
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to create character:', error);
    throw error;
  }

  // Convert database format to app format
  return convertFromDB(data);
}

/**
 * Load a character from Supabase by ID
 * Converts database format to app format
 * Overrides mode with user's localStorage preference if available
 * @param {string} characterId - Character ID to load
 * @returns {Promise<Object|null>} Character object or null if not found/error
 */
export async function loadCharacter(characterId) {
  const { data, error} = await supabase
    .from('characters')
    .select('*')
    .eq('id', characterId)
    .single();

  if (error) {
    console.error(`Failed to load character ${characterId}:`, error);
    return null;
  }

  const character = convertFromDB(data);

  // Override mode with per-user preference from localStorage
  const userMode = localStorage.getItem(`wildsea-character-${characterId}-mode`);
  if (userMode) {
    character.mode = userMode;
  }

  return character;
}

/**
 * Save a character to Supabase
 * Mode IS saved to database as canonical state, but can be overridden per-user via localStorage
 * Updates the updated_at timestamp automatically
 * @param {Object} character - Character object to save
 * @returns {Promise<void>}
 * @throws {Error} If database update fails
 */
export async function saveCharacter(character) {
  if (DEBUG) {
    console.log('[SAVE] Saving character to database:', character.id, character.name, 'at', new Date().toISOString());
  }

  // ========================================================================
  // COLUMN NAME MAPPING: camelCase → snake_case
  // ========================================================================
  // This is the inverse transformation of convertFromDB()
  // Application uses camelCase (JavaScript convention): selectedAspects, journeyRole
  // Database expects snake_case (PostgreSQL convention): selected_aspects, journey_role
  //
  // Note: We don't need a separate convertToDB() function because the mapping
  // is straightforward and happens inline during the database update.
  //
  // Mapping table:
  // - selectedAspects  → selected_aspects
  // - selectedEdges    → selected_edges
  // - journeyRole      → journey_role
  // - updated_at       → Auto-generated timestamp (not in character object)

  const { error } = await supabase
    .from('characters')
    .update({
      // Identity fields (same in DB and app)
      name: character.name,
      mode: character.mode,                          // Save canonical mode (creation/play)
      scenario: character.scenario,                  // Save scenario (old dog/young gun)
      bloodline: character.bloodline,
      origin: character.origin,
      post: character.post,

      // Column name mapping: camelCase → snake_case
      selected_aspects: character.selectedAspects,   // App: selectedAspects
      selected_edges: character.selectedEdges,       // App: selectedEdges

      // No mapping needed (same in DB and app)
      skills: character.skills,
      languages: character.languages,
      drives: character.drives,
      mires: character.mires,
      milestones: character.milestones,
      tasks: character.tasks,
      notes: character.notes,
      resources: character.resources,

      // Column name mapping: camelCase → snake_case
      journey_role: character.journeyRole,           // App: journeyRole

      // Database metadata (auto-generated)
      updated_at: new Date().toISOString()           // Timestamp for last modification
    })
    .eq('id', character.id);

  if (error) {
    console.error(`[SAVE] Failed to save character ${character.id}:`, error);
    throw error;
  }

  if (DEBUG) {
    console.log('[SAVE] Character saved successfully:', character.id);
  }
}

/**
 * Delete a character from Supabase
 * @param {string} characterId - Character ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If database delete fails
 */
export async function deleteCharacter(characterId) {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId);

  if (error) {
    console.error(`Failed to delete character ${characterId}:`, error);
    throw error;
  }
}

/**
 * Get all characters from Supabase for a session
 * Converts all characters from database format to app format
 * @param {string} sessionId - Session ID to fetch characters for
 * @returns {Promise<Array<Object>>} Array of character objects (empty array if error)
 */
export async function getAllCharacters(sessionId) {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('session_id', sessionId);

  if (error) {
    console.error('Failed to load characters:', error);
    return [];
  }

  return data.map(convertFromDB);
}

/**
 * Converts database character format to application format
 *
 * Performs three key transformations:
 * 1. **Column name mapping**: snake_case (DB) → camelCase (app)
 * 2. **Data migration**: Old formats → new formats (backwards compatibility)
 * 3. **Default initialization**: Missing fields → sensible defaults
 *
 * @param {Object} dbChar - Character data from database with snake_case columns
 * @returns {Object} Character object ready for application use with camelCase properties
 *
 * @example
 * // Database format (snake_case):
 * {
 *   id: "abc123",
 *   selected_aspects: [...],
 *   selected_edges: [...],
 *   journey_role: "navigator"
 * }
 *
 * // Application format (camelCase):
 * {
 *   id: "abc123",
 *   selectedAspects: [...],
 *   selectedEdges: [...],
 *   journeyRole: "navigator"
 * }
 */
function convertFromDB(dbChar) {
  // ========================================================================
  // DATA MIGRATION: selectedDamageTypes format
  // ========================================================================
  // Old format: selectedDamageTypes was an array: ["fire", "frost"]
  // New format: selectedDamageTypes is an object keyed by category:
  //   { "Resistance": ["fire", "frost"], "Dealing": ["blunt"] }
  // This migration ensures old characters still work after schema changes

  const selectedAspects = (dbChar.selected_aspects || []).map(aspect => {
    // If selectedDamageTypes is an array (old format), convert to object keyed by category
    if (aspect.selectedDamageTypes && Array.isArray(aspect.selectedDamageTypes)) {
      const oldSelections = aspect.selectedDamageTypes;

      // Handle both old and new damageTypes format
      const damageTypesArray = Array.isArray(aspect.damageTypes)
        ? aspect.damageTypes
        : (aspect.damageTypes ? [aspect.damageTypes] : []);

      // Find the category with "choose" type (that's where the selections belong)
      const chooseCategory = damageTypesArray.find(dt => dt.selectionType === 'choose');

      if (chooseCategory && oldSelections.length > 0) {
        // Migrate array to object with category key
        aspect.selectedDamageTypes = {
          [chooseCategory.category]: oldSelections
        };
      } else {
        // No valid category found, reset to empty object
        aspect.selectedDamageTypes = {};
      }
    } else if (!aspect.selectedDamageTypes) {
      // Initialize if missing
      aspect.selectedDamageTypes = {};
    }

    return aspect;
  });

  // ========================================================================
  // COLUMN NAME MAPPING & DEFAULT INITIALIZATION
  // ========================================================================
  // Database uses snake_case (PostgreSQL convention): selected_aspects, journey_role
  // Application uses camelCase (JavaScript convention): selectedAspects, journeyRole
  //
  // Default initialization ensures all properties exist even if missing from DB:
  // - Prevents null/undefined errors
  // - Ensures UI always has valid data structures to render
  // - Applies game rule defaults (e.g., Low Sour rank 3)

  return {
    // Identity fields (no defaults needed, always present)
    id: dbChar.id,
    mode: dbChar.mode,
    scenario: dbChar.scenario || 'old dog',            // Default to old dog for backwards compatibility
    name: dbChar.name,
    bloodline: dbChar.bloodline,
    origin: dbChar.origin,
    post: dbChar.post,

    // Core character data with column name mapping
    selectedAspects,                                   // DB: selected_aspects
    selectedEdges: dbChar.selected_edges || [],        // DB: selected_edges (default: empty array)
    skills: dbChar.skills || {},                       // DB: skills (default: empty object)

    // Languages - Special case for Low Sour default
    // See GAME-RULES.md § "Low Sour (Default Language)"
    // Low Sour is the common trade language (rank 3) that all characters know
    languages: dbChar.languages || { 'Low Sour': 3 },  // DB: languages (default: Low Sour rank 3)

    // Drives - Must have exactly 3 (CHARACTER_BUDGETS.drives = 3)
    // Default to 3 empty strings if missing
    drives: dbChar.drives || ['', '', ''],             // DB: drives (default: 3 empty strings)

    // Mires - Must have exactly 3 (CHARACTER_BUDGETS.mires = 3)
    // Each mire has text and two checkbox states
    mires: dbChar.mires || [                           // DB: mires (default: 3 empty mires)
      { text: '', checkbox1: false, checkbox2: false },
      { text: '', checkbox1: false, checkbox2: false },
      { text: '', checkbox1: false, checkbox2: false }
    ],

    // Progression tracking
    milestones: dbChar.milestones || [],               // DB: milestones (default: empty array)
    tasks: dbChar.tasks || [],                         // DB: tasks (default: empty array)
    notes: dbChar.notes || '',                         // DB: notes (default: empty string)

    // Resources - 4 types (charts, salvage, specimens, whispers)
    resources: dbChar.resources || {                   // DB: resources (default: empty arrays)
      charts: [],
      salvage: [],
      specimens: [],
      whispers: []
    },

    // Ship integration
    journeyRole: dbChar.journey_role || ''             // DB: journey_role (default: empty string)
  };
}

/**
 * Cache for available aspects to avoid expensive array operations
 * Key format: "bloodline-origin-post"
 */
const availableAspectsCache = new Map();

/**
 * Get all available aspects based on character's bloodline, origin, and post
 * Combines aspects from all three sources, adding source and category metadata
 * Results are cached by "bloodline-origin-post" key to avoid expensive recomputation
 * @param {Object} char - Character object with bloodline, origin, and post properties
 * @returns {Array<Object>} Array of aspect objects with added source and category fields
 */
export function getAvailableAspects(char) {
  const cacheKey = `${char.bloodline}-${char.origin}-${char.post}`;

  // Return cached result if available
  if (availableAspectsCache.has(cacheKey)) {
    return availableAspectsCache.get(cacheKey);
  }

  // Compute available aspects
  const GAME_DATA = getGameData();
  const available = [];

  const bloodlineAspects = GAME_DATA.aspects[char.bloodline] || [];
  bloodlineAspects.forEach(aspect => {
    available.push({
      ...aspect,
      source: char.bloodline,
      category: 'Bloodline'
    });
  });

  const originAspects = GAME_DATA.aspects[char.origin] || [];
  originAspects.forEach(aspect => {
    available.push({
      ...aspect,
      source: char.origin,
      category: 'Origin'
    });
  });

  const postAspects = GAME_DATA.aspects[char.post] || [];
  postAspects.forEach(aspect => {
    available.push({
      ...aspect,
      source: char.post,
      category: 'Post'
    });
  });

  // Cache and return
  availableAspectsCache.set(cacheKey, available);
  return available;
}

/**
 * Character property mutations
 */
/**
 * Update character name
 * @param {string} value - New character name
 * @param {Object} char - Character object to mutate
 * @mutates char.name
 */
export function onCharacterNameChange(value, char) {
  char.name = value;
}

/**
 * Change character bloodline (creation mode only)
 * WARNING: Clears all selected aspects when bloodline changes
 * @param {string} value - New bloodline name
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.bloodline - Sets new bloodline
 * @mutates char.selectedAspects - Resets to empty array (aspects are bloodline-dependent)
 */
export function onBloodlineChange(value, renderCallback, char) {
  char.bloodline = value;
  char.selectedAspects = [];
  renderCallback();
}

/**
 * Change character origin (creation mode only)
 * WARNING: Clears all selected aspects when origin changes
 * @param {string} value - New origin name
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.origin - Sets new origin
 * @mutates char.selectedAspects - Resets to empty array (aspects are origin-dependent)
 */
export function onOriginChange(value, renderCallback, char) {
  char.origin = value;
  char.selectedAspects = [];
  renderCallback();
}

/**
 * Change character post (creation mode only)
 * WARNING: Clears all selected aspects when post changes
 * @param {string} value - New post name
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.post - Sets new post
 * @mutates char.selectedAspects - Resets to empty array (aspects are post-dependent)
 */
export function onPostChange(value, renderCallback, char) {
  char.post = value;
  char.selectedAspects = [];
  renderCallback();
}

/**
 * Aspect mutations
 */

/**
 * Toggle aspect selection on/off in creation or advancement mode
 * If selecting: Respects budget limits (4 in creation, 7 in advancement)
 * If deselecting: Removes aspect from selectedAspects array
 * @param {string} aspectId - Aspect ID in format "Source-AspectName"
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.selectedAspects - Adds or removes aspect object
 * @example
 * toggleAspect('Tzelicrae-Compound Eyes', render, character);
 */
export function toggleAspect(aspectId, renderCallback, char) {
  if (char.mode !== 'creation' && char.mode !== 'advancement') return;

  const index = char.selectedAspects.findIndex(a => a.id === aspectId);

  if (index >= 0) {
    // Deselecting: remove aspect from array
    char.selectedAspects.splice(index, 1);
  } else {
    // Selecting: enforce budget limits
    const budgets = getBudgets(char);

    // Creation mode: max varies by scenario (4 for young gun, 6 for old dog)
    // See GAME-RULES.md § "Creation Scenarios"
    if (char.mode === 'creation' && char.selectedAspects.length >= budgets.aspects) {
      return;
    }
    // Advancement mode: max 7 aspects (allows growth but maintains balance)
    // See GAME-RULES.md § "Character Advancement"
    if (char.mode === 'advancement' && char.selectedAspects.length >= budgets.maxAspectsAdvancement) {
      return;
    }

    const allAspects = getAvailableAspects(char);
    const aspect = allAspects.find(a => {
      const id = a.source + '-' + a.name;
      return id === aspectId;
    });

    if (aspect) {
      char.selectedAspects.push({
        id: aspectId,
        ...aspect,
        trackSize: aspect.track, // Initialize to base track size from aspect data
        damageStates: Array(aspect.track).fill('default'), // All boxes start undamaged
        selectedDamageTypes: {} // Initialize empty object for damage type selections (keyed by category)
      });
    }
  }

  renderCallback();
}

/**
 * Cycle aspect damage box through states (play mode only)
 * Cycles: default → marked → burned → default
 * @param {string} aspectId - Aspect ID to modify
 * @param {number} boxIndex - Index of damage box to cycle (0-based)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates aspect.damageStates[boxIndex] - Cycles through damage states
 */
export function cycleAspectDamage(aspectId, boxIndex, renderCallback, char) {
  if (char.mode !== 'play') return;

  const aspect = char.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  // Damage states cycle in play mode: default → marked → burned → default
  // This represents progressive damage to aspects during gameplay
  // See GAME-RULES.md § "Damage Tracking (Play Mode)"
  const states = ['default', 'marked', 'burned'];
  const currentState = aspect.damageStates[boxIndex];
  const currentIndex = states.indexOf(currentState);
  const nextIndex = (currentIndex + 1) % states.length;

  aspect.damageStates[boxIndex] = states[nextIndex];
  renderCallback();
}

/**
 * Expand or contract aspect track size (advancement mode only)
 * Track size can be adjusted from base value (aspect.track) up to maximum of 5
 * @param {string} aspectId - Aspect ID to modify
 * @param {number} delta - Change amount (+1 to expand, -1 to contract)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates aspect.trackSize - Increases or decreases track size within limits
 * @mutates aspect.damageStates - Adjusts array length to match new trackSize
 */
export function expandAspectTrack(aspectId, delta, renderCallback, char) {
  if (char.mode !== 'advancement') return;

  const aspect = char.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  const newSize = aspect.trackSize + delta;
  // Track size limits: minimum 1 (but typically 2+), maximum from TRACK_CONSTRAINTS
  // Max prevents aspects from becoming too powerful
  // See GAME-RULES.md § "Track Expansion"
  if (newSize < TRACK_CONSTRAINTS.minSize || newSize > TRACK_CONSTRAINTS.maxExpansion) return;

  if (delta > 0) {
    aspect.damageStates.push('default');
  } else {
    aspect.damageStates.pop();
  }

  aspect.trackSize = newSize;
  renderCallback();
}

/**
 * Add aspect from full aspects list (advancement mode only)
 * Allows selecting aspects outside bloodline/origin/post
 * Respects max aspect limit (7 in advancement mode)
 * @param {Object} aspectData - Full aspect object from game data
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.selectedAspects - Pushes new aspect object with initialized track and damage states
 * @example
 * addAspectFromFullList(
 *   { name: 'Sawbones', source: 'Surgeon', type: 'Trait', track: 3, description: '...' },
 *   render,
 *   character
 * );
 */
export function addAspectFromFullList(aspectData, renderCallback, char) {
  if (char.mode !== 'advancement') return;

  // Check if already at max aspects
  if (char.selectedAspects.length >= BUDGETS.maxAspectsAdvancement) {
    return;
  }

  // Create aspect ID
  const aspectId = aspectData.source + '-' + aspectData.name;

  // Check if already selected
  if (char.selectedAspects.find(a => a.id === aspectId)) {
    return;
  }

  // Add the aspect
  char.selectedAspects.push({
    id: aspectId,
    ...aspectData,
    trackSize: aspectData.track,
    damageStates: Array(aspectData.track).fill('default'),
    selectedDamageTypes: [] // Initialize empty array for damage type selections
  });

  renderCallback();
}

/**
 * Customize aspect name and description (advancement mode only)
 * Automatically reparses damage types from new description
 * Preserves valid damage type selections, clears invalid ones
 * @param {string} aspectId - Aspect ID to customize
 * @param {string} name - New aspect name
 * @param {string} description - New aspect description (may contain damage type syntax)
 * @param {Object} char - Character object to mutate
 * @mutates aspect.name - Sets new name
 * @mutates aspect.description - Sets new description
 * @mutates aspect.customized - Marks aspect as customized (true)
 * @mutates aspect.damageTypes - Updates metadata based on new description
 * @mutates aspect.selectedDamageTypes - Preserves valid selections, removes invalid ones
 */
export function customizeAspect(aspectId, name, description, char) {
  const aspect = char.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  aspect.name = name;
  aspect.description = description;
  aspect.customized = true;

  // Reparse damage types from the new description (returns array or null)
  const newDamageTypes = parseDamageTypesFromDescription(description);

  if (newDamageTypes) {
    // New description has damage types - update metadata
    aspect.damageTypes = newDamageTypes;

    // Handle selected damage types - preserve valid selections by category
    const oldSelections = aspect.selectedDamageTypes || {};
    const newSelections = {};

    // For each new damage type category, check if we have valid old selections
    for (const dt of newDamageTypes) {
      const category = dt.category;
      const oldCategorySelections = oldSelections[category] || [];

      // Keep only selections that are still valid in the new options
      if (oldCategorySelections.length > 0 && dt.options) {
        const validSelections = oldCategorySelections.filter(type => dt.options.includes(type));
        if (validSelections.length > 0) {
          newSelections[category] = validSelections;
        }
      }
    }

    aspect.selectedDamageTypes = newSelections;
  } else {
    // New description has no damage types - clear metadata and selections
    delete aspect.damageTypes;
    aspect.selectedDamageTypes = {};
  }
}

/**
 * Reset aspect to original game data (advancement mode only)
 * Reverts customized name and description to original values from game data
 * @param {string} aspectId - Aspect ID to reset
 * @param {Object} char - Character object to mutate
 * @mutates aspect.name - Restores original name
 * @mutates aspect.description - Restores original description
 * @mutates aspect.customized - Sets to false
 */
export function resetAspectCustomization(aspectId, char) {
  const aspect = char.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  // Find original aspect data
  const allAspects = getAvailableAspects(char);
  const originalAspect = allAspects.find(a => {
    const id = a.source + '-' + a.name;
    return id === aspectId;
  });

  // If we can't find the original, try matching by source
  // (in case the name was customized)
  const originalBySource = !originalAspect
    ? allAspects.find(a => a.source === aspect.source)
    : originalAspect;

  if (originalBySource) {
    aspect.name = originalBySource.name;
    aspect.description = originalBySource.description;
    aspect.customized = false;
  }
}

/**
 * Edge mutations
 */

/**
 * Toggle edge selection on/off (creation mode only)
 * Respects budget limit of 3 edges
 * @param {string} edgeName - Name of the edge to toggle
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.selectedEdges - Adds or removes edge name from array
 */
export function toggleEdge(edgeName, renderCallback, char) {
  if (char.mode !== 'creation') return;

  const index = char.selectedEdges.indexOf(edgeName);

  if (index >= 0) {
    char.selectedEdges.splice(index, 1);
  } else {
    if (char.selectedEdges.length >= BUDGETS.edges) {
      return;
    }
    char.selectedEdges.push(edgeName);
  }

  renderCallback();
}

/**
 * Skill mutations
 */

/**
 * Adjust skill rank by delta (+1 or -1)
 * Creation mode: Max rank 2, shares 8-point budget with languages (excluding Low Sour)
 * Play/Advancement mode: Max rank 3, no budget limit
 * @param {string} name - Skill name
 * @param {number} delta - Change amount (+1 to increase, -1 to decrease)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.skills[name] - Sets new rank value (0-2 in creation, 0-3 otherwise)
 * @mutates char.skills[name] - Deletes property if rank reaches 0
 */
export function adjustSkill(name, delta, renderCallback, char) {
  const current = char.skills[name] || 0;
  // Rank limits by mode:
  // Creation: max rank 2 (prevents over-specialization at start)
  // Play/Advancement: max rank 3 (allows growth during campaign)
  // See GAME-RULES.md § "Skills & Languages"
  const newValue = Math.max(0, Math.min(char.mode === 'creation' ? 2 : 3, current + delta));

  if (char.mode === 'creation') {
    // Calculate total skill points spent (skills + languages, excluding Low Sour)
    // Budget varies by scenario: 8 points (young gun) or 15 points (old dog)
    // See GAME-RULES.md § "Creation Scenarios"
    const budgets = getBudgets(char);
    const totalPoints = Object.values(char.skills).reduce((sum, v) => sum + v, 0);
    const languagePoints = Object.entries(char.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; }) // Low Sour doesn't count
      .reduce((sum, entry) => sum + entry[1], 0);

    // Prevent exceeding budget when increasing ranks
    if (delta > 0 && totalPoints + languagePoints >= budgets.skillPoints) {
      return;
    }
  }

  if (newValue === 0) {
    delete char.skills[name];
  } else {
    char.skills[name] = newValue;
  }

  renderCallback();
}

/**
 * Language mutations
 */

/**
 * Adjust language rank by delta (+1 or -1)
 * Creation mode: Max rank 2, shares 8-point budget with skills, Low Sour locked at rank 3
 * Play/Advancement mode: Max rank 3, no budget limit, Low Sour can be decreased
 * @param {string} name - Language name
 * @param {number} delta - Change amount (+1 to increase, -1 to decrease)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.languages[name] - Sets new rank value (0-2 in creation, 0-3 otherwise)
 * @mutates char.languages[name] - Deletes property if rank reaches 0 (except Low Sour)
 */
export function adjustLanguage(name, delta, renderCallback, char) {
  // Low Sour is locked at rank 3 during creation (cannot be modified)
  // This ensures all characters start with a common language
  // See GAME-RULES.md § "Low Sour (Default Language)"
  if (name === 'Low Sour' && char.mode === 'creation') {
    return;
  }

  const current = char.languages[name] || 0;
  // Rank limits by mode (same as skills):
  // Creation: max rank 2, Play/Advancement: max rank 3
  // See GAME-RULES.md § "Skills & Languages"
  const newValue = Math.max(0, Math.min(char.mode === 'creation' ? 2 : 3, current + delta));

  if (char.mode === 'creation') {
    // Calculate total points spent (skills + languages, excluding Low Sour)
    // Budget varies by scenario: 8 points (young gun) or 15 points (old dog)
    // See GAME-RULES.md § "Creation Scenarios"
    const budgets = getBudgets(char);
    const skillPoints = Object.values(char.skills).reduce((sum, v) => sum + v, 0);
    const totalPoints = Object.entries(char.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; }) // Low Sour doesn't count
      .reduce((sum, entry) => sum + entry[1], 0);

    // Prevent exceeding budget when increasing ranks
    if (delta > 0 && skillPoints + totalPoints >= budgets.skillPoints) {
      return;
    }
  }

  // Low Sour cannot be deleted (always present)
  if (newValue === 0 && name !== 'Low Sour') {
    delete char.languages[name];
  } else {
    char.languages[name] = newValue;
  }

  renderCallback();
}

/**
 * Drive mutations
 */

/**
 * Update drive text at specified index (0-2)
 * Drives represent character motivations and goals
 * @param {number} index - Drive index (0, 1, or 2)
 * @param {string} value - New drive text
 * @param {Object} char - Character object to mutate
 * @mutates char.drives[index] - Sets new drive text
 */
export function updateDrive(index, value, char) {
  char.drives[index] = value;
}

/**
 * Mire mutations
 */

/**
 * Update mire text at specified index (0-2)
 * Mires represent character problems and complications
 * @param {number} index - Mire index (0, 1, or 2)
 * @param {string} value - New mire text
 * @param {Object} char - Character object to mutate
 * @mutates char.mires[index].text - Sets new mire text
 */
export function updateMire(index, value, char) {
  char.mires[index].text = value;
}

/**
 * Toggle mire checkbox state (play mode only)
 * Each mire has 2 checkboxes for tracking
 * @param {number} index - Mire index (0-2)
 * @param {number} checkboxNum - Checkbox number (1 or 2)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.mires[index].checkbox1 or checkbox2 - Toggles boolean state
 */
export function toggleMireCheckbox(index, checkboxNum, renderCallback, char) {
  if (checkboxNum === 1) {
    char.mires[index].checkbox1 = !char.mires[index].checkbox1;
  } else {
    char.mires[index].checkbox2 = !char.mires[index].checkbox2;
  }
  renderCallback();
}

/**
 * Milestone mutations
 */

/**
 * Add a new blank milestone to character
 * Creates milestone with unique ID, unused state, empty name, and Minor scale
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.milestones - Pushes new milestone object to array
 */
export function addMilestone(renderCallback, char) {
  char.milestones.push({
    id: Date.now().toString(),
    used: false,
    name: '',
    scale: 'Minor'
  });
  renderCallback();
}

/**
 * Update milestone name
 * @param {string} id - Milestone ID
 * @param {string} name - New milestone name
 * @param {Object} char - Character object to mutate
 * @mutates milestone.name - Sets new milestone name
 */
export function updateMilestoneName(id, name, char) {
  const milestone = char.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.name = name;
  }
}

/**
 * Update milestone scale (Minor or Major)
 * @param {string} id - Milestone ID
 * @param {string} scale - New scale value ("Minor" or "Major")
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates milestone.scale - Sets new scale value
 */
export function updateMilestoneScale(id, scale, renderCallback, char) {
  const milestone = char.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.scale = scale;
    renderCallback();
  }
}

/**
 * Toggle milestone used/unused state
 * When marked as used, milestone becomes read-only
 * @param {string} id - Milestone ID
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates milestone.used - Toggles boolean state
 */
export function toggleMilestoneUsed(id, renderCallback, char) {
  const milestone = char.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.used = !milestone.used;
    renderCallback();
  }
}

/**
 * Delete a milestone by ID
 * @param {string} id - Milestone ID to delete
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.milestones - Removes milestone from array
 */
export function deleteMilestone(id, renderCallback, char) {
  const index = char.milestones.findIndex(m => m.id === id);
  if (index >= 0) {
    char.milestones.splice(index, 1);
    renderCallback();
  }
}

/**
 * Task mutations
 */

/**
 * Add a new task with progress clock (play mode only)
 * Creates task with unique ID, name, maxTicks (1-6), currentTicks (0), and editing state (false)
 * @param {string} name - Task name
 * @param {number} maxTicks - Maximum number of ticks for progress clock (1-6, default 4)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.tasks - Pushes new task object to array
 */
export function addTask(name, maxTicks, renderCallback, char) {
  char.tasks.push({
    id: Date.now().toString(),
    name: name || '',
    maxTicks: maxTicks || 4,
    currentTicks: 0,
    editing: false
  });
  renderCallback();
}

/**
 * Update task name while in edit mode
 * @param {string} id - Task ID
 * @param {string} name - New task name
 * @param {Object} char - Character object to mutate
 * @mutates task.name - Sets new task name
 */
export function updateTaskName(id, name, char) {
  const task = char.tasks.find(t => t.id === id);
  if (task) {
    task.name = name;
  }
}

/**
 * Update task max ticks (progress clock size)
 * Constrains value between 1-6
 * @param {string} id - Task ID
 * @param {number|string} maxTicks - New max ticks value (will be parsed and constrained to 1-6)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates task.maxTicks - Sets new max ticks value (1-6)
 */
export function updateTaskMaxTicks(id, maxTicks, renderCallback, char) {
  const task = char.tasks.find(t => t.id === id);
  if (task) {
    task.maxTicks = Math.max(1, Math.min(6, parseInt(maxTicks) || 4));
    // Don't change currentTicks when editing
    renderCallback();
  }
}

/**
 * Advance task progress clock by one tick
 * Cycles back to 0 when reaching maxTicks
 * @param {string} id - Task ID
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates task.currentTicks - Increments ticks, wraps to 0 at maxTicks
 */
export function tickTask(id, renderCallback, char) {
  const task = char.tasks.find(t => t.id === id);
  if (task) {
    // Cycle: 0 -> 1 -> ... -> maxTicks -> 0
    task.currentTicks = (task.currentTicks + 1) % (task.maxTicks + 1);
    renderCallback();
  }
}

/**
 * Toggle task editing mode
 * When enabled, allows editing task name and max ticks
 * @param {string} id - Task ID
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates task.editing - Toggles boolean state
 */
export function toggleTaskEditing(id, renderCallback, char) {
  const task = char.tasks.find(t => t.id === id);
  if (task) {
    task.editing = !task.editing;
    renderCallback();
  }
}

/**
 * Delete a task by ID
 * @param {string} id - Task ID to delete
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.tasks - Removes task from array
 */
export function deleteTask(id, renderCallback, char) {
  const index = char.tasks.findIndex(t => t.id === id);
  if (index >= 0) {
    char.tasks.splice(index, 1);
    renderCallback();
  }
}

/**
 * Notes mutation
 */

/**
 * Update character notes (free-form text area)
 * @param {string} notes - New notes content
 * @param {Object} char - Character object to mutate
 * @mutates char.notes - Sets new notes text
 */
export function updateNotes(notes, char) {
  char.notes = notes;
}

/**
 * Resource mutations
 */

/**
 * Add a new resource of specified type
 * Types: "charts", "salvage", "specimens", "whispers"
 * @param {string} type - Resource type (charts, salvage, specimens, or whispers)
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.resources[type] - Pushes new resource object to array
 */
export function addResource(type, renderCallback, char) {
  char.resources[type].push({
    id: Date.now().toString(),
    name: '',
    used: false
  });
  renderCallback();
}

/**
 * Update resource name
 * @param {string} type - Resource type
 * @param {string} id - Resource ID
 * @param {string} name - New resource name
 * @param {Object} char - Character object to mutate
 * @mutates resource.name - Sets new resource name
 */
export function updateResourceName(type, id, name, char) {
  const resource = char.resources[type].find(r => r.id === id);
  if (resource) {
    resource.name = name;
  }
}

/**
 * Remove a resource by ID
 * @param {string} type - Resource type
 * @param {string} id - Resource ID to delete
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.resources[type] - Removes resource from array
 */
export function removeResource(type, id, renderCallback, char) {
  const index = char.resources[type].findIndex(r => r.id === id);
  if (index >= 0) {
    char.resources[type].splice(index, 1);
    renderCallback();
  }
}

/**
 * Toggle resource used/unused state
 * When marked as used, resource becomes read-only
 * @param {string} type - Resource type
 * @param {string} id - Resource ID
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates resource.used - Toggles boolean state
 */
export function toggleResourceUsed(type, id, renderCallback, char) {
  const resource = char.resources[type].find(r => r.id === id);
  if (resource) {
    resource.used = !resource.used;
    renderCallback();
  }
}

/**
 * Load suggested starting resources based on bloodline, origin, and post
 * Clears existing resources and populates with default resources from game data
 * Deduplicates resources if they appear in multiple sources
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.resources - Replaces all resource arrays with suggested defaults
 */
export function populateDefaultResources(renderCallback, char) {
  const GAME_DATA = getGameData();

  // Clear existing resources
  char.resources = {
    charts: [],
    salvage: [],
    specimens: [],
    whispers: []
  };

  // Collect resources from bloodline, origin, and post
  const sources = [char.bloodline, char.origin, char.post];
  const seenResources = {
    charts: new Set(),
    salvage: new Set(),
    specimens: new Set(),
    whispers: new Set()
  };

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const resourceData = GAME_DATA.startingResources[source];

    if (resourceData) {
      const resourceTypes = ['charts', 'salvage', 'specimens', 'whispers'];

      for (let j = 0; j < resourceTypes.length; j++) {
        const type = resourceTypes[j];
        const items = resourceData[type];

        if (items) {
          for (let k = 0; k < items.length; k++) {
            const itemName = items[k];

            // Only add if not already seen (avoid duplicates)
            if (!seenResources[type].has(itemName)) {
              seenResources[type].add(itemName);
              char.resources[type].push({
                id: Date.now().toString() + '-' + type + '-' + k + '-' + i,
                name: itemName,
                used: false
              });
            }
          }
        }
      }
    }
  }

  renderCallback();
}

/**
 * Mode mutations
 */

/**
 * Set character mode (creation, play, or advancement)
 * Mode is saved to localStorage per-user (not synced to database)
 * This allows each user to view the same character in different modes independently
 * @param {string} mode - New mode ("creation", "play", or "advancement")
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.mode - Sets new mode
 * @mutates localStorage - Saves mode preference for this user and character
 */
export function setMode(mode, renderCallback, char) {
  char.mode = mode;

  // Save mode to localStorage for this user only
  localStorage.setItem(`wildsea-character-${char.id}-mode`, mode);

  renderCallback();
}

/**
 * Scenario mutations
 */

/**
 * Set character creation scenario (old dog or young gun)
 * This changes the aspect and skill point budgets, trimming if necessary
 * @param {string} scenario - New scenario ("old dog" or "young gun")
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char.scenario - Sets new scenario
 * @mutates char.selectedAspects - May remove aspects if exceeding new budget
 * @mutates char.skills - May reduce skills if exceeding new budget
 * @mutates char.languages - May reduce languages if exceeding new budget
 */
export function setScenario(scenario, renderCallback, char) {
  // Only allow scenario changes in creation mode
  if (char.mode !== 'creation') return;

  const oldBudget = getBudgets(char);
  char.scenario = scenario;
  const newBudget = getBudgets(char);

  // Trim aspects if exceeding new budget
  if (char.selectedAspects.length > newBudget.aspects) {
    // Remove excess aspects from the end
    char.selectedAspects = char.selectedAspects.slice(0, newBudget.aspects);
  }

  // Trim skill/language points if exceeding new budget
  const skillPoints = Object.values(char.skills).reduce((sum, rank) => sum + rank, 0);
  const languagePoints = Object.entries(char.languages)
    .filter(([name]) => name !== 'Low Sour')
    .reduce((sum, [, rank]) => sum + rank, 0);
  const totalPoints = skillPoints + languagePoints;

  if (totalPoints > newBudget.skillPoints) {
    let pointsToRemove = totalPoints - newBudget.skillPoints;

    // Remove from skills first (in reverse alphabetical order for consistency)
    const skillNames = Object.keys(char.skills).sort().reverse();
    for (const skillName of skillNames) {
      if (pointsToRemove <= 0) break;

      const currentRank = char.skills[skillName];
      const reduction = Math.min(currentRank, pointsToRemove);
      char.skills[skillName] -= reduction;
      pointsToRemove -= reduction;

      // Remove skill entirely if reduced to 0
      if (char.skills[skillName] === 0) {
        delete char.skills[skillName];
      }
    }

    // Then remove from languages if still needed (excluding Low Sour)
    const languageNames = Object.keys(char.languages)
      .filter(name => name !== 'Low Sour')
      .sort().reverse();
    for (const langName of languageNames) {
      if (pointsToRemove <= 0) break;

      const currentRank = char.languages[langName];
      const reduction = Math.min(currentRank, pointsToRemove);
      char.languages[langName] -= reduction;
      pointsToRemove -= reduction;

      // Remove language entirely if reduced to 0
      if (char.languages[langName] === 0) {
        delete char.languages[langName];
      }
    }
  }

  renderCallback();
}

/**
 * Character generation
 */

/**
 * Generate a random character in creation mode
 * Randomizes bloodline, origin, post, and selects 4 random aspects
 * Resets all other character properties to defaults
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates char - Resets and randomizes most character properties
 */
export function generateRandomCharacter(renderCallback, char) {
  const GAME_DATA = getGameData();

  char.name = 'Random Character';
  char.bloodline = GAME_DATA.bloodlines[Math.floor(Math.random() * GAME_DATA.bloodlines.length)];
  char.origin = GAME_DATA.origins[Math.floor(Math.random() * GAME_DATA.origins.length)];
  char.post = GAME_DATA.posts[Math.floor(Math.random() * GAME_DATA.posts.length)];

  char.selectedAspects = [];
  char.selectedEdges = [];
  char.skills = {};
  char.languages = { 'Low Sour': 3 };
  char.milestones = [];
  char.drives = ['', '', ''];
  char.mires = [
    { text: '', checkbox1: false, checkbox2: false },
    { text: '', checkbox1: false, checkbox2: false },
    { text: '', checkbox1: false, checkbox2: false }
  ];
  char.resources = {
    charts: [],
    salvage: [],
    specimens: [],
    whispers: []
  };

  // Get budgets based on current scenario
  const budgets = getBudgets(char);

  const allAspects = getAvailableAspects(char);
  const shuffled = allAspects.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(budgets.aspects, shuffled.length); i++) {
    const aspect = shuffled[i];
    char.selectedAspects.push({
      id: aspect.source + '-' + aspect.name,
      ...aspect,
      trackSize: aspect.track,
      damageStates: Array(aspect.track).fill('default'),
      selectedDamageTypes: [] // Initialize empty array for damage type selections
    });
  }

  const shuffledEdges = GAME_DATA.edges.slice().sort(() => Math.random() - 0.5);
  char.selectedEdges = shuffledEdges.slice(0, budgets.edges).map(e => e.name);

  let pointsLeft = budgets.skillPoints;
  while (pointsLeft > 0) {
    const available = GAME_DATA.skills.filter(s => (char.skills[s.name] || 0) < 2);
    if (available.length === 0) break;
    const skillObj = available[Math.floor(Math.random() * available.length)];
    char.skills[skillObj.name] = (char.skills[skillObj.name] || 0) + 1;
    pointsLeft--;
  }

  renderCallback();
}

/**
 * Damage Type Selection Functions
 */

/**
 * Toggle a damage type selection for an aspect
 * @param {string} aspectId - The aspect ID
 * @param {string} damageType - The damage type to toggle
 * @param {function} renderCallback - Callback to trigger re-render
 * @param {object} char - Character object
 */
/**
 * Toggle damage type selection for an aspect (creation/advancement mode)
 * Aspects can have damage types that deal/resist/immune/weak to specific types
 * Some damage types require user selection (e.g., choose 2 resistances from list)
 * @param {string} aspectId - Aspect ID to modify
 * @param {string} category - Damage type category (e.g., "Resistance", "Immunity")
 * @param {string} damageType - Specific damage type to toggle (e.g., "fire", "blunt")
 * @param {Function} renderCallback - Function to call after mutation
 * @param {Object} char - Character object to mutate
 * @mutates aspect.selectedDamageTypes[category] - Adds or removes damage type from selection
 */
export function toggleAspectDamageType(aspectId, category, damageType, renderCallback, char) {
  const aspect = char.selectedAspects.find(a => a.id === aspectId);
  if (!aspect || !aspect.damageTypes) return;

  // Find the damage type metadata for this category
  const damageTypeMetadata = Array.isArray(aspect.damageTypes)
    ? aspect.damageTypes.find(dt => dt.category === category)
    : (aspect.damageTypes.category === category ? aspect.damageTypes : null); // Backwards compat

  if (!damageTypeMetadata) return;

  // Can't modify fixed selections
  if (damageTypeMetadata.selectionType === 'fixed') return;

  // In play mode, only allow selection if incomplete (failsafe for backwards compatibility)
  if (char.mode === 'play') {
    const maxCount = damageTypeMetadata.chooseCount || 1;
    const selected = aspect.selectedDamageTypes[category] || [];
    if (selected.length >= maxCount) {
      return; // Already complete, don't allow changes in play mode
    }
  }

  // Can only modify in creation and advancement modes (or play mode failsafe above)
  if (char.mode !== 'creation' && char.mode !== 'advancement' && char.mode !== 'play') return;

  // Initialize selectedDamageTypes for this category if needed
  if (!aspect.selectedDamageTypes[category]) {
    aspect.selectedDamageTypes[category] = [];
  }

  const selected = aspect.selectedDamageTypes[category];
  const maxCount = damageTypeMetadata.chooseCount || 1;

  if (selected.includes(damageType)) {
    // Deselect
    aspect.selectedDamageTypes[category] = selected.filter(t => t !== damageType);
  } else if (selected.length < maxCount) {
    // Select
    aspect.selectedDamageTypes[category] = [...selected, damageType];
  }

  renderCallback();
}

/**
 * Check if an aspect needs damage type selection
 * @param {object} aspect - The aspect to check
 * @returns {boolean}
 */
export function aspectNeedsDamageTypeSelection(aspect) {
  if (!aspect.damageTypes) return false;

  // Handle both array (new) and object (old) formats
  const damageTypesArray = Array.isArray(aspect.damageTypes) ? aspect.damageTypes : [aspect.damageTypes];

  // Check if any category needs selection
  for (const dt of damageTypesArray) {
    if (dt.selectionType === 'choose') {
      const selected = (aspect.selectedDamageTypes && aspect.selectedDamageTypes[dt.category]) || [];
      const required = dt.chooseCount || 1;
      if (selected.length < required) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get all aspects that need damage type selection
 * @param {object} char - Character object
 * @returns {Array} - Array of aspects needing selection
 */
export function getAspectsNeedingDamageTypeSelection(char) {
  return char.selectedAspects.filter(aspectNeedsDamageTypeSelection);
}

/**
 * Get aggregated damage types from all character aspects
 * Returns separate lists for dealing, resistance, immunity, and weakness
 * @param {object} char - Character object
 * @returns {object} - Object with categorized damage types
 */
export function getCharacterDamageTypes(char) {
  const dealing = {
    CQ: new Set(),
    LR: new Set(),
    UR: new Set()
  };
  const resistanceCounts = new Map(); // Track count of each resistance type
  const immunity = new Set();
  const weakness = new Set();

  char.selectedAspects.forEach(aspect => {
    if (!aspect.damageTypes) return;

    // Handle both array (new) and object (old) formats
    const damageTypesArray = Array.isArray(aspect.damageTypes) ? aspect.damageTypes : [aspect.damageTypes];

    // Process each damage type category
    damageTypesArray.forEach(dt => {
      // Determine which types apply
      let types = [];
      if (dt.selectionType === 'fixed') {
        // Fixed types - use options directly
        types = dt.options || [];
      } else if (dt.selectionType === 'choose') {
        // Chosen types - use player selections for this category
        types = (aspect.selectedDamageTypes && aspect.selectedDamageTypes[dt.category]) || [];
      }

      // Skip if no types available
      if (types.length === 0) return;

      // Categorize by damage type category
      const category = dt.category;
      const range = dt.range;

      if (category === 'dealing' && range) {
        // Handle dual-range weapons like "CQ/LR"
        if (range.includes('/')) {
          const ranges = range.split('/');
          ranges.forEach(r => {
            types.forEach(type => dealing[r.trim()]?.add(type));
          });
        } else {
          types.forEach(type => dealing[range]?.add(type));
        }
      } else if (category === 'resistance') {
        // Count each resistance occurrence
        types.forEach(type => {
          resistanceCounts.set(type, (resistanceCounts.get(type) || 0) + 1);
        });
      } else if (category === 'immunity') {
        types.forEach(type => immunity.add(type));
      } else if (category === 'weakness') {
        types.forEach(type => weakness.add(type));
      }
    });
  });

  // Apply double-resistance-to-immunity rule
  // If a damage type has 2+ resistance sources, upgrade to immunity
  const resistance = new Set();
  resistanceCounts.forEach((count, type) => {
    if (count >= 2) {
      immunity.add(type); // Upgraded to immunity
    } else {
      resistance.add(type); // Remains as resistance
    }
  });

  return {
    dealing: {
      CQ: Array.from(dealing.CQ).sort(),
      LR: Array.from(dealing.LR).sort(),
      UR: Array.from(dealing.UR).sort()
    },
    resistance: Array.from(resistance).sort(),
    immunity: Array.from(immunity).sort(),
    weakness: Array.from(weakness).sort()
  };
}

/**
 * Get character's defensive damage types (resistances, immunities, weaknesses combined)
 * Simplified version for quick reference
 * @param {object} char - Character object
 * @returns {object} - Object with resistances, immunities, and weaknesses
 */
export function getCharacterDefenses(char) {
  const result = getCharacterDamageTypes(char);
  return {
    resistances: result.resistance,
    immunities: result.immunity,
    weaknesses: result.weakness
  };
}

/**
 * Set character's journey role
 * @param {string} role - Role name
 * @param {function} renderCallback - Callback to trigger re-render
 * @param {object} char - Character object
 */
export function setJourneyRole(role, renderCallback, char) {
  char.journeyRole = role;
  if (renderCallback) renderCallback();
}
