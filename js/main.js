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
  addTask,
  updateTaskName,
  updateTaskMaxTicks,
  tickTask,
  toggleTaskEditing,
  deleteTask,
  updateNotes,
  updateDrive,
  updateMire,
  toggleMireCheckbox,
  addResource,
  updateResourceName,
  removeResource,
  toggleResourceUsed,
  populateDefaultResources,
  setMode,
  generateRandomCharacter,
  customizeAspect,
  resetAspectCustomization,
  addAspectFromFullList,
  setJourneyRole
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
import { renderRoleTooltip } from './components/journey-role.js';
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
  removePassenger,
  toggleJourney,
  setJourneyName,
  updateClock,
  setClockMax,
  toggleClockTick
} from './state/ship.js';
import { renderShipCreationMode } from './rendering/ship-creation-mode.js';
import { renderShipPlayMode } from './rendering/ship-play-mode.js';
import { renderShipUpgradeMode } from './rendering/ship-upgrade-mode.js';
import { renderDMScreen } from './rendering/dm-screen-mode.js';
import { switchToShip, switchToDMScreen, setActiveShip } from './state/session.js';
import { renderSection, ACTION_TO_SECTIONS, ACTION_TO_SECTIONS_CREATION, ACTION_TO_SECTIONS_ADVANCEMENT } from './rendering/sections.js';
// Realtime has infrastructure issues - using polling instead
// import { setupSubscriptions, unsubscribeAll } from './realtime.js';
import { startPolling, stopPolling } from './polling.js';
import { getCurrentUser, onAuthStateChange, sendMagicLink, signOut } from './auth.js';
import {
  loadCharacterCached,
  loadShipCached,
  loadSessionCached,
  invalidateCharacterCache,
  invalidateShipCache,
  invalidateSessionCache,
  clearAllCaches
} from './cache/supabase-cache.js';
import { renderLoginScreen, renderCheckEmailScreen } from './components/login.js';
import { supabase } from './supabaseClient.js';
import { startPresenceHeartbeat, stopPresenceHeartbeat, getOnlineUsers, removePresence } from './presence.js';
import { renderPresenceBar } from './components/presence-bar.js';

// Debug flag - only log in development mode
const DEBUG = import.meta.env.DEV;

// Global state
let currentUser = null; // Current authenticated user
let session = null;
let character = null; // Cached active character
let ship = null; // Cached active ship
let onlineUsers = []; // List of online users in the session
let hasPendingCharacterSave = false; // Track if character save is pending
let hasPendingShipSave = false; // Track if ship save is pending
let isPollingActive = false; // Track if polling is currently running
let presenceCheckInterval = null; // Interval for checking user presence
let lastActivityTime = Date.now(); // Track last user interaction
let inactivityCheckInterval = null; // Interval for checking inactivity
const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes of inactivity
let activeShipTab = 'size'; // Track active tab for ship creation mode
let activeWizardStage = 'design'; // Track wizard stage: 'design' | 'fittings' | 'undercrew'
let journeyEditMode = false; // Track if journey controls are in edit mode
let showRoleTooltip = null; // Track which role tooltip to show (role name or null)
let showCustomizeModal = false; // Track if customization modal is open
let selectedModalAspectId = null; // Track which aspect is selected in modal
let modalUnsavedEdits = {}; // Track unsaved edits in customization modal { aspectId: { name, description } }
let showSelectAspectModal = false; // Track if select aspect modal is open
let aspectSearchQuery = ''; // Track search query for aspect selection
let selectedAspectForAdding = null; // Track selected aspect in selection modal
let showAddTaskForm = false; // Track if add task form is open
let loginState = 'login'; // 'login' | 'check-email'
let loginEmail = ''; // Store email for check-email screen
let loginMessage = ''; // Status message for login screen
let dirtySections = new Set(); // Track which sections need re-rendering
let expandedDMAccordion = null; // Track which DM screen accordion is expanded (ship id or character id or null)

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
 * Schedule a render after brief inactivity
 * This batches rapid UI updates to prevent render thrashing
 * Uses smart rendering to only update changed sections
 */
function scheduleRender(forceFull = false) {
  if (forceFull) {
    markAllDirty();
  }

  debounce('render', async () => {
    // If full render is needed, do traditional render
    if (dirtySections.has('full-render')) {
      dirtySections.clear();
      await render();
    } else if (dirtySections.size > 0) {
      // Otherwise, do smart partial render
      await smartRender();
    }
  }, 50); // Very short delay - just batch rapid clicks
}

/**
 * Check if user is actively editing text inputs
 * Returns true if any text input save is pending (debounced)
 */
function hasActiveTextInputEdits() {
  for (const key of debounceTimers.keys()) {
    // Check for text input debounce keys (not render/save debounces)
    if (key.startsWith('character-name') ||
        key.startsWith('drive-') ||
        key.startsWith('mire-') ||
        key === 'notes' ||
        key.startsWith('milestone-name-') ||
        key.startsWith('task-name-') ||
        key.startsWith('resource-name-') ||
        key.startsWith('ship-name') ||
        key.startsWith('cargo-name-') ||
        key.startsWith('passenger-name-')) {
      return true;
    }
  }
  return false;
}

/**
 * Mark user as active (reset inactivity timer)
 */
function markUserActive() {
  lastActivityTime = Date.now();
}

/**
 * Check if user has been inactive and pause polling/presence if needed
 */
function checkInactivity() {
  const timeSinceActivity = Date.now() - lastActivityTime;
  const isInactive = timeSinceActivity > INACTIVITY_THRESHOLD;

  if (isInactive) {
    // User inactive for 5+ minutes - pause background activity
    if (isPollingActive) {
      console.log('[INACTIVITY] User idle for 5 minutes - pausing polling and presence to save bandwidth');
      stopPolling();
      stopPresenceHeartbeat();
      isPollingActive = false;
    }
  }
}

/**
 * Resume activity after user returns from inactivity
 */
async function resumeAfterInactivity() {
  const timeSinceActivity = Date.now() - lastActivityTime;
  const wasInactive = timeSinceActivity > INACTIVITY_THRESHOLD;

  if (wasInactive) {
    console.log('[INACTIVITY] User returned - resuming activity');

    // Restart presence heartbeat
    if (session && currentUser) {
      startPresenceHeartbeat(session.id, currentUser.email);
    }

    // Check if polling should resume
    await managePollingBasedOnPresence();
  }
}

/**
 * Manage polling based on user presence
 * Starts polling when multiple users are online, stops when solo
 */
async function managePollingBasedOnPresence() {
  if (!session) return;

  const users = await getOnlineUsers(session.id);
  const shouldPoll = users.length > 1;

  if (shouldPoll && !isPollingActive) {
    // Multiple users detected - start polling
    console.log(`[POLLING] Another user joined - starting polling (${users.length} users online)`);
    startPolling(session.id, () => render(true), 5000);
    isPollingActive = true;
  } else if (!shouldPoll && isPollingActive) {
    // Back to solo - stop polling
    console.log('[POLLING] Back to solo play - stopping polling to save bandwidth');
    stopPolling();
    isPollingActive = false;
  }
}

/**
 * Schedule a save after 1 second of inactivity
 * This provides optimistic UI updates while batching database writes
 */
function scheduleSave() {
  hasPendingCharacterSave = true; // Mark as pending
  debounce('character-save', async () => {
    if (character) {
      await saveCharacter(character);
      invalidateCharacterCache(character.id, character); // Update cache with latest data
      hasPendingCharacterSave = false; // Clear pending flag after save
      // No render needed - UI already updated via scheduleRender()
    }
  }, 1000);
}

/**
 * Schedule a ship save after 1 second of inactivity
 */
function scheduleShipSave() {
  hasPendingShipSave = true; // Mark as pending
  debounce('ship-save', async () => {
    if (ship) {
      await saveShip(ship);
      invalidateShipCache(ship.id, ship); // Update cache with latest data
      hasPendingShipSave = false; // Clear pending flag after save
      // No render needed - UI already updated via scheduleRender()
    }
  }, 1000);
}

/**
 * No-op render function to pass to mutation functions
 * This prevents mutation functions from triggering immediate renders
 * All rendering is handled by scheduleRender() for proper debouncing
 */
const noopRender = () => {};

/**
 * Mark a section as needing update
 * @param {string|string[]} section - Section name(s) to mark dirty
 */
function markDirty(section) {
  if (Array.isArray(section)) {
    section.forEach(s => dirtySections.add(s));
  } else {
    dirtySections.add(section);
  }
}

/**
 * Mark sections dirty based on action name
 * @param {string} actionName - Name of the action that was performed
 */
function markDirtyByAction(actionName) {
  // Choose the right action-to-sections map based on character mode
  let actionMap = ACTION_TO_SECTIONS; // Default to play mode

  if (character) {
    if (character.mode === 'advancement') {
      actionMap = ACTION_TO_SECTIONS_ADVANCEMENT;
    } else if (character.mode === 'creation') {
      actionMap = ACTION_TO_SECTIONS_CREATION;
    }
  }

  const sections = actionMap[actionName];
  if (sections) {
    markDirty(sections);
  } else {
    // Action not mapped - do full render to be safe
    markAllDirty();
  }
}

/**
 * Force a full render by marking all sections dirty
 */
function markAllDirty() {
  dirtySections.add('full-render');
}

/**
 * Smart render - only updates sections marked as dirty
 * This is much faster than full re-render and preserves scroll/focus
 */
async function smartRender() {
  if (!character) {
    // No character to render, do full render
    dirtySections.clear();
    await render();
    return;
  }

  if (DEBUG) console.log('[SMART RENDER] Updating sections:', Array.from(dirtySections));

  // Render each dirty section
  for (const sectionName of dirtySections) {
    const success = renderSection(sectionName, character);
    if (!success && DEBUG) {
      console.log('[SMART RENDER] Section not found, will do full render:', sectionName);
      // Section doesn't exist in current DOM - need full render
      dirtySections.clear();
      await render();
      return;
    }
  }

  // Clear dirty sections after successful render
  dirtySections.clear();
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
  // BUT skip reload if we have pending unsaved changes to avoid race conditions
  if (reloadSession && (hasPendingCharacterSave || hasPendingShipSave || hasActiveTextInputEdits())) {
    if (DEBUG) console.log('[RENDER] Skipping render - pending saves or active text input edits');
    return; // Skip entire render to avoid interrupting user
  }

  if (reloadSession) {
    if (DEBUG) console.log('[RENDER] Reloading session from database...');
    const sessionId = localStorage.getItem('wildsea-current-session-id');
    if (sessionId) {
      const latestSession = await loadSessionCached(sessionId, loadSession);
      if (latestSession) {
        if (DEBUG) console.log('[RENDER] Session reloaded. Character IDs:', latestSession.activeCharacterIds);
        session = latestSession;
      }
    }

    // Also reload character and ship when session reloads (from real-time updates)
    if (session && session.activeCharacterId) {
      if (DEBUG) console.log('[RENDER] Reloading active character:', session.activeCharacterId);
      character = await loadCharacterCached(session.activeCharacterId, loadCharacter);
    }
    if (session && session.activeShipId) {
      if (DEBUG) console.log('[RENDER] Reloading active ship:', session.activeShipId);
      ship = await loadShipCached(session.activeShipId, loadShip);
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

  // Check if we're viewing the DM screen
  if (session.activeView === 'dm-screen') {
    const dmScreenHtml = await renderDMScreen(session, expandedDMAccordion);
    app.innerHTML = presenceBarHtml + navHtml + dmScreenHtml;
    return;
  }

  // Check if we're viewing the ship
  if (session.activeView === 'ship' && session.activeShipId) {
    // Load ship if not cached or if active ship changed
    if (!ship || ship.id !== session.activeShipId) {
      ship = await loadShipCached(session.activeShipId, loadShip);
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
      renderShipPlayMode(tempDiv, ship, gameData, journeyEditMode);
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
    character = await loadCharacterCached(session.activeCharacterId, loadCharacter);
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
    renderPlayMode(tempDiv, character, gameData, showAddTaskForm, ship);
  } else if (character.mode === 'advancement') {
    renderAdvancementMode(tempDiv, character, gameData, showCustomizeModal, selectedModalAspectId, modalUnsavedEdits, showSelectAspectModal, aspectSearchQuery, selectedAspectForAdding);
  }

  // Combine navigation and content
  app.innerHTML = presenceBarHtml + navHtml + tempDiv.innerHTML;

  // Add role tooltip if needed (only if not already in DOM)
  if (showRoleTooltip && !document.querySelector('.role-tooltip-overlay')) {
    app.insertAdjacentHTML('beforeend', renderRoleTooltip(showRoleTooltip));
  }
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
            // Route action to appropriate handler function
            // Each case handles a specific user interaction via data-action attributes
            switch (action) {
              // === ASPECT ACTIONS ===

              case 'toggleAspect':
                // Toggle aspect selection in creation/advancement mode
                // Params: { id: "Bloodline-AspectName" }
                if (character) {
                  toggleAspect(parsedParams.id, noopRender, character);
                  markDirtyByAction('toggleAspect');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'toggleDamageType':
                // Toggle damage type selection for aspect (weakness, resistance, immunity)
                // Params: { aspectId, category, damageType }
                if (character) {
                  toggleAspectDamageType(parsedParams.aspectId, parsedParams.category, parsedParams.damageType, noopRender, character);
                  markDirtyByAction('toggleAspectDamageType');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              // === EDGE ACTIONS ===

              case 'toggleEdge':
                // Toggle edge selection in creation mode (3/7 budget)
                // Params: { name: "Edge Name" }
                if (character) {
                  toggleEdge(parsedParams.name, noopRender, character);
                  markDirtyByAction('toggleEdge');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              // === SKILL & LANGUAGE ACTIONS ===

              case 'adjustSkill':
                // Increase or decrease skill rank by delta (+1 or -1)
                // Params: { name: "Skill Name", delta: 1 or -1 }
                if (character) {
                  adjustSkill(parsedParams.name, parsedParams.delta, noopRender, character);
                  markDirtyByAction('adjustSkill');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'adjustLanguage':
                // Increase or decrease language rank by delta (+1 or -1)
                // Note: Low Sour is locked at rank 3 in creation mode
                // Params: { name: "Language Name", delta: 1 or -1 }
                if (character) {
                  adjustLanguage(parsedParams.name, parsedParams.delta, noopRender, character);
                  markDirtyByAction('adjustLanguage');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              // === ASPECT DAMAGE TRACKING (PLAY MODE) ===

              case 'cycleAspectDamage':
                // Cycle aspect track box through states: default → marked → burned
                // Used in play mode for damage tracking
                // Params: { id: "Aspect-ID", index: boxNumber }
                e.stopPropagation();
                if (character) {
                  cycleAspectDamage(parsedParams.id, parsedParams.index, noopRender, character);
                  markDirtyByAction('cycleAspectDamage');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'expandAspectTrack':
                // Expand/contract aspect track size in advancement mode
                // Track size can range from base value to maximum of 8 (TRACK_CONSTRAINTS.maxExpansion)
                // Params: { id: "Aspect-ID", delta: 1 or -1 }
                e.stopPropagation();
                if (character) {
                  expandAspectTrack(parsedParams.id, parsedParams.delta, noopRender, character);
                  markDirtyByAction('expandAspectTrack');
                  // If customization modal is open, force full render to update the modal
                  // Modal is not part of section system, so smart render won't update it
                  scheduleRender(showCustomizeModal);
                  scheduleSave();
                }
                break;

              // === MILESTONE ACTIONS ===

              case 'addMilestone':
                // Add a new milestone to character (Minor or Major)
                // No params needed
                if (character) {
                  addMilestone(noopRender, character);
                  markDirtyByAction('addMilestone');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'toggleMilestoneUsed':
                // Toggle milestone used/unused state
                // When used, milestone becomes read-only
                // Params: { id: milestoneId }
                if (character) {
                  toggleMilestoneUsed(parsedParams.id, noopRender, character);
                  markDirtyByAction('toggleMilestoneUsed');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'deleteMilestone':
                // Delete a milestone from the character
                // Params: { id: milestoneId }
                if (character) {
                  deleteMilestone(parsedParams.id, noopRender, character);
                  markDirtyByAction('deleteMilestone');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              // === TASK ACTIONS (PLAY MODE) ===

              case 'openAddTaskForm':
                // Show the "Add Task" form in play mode
                // No params needed
                showAddTaskForm = true;
                await render();
                break;

              case 'cancelNewTask':
                // Cancel adding a new task and hide the form
                // No params needed
                showAddTaskForm = false;
                await render();
                break;

              case 'saveNewTask':
                // Save a new task with name and max ticks
                // Reads values from form inputs
                // No params needed (reads from DOM)
                if (character) {
                  const nameInput = document.getElementById('new-task-name');
                  const ticksInput = document.getElementById('new-task-ticks');
                  const name = nameInput?.value?.trim() || '';
                  const maxTicks = parseInt(ticksInput?.value) || 4;

                  if (name) {
                    addTask(name, maxTicks, noopRender, character);
                    showAddTaskForm = false;
                    markDirtyByAction('addTask');
                    scheduleRender();
                    scheduleSave();
                  }
                }
                break;

              case 'tickTask':
                // Click a task's progress clock to advance it
                // Params: { id: taskId }
                if (character) {
                  tickTask(parsedParams.id, noopRender, character);
                  markDirtyByAction('tickTask');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'toggleTaskEditing':
                // Toggle task editing mode (enables name/ticks editing)
                // Params: { id: taskId }
                if (character) {
                  toggleTaskEditing(parsedParams.id, noopRender, character);
                  markDirtyByAction('toggleTaskEditing');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'deleteTask':
                // Delete a task with confirmation
                // Params: { id: taskId }
                if (character && confirm('Delete this task?')) {
                  deleteTask(parsedParams.id, noopRender, character);
                  markDirtyByAction('deleteTask');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              // === RESOURCE ACTIONS ===

              case 'addResource':
                // Add a new resource of specified type (charts, salvage, specimens, whispers)
                // Params: { type: resourceType }
                if (character) {
                  addResource(parsedParams.type, noopRender, character);
                  markDirtyByAction('addResource');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'removeResource':
                // Delete a resource item
                // Params: { type: resourceType, id: resourceId }
                if (character) {
                  removeResource(parsedParams.type, parsedParams.id, noopRender, character);
                  markDirtyByAction('removeResource');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'toggleResourceUsed':
                // Toggle resource used/unused state (checkbox)
                // Params: { type: resourceType, id: resourceId }
                if (character) {
                  toggleResourceUsed(parsedParams.type, parsedParams.id, noopRender, character);
                  markDirtyByAction('toggleResourceUsed');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'populateDefaultResources':
                // Load suggested starting resources in creation mode
                // No params needed
                if (character) {
                  populateDefaultResources(noopRender, character);
                  markDirtyByAction('populateDefaultResources');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              // === CHARACTER ACTIONS ===

              case 'generateRandomCharacter':
                // Generate random character in creation mode (bloodline, origin, post, aspects)
                // No params needed
                if (character) {
                  generateRandomCharacter(noopRender, character);
                  markAllDirty(); // Affects everything
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'createCharacter':
                // Validate and transition character from creation → play mode
                // No params needed
                await handleCreateCharacter();
                break;

              case 'setMode':
                // Change character mode (creation, play, advancement)
                // Params: { mode: "creation" | "play" | "advancement" }
                if (character) {
                  setMode(parsedParams.mode, noopRender, character);
                  markAllDirty(); // Mode switch affects entire layout
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'exportCharacter':
                // Download character as JSON file
                // No params needed
                if (character) {
                  exportCharacter(character);
                }
                break;

              case 'importCharacter':
                // Open file dialog to import character from JSON
                // No params needed
                await importCharacter(session, render);
                break;

              // === DRIVES & MIRES ===

              case 'toggleMireCheckbox':
                // Toggle mire checkbox state in play mode (2 checkboxes per mire)
                // Params: { index: mireIndex, num: 1 or 2 }
                if (character) {
                  toggleMireCheckbox(parsedParams.index, parsedParams.num, noopRender, character);
                  markDirtyByAction('toggleMireCheckbox');
                  scheduleRender();
                  scheduleSave();
                }
                break;

              // === NAVIGATION & SESSION ACTIONS ===

              case 'toggleCharacterDropdown':
                // Show/hide character selection dropdown in navigation
                // No params needed
                const dropdown = document.getElementById('characterDropdown');
                if (dropdown) {
                  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                }
                break;

              case 'switchCharacter':
                // Switch to viewing a different character in the crew
                // Params: { characterId: string }
                if (session && parsedParams.characterId) {
                  await setActiveCharacter(session, parsedParams.characterId);
                  // Load the new character into cache
                  character = await loadCharacterCached(parsedParams.characterId, loadCharacter);
                  await render();
                }
                break;

              case 'removeCharacter':
                // Remove character from crew and delete (with confirmation)
                // Params: { characterId: string }
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
                // Create a new character and add to crew
                // No params needed
                if (session) {
                  const newCharacter = await createCharacter(session.id);
                  await addCharacterToSession(session, newCharacter.id);
                  await setActiveCharacter(session, newCharacter.id);
                  // Cache the new character
                  character = newCharacter;
                  await render();
                }
                break;

              // === SHIP ACTIONS ===

              case 'createNewShip':
                // Create a new ship and switch to ship view
                // No params needed
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
                // Switch active view to ship (from character view)
                // No params needed
                if (session) {
                  await switchToShip(session);
                  await render();
                }
                break;

              case 'switchToDMScreen':
                // Switch to DM screen view (shows all characters + ship)
                // No params needed
                if (session) {
                  await switchToDMScreen(session);
                  await render();
                }
                break;

              case 'toggleDMAccordion':
                // Expand/collapse character or ship accordion in DM screen
                // Params: { id: characterId or shipId }
                if (parsedParams && parsedParams.id) {
                  // Toggle accordion: if already expanded, collapse it; otherwise expand it
                  expandedDMAccordion = expandedDMAccordion === parsedParams.id ? null : parsedParams.id;
                  await render();
                }
                break;

              case 'setShipMode':
                // Change ship mode (creation, play, upgrade)
                // Params: { mode: "creation" | "play" | "upgrade" }
                if (ship) {
                  setShipMode(parsedParams.mode, noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'switchShipTab':
                // Switch active tab in ship creation mode (size, frame, hull, etc.)
                // Params: { tab: tabName }
                activeShipTab = parsedParams.tab;
                await render();
                break;

              case 'switchWizardStage':
                // Switch wizard stage in ship creation (design, fittings, undercrew)
                // Params: { stage: "design" | "fittings" | "undercrew" }
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
                // Select ship design element (size, frame, hull, bite, engine)
                // Params: { partType: string, part: object }
                if (ship) {
                  selectShipPart(parsedParams.partType, parsedParams.part, noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'selectShipFitting':
                // Select ship fitting (motif, outfit, armament)
                // Params: { fittingType: string, fitting: object }
                if (ship) {
                  selectShipFitting(parsedParams.fittingType, parsedParams.fitting, noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'selectShipUndercrew':
                // Select undercrew member (officer, crew, specimen)
                // Params: { undercrewType: string, undercrew: object }
                if (ship) {
                  selectShipUndercrew(parsedParams.undercrewType, parsedParams.undercrew, noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'importShip':
                // Open file dialog to import ship from JSON
                // No params needed
                if (session) {
                  await importShip(session, render);
                }
                break;

              case 'exportShip':
                // Download ship as JSON file
                // No params needed
                if (ship) {
                  exportShip(ship);
                }
                break;

              case 'createShip':
                // Validate and transition ship from creation → play mode
                // Requires: size, frame, hull, bite, engine
                // No params needed
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
                // Save ship upgrades and return to play mode
                // No params needed
                if (ship) {
                  // Set mode and save to localStorage (mode is per-user, not saved to DB)
                  ship.mode = 'play';
                  localStorage.setItem(`wildsea-ship-${ship.id}-mode`, 'play');

                  await saveShip(ship);
                  await render();
                }
                break;

              case 'cycleRatingDamage':
                // Cycle ship rating damage (Bite, Engine, Hull, Seals)
                // Cycles through: default → marked → burned
                // Params: { rating: string, index: number }
                e.stopPropagation();
                if (ship) {
                  cycleRatingDamage(parsedParams.rating, parsedParams.index, noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'cycleUndercrewDamage':
                // Cycle undercrew track damage (officers, crew, specimens)
                // Cycles through: default → marked → burned
                // Params: { undercrewName: string, index: number }
                e.stopPropagation();
                if (ship) {
                  cycleUndercrewDamage(parsedParams.undercrewName, parsedParams.index, noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'addCargo':
                // Add a new cargo item to ship
                // No params needed
                if (ship) {
                  addCargo(render, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'removeCargo':
                // Remove cargo item from ship
                // Params: { id: cargoId }
                if (ship) {
                  removeCargo(parsedParams.id, noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'addPassenger':
                // Add a new passenger to ship
                // No params needed
                if (ship) {
                  addPassenger(render, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'removePassenger':
                // Remove passenger from ship
                // Params: { id: passengerId }
                if (ship) {
                  removePassenger(parsedParams.id, noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              // === JOURNEY ACTIONS ===

              case 'toggleJourney':
                // Start or end a journey (shows/hides journey UI)
                // No params needed
                if (ship) {
                  toggleJourney(noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'editJourney':
                // Enter journey edit mode (allows changing name and clocks)
                // No params needed
                journeyEditMode = true;
                await render();
                break;

              case 'saveJourney':
                // Exit journey edit mode and save changes
                // No params needed
                journeyEditMode = false;
                await render();
                break;

              case 'updateJourneyName':
                // Update journey name (only fires in edit mode)
                // Value read from e.target.value
                // No params needed
                if (ship) {
                  setJourneyName(e.target.value, ship);
                  scheduleShipSave();
                }
                break;

              case 'setClockMax':
                // Set maximum ticks for journey clock (range or danger)
                // Value read from e.target.value
                // Params: { clockType: "range" | "danger" }
                if (ship) {
                  setClockMax(parsedParams.clockType, parseInt(e.target.value), noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              case 'toggleClockTick':
                // Toggle individual tick on journey clock
                // Params: { clockType: "range" | "danger", tickIndex: number }
                if (ship) {
                  toggleClockTick(parsedParams.clockType, parsedParams.tickIndex, noopRender, ship);
                  scheduleRender();
                  scheduleShipSave();
                }
                break;

              // === JOURNEY ROLE TOOLTIPS ===

              case 'showRoleTooltip':
                // Show journey role description tooltip
                // Params: { role: roleName }
                if (parsedParams.role) {
                  showRoleTooltip = parsedParams.role;
                  // Render modal immediately without full render
                  const modalHtml = renderRoleTooltip(showRoleTooltip);
                  if (modalHtml) {
                    app.insertAdjacentHTML('beforeend', modalHtml);
                  }
                }
                break;

              case 'closeTooltip':
                // Close journey role tooltip
                // No params needed
                showRoleTooltip = null;
                // Remove modal immediately
                const modalOverlay = document.querySelector('.role-tooltip-overlay');
                if (modalOverlay) {
                  modalOverlay.remove();
                }
                break;

              // === ASPECT CUSTOMIZATION MODAL (ADVANCEMENT MODE) ===

              case 'openCustomizeModal':
                // Open modal to customize aspect names and descriptions
                // No params needed
                showCustomizeModal = true;
                selectedModalAspectId = null; // Default to first aspect
                await render();
                break;

              case 'closeCustomizeModal':
                // Close customization modal (clicking overlay or Cancel button)
                // Discards unsaved edits
                // No params needed
                // Close if clicking overlay, OR if clicking element with this specific action (Cancel button)
                const isOverlayClick = e.target.classList && e.target.classList.contains('modal-overlay');
                const isCancelButton = e.target.dataset && e.target.dataset.action === 'closeCustomizeModal';
                if (isOverlayClick || isCancelButton) {
                  showCustomizeModal = false;
                  selectedModalAspectId = null;
                  modalUnsavedEdits = {}; // Clear unsaved edits
                  await render();
                }
                break;

              case 'openSelectAspectModal':
                // Open modal to add aspect from full list (advancement mode)
                // No params needed
                showSelectAspectModal = true;
                aspectSearchQuery = '';
                selectedAspectForAdding = null;
                await render();
                break;

              case 'closeSelectAspectModal':
                // Close aspect selection modal (clicking overlay or Cancel button)
                // No params needed
                // Close if clicking overlay, OR if clicking element with this specific action (Cancel button)
                const isOverlayClickSelect = e.target.classList && e.target.classList.contains('modal-overlay');
                const isCancelButtonSelect = e.target.dataset && e.target.dataset.action === 'closeSelectAspectModal';
                if (isOverlayClickSelect || isCancelButtonSelect) {
                  showSelectAspectModal = false;
                  aspectSearchQuery = '';
                  selectedAspectForAdding = null;
                  await render();
                }
                break;

              case 'selectAspectForAdding':
                // Select an aspect from the list for preview before adding
                // Params: { aspectId: "Source-AspectName" }
                if (character && parsedParams.aspectId) {
                  // Find the aspect from game data
                  const gameData = getGameData();
                  let foundAspect = null;

                  // Search through all aspects in game data
                  for (const [source, aspects] of Object.entries(gameData.aspects)) {
                    const aspect = aspects.find(a => {
                      const id = source + '-' + a.name;
                      return id === parsedParams.aspectId;
                    });

                    if (aspect) {
                      foundAspect = {
                        ...aspect,
                        source: source,
                        category: gameData.bloodlines.includes(source) ? 'Bloodline' :
                                 gameData.origins.includes(source) ? 'Origin' :
                                 gameData.posts.includes(source) ? 'Post' : 'Unknown'
                      };
                      break;
                    }
                  }

                  selectedAspectForAdding = foundAspect;
                  await render();
                }
                break;

              case 'addSelectedAspect':
                // Add the selected aspect to character and close modal
                // No params needed (uses selectedAspectForAdding state)
                if (character && selectedAspectForAdding) {
                  addAspectFromFullList(selectedAspectForAdding, noopRender, character);
                  showSelectAspectModal = false;
                  aspectSearchQuery = '';
                  selectedAspectForAdding = null;
                  markAllDirty(); // Adding aspect affects multiple sections
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'selectAspectInModal':
                // Select which aspect to customize in modal (handled by change event)
                // See change event handler
                break;

              case 'saveAspectCustomization':
                // Save customized aspect name and description
                // Validates length limits (name: 250, description: 800)
                // Params: { id: aspectId }
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
                  scheduleRender();
                  scheduleSave();
                }
                break;

              case 'resetAspectCustomization':
                // Reset aspect to original name/description with confirmation
                // Params: { id: aspectId }
                if (character && parsedParams.id) {
                  // Clear unsaved edits for this aspect
                  if (modalUnsavedEdits[parsedParams.id]) {
                    delete modalUnsavedEdits[parsedParams.id];
                  }
                  if (confirm('Reset this aspect to its original name and description?')) {
                    resetAspectCustomization(parsedParams.id, character);
                    scheduleRender();
                    scheduleSave();
                  }
                }
                break;

              // === AUTHENTICATION ACTIONS ===

              case 'backToLogin':
                // Return to login screen from "check email" screen
                // No params needed
                loginState = 'login';
                loginEmail = '';
                loginMessage = '';
                renderLogin();
                break;

              case 'toggleTheme':
                // Toggle between light and dark theme
                // No params needed
                // Toggle between light and dark mode
                const currentTheme = localStorage.getItem('theme') || 'light';
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                localStorage.setItem('theme', newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
                // Re-render to update the toggle button icon
                render();
                break;

              case 'signOut':
                // Sign out user and clean up (presence, polling, caches)
                // Shows confirmation dialog
                // No params needed
                if (confirm('Are you sure you want to sign out?')) {
                  // Clean up presence
                  if (session) {
                    await removePresence(session.id);
                  }
                  stopPresenceHeartbeat();
                  stopPolling();

                  // Stop presence check interval
                  if (presenceCheckInterval) {
                    clearInterval(presenceCheckInterval);
                    presenceCheckInterval = null;
                  }

                  // Stop inactivity check interval
                  if (inactivityCheckInterval) {
                    clearInterval(inactivityCheckInterval);
                    inactivityCheckInterval = null;
                  }

                  // Clear all caches on sign out
                  clearAllCaches();

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
        // === SHIP-RELATED CHANGE EVENTS ===
        // These handle text input changes for ship properties
        // Most are debounced to reduce database writes

        if (action === 'updateShipName') {
          // Update ship name from text input
          // No params needed (value from target.value)
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
          // Update anticipated crew size number input
          // No params needed (value from target.value)
          if (ship) {
            updateAnticipatedCrewSize(target.value, noopRender, ship);
            scheduleRender();
            scheduleShipSave();
          }
          return;
        }

        if (action === 'updateAdditionalStakes') {
          // Update additional stakes text input
          // No params needed (value from target.value)
          if (ship) {
            updateAdditionalStakes(target.value, noopRender, ship);
            scheduleRender();
            scheduleShipSave();
          }
          return;
        }

        if (action === 'updateCargoName') {
          // Update cargo item name text input
          // Params: { id: cargoId }
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
          // Update passenger name text input
          // Params: { id: passengerId }
          if (ship) {
            updatePassengerName(parsedParams.id, target.value, ship);
            // Debounce passenger name saves
            debounce('passenger-name-' + parsedParams.id, async () => {
              await saveShip(ship);
            });
          }
          return;
        }

        if (action === 'updateJourneyName') {
          // Update journey name text input
          // No params needed (value from target.value)
          if (ship) {
            setJourneyName(target.value, ship);
            // Debounce journey name saves
            debounce('journey-name', async () => {
              await saveShip(ship);
            });
          }
          return;
        }

        if (action === 'setJourneyRole') {
          // Set character's role on the current journey
          // No params needed (value from target.value - role name)
          if (character) {
            setJourneyRole(target.value, noopRender, character);
            await render(); // Immediate render for snappy nav bar update
            scheduleSave();
          }
          return;
        }

        // Handle character-related change events (use cached character)
        if (!character) return;

        // Route change events to appropriate handler functions
        // Text inputs are debounced to reduce database writes
        switch (action) {
          case 'onCharacterNameChange':
            // Update character name from text input in creation mode
            // No params needed (value from target.value)
            onCharacterNameChange(target.value, character);
            // No render needed - input already shows user's changes
            // Debounce character name saves
            debounce('character-name', async () => {
              await saveCharacter(character);
            });
            break;

          case 'onBloodlineChange':
            // Change character bloodline in creation mode (affects available aspects)
            // No params needed (value from target.value)
            onBloodlineChange(target.value, noopRender, character);
            markDirtyByAction('onBloodlineChange');
            scheduleRender();
            scheduleSave();
            break;

          case 'onOriginChange':
            // Change character origin in creation mode (affects available aspects)
            // No params needed (value from target.value)
            onOriginChange(target.value, noopRender, character);
            markDirtyByAction('onOriginChange');
            scheduleRender();
            scheduleSave();
            break;

          case 'onPostChange':
            // Change character post in creation mode (affects available aspects)
            // No params needed (value from target.value)
            onPostChange(target.value, noopRender, character);
            markDirtyByAction('onPostChange');
            scheduleRender();
            scheduleSave();
            break;

          case 'updateDrive':
            // Update drive text at specified index (0-2)
            // Params: { index: 0-2 }
            updateDrive(parsedParams.index, target.value, character);
            // No render needed - input already shows user's changes
            // Debounce drive saves
            debounce('drive-' + parsedParams.index, async () => {
              await saveCharacter(character);
            });
            break;

          case 'updateMire':
            // Update mire text at specified index (0-2)
            // Params: { index: 0-2 }
            updateMire(parsedParams.index, target.value, character);
            // No render needed - input already shows user's changes
            // Debounce mire saves
            debounce('mire-' + parsedParams.index, async () => {
              await saveCharacter(character);
            });
            break;

          case 'updateNotes':
            // Update character notes textarea
            // No params needed (value from target.value)
            updateNotes(target.value, character);
            // No render needed - input already shows user's changes
            // Debounce notes saves
            debounce('notes', async () => {
              await saveCharacter(character);
            });
            break;

          case 'updateMilestoneName':
            // Update milestone name text input
            // Params: { id: milestoneId }
            updateMilestoneName(parsedParams.id, target.value, character);
            // No render needed - input already shows user's changes
            // Debounce milestone name saves
            debounce('milestone-name-' + parsedParams.id, async () => {
              await saveCharacter(character);
            });
            break;

          case 'updateMilestoneScale':
            // Change milestone scale dropdown (Minor/Major)
            // Params: { id: milestoneId }
            updateMilestoneScale(parsedParams.id, target.value, noopRender, character);
            markDirtyByAction('updateMilestoneScale');
            scheduleRender();
            scheduleSave();
            break;

          case 'updateTaskName':
            // Update task name while in edit mode
            // Params: { id: taskId }
            updateTaskName(parsedParams.id, target.value, character);
            // No render needed - input already shows user's changes
            // Debounce task name saves
            debounce('task-name-' + parsedParams.id, async () => {
              await saveCharacter(character);
            });
            break;

          case 'updateTaskMaxTicks':
            // Update task max ticks (progress clock size)
            // Params: { id: taskId }
            updateTaskMaxTicks(parsedParams.id, target.value, noopRender, character);
            markDirtyByAction('updateTaskMaxTicks');
            scheduleRender();
            scheduleSave();
            break;

          case 'updateResourceName':
            // Update resource name text input
            // Params: { type: resourceType, id: resourceId }
            updateResourceName(parsedParams.type, parsedParams.id, target.value, character);
            // No render needed - input already shows user's changes
            // Debounce resource name saves
            debounce('resource-name-' + parsedParams.type + '-' + parsedParams.id, async () => {
              await saveCharacter(character);
            });
            break;

          case 'selectAspectInModal':
            // Select aspect from dropdown in aspect addition modal
            // No params needed (value from target.value)
            selectedModalAspectId = target.value;
            await render();
            break;
        }
      } catch (error) {
        console.error('Error handling change event:', action, error);
      }
    })();
  });

  // Input event delegation for live character count updates and search
  app.addEventListener('input', function (e) {
    const target = e.target;

    // Handle aspect search input
    if (target.id === 'aspect-search-input') {
      aspectSearchQuery = target.value;
      selectedAspectForAdding = null; // Reset selection when search changes
      debounce('aspect-search', async () => {
        await render();
      }, 200); // Shorter debounce for search
      return;
    }

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
      character = await loadCharacterCached(session.activeCharacterId, loadCharacter);
    }
    if (session.activeShipId) {
      console.log('Loading active ship...');
      ship = await loadShipCached(session.activeShipId, loadShip);
    }

    console.log('Setting up polling-based sync...');

    // Check how many users are online to optimize polling
    const initialOnlineUsers = await getOnlineUsers(session.id);

    if (initialOnlineUsers.length > 1) {
      // Multiple users online - start polling for multiplayer sync
      console.log(`[POLLING] Starting polling - ${initialOnlineUsers.length} users online`);
      startPolling(session.id, () => render(true), 5000);
      isPollingActive = true;
    } else {
      // Solo play - skip polling to save egress
      console.log('[POLLING] Solo play detected - polling disabled to save bandwidth');
      console.log('[POLLING] Polling will auto-start if another user joins');
      isPollingActive = false;
    }

    // Start presence heartbeat
    console.log('Starting presence heartbeat...');
    startPresenceHeartbeat(session.id, currentUser.email);

    // Check presence every 30 seconds to dynamically manage polling
    presenceCheckInterval = setInterval(async () => {
      await managePollingBasedOnPresence();
    }, 30000); // Check every 30 seconds

    // Check for user inactivity every 60 seconds
    inactivityCheckInterval = setInterval(() => {
      checkInactivity();
    }, 60000); // Check every minute

    // Track user activity to detect when they return
    const activityEvents = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    activityEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        resumeAfterInactivity();
        markUserActive();
      }, { passive: true });
    });

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

    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

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

        // Stop presence check interval
        if (presenceCheckInterval) {
          clearInterval(presenceCheckInterval);
          presenceCheckInterval = null;
        }

        // Stop inactivity check interval
        if (inactivityCheckInterval) {
          clearInterval(inactivityCheckInterval);
          inactivityCheckInterval = null;
        }

        session = null;
        character = null;
        ship = null;
        await render();
      }
    });

    // Close character dropdown when clicking outside
    document.addEventListener('click', function (e) {
      const dropdown = document.getElementById('characterDropdown');
      const dropdownContainer = e.target.closest('.nav-dropdown-container');

      if (dropdown && dropdown.style.display === 'block' && !dropdownContainer) {
        dropdown.style.display = 'none';
      }
    });

    // Handle tab visibility changes - pause polling when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab hidden - stop polling to save bandwidth
        if (isPollingActive) {
          console.log('[POLLING] Tab hidden - pausing polling');
          stopPolling();
          isPollingActive = false; // Mark as stopped so it can resume later
        }
      } else {
        // Tab visible again - resume polling if needed
        console.log('[POLLING] Tab visible - checking if polling should resume');
        managePollingBasedOnPresence();
      }
    });

    // Cleanup polling and presence when page unloads
    window.addEventListener('beforeunload', () => {
      stopPolling();
      stopPresenceHeartbeat();

      // Stop presence check interval
      if (presenceCheckInterval) {
        clearInterval(presenceCheckInterval);
        presenceCheckInterval = null;
      }

      // Stop inactivity check interval
      if (inactivityCheckInterval) {
        clearInterval(inactivityCheckInterval);
        inactivityCheckInterval = null;
      }

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
