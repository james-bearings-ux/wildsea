/**
 * Character state management module
 * Handles character data and all mutation functions
 * Now using Supabase for real-time multiplayer support
 */

import { getGameData } from '../data/loader.js';
import { supabase } from '../supabaseClient.js';
import { parseDamageTypesFromDescription } from '../constants/damage-types.js';

// Debug flag - only log in development mode
const DEBUG = import.meta.env.DEV;

export const BUDGETS = {
  aspects: 4,
  edges: 3,
  skillPoints: 8,
  resources: 6,
  maxAspectsAdvancement: 7
};

/**
 * Create a new character with default values and save to Supabase
 */
export async function createCharacter(sessionId, name = 'Unnamed Character', bloodline = 'Tzelicrae', origin = 'Ridgeback', post = 'Mesmer') {
  const { data, error } = await supabase
    .from('characters')
    .insert([{
      session_id: sessionId,
      name,
      mode: 'creation',
      bloodline,
      origin,
      post,
      selected_aspects: [],
      selected_edges: [],
      skills: {},
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
      }
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
 * Load a character from Supabase
 */
export async function loadCharacter(characterId) {
  const { data, error } = await supabase
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
 * Note: Mode IS saved to database as the canonical state, but can be overridden per-user via localStorage
 */
export async function saveCharacter(character) {
  if (DEBUG) {
    console.log('[SAVE] Saving character to database:', character.id, character.name, 'at', new Date().toISOString());
  }

  const { error } = await supabase
    .from('characters')
    .update({
      name: character.name,
      mode: character.mode, // Save canonical mode (creation/play)
      bloodline: character.bloodline,
      origin: character.origin,
      post: character.post,
      selected_aspects: character.selectedAspects,
      selected_edges: character.selectedEdges,
      skills: character.skills,
      languages: character.languages,
      drives: character.drives,
      mires: character.mires,
      milestones: character.milestones,
      tasks: character.tasks,
      notes: character.notes,
      resources: character.resources,
      updated_at: new Date().toISOString()
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
 * Convert database column names to app property names
 */
function convertFromDB(dbChar) {
  return {
    id: dbChar.id,
    mode: dbChar.mode,
    name: dbChar.name,
    bloodline: dbChar.bloodline,
    origin: dbChar.origin,
    post: dbChar.post,
    selectedAspects: dbChar.selected_aspects || [],
    selectedEdges: dbChar.selected_edges || [],
    skills: dbChar.skills || {},
    languages: dbChar.languages || { 'Low Sour': 3 },
    drives: dbChar.drives || ['', '', ''],
    mires: dbChar.mires || [
      { text: '', checkbox1: false, checkbox2: false },
      { text: '', checkbox1: false, checkbox2: false },
      { text: '', checkbox1: false, checkbox2: false }
    ],
    milestones: dbChar.milestones || [],
    tasks: dbChar.tasks || [],
    notes: dbChar.notes || '',
    resources: dbChar.resources || {
      charts: [],
      salvage: [],
      specimens: [],
      whispers: []
    }
  };
}

/**
 * Get all available aspects based on character selections
 * @param {Object} char - Character object
 */
export function getAvailableAspects(char) {
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

  return available;
}

/**
 * Character property mutations
 */
export function onCharacterNameChange(value, char) {
  char.name = value;
}

export function onBloodlineChange(value, renderCallback, char) {
  char.bloodline = value;
  char.selectedAspects = [];
  renderCallback();
}

export function onOriginChange(value, renderCallback, char) {
  char.origin = value;
  char.selectedAspects = [];
  renderCallback();
}

export function onPostChange(value, renderCallback, char) {
  char.post = value;
  char.selectedAspects = [];
  renderCallback();
}

/**
 * Aspect mutations
 */
export function toggleAspect(aspectId, renderCallback, char) {
  if (char.mode !== 'creation' && char.mode !== 'advancement') return;

  const index = char.selectedAspects.findIndex(a => a.id === aspectId);

  if (index >= 0) {
    char.selectedAspects.splice(index, 1);
  } else {
    if (char.mode === 'creation' && char.selectedAspects.length >= BUDGETS.aspects) {
      return;
    }
    if (char.mode === 'advancement' && char.selectedAspects.length >= BUDGETS.maxAspectsAdvancement) {
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
        trackSize: aspect.track,
        damageStates: Array(aspect.track).fill('default'),
        selectedDamageTypes: [] // Initialize empty array for damage type selections
      });
    }
  }

  renderCallback();
}

export function cycleAspectDamage(aspectId, boxIndex, renderCallback, char) {
  if (char.mode !== 'play') return;

  const aspect = char.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  const states = ['default', 'marked', 'burned'];
  const currentState = aspect.damageStates[boxIndex];
  const currentIndex = states.indexOf(currentState);
  const nextIndex = (currentIndex + 1) % states.length;

  aspect.damageStates[boxIndex] = states[nextIndex];
  renderCallback();
}

export function expandAspectTrack(aspectId, delta, renderCallback, char) {
  if (char.mode !== 'advancement') return;

  const aspect = char.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  const newSize = aspect.trackSize + delta;
  if (newSize < 1 || newSize > 5) return;

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
 * Customize aspect name and description
 */
export function customizeAspect(aspectId, name, description, char) {
  const aspect = char.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  aspect.name = name;
  aspect.description = description;
  aspect.customized = true;

  // Reparse damage types from the new description
  const newDamageTypes = parseDamageTypesFromDescription(description);

  if (newDamageTypes) {
    // New description has damage types - update metadata
    aspect.damageTypes = newDamageTypes;

    // Handle selected damage types - keep only selections that are still valid
    if (aspect.selectedDamageTypes && aspect.selectedDamageTypes.length > 0) {
      const validSelections = aspect.selectedDamageTypes.filter(type =>
        newDamageTypes.options && newDamageTypes.options.includes(type)
      );
      aspect.selectedDamageTypes = validSelections;
    } else {
      // Initialize if needed for new "choose" type
      aspect.selectedDamageTypes = aspect.selectedDamageTypes || [];
    }
  } else {
    // New description has no damage types - clear metadata and selections
    delete aspect.damageTypes;
    aspect.selectedDamageTypes = [];
  }
}

/**
 * Reset aspect to original game data
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
export function adjustSkill(name, delta, renderCallback, char) {
  const current = char.skills[name] || 0;
  const newValue = Math.max(0, Math.min(char.mode === 'creation' ? 2 : 3, current + delta));

  if (char.mode === 'creation') {
    const totalPoints = Object.values(char.skills).reduce((sum, v) => sum + v, 0);
    const languagePoints = Object.entries(char.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; })
      .reduce((sum, entry) => sum + entry[1], 0);

    if (delta > 0 && totalPoints + languagePoints >= BUDGETS.skillPoints) {
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
export function adjustLanguage(name, delta, renderCallback, char) {
  if (name === 'Low Sour' && char.mode === 'creation') {
    return;
  }

  const current = char.languages[name] || 0;
  const newValue = Math.max(0, Math.min(char.mode === 'creation' ? 2 : 3, current + delta));

  if (char.mode === 'creation') {
    const skillPoints = Object.values(char.skills).reduce((sum, v) => sum + v, 0);
    const totalPoints = Object.entries(char.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; })
      .reduce((sum, entry) => sum + entry[1], 0);

    if (delta > 0 && skillPoints + totalPoints >= BUDGETS.skillPoints) {
      return;
    }
  }

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
export function updateDrive(index, value, char) {
  char.drives[index] = value;
}

/**
 * Mire mutations
 */
export function updateMire(index, value, char) {
  char.mires[index].text = value;
}

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
export function addMilestone(renderCallback, char) {
  char.milestones.push({
    id: Date.now().toString(),
    used: false,
    name: '',
    scale: 'Minor'
  });
  renderCallback();
}

export function updateMilestoneName(id, name, char) {
  const milestone = char.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.name = name;
  }
}

export function updateMilestoneScale(id, scale, renderCallback, char) {
  const milestone = char.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.scale = scale;
    renderCallback();
  }
}

export function toggleMilestoneUsed(id, renderCallback, char) {
  const milestone = char.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.used = !milestone.used;
    renderCallback();
  }
}

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

export function updateTaskName(id, name, char) {
  const task = char.tasks.find(t => t.id === id);
  if (task) {
    task.name = name;
  }
}

export function updateTaskMaxTicks(id, maxTicks, renderCallback, char) {
  const task = char.tasks.find(t => t.id === id);
  if (task) {
    task.maxTicks = Math.max(1, Math.min(6, parseInt(maxTicks) || 4));
    // Don't change currentTicks when editing
    renderCallback();
  }
}

export function tickTask(id, renderCallback, char) {
  const task = char.tasks.find(t => t.id === id);
  if (task) {
    // Cycle: 0 -> 1 -> ... -> maxTicks -> 0
    task.currentTicks = (task.currentTicks + 1) % (task.maxTicks + 1);
    renderCallback();
  }
}

export function toggleTaskEditing(id, renderCallback, char) {
  const task = char.tasks.find(t => t.id === id);
  if (task) {
    task.editing = !task.editing;
    renderCallback();
  }
}

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
export function updateNotes(notes, char) {
  char.notes = notes;
}

/**
 * Resource mutations
 */
export function addResource(type, renderCallback, char) {
  char.resources[type].push({
    id: Date.now().toString(),
    name: ''
  });
  renderCallback();
}

export function updateResourceName(type, id, name, char) {
  const resource = char.resources[type].find(r => r.id === id);
  if (resource) {
    resource.name = name;
  }
}

export function removeResource(type, id, renderCallback, char) {
  const index = char.resources[type].findIndex(r => r.id === id);
  if (index >= 0) {
    char.resources[type].splice(index, 1);
    renderCallback();
  }
}

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
                name: itemName
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
 * Note: Mode is saved to localStorage per-user, not to database
 */
export function setMode(mode, renderCallback, char) {
  char.mode = mode;

  // Save mode to localStorage for this user only
  localStorage.setItem(`wildsea-character-${char.id}-mode`, mode);

  renderCallback();
}

/**
 * Character generation
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

  const allAspects = getAvailableAspects(char);
  const shuffled = allAspects.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(4, shuffled.length); i++) {
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
  char.selectedEdges = shuffledEdges.slice(0, 3).map(e => e.name);

  let pointsLeft = BUDGETS.skillPoints;
  while (pointsLeft > 0) {
    const skill = GAME_DATA.skills[Math.floor(Math.random() * GAME_DATA.skills.length)];
    const current = char.skills[skill] || 0;
    if (current < 2) {
      char.skills[skill] = current + 1;
      pointsLeft--;
    }
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
export function toggleAspectDamageType(aspectId, damageType, renderCallback, char) {
  const aspect = char.selectedAspects.find(a => a.id === aspectId);
  if (!aspect || !aspect.damageTypes) return;

  // Can't modify fixed selections
  if (aspect.damageTypes.selectionType === 'fixed') return;

  // In play mode, only allow selection if incomplete (failsafe for backwards compatibility)
  if (char.mode === 'play') {
    const maxCount = aspect.damageTypes.chooseCount || 1;
    if (aspect.selectedDamageTypes && aspect.selectedDamageTypes.length >= maxCount) {
      return; // Already complete, don't allow changes in play mode
    }
  }

  // Can only modify in creation and advancement modes (or play mode failsafe above)
  if (char.mode !== 'creation' && char.mode !== 'advancement' && char.mode !== 'play') return;

  const selected = aspect.selectedDamageTypes || [];
  const maxCount = aspect.damageTypes.chooseCount || 1;

  if (selected.includes(damageType)) {
    // Deselect
    aspect.selectedDamageTypes = selected.filter(t => t !== damageType);
  } else if (selected.length < maxCount) {
    // Select
    aspect.selectedDamageTypes = [...selected, damageType];
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
  if (aspect.damageTypes.selectionType !== 'choose') return false;

  const selected = aspect.selectedDamageTypes || [];
  const required = aspect.damageTypes.chooseCount || 1;

  return selected.length < required;
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

    // Determine which types apply
    let types = [];
    if (aspect.damageTypes.selectionType === 'fixed') {
      // Fixed types - use options directly
      types = aspect.damageTypes.options || [];
    } else if (aspect.damageTypes.selectionType === 'choose') {
      // Chosen types - use player selections
      types = aspect.selectedDamageTypes || [];
    }

    // Skip if no types available
    if (types.length === 0) return;

    // Categorize by damage type category
    const category = aspect.damageTypes.category;
    const range = aspect.damageTypes.range;

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
