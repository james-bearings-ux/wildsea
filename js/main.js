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
import { exportCharacter, importCharacter, exportShip, importShip } from './utils/file-handlers.js';
import { renderCreationMode } from './rendering/creation-mode.js';
import { renderPlayMode } from './rendering/play-mode.js';
import { renderAdvancementMode } from './rendering/advancement-mode.js';
import { renderSkills, renderLanguages } from './components/skills.js';
import { renderEdgesSkillsLanguagesRow } from './components/edges.js';
import { renderNavigation } from './components/navigation.js';
import {
  createShip,
  loadShip,
  saveShip,
  setShipMode,
  updateAnticipatedCrewSize,
  selectShipPart,
  selectShipFitting
} from './state/ship.js';
import { renderShipCreationMode } from './rendering/ship-creation-mode.js';
import { renderShipPlayMode } from './rendering/ship-play-mode.js';
import { renderShipUpgradeMode } from './rendering/ship-upgrade-mode.js';
import { switchToShip, setActiveShip } from './state/session.js';

// Global state
let session = null;
let activeShipTab = 'size'; // Track active tab for ship creation mode
let activeWizardStage = 'design'; // Track wizard stage: 'design' | 'fittings' | 'undercrew'

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
  const navHtml = renderNavigation(session);

  // Check if we're viewing the ship
  if (session.activeView === 'ship' && session.activeShipId) {
    const ship = loadShip(session.activeShipId);
    if (!ship) {
      app.innerHTML = navHtml + '<div style="padding: 20px; color: red;">Error: Could not load ship.</div>';
      return;
    }

    // Create a temporary container for ship content
    const tempDiv = document.createElement('div');
    const gameData = getGameData();

    if (ship.mode === 'creation') {
      renderShipCreationMode(tempDiv, ship, gameData, activeShipTab, activeWizardStage);
    } else if (ship.mode === 'play') {
      renderShipPlayMode(tempDiv, ship, gameData);
    } else if (ship.mode === 'upgrade') {
      renderShipUpgradeMode(tempDiv, ship, gameData);
    }

    // Combine navigation and content
    app.innerHTML = navHtml + tempDiv.innerHTML;
    return;
  }

  // Otherwise render character view
  if (!session.activeCharacterId) {
    app.innerHTML = navHtml + '<div style="padding: 20px;">No active character. Please create or import a character.</div>';
    return;
  }

  const character = loadCharacter(session.activeCharacterId);
  if (!character) {
    app.innerHTML = navHtml + '<div style="padding: 20px; color: red;">Error: Could not load active character.</div>';
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
  app.innerHTML = navHtml + tempDiv.innerHTML;
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
        // Decode HTML entities before parsing JSON
        const decodedParams = params ? params.replace(/&quot;/g, '"') : '{}';
        const parsedParams = decodedParams ? JSON.parse(decodedParams) : {};

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
          case 'createNewShip':
            if (session) {
              const newShip = createShip();
              saveShip(newShip);
              setActiveShip(session, newShip.id);
              switchToShip(session);
              render();
            }
            break;
          case 'switchToShip':
            if (session) {
              switchToShip(session);
              render();
            }
            break;
          case 'setShipMode':
            if (session && session.activeShipId) {
              const ship = loadShip(session.activeShipId);
              if (ship) {
                setShipMode(parsedParams.mode, render, ship);
                saveShip(ship);
                render();
              }
            }
            break;
          case 'switchShipTab':
            activeShipTab = parsedParams.tab;
            render();
            break;
          case 'switchWizardStage':
            activeWizardStage = parsedParams.stage;
            // Reset to default tab when switching stages
            if (activeWizardStage === 'design') {
              activeShipTab = 'size';
            } else if (activeWizardStage === 'fittings') {
              activeShipTab = 'motifs';
            }
            render();
            break;
          case 'selectShipPart':
            if (session && session.activeShipId) {
              const ship = loadShip(session.activeShipId);
              if (ship) {
                selectShipPart(parsedParams.partType, parsedParams.part, render, ship);
                saveShip(ship);
                render();
              }
            }
            break;
          case 'selectShipFitting':
            if (session && session.activeShipId) {
              const ship = loadShip(session.activeShipId);
              if (ship) {
                selectShipFitting(parsedParams.fittingType, parsedParams.fitting, render, ship);
                saveShip(ship);
                render();
              }
            }
            break;
          case 'importShip':
            if (session) {
              importShip(session, render);
            }
            break;
          case 'exportShip':
            if (session && session.activeShipId) {
              const ship = loadShip(session.activeShipId);
              if (ship) {
                exportShip(ship);
              }
            }
            break;
          case 'createShip':
            if (session && session.activeShipId) {
              const ship = loadShip(session.activeShipId);
              if (ship) {
                // Validate required elements
                const hasAllRequired = ship.size && ship.frame &&
                  Array.isArray(ship.hull) && ship.hull.length > 0 &&
                  Array.isArray(ship.bite) && ship.bite.length > 0 &&
                  Array.isArray(ship.engine) && ship.engine.length > 0;

                if (!hasAllRequired) {
                  alert('Please select all required ship design elements (Size, Frame, Hull, Bite, and Engine)');
                  return;
                }

                ship.mode = 'play';
                saveShip(ship);
                render();
              }
            }
            break;
          case 'saveShipUpgrade':
            if (session && session.activeShipId) {
              const ship = loadShip(session.activeShipId);
              if (ship) {
                ship.mode = 'play';
                saveShip(ship);
                render();
              }
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

    // Handle ship-related change events
    if (action === 'updateAnticipatedCrewSize') {
      if (session && session.activeShipId) {
        const ship = loadShip(session.activeShipId);
        if (ship) {
          updateAnticipatedCrewSize(target.value, render, ship);
          saveShip(ship);
          render();
        }
      }
      return;
    }

    // Handle character-related change events
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
