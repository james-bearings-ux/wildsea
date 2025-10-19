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
  toggleAspectDamageType,
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
  generateRandomCharacter,
  customizeAspect,
  resetAspectCustomization
} from './state/character.js';
import {
  createSession,
  loadSession,
  saveSession,
  addCharacterToSession,
  removeCharacterFromSession,
  setActiveCharacter,
  getOrCreateSharedSession
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
  updateShipName,
  updateAnticipatedCrewSize,
  updateAdditionalStakes,
  selectShipPart,
  selectShipFitting,
  selectShipUndercrew,
  cycleRatingDamage,
  cycleUndercrewDamage,
  addCargo,
  updateCargoName,
  removeCargo,
  addPassenger,
  updatePassengerName,
  removePassenger
} from './state/ship.js';
import { renderShipCreationMode } from './rendering/ship-creation-mode.js';
import { renderShipPlayMode } from './rendering/ship-play-mode.js';
import { renderShipUpgradeMode } from './rendering/ship-upgrade-mode.js';
import { switchToShip, setActiveShip } from './state/session.js';
// Realtime has infrastructure issues - using polling instead
// import { setupSubscriptions, unsubscribeAll } from './realtime.js';
import { startPolling, stopPolling } from './polling.js';
import { getCurrentUser, onAuthStateChange, sendMagicLink, signOut } from './auth.js';
import { renderLoginScreen, renderCheckEmailScreen } from './components/login.js';
import { supabase } from './supabaseClient.js';
import { startPresenceHeartbeat, stopPresenceHeartbeat, getOnlineUsers, removePresence } from './presence.js';
import { renderPresenceBar } from './components/presence-bar.js';

// Global state
let currentUser = null; // Current authenticated user
let session = null;
let character = null; // Cached active character
let ship = null; // Cached active ship
let onlineUsers = []; // List of online users in the session
let activeShipTab = 'size'; // Track active tab for ship creation mode
let activeWizardStage = 'design'; // Track wizard stage: 'design' | 'fittings' | 'undercrew'
let showCustomizeModal = false; // Track if customization modal is open
let selectedModalAspectId = null; // Track which aspect is selected in modal
let modalUnsavedEdits = {}; // Track unsaved edits in customization modal { aspectId: { name, description } }
let loginState = 'login'; // 'login' | 'check-email'
let loginEmail = ''; // Store email for check-email screen
let loginMessage = ''; // Status message for login screen

// Debounce timers for text inputs
const debounceTimers = new Map();

/**
 * Debounce a function call by key
 * @param {string} key - Unique identifier for this debounce
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds (default 400ms)
 */
function debounce(key, fn, delay = 400) {
  // Clear existing timer for this key
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }

  // Set new timer
  const timer = setTimeout(() => {
    debounceTimers.delete(key);
    fn();
  }, delay);

  debounceTimers.set(key, timer);
}

/**
 * Schedule a save after 1 second of inactivity
 * This provides optimistic UI updates while batching database writes
 */
function scheduleSave() {
  debounce('character-save', async () => {
    if (character) {
      await saveCharacter(character);
    }
  }, 1000);
}

/**
 * Schedule a ship save after 1 second of inactivity
 */
function scheduleShipSave() {
  debounce('ship-save', async () => {
    if (ship) {
      await saveShip(ship);
    }
  }, 1000);
}

/**
 * Render login screen
 */
function renderLogin() {
  const app = document.getElementById('app');

  if (loginState === 'check-email') {
    app.innerHTML = renderCheckEmailScreen(loginEmail);
  } else {
    app.innerHTML = renderLoginScreen(loginMessage, loginEmail);
  }
}

/**
 * Main render function - delegates to mode-specific renderers
 * @param {boolean} reloadSession - Whether to reload session from DB (true for real-time updates, false for user actions)
 */
async function render(reloadSession = false) {
  const app = document.getElementById('app');

  // Check if user is authenticated
  if (!currentUser) {
    renderLogin();
    return;
  }

  // Only reload session from DB when explicitly requested (e.g., from real-time subscription)
  if (reloadSession) {
    console.log('[RENDER] Reloading session from database...');
    const latestSession = await loadSession();
    if (latestSession) {
      console.log('[RENDER] Session reloaded. Character IDs:', latestSession.activeCharacterIds);
      session = latestSession;
    }

    // Also reload character and ship when session reloads (from real-time updates)
    if (session && session.activeCharacterId) {
      console.log('[RENDER] Reloading active character:', session.activeCharacterId);
      character = await loadCharacter(session.activeCharacterId);
    }
    if (session && session.activeShipId) {
      console.log('[RENDER] Reloading active ship:', session.activeShipId);
      ship = await loadShip(session.activeShipId);
    }
  }

  if (!session) {
    app.innerHTML = '<div style="padding: 20px;">No session found. Reloading...</div>';
    return;
  }

  // Fetch online users
  onlineUsers = await getOnlineUsers(session.id);

  // Render presence bar and navigation
  const presenceBarHtml = renderPresenceBar(onlineUsers);
  const navHtml = await renderNavigation(session);

  // Check if we're viewing the ship
  if (session.activeView === 'ship' && session.activeShipId) {
    // Load ship if not cached or if active ship changed
    if (!ship || ship.id !== session.activeShipId) {
      ship = await loadShip(session.activeShipId);
    }

    if (!ship) {
      app.innerHTML = presenceBarHtml + navHtml + '<div style="padding: 20px; color: red;">Error: Could not load ship.</div>';
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
    app.innerHTML = presenceBarHtml + navHtml + tempDiv.innerHTML;
    return;
  }

  // Otherwise render character view
  if (!session.activeCharacterId) {
    app.innerHTML = presenceBarHtml + navHtml + '<div style="padding: 20px;">No active character. Please create or import a character.</div>';
    return;
  }

  // Load character if not cached or if active character changed
  if (!character || character.id !== session.activeCharacterId) {
    character = await loadCharacter(session.activeCharacterId);
  }

  if (!character) {
    app.innerHTML = presenceBarHtml + navHtml + '<div style="padding: 20px; color: red;">Error: Could not load active character.</div>';
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
    renderAdvancementMode(tempDiv, character, gameData, showCustomizeModal, selectedModalAspectId, modalUnsavedEdits);
  }

  // Combine navigation and content
  app.innerHTML = presenceBarHtml + navHtml + tempDiv.innerHTML;
}

/**
 * Handle character creation validation and mode transition
 */
async function handleCreateCharacter() {
  if (!character) return;

  const validation = validateCharacterCreation(character);

  if (!validation.valid) {
    alert(validation.errors[0]);
    return;
  }

  // Set mode and save to localStorage (mode is per-user, not saved to DB)
  character.mode = 'play';
  localStorage.setItem(`wildsea-character-${character.id}-mode`, 'play');

  await saveCharacter(character);
  await render();
}

/**
 * Setup event delegation for click and change events
 */
function setupEventDelegation() {
  const app = document.getElementById('app');

  // Handle login form submission
  app.addEventListener('submit', async function (e) {
    if (e.target.id === 'login-form') {
      e.preventDefault();

      const emailInput = document.getElementById('email');
      const email = emailInput?.value?.trim();

      if (!email) {
        loginMessage = 'Please enter your email address';
        renderLogin();
        return;
      }

      // Disable button and show loading
      const button = document.getElementById('login-button');
      if (button) {
        button.disabled = true;
        button.textContent = 'Sending...';
      }

      try {
        const result = await sendMagicLink(email);

        if (result.success) {
          loginState = 'check-email';
          loginEmail = email;
          loginMessage = '';
          renderLogin();
        } else {
          loginMessage = result.error || 'Failed to send magic link';
          loginEmail = email;
          renderLogin();
        }
      } catch (error) {
        console.error('Login error:', error);
        loginMessage = 'An error occurred. Please try again.';
        loginEmail = email;
        renderLogin();
      }
    }
  });

  // Click event delegation
  app.addEventListener('click', function (e) {
    // Find the closest element with data-action (bubble up the DOM)
    let target = e.target;
    while (target && target !== app) {
      const action = target.getAttribute('data-action');

      if (action) {
        const params = target.getAttribute('data-params');
        // Decode HTML entities before parsing JSON
        let parsedParams = {};
        if (params && params.trim() !== '') {
          const decodedParams = params.replace(/&quot;/g, '"');
          try {
            parsedParams = JSON.parse(decodedParams);
          } catch (e) {
            console.error('Failed to parse data-params:', params, e);
            parsedParams = {};
          }
        }

        // Handle async actions
        (async () => {
          try {
            // Route to appropriate function
            switch (action) {
              case 'toggleAspect':
                if (character) {
                  toggleAspect(parsedParams.id, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'toggleDamageType':
                if (character) {
                  toggleAspectDamageType(parsedParams.aspectId, parsedParams.damageType, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'toggleEdge':
                if (character) {
                  toggleEdge(parsedParams.name, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'adjustSkill':
                if (character) {
                  adjustSkill(parsedParams.name, parsedParams.delta, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'adjustLanguage':
                if (character) {
                  adjustLanguage(parsedParams.name, parsedParams.delta, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'cycleAspectDamage':
                e.stopPropagation();
                if (character) {
                  cycleAspectDamage(parsedParams.id, parsedParams.index, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'expandAspectTrack':
                e.stopPropagation();
                if (character) {
                  expandAspectTrack(parsedParams.id, parsedParams.delta, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'addMilestone':
                if (character) {
                  addMilestone(render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'toggleMilestoneUsed':
                if (character) {
                  toggleMilestoneUsed(parsedParams.id, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'deleteMilestone':
                if (character) {
                  deleteMilestone(parsedParams.id, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'addResource':
                if (character) {
                  addResource(parsedParams.type, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'removeResource':
                if (character) {
                  removeResource(parsedParams.type, parsedParams.id, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'populateDefaultResources':
                if (character) {
                  populateDefaultResources(render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'generateRandomCharacter':
                if (character) {
                  generateRandomCharacter(render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'createCharacter':
                await handleCreateCharacter();
                break;
              case 'setMode':
                if (character) {
                  setMode(parsedParams.mode, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'exportCharacter':
                if (character) {
                  exportCharacter(character);
                }
                break;
              case 'importCharacter':
                await importCharacter(session, render);
                break;
              case 'toggleMireCheckbox':
                if (character) {
                  toggleMireCheckbox(parsedParams.index, parsedParams.num, render, character);
                  await render();
                  scheduleSave();
                }
                break;
              case 'switchCharacter':
                if (session && parsedParams.characterId) {
                  await setActiveCharacter(session, parsedParams.characterId);
                  // Load the new character into cache
                  character = await loadCharacter(parsedParams.characterId);
                  await render();
                }
                break;
              case 'removeCharacter':
                if (session && parsedParams.characterId) {
                  if (confirm('Remove this character from the crew? The character data will be deleted.')) {
                    await removeCharacterFromSession(session, parsedParams.characterId);
                    await deleteCharacter(parsedParams.characterId);
                    // Clear character cache if we deleted the active one
                    if (character && character.id === parsedParams.characterId) {
                      character = null;
                    }
                    await render();
                  }
                }
                break;
              case 'createNewCharacter':
                if (session) {
                  const newCharacter = await createCharacter(session.id);
                  await addCharacterToSession(session, newCharacter.id);
                  await setActiveCharacter(session, newCharacter.id);
                  // Cache the new character
                  character = newCharacter;
                  await render();
                }
                break;
              case 'createNewShip':
                if (session) {
                  const newShip = await createShip(session.id);
                  await setActiveShip(session, newShip.id);
                  await switchToShip(session);
                  // Cache the new ship
                  ship = newShip;
                  await render();
                }
                break;
              case 'switchToShip':
                if (session) {
                  await switchToShip(session);
                  await render();
                }
                break;
              case 'setShipMode':
                if (ship) {
                  setShipMode(parsedParams.mode, render, ship);
                  await render();
                  scheduleShipSave();
                }
                break;
              case 'switchShipTab':
                activeShipTab = parsedParams.tab;
                await render();
                break;
              case 'switchWizardStage':
                activeWizardStage = parsedParams.stage;
                // Reset to default tab when switching stages
                if (activeWizardStage === 'design') {
                  activeShipTab = 'size';
                } else if (activeWizardStage === 'fittings') {
                  activeShipTab = 'motifs';
                } else if (activeWizardStage === 'undercrew') {
                  activeShipTab = 'officers';
                }
                await render();
                break;
              case 'selectShipPart':
                if (ship) {
                  selectShipPart(parsedParams.partType, parsedParams.part, render, ship);
                  await render();
                  scheduleShipSave();
                }
                break;
              case 'selectShipFitting':
                if (ship) {
                  selectShipFitting(parsedParams.fittingType, parsedParams.fitting, render, ship);
                  await render();
                  scheduleShipSave();
                }
                break;
              case 'selectShipUndercrew':
                if (ship) {
                  selectShipUndercrew(parsedParams.undercrewType, parsedParams.undercrew, render, ship);
                  await render();
                  scheduleShipSave();
                }
                break;
              case 'importShip':
                if (session) {
                  await importShip(session, render);
                }
                break;
              case 'exportShip':
                if (ship) {
                  exportShip(ship);
                }
                break;
              case 'createShip':
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

                  // Set mode and save to localStorage (mode is per-user, not saved to DB)
                  ship.mode = 'play';
                  localStorage.setItem(`wildsea-ship-${ship.id}-mode`, 'play');

                  await saveShip(ship);
                  await render();
                }
                break;
              case 'saveShipUpgrade':
                if (ship) {
                  // Set mode and save to localStorage (mode is per-user, not saved to DB)
                  ship.mode = 'play';
                  localStorage.setItem(`wildsea-ship-${ship.id}-mode`, 'play');

                  await saveShip(ship);
                  await render();
                }
                break;
              case 'cycleRatingDamage':
                e.stopPropagation();
                if (ship) {
                  cycleRatingDamage(parsedParams.rating, parsedParams.index, render, ship);
                  await render();
                  scheduleShipSave();
                }
                break;
              case 'cycleUndercrewDamage':
                e.stopPropagation();
                if (ship) {
                  cycleUndercrewDamage(parsedParams.undercrewName, parsedParams.index, render, ship);
                  await render();
                  scheduleShipSave();
                }
                break;
              case 'addCargo':
                if (ship) {
                  addCargo(render, ship);
                  await render();
                  scheduleShipSave();
                }
                break;
              case 'removeCargo':
                if (ship) {
                  removeCargo(parsedParams.id, render, ship);
                  await render();
                  scheduleShipSave();
                }
                break;
              case 'addPassenger':
                if (ship) {
                  addPassenger(render, ship);
                  await render();
                  scheduleShipSave();
                }
                break;
              case 'removePassenger':
                if (ship) {
                  removePassenger(parsedParams.id, render, ship);
                  await render();
                  scheduleShipSave();
                }
                break;
              case 'openCustomizeModal':
                showCustomizeModal = true;
                selectedModalAspectId = null; // Default to first aspect
                await render();
                break;
              case 'closeCustomizeModal':
                // Only close if clicked directly on overlay, not on modal content
                if (e.target.classList && e.target.classList.contains('modal-overlay')) {
                  showCustomizeModal = false;
                  selectedModalAspectId = null;
                  modalUnsavedEdits = {}; // Clear unsaved edits
                  await render();
                }
                break;
              case 'selectAspectInModal':
                // This is handled by change event
                break;
              case 'saveAspectCustomization':
                if (character) {
                  const nameInput = document.getElementById('modal-aspect-name');
                  const descInput = document.getElementById('modal-aspect-description');

                  if (!nameInput || !descInput) break;

                  const name = nameInput.value.trim();
                  const description = descInput.value.trim();

                  // Validation
                  if (!name || name.length === 0) {
                    alert('Aspect name is required');
                    break;
                  }
                  if (name.length > 250) {
                    alert('Aspect name must be 250 characters or less');
                    break;
                  }
                  if (!description || description.length === 0) {
                    alert('Aspect description is required');
                    break;
                  }
                  if (description.length > 800) {
                    alert('Aspect description must be 800 characters or less');
                    break;
                  }

                  customizeAspect(parsedParams.id, name, description, character);
                  showCustomizeModal = false;
                  selectedModalAspectId = null;
                  modalUnsavedEdits = {}; // Clear unsaved edits
                  await render();
                  scheduleSave();
                }
                break;
              case 'resetAspectCustomization':
                if (character && parsedParams.id) {
                  // Clear unsaved edits for this aspect
                  if (modalUnsavedEdits[parsedParams.id]) {
                    delete modalUnsavedEdits[parsedParams.id];
                  }
                  if (confirm('Reset this aspect to its original name and description?')) {
                    resetAspectCustomization(parsedParams.id, character);
                    await render();
                    scheduleSave();
                  }
                }
                break;
              case 'backToLogin':
                loginState = 'login';
                loginEmail = '';
                loginMessage = '';
                renderLogin();
                break;
              case 'signOut':
                if (confirm('Are you sure you want to sign out?')) {
                  // Clean up presence
                  if (session) {
                    await removePresence(session.id);
                  }
                  stopPresenceHeartbeat();

                  await signOut();
                  // Auth state change will handle the rest
                }
                break;
            }
          } catch (error) {
            console.error('Error handling action:', action, error);
            alert('An error occurred. Please try again.');
          }
        })();
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

    // Handle async operations
    (async () => {
      try {
        // Handle ship-related change events
        if (action === 'updateShipName') {
          if (ship) {
            updateShipName(target.value, ship);
            // Debounce ship name saves
            debounce('ship-name', async () => {
              await saveShip(ship);
            });
          }
          return;
        }

        if (action === 'updateAnticipatedCrewSize') {
          if (ship) {
            updateAnticipatedCrewSize(target.value, render, ship);
            await render();
            scheduleShipSave();
          }
          return;
        }

        if (action === 'updateAdditionalStakes') {
          if (ship) {
            updateAdditionalStakes(target.value, render, ship);
            await render();
            scheduleShipSave();
          }
          return;
        }

        if (action === 'updateCargoName') {
          if (ship) {
            updateCargoName(parsedParams.id, target.value, ship);
            // Debounce cargo name saves
            debounce('cargo-name-' + parsedParams.id, async () => {
              await saveShip(ship);
            });
          }
          return;
        }

        if (action === 'updatePassengerName') {
          if (ship) {
            updatePassengerName(parsedParams.id, target.value, ship);
            // Debounce passenger name saves
            debounce('passenger-name-' + parsedParams.id, async () => {
              await saveShip(ship);
            });
          }
          return;
        }

        // Handle character-related change events (use cached character)
        if (!character) return;

        switch (action) {
          case 'onCharacterNameChange':
            onCharacterNameChange(target.value, character);
            // Debounce character name saves
            debounce('character-name', async () => {
              await saveCharacter(character);
            });
            break;
          case 'onBloodlineChange':
            onBloodlineChange(target.value, render, character);
            await render();
            scheduleSave();
            break;
          case 'onOriginChange':
            onOriginChange(target.value, render, character);
            await render();
            scheduleSave();
            break;
          case 'onPostChange':
            onPostChange(target.value, render, character);
            await render();
            scheduleSave();
            break;
          case 'updateDrive':
            updateDrive(parsedParams.index, target.value, character);
            // Debounce drive saves
            debounce('drive-' + parsedParams.index, async () => {
              await saveCharacter(character);
            });
            break;
          case 'updateMire':
            updateMire(parsedParams.index, target.value, character);
            // Debounce mire saves
            debounce('mire-' + parsedParams.index, async () => {
              await saveCharacter(character);
            });
            break;
          case 'updateMilestoneName':
            updateMilestoneName(parsedParams.id, target.value, character);
            // Debounce milestone name saves
            debounce('milestone-name-' + parsedParams.id, async () => {
              await saveCharacter(character);
            });
            break;
          case 'updateMilestoneScale':
            updateMilestoneScale(parsedParams.id, target.value, render, character);
            await render();
            scheduleSave();
            break;
          case 'updateResourceName':
            updateResourceName(parsedParams.type, parsedParams.id, target.value, character);
            // Debounce resource name saves
            debounce('resource-name-' + parsedParams.type + '-' + parsedParams.id, async () => {
              await saveCharacter(character);
            });
            break;
          case 'selectAspectInModal':
            selectedModalAspectId = target.value;
            await render();
            break;
        }
      } catch (error) {
        console.error('Error handling change event:', action, error);
      }
    })();
  });

  // Input event delegation for live character count updates
  app.addEventListener('input', function (e) {
    const target = e.target;

    // Update character count for name input
    if (target.id === 'modal-aspect-name') {
      const charCount = document.getElementById('name-char-count');
      if (charCount) {
        charCount.textContent = target.value.length;
        const countContainer = charCount.parentElement;
        if (target.value.length > 250) {
          countContainer.classList.add('over-limit');
        } else {
          countContainer.classList.remove('over-limit');
        }
      }
      // Save to temporary storage
      if (selectedModalAspectId) {
        if (!modalUnsavedEdits[selectedModalAspectId]) {
          modalUnsavedEdits[selectedModalAspectId] = {};
        }
        modalUnsavedEdits[selectedModalAspectId].name = target.value;
      }
    }

    // Update character count for description textarea
    if (target.id === 'modal-aspect-description') {
      const charCount = document.getElementById('description-char-count');
      if (charCount) {
        charCount.textContent = target.value.length;
        const countContainer = charCount.parentElement;
        if (target.value.length > 800) {
          countContainer.classList.add('over-limit');
        } else {
          countContainer.classList.remove('over-limit');
        }
      }
      // Save to temporary storage
      if (selectedModalAspectId) {
        if (!modalUnsavedEdits[selectedModalAspectId]) {
          modalUnsavedEdits[selectedModalAspectId] = {};
        }
        modalUnsavedEdits[selectedModalAspectId].description = target.value;
      }
    }
  });
}

/**
 * Load app data after authentication
 */
async function loadApp() {
  try {
    console.log('Loading game data...');
    const success = await loadGameData();

    if (!success) {
      console.error('Game data failed to load');
      const app = document.getElementById('app');
      app.innerHTML = '<div style="padding: 20px; color: red;">Failed to load game data. Check console for errors.</div>';
      return;
    }
    console.log('Game data loaded successfully');

    // Load the shared session (creates it if it doesn't exist)
    console.log('Loading shared session...');
    session = await getOrCreateSharedSession();
    console.log('Shared session loaded:', session.id);

    // If the shared session has no characters, show a prompt but don't auto-create
    if (session.activeCharacterIds.length === 0) {
      console.log('Shared session has no characters yet');
    }

    // Cache initial character and ship
    if (session.activeCharacterId) {
      console.log('Loading active character...');
      character = await loadCharacter(session.activeCharacterId);
    }
    if (session.activeShipId) {
      console.log('Loading active ship...');
      ship = await loadShip(session.activeShipId);
    }

    console.log('Setting up polling-based sync...');

    // Start polling for changes (check every 3 seconds)
    startPolling(session.id, () => render(true));

    // Start presence heartbeat
    console.log('Starting presence heartbeat...');
    startPresenceHeartbeat(session.id, currentUser.email);

    console.log('Rendering...');
    await render();
    console.log('App loaded successfully!');
  } catch (error) {
    console.error('Failed to load app:', error);
    console.error('Error stack:', error.stack);
    const app = document.getElementById('app');
    app.innerHTML = '<div style="padding: 20px; color: red;">Failed to load: ' + error.message + '<br><br>Check console for details.</div>';
  }
}

/**
 * Initialize the application
 */
async function init() {
  const app = document.getElementById('app');
  app.innerHTML = '<div style="padding: 20px;">Loading...</div>';

  try {
    console.log('Starting initialization...');

    // Set up event delegation first (works for both login and app)
    console.log('Setting up event delegation...');
    setupEventDelegation();

    // Check current auth state
    console.log('Checking authentication...');
    currentUser = await getCurrentUser();

    // Set up auth state listener
    onAuthStateChange(async (user) => {
      console.log('Auth state changed:', user ? user.email : 'signed out');
      currentUser = user;

      if (user) {
        // User signed in - load the app
        await loadApp();
      } else {
        // User signed out - clear state and show login
        stopPolling();
        stopPresenceHeartbeat();
        session = null;
        character = null;
        ship = null;
        await render();
      }
    });

    // Cleanup polling and presence when page unloads
    window.addEventListener('beforeunload', () => {
      stopPolling();
      stopPresenceHeartbeat();
      // Try to remove presence (may not complete due to page unload)
      if (session) {
        removePresence(session.id);
      }
    });

    // If already authenticated, load the app
    if (currentUser) {
      console.log('User already authenticated:', currentUser.email);
      await loadApp();
    } else {
      console.log('No user authenticated, showing login');
      await render(); // Will show login screen
    }

    console.log('Initialization complete!');
  } catch (error) {
    console.error('Failed to initialize:', error);
    console.error('Error stack:', error.stack);
    app.innerHTML = '<div style="padding: 20px; color: red;">Failed to load: ' + error.message + '<br><br>Check console for details.</div>';
  }
}

// Start the app
init();
