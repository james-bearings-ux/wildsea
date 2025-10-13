let GAME_DATA = {};

// Load game data from JSON files
async function loadGameData() {
  try {
    const [constants, aspects, resources] = await Promise.all([
      fetch('data/game-constants.json').then(r => r.json()),
      fetch('data/aspects.json').then(r => r.json()),
      fetch('data/resources.json').then(r => r.json())
    ]);
    
    GAME_DATA = {
      ...constants,
      aspects: aspects,
      startingResources: resources
    };
    
    return true;
  } catch (error) {
    console.error('Failed to load game data:', error);
    return false;
  }
}

// Initialize app after data loads
loadGameData().then(success => {
  if (success) {
    // Make render globally accessible too
    window.render = render;
    render();
  } else {
    document.getElementById('app').innerHTML = '<div style="padding: 20px; color: red;">Failed to load game data. Check console for errors.</div>';
  }
});
    
let character = {
    mode: 'creation',
    name: 'Character Name',
    bloodline: 'Tzelicrae',
    origin: 'Ridgeback',
    post: 'Mesmer',
    selectedAspects: [],
    selectedEdges: ['Sharps','Instinct','Teeth'],
    skills: { 'Break': 2,'Concoct': 2,'Scavenge': 2,'Wavewalk': 2, },
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
        {id:'001', name:'A Sketch of Shadowed Paths'}
    ],
        salvage: [
        {id:'004', name:'Old Memento'},
        {id:'005', name:'Broken Locket'}
    ],
        specimens: [
        {id:'007', name:'Glowing Plasm'},
        {id:'008', name:'Spectral Flower'}
    ],
        whispers: [
        {id:'010', name:'Back from Beyond'},
        {id:'011', name:'Drowned and Not'}
    ]
    }
};

// Make functions globally accessible for inline event handlers
window.toggleAspect = toggleAspect;
window.toggleEdge = toggleEdge;
window.adjustSkill = adjustSkill;
window.adjustLanguage = adjustLanguage;
window.cycleAspectDamage = cycleAspectDamage;
window.expandAspectTrack = expandAspectTrack;
window.addMilestone = addMilestone;
window.updateMilestoneName = updateMilestoneName;
window.updateMilestoneScale = updateMilestoneScale;
window.toggleMilestoneUsed = toggleMilestoneUsed;
window.deleteMilestone = deleteMilestone;
window.updateDrive = updateDrive;
window.updateMire = updateMire;
window.toggleMireCheckbox = toggleMireCheckbox;
window.addResource = addResource;
window.updateResourceName = updateResourceName;
window.removeResource = removeResource;
window.generateRandomCharacter = generateRandomCharacter;
window.createCharacter = createCharacter;
window.setMode = setMode;
window.exportCharacter = exportCharacter;
window.importCharacter = importCharacter;
window.onBloodlineChange = onBloodlineChange;
window.onOriginChange = onOriginChange;
window.onPostChange = onPostChange;
window.onCharacterNameChange = onCharacterNameChange;

const BUDGETS = {
    aspects: 4,
    edges: 3,
    skillPoints: 8
};

function getAvailableAspects() {
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

function onBloodlineChange(value) {
  character.bloodline = value;
  character.selectedAspects = [];
  render();
}

function onOriginChange(value) {
  character.origin = value;
  character.selectedAspects = [];
  render();
}

function onPostChange(value) {
  character.post = value;
  character.selectedAspects = [];
  render();
}

function onCharacterNameChange(value) {
  character.name = value;
}

function toggleAspect(aspectId) {
    if (character.mode !== 'creation' && character.mode !== 'advancement') return;
    
    const index = character.selectedAspects.findIndex(a => a.id === aspectId);
    
    if (index >= 0) {
    character.selectedAspects.splice(index, 1);
    } else {
    if (character.mode === 'creation' && character.selectedAspects.length >= BUDGETS.aspects) {
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
    
    render();
}

function toggleEdge(edgeName) {
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
    
    render();
}

function adjustSkill(name, delta) {
    const current = character.skills[name] || 0;
    const newValue = Math.max(0, Math.min(character.mode === 'creation' ? 2 : 3, current + delta));
    
    if (character.mode === 'creation') {
    const totalPoints = Object.values(character.skills).reduce((sum, v) => sum + v, 0);
    const languagePoints = Object.entries(character.languages)
        .filter(function(entry) { return entry[0] !== 'Low Sour'; })
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
    
    render();
}

function adjustLanguage(name, delta) {
    if (name === 'Low Sour' && character.mode === 'creation') {
    return;
    }
    
    const current = character.languages[name] || 0;
    const newValue = Math.max(0, Math.min(character.mode === 'creation' ? 2 : 3, current + delta));
    
    if (character.mode === 'creation') {
    const skillPoints = Object.values(character.skills).reduce((sum, v) => sum + v, 0);
    const totalPoints = Object.entries(character.languages)
        .filter(function(entry) { return entry[0] !== 'Low Sour'; })
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
    
    render();
}

function cycleAspectDamage(aspectId, boxIndex) {
    if (character.mode !== 'play') return;
    
    const aspect = character.selectedAspects.find(a => a.id === aspectId);
    if (!aspect) return;
    
    const states = ['default', 'marked', 'burned'];
    const currentState = aspect.damageStates[boxIndex];
    const currentIndex = states.indexOf(currentState);
    const nextIndex = (currentIndex + 1) % states.length;
    
    aspect.damageStates[boxIndex] = states[nextIndex];
    render();
}

function expandAspectTrack(aspectId, delta) {
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
    render();
}

function addMilestone() {
    character.milestones.push({
    id: Date.now().toString(),
    used: false,
    name: '',
    scale: 'Minor'
    });
    render();
}

function updateMilestoneName(id, name) {
    const milestone = character.milestones.find(m => m.id === id);
    if (milestone) {
    milestone.name = name;
    }
}

function updateMilestoneScale(id, scale) {
    const milestone = character.milestones.find(m => m.id === id);
    if (milestone) {
    milestone.scale = scale;
    render();
    }
}

function toggleMilestoneUsed(id) {
    const milestone = character.milestones.find(m => m.id === id);
    if (milestone) {
    milestone.used = !milestone.used;
    render();
    }
}

function deleteMilestone(id) {
    const index = character.milestones.findIndex(m => m.id === id);
    if (index >= 0) {
    character.milestones.splice(index, 1);
    render();
    }
}

function updateDrive(index, value) {
    character.drives[index] = value;
}

function updateMire(index, value) {
    character.mires[index].text = value;
}

function toggleMireCheckbox(index, checkboxNum) {
    if (checkboxNum === 1) {
    character.mires[index].checkbox1 = !character.mires[index].checkbox1;
    } else {
    character.mires[index].checkbox2 = !character.mires[index].checkbox2;
    }
    render();
}

function addResource(type) {
    character.resources[type].push({
    id: Date.now().toString(),
    name: ''
    });
    render();
}

function updateResourceName(type, id, name) {
    const resource = character.resources[type].find(r => r.id === id);
    if (resource) {
    resource.name = name;
    }
}

function removeResource(type, id) {
    const index = character.resources[type].findIndex(r => r.id === id);
    if (index >= 0) {
    character.resources[type].splice(index, 1);
    render();
    }
}

// Helper function to render small track boxes (used in Creation and Advancement for unselected)
function renderSmallTrack(trackSize) {
    let html = '<div style="display: flex; gap: 4px; padding-top: 4px; margin-bottom: 4px;">';
    for (let i = 0; i < trackSize; i++) {
    html += '<div class="track-box small"></div>';
    }
    html += '</div>';
    return html;
}

// Helper function to render interactive track (used in Advancement for selected)
function renderInteractiveTrack(aspect, escapedId) {
    let html = '<div style="display: flex; gap: 8px; align-items: center; padding-top: 4px; margin-bottom: 4px;">';
    html += '<button onclick="event.stopPropagation(); expandAspectTrack(\'' + escapedId + '\', -1)" ';
    html += (aspect.trackSize <= aspect.track ? 'disabled ' : '');
    html += 'style="flex-shrink: 0; padding: 2px 8px; font-size: 14px;" class="bg-black">−</button>';
    
    for (let i = 0; i < aspect.trackSize; i++) {
    const isNew = i >= aspect.track;
    html += '<div class="track-box' + (isNew ? ' new' : '') + '" onclick="event.stopPropagation()"></div>';
    }
    
    html += '<button onclick="event.stopPropagation(); expandAspectTrack(\'' + escapedId + '\', 1)" ';
    html += (aspect.trackSize >= 5 ? 'disabled ' : '');
    html += 'style="flex-shrink: 0; padding: 2px 8px; font-size: 14px;" class="bg-black">+</button>';
    html += '</div>';
    return html;
}

function renderDrives() {
    let html = '<div><h2 class="section-header">Drives</h2>';
    html += '<div style="display: flex; flex-direction: column; gap: 2px;">';
    
    for (let i = 0; i < character.drives.length; i++) {
    html += '<input type="text" ';
    html += 'value="' + character.drives[i] + '" ';
    html += 'placeholder="Enter a drive..." ';
    html += 'onchange="updateDrive(' + i + ', this.value)" ';
    html += 'style="width: 100%; padding: 8px 10px 8px 10px;">';
    }
    
    html += '</div></div>';
    return html;
}

function renderMires() {
    const showCheckboxes = character.mode === 'play';
    
    let html = '<div><h2 class="section-header">Mires</h2>';
    html += '<div style="display: flex; flex-direction: column; gap: 2px;">';
    
    for (let i = 0; i < character.mires.length; i++) {
    const mire = character.mires[i];
    
    if (showCheckboxes) {
        html += '<div style="display: flex; gap: 10px; align-items: center;">';
        html += '<div style="width: 8px;"></div>';
        html += '<input type="checkbox" ';
        if (mire.checkbox1) html += 'checked ';
        html += 'onchange="toggleMireCheckbox(' + i + ', 1)">';
        html += '<input type="checkbox" ';
        if (mire.checkbox2) html += 'checked ';
        html += 'onchange="toggleMireCheckbox(' + i + ', 2)">';
        html += '<input type="text" ';
        html += 'value="' + mire.text + '" ';
        html += 'placeholder="Enter a mire..." ';
        html += 'onchange="updateMire(' + i + ', this.value)" ';
        html += 'style="width: 100%; padding: 8px 10px 8px 10px;">';
        html += '</div>';
    } else {
        html += '<input type="text" ';
        html += 'value="' + mire.text + '" ';
        html += 'placeholder="Enter a mire..." ';
        html += 'onchange="updateMire(' + i + ', this.value)" ';
        html += 'style="width: 100%; padding: 8px 10px 8px 10px;">';
    }
    }
    
    html += '</div></div>';
    return html;
}

function renderMilestones() {
    let html = '<div><h2 class="section-header">Milestones</h2>';
    
    if (character.milestones.length > 0) {
    html += '<div class="grid-milestone" style="margin-bottom: 8px;">';
    html += '<h3 class="subsection-header">Used</h3>';
    html += '<h3 class="subsection-header">Name</h3>';
    html += '<h3 class="subsection-header">Scale</h3>';
    html += '</div>';
    }
    
    for (let i = 0; i < character.milestones.length; i++) {
    const milestone = character.milestones[i];
    
    html += '<div class="grid-milestone" style="margin-bottom: 8px;">';
    html += '<div style="display: flex; align-items: center; gap: 10px;">';
    html += '<div style="width: 34px;"></div>';
    html += '<input type="checkbox" ';
    if (milestone.used) html += 'checked ';
    html += 'onchange="toggleMilestoneUsed(\'' + milestone.id + '\')">';
    html += '</div>';
    html += '<input type="text" ';
    html += 'value="' + milestone.name + '" ';
    html += 'placeholder="Enter milestone name..." ';
    if (milestone.used) html += 'disabled ';
    html += 'onchange="updateMilestoneName(\'' + milestone.id + '\', this.value)" ';
    html += 'style="width: 100%;">';
    html += '<select ';
    if (milestone.used) html += 'disabled ';
    html += 'onchange="updateMilestoneScale(\'' + milestone.id + '\', this.value)" ';
    html += 'style="width: 100%;">';
    html += '<option value="Minor"';
    if (milestone.scale === 'Minor') html += ' selected';
    html += '>Minor</option>';
    html += '<option value="Major"';
    if (milestone.scale === 'Major') html += ' selected';
    html += '>Major</option>';
    html += '</select>';
    html += '</div>';
    }
    
    const marginTop = character.milestones.length > 0 ? '12' : '0';
    html += '<button class="ghost" onclick="addMilestone()" style="width: 100%; margin-top: ' + marginTop + 'px;">+ New Milestone</button>';
    html += '</div>';
    
    return html;
}

function renderResources() {
    const resourceTypes = [
    { key: 'charts', label: 'Charts', placeholder: 'Name your Chart...', singular: 'Chart' },
    { key: 'salvage', label: 'Salvage', placeholder: 'Name your Salvage...', singular: 'Salvage' },
    { key: 'specimens', label: 'Specimens', placeholder: 'Name your Specimen...', singular: 'Specimen' },
    { key: 'whispers', label: 'Whispers', placeholder: 'Name your Whisper...', singular: 'Whisper' }
    ];
    
    let html = '<div style="margin-bottom: 32px;">';
    html += '<h2 class="section-header">Resources</h2>';
    html += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px;">';
    
    for (let i = 0; i < resourceTypes.length; i++) {
    const type = resourceTypes[i];
    const items = character.resources[type.key];
    
    html += '<div>';
    html += '<h3 class="subsection-header" style="margin-bottom: 12px;">' + type.label + '</h3>';
    html += '<div style="display: flex; flex-direction: column; gap: 12px;">';
    
    for (let j = 0; j < items.length; j++) {
        const item = items[j];
        html += '<div style="display: flex; gap: 8px; align-items: center;">';
        html += '<input type="text" ';
        html += 'value="' + item.name + '" ';
        html += 'placeholder="' + type.placeholder + '" ';
        html += 'onchange="updateResourceName(\'' + type.key + '\', \'' + item.id + '\', this.value)" ';
        html += 'style="width: 100%; padding: 8px 10px;">';
        html += '<button onclick="removeResource(\'' + type.key + '\', \'' + item.id + '\')" ';
        html += 'style="padding: 8px; flex-shrink: 0; border: 0;">✕</button>';
        html += '</div>';
    }
    
    const marginTop = items.length > 0 ? '12' : '0';
    html += '<button class="ghost" onclick="addResource(\'' + type.key + '\')" style="width: 100%; margin-top: ' + marginTop + 'px;">+ New ' + type.singular + '</button>';
    html += '</div>';
    html += '</div>';
    }
    
    html += '</div>';
    html += '</div>';
    
    return html;
}

function renderEdges() {
    const isCreationMode = character.mode === 'creation';
    const edgesSelected = character.selectedEdges.length;
    
    if (isCreationMode) {
    let html = '<div>';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">';
    html += '<h2 class="section-header" style="margin: 0;">Edges</h2>';
    html += '<div class="budget-indicator">' + edgesSelected + '/' + BUDGETS.edges + '</div>';
    html += '</div>';
    html += '<div style="display: flex; flex-direction: column; gap: 12px;">';
    
    for (let i = 0; i < GAME_DATA.edges.length; i++) {
        const edge = GAME_DATA.edges[i];
        const isSelected = character.selectedEdges.includes(edge.name);
        const isDisabled = !isSelected && edgesSelected >= BUDGETS.edges;
        
        html += '<div class="edge-card';
        if (isSelected) html += ' selected';
        if (isDisabled) html += ' disabled';
        html += '" onclick="toggleEdge(\'' + edge.name + '\')">';
        html += '<div class="aspect-name" style="margin-bottom: 4px;">' + edge.name + '</div>';
        html += '<div class="edge-tagline" style="font-size: 12px; color: ';
        html += isSelected ? '#9CA3AF' : '#6B7280';
        html += ';">' + edge.tagline + '</div>';
        html += '</div>';
    }
    
    html += '</div></div>';
    return html;
    } else {
    let html = '<div><h2 class="section-header">Edges</h2>';
    
    for (let i = 0; i < character.selectedEdges.length; i++) {
        html += '<div class="aspect-name" style="color: #111827; margin-bottom: 4px;">';
        html += character.selectedEdges[i];
        html += '</div>';
    }
    
    html += '</div>';
    return html;
    }
}

function renderSkills() {
    const isCreationMode = character.mode === 'creation';
    const isPlayMode = character.mode === 'play';
    
    if (isPlayMode) {
    let html = '<div><h2 class="section-header">Skills</h2>';
    
    for (let i = 0; i < GAME_DATA.skills.length; i++) {
        const skill = GAME_DATA.skills[i];
        const rank = character.skills[skill] || 0;
        
        html += '<div class="skill-row">';
        html += '<div class="skill-name">' + skill + '</div>';
        html += '<div style="display: flex; gap: 4px;">';
        
        for (let j = 0; j < 3; j++) {
        html += '<div class="track-box small';
        if (j < rank) html += ' active';
        html += '"></div>';
        }
        
        html += '</div></div>';
    }
    
    html += '</div>';
    return html;
    } else if (isCreationMode) {
    let html = '<div style="display: flex; flex-direction: column; gap: 4px;">';
    html += '<h3 class="subsection-header" style="margin-bottom: 12px;">Skills</h3>';
    
    const skillPoints = Object.values(character.skills).reduce(function(sum, v) { return sum + v; }, 0);
    const languagePoints = Object.entries(character.languages)
        .filter(function(entry) { return entry[0] !== 'Low Sour'; })
        .reduce(function(sum, entry) { return sum + entry[1]; }, 0);
    const totalPoints = skillPoints + languagePoints;
    
    for (let i = 0; i < GAME_DATA.skills.length; i++) {
        const skill = GAME_DATA.skills[i];
        const rank = character.skills[skill] || 0;
        const canIncrease = rank < 2 && totalPoints < BUDGETS.skillPoints;
        
        html += '<div class="flex-between" style="margin-bottom: 8px;">';
        html += '<div class="skill-name">' + skill + '</div>';
        html += '<div style="display: flex; gap: 8px; align-items: center;">';
        html += '<button onclick="adjustSkill(\'' + skill + '\', -1)"';
        if (rank === 0) html += ' disabled';
        html += '>−</button>';
        
        for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
        }
        
        html += '<button onclick="adjustSkill(\'' + skill + '\', 1)"';
        if (!canIncrease) html += ' disabled';
        html += '>+</button>';
        html += '</div></div>';
    }
    
    html += '</div>';
    return html;
    } else {
    let html = '<div><h2 class="section-header">Skills</h2>';
    
    for (let i = 0; i < GAME_DATA.skills.length; i++) {
        const skill = GAME_DATA.skills[i];
        const rank = character.skills[skill] || 0;
        
        html += '<div class="flex-between" style="margin-bottom: 8px;">';
        html += '<div class="skill-name">' + skill + '</div>';
        html += '<div style="display: flex; gap: 8px; align-items: center;">';
        html += '<button onclick="adjustSkill(\'' + skill + '\', -1)"';
        if (rank === 0) html += ' disabled';
        html += '>−</button>';
        
        for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
        }
        
        html += '<button onclick="adjustSkill(\'' + skill + '\', 1)"';
        if (rank >= 3) html += ' disabled';
        html += '>+</button>';
        html += '</div></div>';
    }
    
    html += '</div>';
    return html;
    }
}

function renderLanguages() {
    const isCreationMode = character.mode === 'creation';
    const isPlayMode = character.mode === 'play';
    
    if (isPlayMode) {
    let html = '<div><h2 class="section-header">Languages</h2>';
    
    for (let i = 0; i < GAME_DATA.languages.length; i++) {
        const lang = GAME_DATA.languages[i];
        const rank = character.languages[lang] || 0;
        
        html += '<div class="skill-row">';
        html += '<div class="skill-name">' + lang + '</div>';
        html += '<div style="display: flex; gap: 4px;">';
        
        for (let j = 0; j < 3; j++) {
        html += '<div class="track-box small';
        if (j < rank) html += ' active';
        html += '"></div>';
        }
        
        html += '</div></div>';
    }
    
    html += '</div>';
    return html;
    } else if (isCreationMode) {
    let html = '<div style="display: flex; flex-direction: column; gap: 4px;">';
    html += '<h3 class="subsection-header" style="margin-bottom: 12px;">Languages</h3>';
    
    const skillPoints = Object.values(character.skills).reduce(function(sum, v) { return sum + v; }, 0);
    const languagePoints = Object.entries(character.languages)
        .filter(function(entry) { return entry[0] !== 'Low Sour'; })
        .reduce(function(sum, entry) { return sum + entry[1]; }, 0);
    const totalPoints = skillPoints + languagePoints;
    
    for (let i = 0; i < GAME_DATA.languages.length; i++) {
        const lang = GAME_DATA.languages[i];
        const rank = character.languages[lang] || 0;
        const isLowSour = lang === 'Low Sour';
        const canIncrease = !isLowSour && rank < 2 && totalPoints < BUDGETS.skillPoints;
        const canDecrease = !isLowSour && rank > 0;
        
        html += '<div class="flex-between" style="margin-bottom: 8px;">';
        html += '<div class="skill-name">' + lang + '</div>';
        html += '<div style="display: flex; gap: 8px; align-items: center;">';
        html += '<button onclick="adjustLanguage(\'' + lang + '\', -1)"';
        if (!canDecrease) html += ' disabled';
        html += '>−</button>';
        
        for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
        }
        
        html += '<button onclick="adjustLanguage(\'' + lang + '\', 1)"';
        if (!canIncrease) html += ' disabled';
        html += '>+</button>';
        html += '</div></div>';
    }
    
    html += '</div>';
    return html;
    } else {
    let html = '<div><h2 class="section-header">Languages</h2>';
    
    for (let i = 0; i < GAME_DATA.languages.length; i++) {
        const lang = GAME_DATA.languages[i];
        const rank = character.languages[lang] || 0;
        
        html += '<div class="flex-between" style="margin-bottom: 8px;">';
        html += '<div class="skill-name">' + lang + '</div>';
        html += '<div style="display: flex; gap: 8px; align-items: center;">';
        html += '<button onclick="adjustLanguage(\'' + lang + '\', -1)"';
        if (rank === 0 || lang === 'Low Sour') html += ' disabled';
        html += '>−</button>';
        
        for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
        }
        
        html += '<button onclick="adjustLanguage(\'' + lang + '\', 1)"';
        if (rank >= 3) html += ' disabled';
        html += '>+</button>';
        html += '</div></div>';
    }
    
    html += '</div>';
    return html;
    }
}

function renderEdgesSkillsLanguagesRow() {
    const isCreationMode = character.mode === 'creation';
    
    if (isCreationMode) {
    const skillPoints = Object.values(character.skills).reduce(function(sum, v) { return sum + v; }, 0);
    const languagePoints = Object.entries(character.languages)
        .filter(function(entry) { return entry[0] !== 'Low Sour'; })
        .reduce(function(sum, entry) { return sum + entry[1]; }, 0);
    const totalPoints = skillPoints + languagePoints;
    
    let html = '<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 32px; margin-bottom: 40px;">';
    html += renderEdges();
    html += '<div>';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">';
    html += '<h2 class="section-header" style="margin: 0;">Skills & Languages</h2>';
    html += '<div class="budget-indicator">' + totalPoints + '/' + BUDGETS.skillPoints + '</div>';
    html += '</div>';
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">';
    html += renderSkills();
    html += renderLanguages();
    html += '</div></div></div>';
    
    return html;
    } else {
    let html = '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; margin-bottom: 32px;">';
    html += renderEdges();
    html += renderSkills();
    html += renderLanguages();
    html += '</div>';
    
    return html;
    }
}

function generateRandomCharacter() {
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
    
    render();
}

function createCharacter() {
    if (character.selectedAspects.length !== BUDGETS.aspects) {
    alert('Please select exactly ' + BUDGETS.aspects + ' aspects');
    return;
    }
    
    if (character.selectedEdges.length !== BUDGETS.edges) {
    alert('Please select exactly ' + BUDGETS.edges + ' edges');
    return;
    }
    
    const skillPoints = Object.values(character.skills).reduce((sum, v) => sum + v, 0);
    const languagePoints = Object.entries(character.languages)
    .filter(function(entry) { return entry[0] !== 'Low Sour'; })
    .reduce((sum, entry) => sum + entry[1], 0);
    
    if (skillPoints + languagePoints !== BUDGETS.skillPoints) {
    alert('Please allocate all ' + BUDGETS.skillPoints + ' skill/language points (currently allocated: ' + (skillPoints + languagePoints) + ')');
    return;
    }
    
    character.mode = 'play';
    render();
}

function setMode(mode) {
    character.mode = mode;
    render();
}

function exportCharacter() {
    const exportData = {
    version: '1.0',
    character: character
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = (character.name || 'character') + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importCharacter() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
        const importData = JSON.parse(event.target.result);
        
        if (!importData.version || !importData.character) {
            alert('Invalid character file format');
            return;
        }
        
        character = importData.character;
        render();
        alert('Character imported successfully!');
        } catch (error) {
        alert('Error reading character file: ' + error.message);
        }
    };
    reader.readAsText(file);
    };
    
    input.click();
}

function render() {
    const app = document.getElementById('app');
    
    if (character.mode === 'creation') {
    renderCreationMode(app);
    } else if (character.mode === 'play') {
    renderPlayMode(app);
    } else if (character.mode === 'advancement') {
    renderAdvancementMode(app);
    }
}

function renderCreationMode(app) {
    const allAspects = getAvailableAspects();
    const bloodlineAspects = allAspects.filter(a => a.category === 'Bloodline');
    const originAspects = allAspects.filter(a => a.category === 'Origin');
    const postAspects = allAspects.filter(a => a.category === 'Post');
    
    const aspectsSelected = character.selectedAspects.length;
    
    app.innerHTML = `
    <div style="padding: 20px; max-width: 1400px; margin: 0 auto; padding-bottom: 80px;">
        <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Character Name</label>
        <input type="text" value="${character.name}" 
            onchange="onCharacterNameChange(this.value)"
                placeholder="Enter name..." 
                style="width: 300px; font-size: 16px;">
        </div>
        
        <div style="margin-bottom: 40px;">
        <h2 class="section-header">Core Elements</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
            <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Bloodline</label>
            <select onchange="onBloodlineChange(this.value)"
                    style="width: 100%; font-size: 16px;">
                ${GAME_DATA.bloodlines.map(b => '<option value="' + b + '"' + (character.bloodline === b ? ' selected' : '') + '>' + b + '</option>').join('')}
            </select>
            </div>
            <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Origin</label>
            <select onchange="onOriginChange(this.value)"
                    style="width: 100%; font-size: 16px;">
                ${GAME_DATA.origins.map(o => '<option value="' + o + '"' + (character.origin === o ? ' selected' : '') + '>' + o + '</option>').join('')}
            </select>
            </div>
            <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Post</label>
            <select onchange="onPostChange(this.value)"
                    style="width: 100%; font-size: 16px;">
                ${GAME_DATA.posts.map(p => '<option value="' + p + '"' + (character.post === p ? ' selected' : '') + '>' + p + '</option>').join('')}
            </select>
            </div>
        </div>
        </div>
        
        <div style="margin-bottom: 40px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h2 class="section-header" style="margin: 0;">Aspects</h2>
            <div class="budget-indicator">${aspectsSelected}/${BUDGETS.aspects}</div>
        </div>
        <div class="grid-3col">
            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.bloodline}</h3>
            ${bloodlineAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/'/g, "\\'");
                const isSelected = character.selectedAspects.some(a => a.id === id);
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.aspects;
                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" 
                        onclick="toggleAspect('${escapedId}')">
                    ${renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${aspect.name}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${aspect.description}</div>
                </div>
                `;
            }).join('')}
            </div>
            
            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.origin}</h3>
            ${originAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/'/g, "\\'");
                const isSelected = character.selectedAspects.some(a => a.id === id);
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.aspects;
                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" 
                        onclick="toggleAspect('${escapedId}')">
                    ${renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${aspect.name}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${aspect.description}</div>
                </div>
                `;
            }).join('')}
            </div>
            
            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.post}</h3>
            ${postAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/'/g, "\\'");
                const isSelected = character.selectedAspects.some(a => a.id === id);
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.aspects;
                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}" 
                        onclick="toggleAspect('${escapedId}')">
                    ${renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${aspect.name}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${aspect.description}</div>
                </div>
                `;
            }).join('')}
            </div>
        </div>
        </div>
        <hr />
        
        ${renderEdgesSkillsLanguagesRow()}
        <hr />
        
        <div style="margin-bottom: 32px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
            ${renderDrives()}
            ${renderMires()}
        </div>
        </div>
    </div>
    
    <div class="sticky-action-bar split">
        <button onclick="importCharacter()">Import</button>
        <div>
        <button onclick="generateRandomCharacter()">Generate Random Character</button>
        <button onclick="createCharacter()" class="primary">Create Character</button>
        </div>
    </div>
    `;
}

function renderPlayMode(app) {
    app.innerHTML = `
    <div style="padding: 20px; max-width: 1400px; margin: 0 auto; padding-bottom: 80px;">
        <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #E5E7EB;">
        <div style="display: flex; gap: 48px; align-items: baseline;">
            <div>
            <div class="char-label">Character Name</div>
            <div class="char-name-header">${character.name}</div>
            </div>
            <div>
            <div class="char-label">Bloodline</div>
            <div class="char-name-header">${character.bloodline}</div>
            </div>
            <div>
            <div class="char-label">Origin</div>
            <div class="char-name-header">${character.origin}</div>
            </div>
            <div>
            <div class="char-label">Post</div>
            <div class="char-name-header">${character.post}</div>
            </div>
        </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 3fr; gap: 32px; margin-bottom: 32px;">
        ${renderEdges()}
        ${renderSkills()}
        ${renderLanguages()}
        
        <div>
            <h2 class="section-header">Aspects</h2>
            ${character.selectedAspects.map(aspect => {
            let trackHTML = '<div style="display: flex; gap: 8px; padding-top: 4px; flex-shrink: 0; width: 165px;">';
            for (let i = 0; i < 5; i++) {
                if (i < aspect.trackSize) {
                const state = aspect.damageStates[i];
                const stateChar = state === 'marked' ? '/' : state === 'burned' ? 'X' : '';
                trackHTML += '<div class="track-box ' + state + '" onclick="cycleAspectDamage(\'' + aspect.id + '\', ' + i + ')" style="cursor: pointer;">' + stateChar + '</div>';
                } else {
                trackHTML += '<div style="width: 26px; height: 26px;"></div>';
                }
            }
            trackHTML += '</div>';
            
            return `
                <div style="margin-bottom: 8px; padding: 8px; border-radius: 2px;">
                <div style="display: flex; gap: 8px; align-items: flex-start;">
                    ${trackHTML}
                    <div style="flex: 1; min-width: 0;">
                    <div class="split">
                        <div class="aspect-name" style="margin-bottom: 4px;">${aspect.name}</div>
                        <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${aspect.description}</div>
                    </div>
                </div>
                </div>
            `;
            }).join('')}
        </div>
        </div>
        <hr />
        ${renderResources()}
        <hr />
        <div style="margin-bottom: 32px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px;">
            ${renderDrives()}
            ${renderMires()}
            ${renderMilestones()}
        </div>
        </div>
    </div>
    
    <div class="sticky-action-bar split">
        <button onclick="exportCharacter()">Export</button>
        <button onclick="setMode('advancement')">Advancement</button>
    </div>
    `;
}

function renderAdvancementMode(app) {
    const allAspects = getAvailableAspects();
    const bloodlineAspects = allAspects.filter(a => a.category === 'Bloodline');
    const originAspects = allAspects.filter(a => a.category === 'Origin');
    const postAspects = allAspects.filter(a => a.category === 'Post');
    
    app.innerHTML = `
    <div style="padding: 20px; max-width: 1400px; margin: 0 auto; padding-bottom: 80px;">
        <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #E5E7EB;">
        <div style="display: flex; gap: 48px; align-items: baseline;">
            <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Character Name</label>
            <input type="text" value="${character.name}" 
                    onchange="onCharacterNameChange(this.value)"
                    placeholder="Enter name..." 
                    style="width: 300px; font-size: 16px;">
            </div>
            <div>
            <div class="char-label">Bloodline</div>
            <div class="char-name-header">${character.bloodline}</div>
            </div>
            <div>
            <div class="char-label">Origin</div>
            <div class="char-name-header">${character.origin}</div>
            </div>
            <div>
            <div class="char-label">Post</div>
            <div class="char-name-header">${character.post}</div>
            </div>
        </div>
        </div>
        
        <div style="margin-bottom: 40px;">
        <h2 class="section-header">Aspects</h2>
        <div class="grid-3col">
            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.bloodline}</h3>
            ${bloodlineAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/'/g, "\\'");
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                const isSelected = !!selectedAspect;
                
                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''}" 
                        onclick="toggleAspect('${escapedId}')"
                        style="position: relative;">
                    ${isSelected ? renderInteractiveTrack(selectedAspect, escapedId) : renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${aspect.name}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${aspect.description}</div>
                </div>
                `;
            }).join('')}
            </div>
            
            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.origin}</h3>
            ${originAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/'/g, "\\'");
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                const isSelected = !!selectedAspect;
                
                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''}" 
                        onclick="toggleAspect('${escapedId}')"
                        style="position: relative;">
                    ${isSelected ? renderInteractiveTrack(selectedAspect, escapedId) : renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${aspect.name}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${aspect.description}</div>
                </div>
                `;
            }).join('')}
            </div>
            
            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.post}</h3>
            ${postAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/'/g, "\\'");
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                const isSelected = !!selectedAspect;
                
                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''}" 
                        onclick="toggleAspect('${escapedId}')"
                        style="position: relative;">
                    ${isSelected ? renderInteractiveTrack(selectedAspect, escapedId) : renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${aspect.name}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${aspect.description}</div>
                </div>
                `;
            }).join('')}
            </div>
        </div>
        </div>
        <hr />
        
        ${renderEdgesSkillsLanguagesRow()}
        <hr />
        
        <div style="margin-bottom: 32px;">
        ${renderMilestones()}
        </div>
    </div>
    
    <div class="sticky-action-bar" style="display: flex; justify-content: flex-end;">
        <button onclick="setMode('play')" class="primary">Save Changes</button>
        <button onclick="setMode('play')">Cancel</button>
    </div>
    `;
}

render();