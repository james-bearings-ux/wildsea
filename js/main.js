/**
 * Main application entry point
 * Initializes the app, sets up event delegation, and manages rendering
 */

import { loadGameData } from './data/loader.js';
import {
  getCharacter,
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
import { validateCharacterCreation } from './utils/validation.js';
import { exportCharacter, importCharacter } from './utils/file-handlers.js';
import { renderCreationMode } from './rendering/creation-mode.js';
import { renderPlayMode } from './rendering/play-mode.js';
import { renderAdvancementMode } from './rendering/advancement-mode.js';
import { renderSkills, renderLanguages } from './components/skills.js';
import { renderEdgesSkillsLanguagesRow } from './components/edges.js';

/**
 * Main render function - delegates to mode-specific renderers
 */
function render() {
  const app = document.getElementById('app');
  const character = getCharacter();

  if (character.mode === 'creation') {
    renderCreationMode(app);
  } else if (character.mode === 'play') {
    renderPlayMode(app);
  } else if (character.mode === 'advancement') {
    renderAdvancementMode(app);
  }
}

/**
 * Handle character creation validation and mode transition
 */
function createCharacter() {
  const validation = validateCharacterCreation();

  if (!validation.valid) {
    alert(validation.errors[0]);
    return;
  }

  setMode('play', render);
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

        // Route to appropriate function
        switch (action) {
          case 'toggleAspect':
            toggleAspect(parsedParams.id, render);
            break;
          case 'toggleEdge':
            toggleEdge(parsedParams.name, render);
            break;
          case 'adjustSkill':
            adjustSkill(parsedParams.name, parsedParams.delta, render);
            break;
          case 'adjustLanguage':
            adjustLanguage(parsedParams.name, parsedParams.delta, render);
            break;
          case 'cycleAspectDamage':
            e.stopPropagation();
            cycleAspectDamage(parsedParams.id, parsedParams.index, render);
            break;
          case 'expandAspectTrack':
            e.stopPropagation();
            expandAspectTrack(parsedParams.id, parsedParams.delta, render);
            break;
          case 'addMilestone':
            addMilestone(render);
            break;
          case 'toggleMilestoneUsed':
            toggleMilestoneUsed(parsedParams.id, render);
            break;
          case 'deleteMilestone':
            deleteMilestone(parsedParams.id, render);
            break;
          case 'addResource':
            addResource(parsedParams.type, render);
            break;
          case 'removeResource':
            removeResource(parsedParams.type, parsedParams.id, render);
            break;
          case 'populateDefaultResources':
            populateDefaultResources(render);
            break;
          case 'generateRandomCharacter':
            generateRandomCharacter(render);
            break;
          case 'createCharacter':
            createCharacter();
            break;
          case 'setMode':
            setMode(parsedParams.mode, render);
            break;
          case 'exportCharacter':
            exportCharacter();
            break;
          case 'importCharacter':
            importCharacter(render);
            break;
          case 'toggleMireCheckbox':
            toggleMireCheckbox(parsedParams.index, parsedParams.num, render);
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

    switch (action) {
      case 'onCharacterNameChange':
        onCharacterNameChange(target.value);
        break;
      case 'onBloodlineChange':
        onBloodlineChange(target.value, render);
        break;
      case 'onOriginChange':
        onOriginChange(target.value, render);
        break;
      case 'onPostChange':
        onPostChange(target.value, render);
        break;
      case 'updateDrive':
        updateDrive(parsedParams.index, target.value);
        break;
      case 'updateMire':
        updateMire(parsedParams.index, target.value);
        break;
      case 'updateMilestoneName':
        updateMilestoneName(parsedParams.id, target.value);
        break;
      case 'updateMilestoneScale':
        updateMilestoneScale(parsedParams.id, target.value, render);
        break;
      case 'updateResourceName':
        updateResourceName(parsedParams.type, parsedParams.id, target.value);
        break;
    }
  });
}

/**
 * Initialize the application
 */
async function init() {
  const success = await loadGameData();

  if (success) {
    setupEventDelegation();
    render();
  } else {
    document.getElementById('app').innerHTML = '<div style="padding: 20px; color: red;">Failed to load game data. Check console for errors.</div>';
  }
}

// Start the app
init();
