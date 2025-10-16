/**
 * Character state management module
 * Handles character data and all mutation functions
 */

import { getGameData } from '../data/loader.js';

export const BUDGETS = {
  aspects: 4,
  edges: 3,
  skillPoints: 8,
  resources: 6,
  maxAspectsAdvancement: 7
};

/**
 * Generate a unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Create a new character with default values
 */
export function createCharacter(name = 'Character Name', bloodline = 'Tzelicrae', origin = 'Ridgeback', post = 'Mesmer') {
  return {
    id: generateId(),
    mode: 'creation',
    name,
    bloodline,
    origin,
    post,
    selectedAspects: [],
    selectedEdges: [],
    skills: {},
    languages: { 'Low Sour': 3 },
    milestones: [],
    drives: ['', '', ''],
    mires: [
      { text: '', checkbox1: false, checkbox2: false },
      { text: '', checkbox1: false, checkbox2: false },
      { text: '', checkbox1: false, checkbox2: false }
    ],
    resources: {
      charts: [],
      salvage: [],
      specimens: [],
      whispers: []
    }
  };
}

/**
 * Load a character from localStorage
 */
export function loadCharacter(characterId) {
  const stored = localStorage.getItem(`wildsea-character-${characterId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(`Failed to load character ${characterId}:`, e);
    }
  }
  return null;
}

/**
 * Save a character to localStorage
 */
export function saveCharacter(character) {
  localStorage.setItem(`wildsea-character-${character.id}`, JSON.stringify(character));
}

/**
 * Delete a character from localStorage
 */
export function deleteCharacter(characterId) {
  localStorage.removeItem(`wildsea-character-${characterId}`);
}

/**
 * Get all characters from localStorage
 */
export function getAllCharacters() {
  const characters = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('wildsea-character-')) {
      const character = loadCharacter(key.replace('wildsea-character-', ''));
      if (character) characters.push(character);
    }
  }
  return characters;
}

// Initial character state (global for backward compatibility)
export let character = {
  id: generateId(),
  mode: 'creation',
  name: 'Character Name',
  bloodline: 'Tzelicrae',
  origin: 'Ridgeback',
  post: 'Mesmer',
  selectedAspects: [],
  selectedEdges: ['Sharps', 'Instinct', 'Teeth'],
  skills: { 'Break': 2, 'Concoct': 2, 'Scavenge': 2, 'Wavewalk': 2 },
  languages: { 'Low Sour': 3 },
  milestones: [],
  drives: ['Send other spirits to a peaceful rest', 'Reconnect with your friends and family', 'Help those suffering from great distraction'],
  mires: [
    { text: 'Your material control wavers erratically', checkbox1: false, checkbox2: false },
    { text: 'Visions of your past death are difficult to banish', checkbox1: false, checkbox2: false },
    { text: 'Your own thoughts are cloudy, mercurial', checkbox1: false, checkbox2: false }
  ],
  resources: {
    charts: [
      { id: '001', name: 'A Sketch of Shadowed Paths' }
    ],
    salvage: [
      { id: '004', name: 'Old Memento' },
      { id: '005', name: 'Broken Locket' }
    ],
    specimens: [
      { id: '007', name: 'Glowing Plasm' },
      { id: '008', name: 'Spectral Flower' }
    ],
    whispers: [
      { id: '010', name: 'Back from Beyond' },
      { id: '011', name: 'Drowned and Not' }
    ]
  }
};

/**
 * Get all available aspects based on character selections
 * @param {Object} char - Character object (optional, defaults to global character)
 */
export function getAvailableAspects(char = null) {
  const GAME_DATA = getGameData();
  const targetChar = char || character;
  const available = [];

  const bloodlineAspects = GAME_DATA.aspects[targetChar.bloodline] || [];
  bloodlineAspects.forEach(aspect => {
    available.push({
      ...aspect,
      source: targetChar.bloodline,
      category: 'Bloodline'
    });
  });

  const originAspects = GAME_DATA.aspects[targetChar.origin] || [];
  originAspects.forEach(aspect => {
    available.push({
      ...aspect,
      source: targetChar.origin,
      category: 'Origin'
    });
  });

  const postAspects = GAME_DATA.aspects[targetChar.post] || [];
  postAspects.forEach(aspect => {
    available.push({
      ...aspect,
      source: targetChar.post,
      category: 'Post'
    });
  });

  return available;
}

/**
 * Character property mutations
 */
export function onCharacterNameChange(value, char = null) {
  const targetChar = char || character;
  targetChar.name = value;
}

export function onBloodlineChange(value, renderCallback, char = null) {
  const targetChar = char || character;
  targetChar.bloodline = value;
  targetChar.selectedAspects = [];
  renderCallback();
}

export function onOriginChange(value, renderCallback, char = null) {
  const targetChar = char || character;
  targetChar.origin = value;
  targetChar.selectedAspects = [];
  renderCallback();
}

export function onPostChange(value, renderCallback, char = null) {
  const targetChar = char || character;
  targetChar.post = value;
  targetChar.selectedAspects = [];
  renderCallback();
}

/**
 * Aspect mutations
 */
export function toggleAspect(aspectId, renderCallback, char = null) {
  const targetChar = char || character;
  if (targetChar.mode !== 'creation' && targetChar.mode !== 'advancement') return;

  const index = targetChar.selectedAspects.findIndex(a => a.id === aspectId);

  if (index >= 0) {
    targetChar.selectedAspects.splice(index, 1);
  } else {
    if (targetChar.mode === 'creation' && targetChar.selectedAspects.length >= BUDGETS.aspects) {
      return;
    }
    if (targetChar.mode === 'advancement' && targetChar.selectedAspects.length >= BUDGETS.maxAspectsAdvancement) {
      return;
    }

    const allAspects = getAvailableAspects(targetChar);
    const aspect = allAspects.find(a => {
      const id = a.source + '-' + a.name;
      return id === aspectId;
    });

    if (aspect) {
      targetChar.selectedAspects.push({
        id: aspectId,
        ...aspect,
        trackSize: aspect.track,
        damageStates: Array(aspect.track).fill('default')
      });
    }
  }

  renderCallback();
}

export function cycleAspectDamage(aspectId, boxIndex, renderCallback, char = null) {
  const targetChar = char || character;
  if (targetChar.mode !== 'play') return;

  const aspect = targetChar.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  const states = ['default', 'marked', 'burned'];
  const currentState = aspect.damageStates[boxIndex];
  const currentIndex = states.indexOf(currentState);
  const nextIndex = (currentIndex + 1) % states.length;

  aspect.damageStates[boxIndex] = states[nextIndex];
  renderCallback();
}

export function expandAspectTrack(aspectId, delta, renderCallback, char = null) {
  const targetChar = char || character;
  if (targetChar.mode !== 'advancement') return;

  const aspect = targetChar.selectedAspects.find(a => a.id === aspectId);
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
export function customizeAspect(aspectId, name, description, char = null) {
  const targetChar = char || character;
  const aspect = targetChar.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  aspect.name = name;
  aspect.description = description;
  aspect.customized = true;
}

/**
 * Reset aspect to original game data
 */
export function resetAspectCustomization(aspectId, char = null) {
  const targetChar = char || character;
  const aspect = targetChar.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  // Find original aspect data
  const allAspects = getAvailableAspects(targetChar);
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
export function toggleEdge(edgeName, renderCallback, char = null) {
  const targetChar = char || character;
  if (targetChar.mode !== 'creation') return;

  const index = targetChar.selectedEdges.indexOf(edgeName);

  if (index >= 0) {
    targetChar.selectedEdges.splice(index, 1);
  } else {
    if (targetChar.selectedEdges.length >= BUDGETS.edges) {
      return;
    }
    targetChar.selectedEdges.push(edgeName);
  }

  renderCallback();
}

/**
 * Skill mutations
 */
export function adjustSkill(name, delta, renderCallback, char = null) {
  const targetChar = char || character;
  const current = targetChar.skills[name] || 0;
  const newValue = Math.max(0, Math.min(targetChar.mode === 'creation' ? 2 : 3, current + delta));

  if (targetChar.mode === 'creation') {
    const totalPoints = Object.values(targetChar.skills).reduce((sum, v) => sum + v, 0);
    const languagePoints = Object.entries(targetChar.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; })
      .reduce((sum, entry) => sum + entry[1], 0);

    if (delta > 0 && totalPoints + languagePoints >= BUDGETS.skillPoints) {
      return;
    }
  }

  if (newValue === 0) {
    delete targetChar.skills[name];
  } else {
    targetChar.skills[name] = newValue;
  }

  renderCallback();
}

/**
 * Language mutations
 */
export function adjustLanguage(name, delta, renderCallback, char = null) {
  const targetChar = char || character;
  if (name === 'Low Sour' && targetChar.mode === 'creation') {
    return;
  }

  const current = targetChar.languages[name] || 0;
  const newValue = Math.max(0, Math.min(targetChar.mode === 'creation' ? 2 : 3, current + delta));

  if (targetChar.mode === 'creation') {
    const skillPoints = Object.values(targetChar.skills).reduce((sum, v) => sum + v, 0);
    const totalPoints = Object.entries(targetChar.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; })
      .reduce((sum, entry) => sum + entry[1], 0);

    if (delta > 0 && skillPoints + totalPoints >= BUDGETS.skillPoints) {
      return;
    }
  }

  if (newValue === 0 && name !== 'Low Sour') {
    delete targetChar.languages[name];
  } else {
    targetChar.languages[name] = newValue;
  }

  renderCallback();
}

/**
 * Drive mutations
 */
export function updateDrive(index, value, char = null) {
  const targetChar = char || character;
  targetChar.drives[index] = value;
}

/**
 * Mire mutations
 */
export function updateMire(index, value, char = null) {
  const targetChar = char || character;
  targetChar.mires[index].text = value;
}

export function toggleMireCheckbox(index, checkboxNum, renderCallback, char = null) {
  const targetChar = char || character;
  if (checkboxNum === 1) {
    targetChar.mires[index].checkbox1 = !targetChar.mires[index].checkbox1;
  } else {
    targetChar.mires[index].checkbox2 = !targetChar.mires[index].checkbox2;
  }
  renderCallback();
}

/**
 * Milestone mutations
 */
export function addMilestone(renderCallback, char = null) {
  const targetChar = char || character;
  targetChar.milestones.push({
    id: Date.now().toString(),
    used: false,
    name: '',
    scale: 'Minor'
  });
  renderCallback();
}

export function updateMilestoneName(id, name, char = null) {
  const targetChar = char || character;
  const milestone = targetChar.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.name = name;
  }
}

export function updateMilestoneScale(id, scale, renderCallback, char = null) {
  const targetChar = char || character;
  const milestone = targetChar.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.scale = scale;
    renderCallback();
  }
}

export function toggleMilestoneUsed(id, renderCallback, char = null) {
  const targetChar = char || character;
  const milestone = targetChar.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.used = !milestone.used;
    renderCallback();
  }
}

export function deleteMilestone(id, renderCallback, char = null) {
  const targetChar = char || character;
  const index = targetChar.milestones.findIndex(m => m.id === id);
  if (index >= 0) {
    targetChar.milestones.splice(index, 1);
    renderCallback();
  }
}

/**
 * Resource mutations
 */
export function addResource(type, renderCallback, char = null) {
  const targetChar = char || character;
  targetChar.resources[type].push({
    id: Date.now().toString(),
    name: ''
  });
  renderCallback();
}

export function updateResourceName(type, id, name, char = null) {
  const targetChar = char || character;
  const resource = targetChar.resources[type].find(r => r.id === id);
  if (resource) {
    resource.name = name;
  }
}

export function removeResource(type, id, renderCallback, char = null) {
  const targetChar = char || character;
  const index = targetChar.resources[type].findIndex(r => r.id === id);
  if (index >= 0) {
    targetChar.resources[type].splice(index, 1);
    renderCallback();
  }
}

export function populateDefaultResources(renderCallback, char = null) {
  const targetChar = char || character;
  const GAME_DATA = getGameData();

  // Clear existing resources
  targetChar.resources = {
    charts: [],
    salvage: [],
    specimens: [],
    whispers: []
  };

  // Collect resources from bloodline, origin, and post
  const sources = [targetChar.bloodline, targetChar.origin, targetChar.post];
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
              targetChar.resources[type].push({
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
export function setMode(mode, renderCallback, char = null) {
  const targetChar = char || character;
  targetChar.mode = mode;
  renderCallback();
}

/**
 * Character generation
 */
export function generateRandomCharacter(renderCallback, char = null) {
  const targetChar = char || character;
  const GAME_DATA = getGameData();

  targetChar.name = 'Random Character';
  targetChar.bloodline = GAME_DATA.bloodlines[Math.floor(Math.random() * GAME_DATA.bloodlines.length)];
  targetChar.origin = GAME_DATA.origins[Math.floor(Math.random() * GAME_DATA.origins.length)];
  targetChar.post = GAME_DATA.posts[Math.floor(Math.random() * GAME_DATA.posts.length)];

  targetChar.selectedAspects = [];
  targetChar.selectedEdges = [];
  targetChar.skills = {};
  targetChar.languages = { 'Low Sour': 3 };
  targetChar.milestones = [];
  targetChar.drives = ['', '', ''];
  targetChar.mires = [
    { text: '', checkbox1: false, checkbox2: false },
    { text: '', checkbox1: false, checkbox2: false },
    { text: '', checkbox1: false, checkbox2: false }
  ];
  targetChar.resources = {
    charts: [],
    salvage: [],
    specimens: [],
    whispers: []
  };

  const allAspects = getAvailableAspects(targetChar);
  const shuffled = allAspects.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(4, shuffled.length); i++) {
    const aspect = shuffled[i];
    targetChar.selectedAspects.push({
      id: aspect.source + '-' + aspect.name,
      ...aspect,
      trackSize: aspect.track,
      damageStates: Array(aspect.track).fill('default')
    });
  }

  const shuffledEdges = GAME_DATA.edges.slice().sort(() => Math.random() - 0.5);
  targetChar.selectedEdges = shuffledEdges.slice(0, 3).map(e => e.name);

  let pointsLeft = BUDGETS.skillPoints;
  while (pointsLeft > 0) {
    const skill = GAME_DATA.skills[Math.floor(Math.random() * GAME_DATA.skills.length)];
    const current = targetChar.skills[skill] || 0;
    if (current < 2) {
      targetChar.skills[skill] = current + 1;
      pointsLeft--;
    }
  }

  renderCallback();
}

/**
 * Replace entire character state (used for import)
 */
export function replaceCharacter(newCharacter) {
  character = newCharacter;
}

/**
 * Get current character state
 */
export function getCharacter() {
  return character;
}
