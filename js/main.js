/**
 * Main application entry point
 * Initializes the app, sets up event delegation, and manages rendering
 */

import { loadGameData, getGameData } from './data/loader.js';
import {
  createCharacter,
  loadCharacter,
  saveCharacter,
  deleteCharacter,
  onCharacterNameChange,
  onBloodlineChange,
  onOriginChange,
  onPostChange,
  toggleAspect,
  toggleEdge,
  adjustSkill,
  adjustLanguage,
  cycleAspectDamage,
  expandAspectTrack,
  addMilestone,
  updateMilestoneName,
  updateMilestoneScale,
  toggleMilestoneUsed,
  deleteMilestone,
  updateDrive,
  updateMire,
  toggleMireCheckbox,
  addResource,
  updateResourceName,
  removeResource,
  populateDefaultResources,
  setMode,
  generateRandomCharacter
} from './state/character.js';
import {
  createSession,
  loadSession,
  saveSession,
  addCharacterToSession,
  removeCharacterFromSession,
  setActiveCharacter
} from './state/session.js';
import { validateCharacterCreation } from './utils/validation.js';
import { exportCharacter, importCharacter } from './utils/file-handlers.js';
import { renderCreationMode } from './rendering/creation-mode.js';
import { renderPlayMode } from './rendering/play-mode.js';
import { renderAdvancementMode } from './rendering/advancement-mode.js';
import { renderSkills, renderLanguages } from './components/skills.js';
import { renderEdgesSkillsLanguagesRow } from './components/edges.js';
import { renderNavigation } from './components/navigation.js';

// Global state
let session = null;

/**
 * Main render function - delegates to mode-specific renderers
 */
function render() {
  const app = document.getElementById('app');

  if (!session) {
    app.innerHTML = '<div style="padding: 20px;">No session found. Reloading...</div>';
    return;
  }

  // Render navigation
  let html = renderNavigation(session);

  // Check if we have an active character
  if (!session.activeCharacterId) {
    html += '<div style="padding: 20px;">No active character. Please create or import a character.</div>';
    app.innerHTML = html;
    return;
  }

  const character = loadCharacter(session.activeCharacterId);
  if (!character) {
    html += '<div style="padding: 20px; color: red;">Error: Could not load active character.</div>';
    app.innerHTML = html;
    return;
  }

  // Create a temporary container for character content
  const tempDiv = document.createElement('div');
  const gameData = getGameData();

  if (character.mode === 'creation') {
    renderCreationMode(tempDiv, character, gameData);
  } else if (character.mode === 'play') {
    renderPlayMode(tempDiv, character, gameData);
  } else if (character.mode === 'advancement') {
    renderAdvancementMode(tempDiv, character, gameData);
  }

  // Combine navigation and content
  app.innerHTML = html + tempDiv.innerHTML;
}

/**
 * Handle character creation validation and mode transition
 */
function handleCreateCharacter() {
  if (!session || !session.activeCharacterId) return;

  const character = loadCharacter(session.activeCharacterId);
  if (!character) return;

  const validation = validateCharacterCreation(character);

  if (!validation.valid) {
    alert(validation.errors[0]);
    return;
  }

  character.mode = 'play';
  saveCharacter(character);
  render();
}

/**
 * Setup event delegation for click and change events
 */
function setupEventDelegation() {
  const app = document.getElementById('app');

  // Click event delegation
  app.addEventListener('click', function (e) {
    // Check if the clicked element or any parent has data-no-propagate
    let checkTarget = e.target;
    while (checkTarget && checkTarget !== app) {
      if (checkTarget.getAttribute('data-no-propagate') === 'true') {
        return; // Stop event handling entirely
      }
      checkTarget = checkTarget.parentElement;
    }

    // Find the closest element with data-action (bubble up the DOM)
    let target = e.target;
    while (target && target !== app) {
      const action = target.getAttribute('data-action');

      if (action) {
        const params = target.getAttribute('data-params');
        const parsedParams = params ? JSON.parse(params) : {};

        // Get active character for mutations
        const character = session && session.activeCharacterId ? loadCharacter(session.activeCharacterId) : null;

        // Route to appropriate function
        switch (action) {
          case 'toggleAspect':
            if (character) {
              toggleAspect(parsedParams.id, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'toggleEdge':
            if (character) {
              toggleEdge(parsedParams.name, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'adjustSkill':
            if (character) {
              adjustSkill(parsedParams.name, parsedParams.delta, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'adjustLanguage':
            if (character) {
              adjustLanguage(parsedParams.name, parsedParams.delta, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'cycleAspectDamage':
            e.stopPropagation();
            if (character) {
              cycleAspectDamage(parsedParams.id, parsedParams.index, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'expandAspectTrack':
            e.stopPropagation();
            if (character) {
              expandAspectTrack(parsedParams.id, parsedParams.delta, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'addMilestone':
            if (character) {
              addMilestone(render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'toggleMilestoneUsed':
            if (character) {
              toggleMilestoneUsed(parsedParams.id, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'deleteMilestone':
            if (character) {
              deleteMilestone(parsedParams.id, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'addResource':
            if (character) {
              addResource(parsedParams.type, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'removeResource':
            if (character) {
              removeResource(parsedParams.type, parsedParams.id, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'populateDefaultResources':
            if (character) {
              populateDefaultResources(render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'generateRandomCharacter':
            if (character) {
              generateRandomCharacter(render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'createCharacter':
            handleCreateCharacter();
            break;
          case 'setMode':
            if (character) {
              setMode(parsedParams.mode, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'exportCharacter':
            if (character) {
              exportCharacter(character);
            }
            break;
          case 'importCharacter':
            importCharacter(session, render);
            break;
          case 'toggleMireCheckbox':
            if (character) {
              toggleMireCheckbox(parsedParams.index, parsedParams.num, render, character);
              saveCharacter(character);
              render();
            }
            break;
          case 'switchCharacter':
            if (session && parsedParams.characterId) {
              setActiveCharacter(session, parsedParams.characterId);
              render();
            }
            break;
          case 'removeCharacter':
            if (session && parsedParams.characterId) {
              if (confirm('Remove this character from the crew? The character data will be deleted.')) {
                removeCharacterFromSession(session, parsedParams.characterId);
                deleteCharacter(parsedParams.characterId);
                render();
              }
            }
            break;
          case 'createNewCharacter':
            if (session) {
              const newCharacter = createCharacter();
              saveCharacter(newCharacter);
              addCharacterToSession(session, newCharacter.id);
              setActiveCharacter(session, newCharacter.id);
              render();
            }
            break;
        }
        return; // Stop after handling the action
      }
      target = target.parentElement; // Move up the DOM tree
    }
  });

  // Change event delegation
  app.addEventListener('change', function (e) {
    const target = e.target;
    const action = target.getAttribute('data-action');

    if (!action) return;

    const params = target.getAttribute('data-params');
    const parsedParams = params ? JSON.parse(params) : {};

    const character = session && session.activeCharacterId ? loadCharacter(session.activeCharacterId) : null;
    if (!character) return;

    switch (action) {
      case 'onCharacterNameChange':
        onCharacterNameChange(target.value, character);
        saveCharacter(character);
        break;
      case 'onBloodlineChange':
        onBloodlineChange(target.value, render, character);
        saveCharacter(character);
        render();
        break;
      case 'onOriginChange':
        onOriginChange(target.value, render, character);
        saveCharacter(character);
        render();
        break;
      case 'onPostChange':
        onPostChange(target.value, render, character);
        saveCharacter(character);
        render();
        break;
      case 'updateDrive':
        updateDrive(parsedParams.index, target.value, character);
        saveCharacter(character);
        break;
      case 'updateMire':
        updateMire(parsedParams.index, target.value, character);
        saveCharacter(character);
        break;
      case 'updateMilestoneName':
        updateMilestoneName(parsedParams.id, target.value, character);
        saveCharacter(character);
        break;
      case 'updateMilestoneScale':
        updateMilestoneScale(parsedParams.id, target.value, render, character);
        saveCharacter(character);
        render();
        break;
      case 'updateResourceName':
        updateResourceName(parsedParams.type, parsedParams.id, target.value, character);
        saveCharacter(character);
        break;
    }
  });
}

/**
 * Initialize the application
 */
async function init() {
  const success = await loadGameData();

  if (!success) {
    document.getElementById('app').innerHTML = '<div style="padding: 20px; color: red;">Failed to load game data. Check console for errors.</div>';
    return;
  }

  // Load or create session
  session = loadSession();
  if (!session) {
    // New user - create default session with one character
    session = createSession('My Crew');

    const character = createCharacter();
    saveCharacter(character);
    addCharacterToSession(session, character.id);

    saveSession(session);
  }

  setupEventDelegation();
  render();
}

// Start the app
init();
