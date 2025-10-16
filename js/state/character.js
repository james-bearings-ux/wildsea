/**
 * Character state management module
 * Handles character data and all mutation functions
 * Now using Supabase for real-time multiplayer support
 */

import { getGameData } from '../data/loader.js';
import { supabase } from '../supabaseClient.js';

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

  return convertFromDB(data);
}

/**
 * Save a character to Supabase
 */
export async function saveCharacter(character) {
  const { error } = await supabase
    .from('characters')
    .update({
      name: character.name,
      mode: character.mode,
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
      resources: character.resources,
      updated_at: new Date().toISOString()
    })
    .eq('id', character.id);

  if (error) {
    console.error(`Failed to save character ${character.id}:`, error);
    throw error;
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
        damageStates: Array(aspect.track).fill('default')
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
 * Customize aspect name and description
 */
export function customizeAspect(aspectId, name, description, char) {
  const aspect = char.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  aspect.name = name;
  aspect.description = description;
  aspect.customized = true;
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
 */
export function setMode(mode, renderCallback, char) {
  char.mode = mode;
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
      damageStates: Array(aspect.track).fill('default')
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
