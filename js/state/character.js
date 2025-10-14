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

// Initial character state
export let character = {
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
 * Get all available aspects based on current character selections
 */
export function getAvailableAspects() {
  const GAME_DATA = getGameData();
  const available = [];

  const bloodlineAspects = GAME_DATA.aspects[character.bloodline] || [];
  bloodlineAspects.forEach(aspect => {
    available.push({
      ...aspect,
      source: character.bloodline,
      category: 'Bloodline'
    });
  });

  const originAspects = GAME_DATA.aspects[character.origin] || [];
  originAspects.forEach(aspect => {
    available.push({
      ...aspect,
      source: character.origin,
      category: 'Origin'
    });
  });

  const postAspects = GAME_DATA.aspects[character.post] || [];
  postAspects.forEach(aspect => {
    available.push({
      ...aspect,
      source: character.post,
      category: 'Post'
    });
  });

  return available;
}

/**
 * Character property mutations
 */
export function onCharacterNameChange(value) {
  character.name = value;
}

export function onBloodlineChange(value, renderCallback) {
  character.bloodline = value;
  character.selectedAspects = [];
  renderCallback();
}

export function onOriginChange(value, renderCallback) {
  character.origin = value;
  character.selectedAspects = [];
  renderCallback();
}

export function onPostChange(value, renderCallback) {
  character.post = value;
  character.selectedAspects = [];
  renderCallback();
}

/**
 * Aspect mutations
 */
export function toggleAspect(aspectId, renderCallback) {
  if (character.mode !== 'creation' && character.mode !== 'advancement') return;

  const index = character.selectedAspects.findIndex(a => a.id === aspectId);

  if (index >= 0) {
    character.selectedAspects.splice(index, 1);
  } else {
    if (character.mode === 'creation' && character.selectedAspects.length >= BUDGETS.aspects) {
      return;
    }
    if (character.mode === 'advancement' && character.selectedAspects.length >= BUDGETS.maxAspectsAdvancement) {
      return;
    }

    const allAspects = getAvailableAspects();
    const aspect = allAspects.find(a => {
      const id = a.source + '-' + a.name;
      return id === aspectId;
    });

    if (aspect) {
      character.selectedAspects.push({
        id: aspectId,
        ...aspect,
        trackSize: aspect.track,
        damageStates: Array(aspect.track).fill('default')
      });
    }
  }

  renderCallback();
}

export function cycleAspectDamage(aspectId, boxIndex, renderCallback) {
  if (character.mode !== 'play') return;

  const aspect = character.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  const states = ['default', 'marked', 'burned'];
  const currentState = aspect.damageStates[boxIndex];
  const currentIndex = states.indexOf(currentState);
  const nextIndex = (currentIndex + 1) % states.length;

  aspect.damageStates[boxIndex] = states[nextIndex];
  renderCallback();
}

export function expandAspectTrack(aspectId, delta, renderCallback) {
  if (character.mode !== 'advancement') return;

  const aspect = character.selectedAspects.find(a => a.id === aspectId);
  if (!aspect) return;

  const newSize = aspect.trackSize + delta;
  if (newSize < aspect.track || newSize > 5) return;

  if (delta > 0) {
    aspect.damageStates.push('default');
  } else {
    aspect.damageStates.pop();
  }

  aspect.trackSize = newSize;
  renderCallback();
}

/**
 * Edge mutations
 */
export function toggleEdge(edgeName, renderCallback) {
  if (character.mode !== 'creation') return;

  const index = character.selectedEdges.indexOf(edgeName);

  if (index >= 0) {
    character.selectedEdges.splice(index, 1);
  } else {
    if (character.selectedEdges.length >= BUDGETS.edges) {
      return;
    }
    character.selectedEdges.push(edgeName);
  }

  renderCallback();
}

/**
 * Skill mutations
 */
export function adjustSkill(name, delta, renderCallback) {
  const current = character.skills[name] || 0;
  const newValue = Math.max(0, Math.min(character.mode === 'creation' ? 2 : 3, current + delta));

  if (character.mode === 'creation') {
    const totalPoints = Object.values(character.skills).reduce((sum, v) => sum + v, 0);
    const languagePoints = Object.entries(character.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; })
      .reduce((sum, entry) => sum + entry[1], 0);

    if (delta > 0 && totalPoints + languagePoints >= BUDGETS.skillPoints) {
      return;
    }
  }

  if (newValue === 0) {
    delete character.skills[name];
  } else {
    character.skills[name] = newValue;
  }

  renderCallback();
}

/**
 * Language mutations
 */
export function adjustLanguage(name, delta, renderCallback) {
  if (name === 'Low Sour' && character.mode === 'creation') {
    return;
  }

  const current = character.languages[name] || 0;
  const newValue = Math.max(0, Math.min(character.mode === 'creation' ? 2 : 3, current + delta));

  if (character.mode === 'creation') {
    const skillPoints = Object.values(character.skills).reduce((sum, v) => sum + v, 0);
    const totalPoints = Object.entries(character.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; })
      .reduce((sum, entry) => sum + entry[1], 0);

    if (delta > 0 && skillPoints + totalPoints >= BUDGETS.skillPoints) {
      return;
    }
  }

  if (newValue === 0 && name !== 'Low Sour') {
    delete character.languages[name];
  } else {
    character.languages[name] = newValue;
  }

  renderCallback();
}

/**
 * Drive mutations
 */
export function updateDrive(index, value) {
  character.drives[index] = value;
}

/**
 * Mire mutations
 */
export function updateMire(index, value) {
  character.mires[index].text = value;
}

export function toggleMireCheckbox(index, checkboxNum, renderCallback) {
  if (checkboxNum === 1) {
    character.mires[index].checkbox1 = !character.mires[index].checkbox1;
  } else {
    character.mires[index].checkbox2 = !character.mires[index].checkbox2;
  }
  renderCallback();
}

/**
 * Milestone mutations
 */
export function addMilestone(renderCallback) {
  character.milestones.push({
    id: Date.now().toString(),
    used: false,
    name: '',
    scale: 'Minor'
  });
  renderCallback();
}

export function updateMilestoneName(id, name) {
  const milestone = character.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.name = name;
  }
}

export function updateMilestoneScale(id, scale, renderCallback) {
  const milestone = character.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.scale = scale;
    renderCallback();
  }
}

export function toggleMilestoneUsed(id, renderCallback) {
  const milestone = character.milestones.find(m => m.id === id);
  if (milestone) {
    milestone.used = !milestone.used;
    renderCallback();
  }
}

export function deleteMilestone(id, renderCallback) {
  const index = character.milestones.findIndex(m => m.id === id);
  if (index >= 0) {
    character.milestones.splice(index, 1);
    renderCallback();
  }
}

/**
 * Resource mutations
 */
export function addResource(type, renderCallback) {
  character.resources[type].push({
    id: Date.now().toString(),
    name: ''
  });
  renderCallback();
}

export function updateResourceName(type, id, name) {
  const resource = character.resources[type].find(r => r.id === id);
  if (resource) {
    resource.name = name;
  }
}

export function removeResource(type, id, renderCallback) {
  const index = character.resources[type].findIndex(r => r.id === id);
  if (index >= 0) {
    character.resources[type].splice(index, 1);
    renderCallback();
  }
}

export function populateDefaultResources(renderCallback) {
  const GAME_DATA = getGameData();

  // Clear existing resources
  character.resources = {
    charts: [],
    salvage: [],
    specimens: [],
    whispers: []
  };

  // Collect resources from bloodline, origin, and post
  const sources = [character.bloodline, character.origin, character.post];
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
              character.resources[type].push({
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
export function setMode(mode, renderCallback) {
  character.mode = mode;
  renderCallback();
}

/**
 * Character generation
 */
export function generateRandomCharacter(renderCallback) {
  const GAME_DATA = getGameData();

  character.name = 'Random Character';
  character.bloodline = GAME_DATA.bloodlines[Math.floor(Math.random() * GAME_DATA.bloodlines.length)];
  character.origin = GAME_DATA.origins[Math.floor(Math.random() * GAME_DATA.origins.length)];
  character.post = GAME_DATA.posts[Math.floor(Math.random() * GAME_DATA.posts.length)];

  character.selectedAspects = [];
  character.selectedEdges = [];
  character.skills = {};
  character.languages = { 'Low Sour': 3 };
  character.milestones = [];
  character.drives = ['', '', ''];
  character.mires = [
    { text: '', checkbox1: false, checkbox2: false },
    { text: '', checkbox1: false, checkbox2: false },
    { text: '', checkbox1: false, checkbox2: false }
  ];
  character.resources = {
    charts: [],
    salvage: [],
    specimens: [],
    whispers: []
  };

  const allAspects = getAvailableAspects();
  const shuffled = allAspects.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(4, shuffled.length); i++) {
    const aspect = shuffled[i];
    character.selectedAspects.push({
      id: aspect.source + '-' + aspect.name,
      ...aspect,
      trackSize: aspect.track,
      damageStates: Array(aspect.track).fill('default')
    });
  }

  const shuffledEdges = GAME_DATA.edges.slice().sort(() => Math.random() - 0.5);
  character.selectedEdges = shuffledEdges.slice(0, 3).map(e => e.name);

  let pointsLeft = BUDGETS.skillPoints;
  while (pointsLeft > 0) {
    const skill = GAME_DATA.skills[Math.floor(Math.random() * GAME_DATA.skills.length)];
    const current = character.skills[skill] || 0;
    if (current < 2) {
      character.skills[skill] = current + 1;
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
