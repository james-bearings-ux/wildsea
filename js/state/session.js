/**
 * Session state management module
 * Manages the current play session (crew, active ship, active characters)
 * Now using Supabase for real-time multiplayer support
 */

import { supabase } from '../supabaseClient.js';

/**
 * Session state structure (stored in Supabase)
 * {
 *   id: UUID,
 *   name: string,
 *   active_character_id: UUID,
 *   active_ship_id: UUID,
 *   active_view: 'character' | 'ship',
 *   created_at: timestamp,
 *   updated_at: timestamp
 * }
 *
 * Character IDs are stored in session_characters junction table
 */

/**
 * Create a new session in Supabase
 */
export async function createSession(crewName = 'New Crew') {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create a session');
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert([{
      name: crewName,
      user_id: user.id
    }])
    .select()
    .single();

  if (error) {
    console.error('Failed to create session:', error);
    throw error;
  }

  // Store session ID in localStorage for quick access
  localStorage.setItem('wildsea-current-session-id', data.id);

  // Convert database format to app format
  return {
    id: data.id,
    crewName: data.name,
    activeShipId: data.active_ship_id,
    activeCharacterIds: [], // New session has no characters yet
    activeView: data.active_view,
    activeCharacterId: data.active_character_id,
    created: new Date(data.created_at).getTime(),
    lastModified: new Date(data.updated_at).getTime()
  };
}

/**
 * Get or create the shared session for multiplayer
 * All authenticated users join the same shared session
 */
export async function getOrCreateSharedSession() {
  // Call the database function to get or create shared session
  const { data: sessionId, error: funcError } = await supabase.rpc('get_or_create_shared_session');

  if (funcError) {
    console.error('Failed to get shared session:', funcError);
    throw funcError;
  }

  // Now load the full session data
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Failed to load shared session:', error);
    throw error;
  }

  // Store in localStorage so we remember it
  localStorage.setItem('wildsea-current-session-id', data.id);

  // Also fetch character IDs from junction table
  const { data: characterLinks, error: linkError } = await supabase
    .from('session_characters')
    .select('character_id, position')
    .eq('session_id', sessionId)
    .order('position', { ascending: true });

  if (linkError) {
    console.error('Failed to load character links:', linkError);
  }

  // Load per-user view state from localStorage
  const activeView = localStorage.getItem('wildsea-active-view') || 'character';
  const activeCharacterId = localStorage.getItem('wildsea-active-character-id') || null;

  // Convert database format to app format
  return {
    id: data.id,
    crewName: data.name,
    activeShipId: data.active_ship_id,
    activeCharacterIds: characterLinks ? characterLinks.map(link => link.character_id) : [],
    activeView: activeView, // Per-user from localStorage
    activeCharacterId: activeCharacterId, // Per-user from localStorage
    diceRolls: data.dice_rolls || [], // Shared multiplayer dice rolls
    created: new Date(data.created_at).getTime(),
    lastModified: new Date(data.updated_at).getTime()
  };
}

/**
 * Get the current session from Supabase
 * Uses localStorage to remember which session to load
 */
export async function loadSession() {
  const sessionId = localStorage.getItem('wildsea-current-session-id');

  if (!sessionId) {
    return null;
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Failed to load session:', error);
    return null;
  }

  // Also fetch character IDs from junction table
  const { data: characterLinks, error: linkError } = await supabase
    .from('session_characters')
    .select('character_id, position')
    .eq('session_id', sessionId)
    .order('position', { ascending: true });

  if (linkError) {
    console.error('Failed to load character links:', linkError);
  }

  // Load per-user view state from localStorage
  const activeView = localStorage.getItem('wildsea-active-view') || 'character';
  const activeCharacterId = localStorage.getItem('wildsea-active-character-id') || null;

  // Convert database format to app format
  return {
    id: data.id,
    crewName: data.name,
    activeShipId: data.active_ship_id,
    activeCharacterIds: characterLinks ? characterLinks.map(link => link.character_id) : [],
    activeView: activeView, // Per-user from localStorage
    activeCharacterId: activeCharacterId, // Per-user from localStorage
    diceRolls: data.dice_rolls || [], // Shared multiplayer dice rolls
    created: new Date(data.created_at).getTime(),
    lastModified: new Date(data.updated_at).getTime()
  };
}

/**
 * Save session to Supabase (only shared state, not per-user view state)
 */
export async function saveSession(session) {
  // Save per-user view state to localStorage
  localStorage.setItem('wildsea-active-view', session.activeView);
  localStorage.setItem('wildsea-active-character-id', session.activeCharacterId || '');

  // Only save shared state to database (crew name, ship)
  const { error } = await supabase
    .from('sessions')
    .update({
      name: session.crewName,
      active_ship_id: session.activeShipId,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);

  if (error) {
    console.error('Failed to save session:', error);
    throw error;
  }
}

/**
 * Add a character to the session
 */
export async function addCharacterToSession(session, characterId) {
  if (session.activeCharacterIds.includes(characterId)) {
    return; // Already in session
  }

  // Add to junction table
  const position = session.activeCharacterIds.length;
  const { error } = await supabase
    .from('session_characters')
    .insert([{
      session_id: session.id,
      character_id: characterId,
      position
    }]);

  if (error) {
    console.error('Failed to add character to session:', error);
    throw error;
  }

  // Update local session state
  session.activeCharacterIds.push(characterId);

  // If this is the first character, make it active
  if (session.activeCharacterId === null) {
    session.activeCharacterId = characterId;
    session.activeView = 'character';
    await saveSession(session);
  }
}

/**
 * Remove a character from the session
 */
export async function removeCharacterFromSession(session, characterId) {
  const index = session.activeCharacterIds.indexOf(characterId);
  if (index < 0) {
    return; // Not in session
  }

  // Remove from junction table
  const { error } = await supabase
    .from('session_characters')
    .delete()
    .eq('session_id', session.id)
    .eq('character_id', characterId);

  if (error) {
    console.error('Failed to remove character from session:', error);
    throw error;
  }

  // Update local session state
  session.activeCharacterIds.splice(index, 1);

  // If we removed the active character, switch to another
  if (session.activeCharacterId === characterId) {
    session.activeCharacterId = session.activeCharacterIds[0] || null;
    await saveSession(session);
  }
}

/**
 * Set the active ship for the session
 */
export async function setActiveShip(session, shipId) {
  session.activeShipId = shipId;
  await saveSession(session);
}

/**
 * Set the active view (character or ship)
 */
export async function setActiveView(session, view) {
  session.activeView = view;
  await saveSession(session);
}

/**
 * Set the active ship for the session and switch to ship view
 */
export async function switchToShip(session) {
  if (session.activeShipId) {
    session.activeView = 'ship';
    await saveSession(session);
  }
}

/**
 * Switch to DM screen view
 */
export async function switchToDMScreen(session) {
  session.activeView = 'dm-screen';
  await saveSession(session);
}

/**
 * Set the active character
 */
export async function setActiveCharacter(session, characterId) {
  if (session.activeCharacterIds.includes(characterId)) {
    session.activeCharacterId = characterId;
    session.activeView = 'character';
    await saveSession(session);
  }
}

/**
 * Maximum number of dice rolls retained in the session row. The dice_rolls JSONB
 * array is re-written on every roll and read on every session load/poll, so it must
 * not grow unbounded over a campaign. Visible rolls beyond this cap (oldest first)
 * are dropped on write.
 */
const MAX_DICE_ROLLS = 50;

/**
 * Prune the dice rolls array before persisting:
 * - drop dismissed rolls (visible === false) — there is no "un-dismiss" UI, so a
 *   hidden roll is dead weight
 * - keep only the most recent MAX_DICE_ROLLS (the array is in append order)
 * @param {Array} rolls
 * @returns {Array} pruned rolls
 */
function pruneDiceRolls(rolls) {
  if (!Array.isArray(rolls)) return [];
  const visible = rolls.filter(r => r && r.visible);
  return visible.length > MAX_DICE_ROLLS
    ? visible.slice(visible.length - MAX_DICE_ROLLS)
    : visible;
}

/**
 * Add a dice roll to the session (multiplayer)
 *
 * Saves the dice roll to the database. This function expects the caller to have
 * already updated session.diceRolls locally (optimistic update pattern).
 *
 * USAGE PATTERN (from main.js):
 * 1. Create roll object with { id, userId, userName, diceCount, values, timestamp, visible }
 * 2. Push to session.diceRolls array (optimistic update)
 * 3. Call render() to update UI immediately
 * 4. Call addDiceRoll() to save to database in background
 * 5. On error, remove from session.diceRolls and re-render
 *
 * @param {Object} session - Session object with diceRolls array
 * @param {Object} roll - Roll data object (see js/components/dice-roller.js for structure)
 * @returns {Promise<void>}
 * @throws {Error} If database save fails
 */
export async function addDiceRoll(session, roll) {
  // Prune before persisting so the array stays bounded (drops dismissed rolls and
  // caps to the most recent MAX_DICE_ROLLS). The just-added roll is visible, so it
  // is always retained. Mutates session.diceRolls so local state matches the DB.
  session.diceRolls = pruneDiceRolls(session.diceRolls);

  // Save to database (local state should already be updated by caller)
  const { error } = await supabase
    .from('sessions')
    .update({
      dice_rolls: session.diceRolls,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);

  if (error) {
    console.error('Failed to save dice roll:', error);
    throw error;
  }
}

/**
 * Dismiss all visible dice rolls (multiplayer)
 *
 * Marks all rolls as not visible by setting visible=false on each roll object.
 * Like addDiceRoll, this expects the caller to update local state first
 * (optimistic update pattern).
 *
 * USAGE PATTERN (from main.js):
 * 1. Iterate through session.diceRolls and set visible=false (optimistic update)
 * 2. Call render() to update UI immediately
 * 3. Call dismissAllDiceRolls() to save to database in background
 * 4. On error, log to console (no rollback needed for dismiss action)
 *
 * NOTE: Dismissed rolls are removed entirely. There is no "un-dismiss" UI, so
 * keeping hidden rolls around only bloats the session row; dismiss therefore
 * clears the array (see pruneDiceRolls).
 *
 * @param {Object} session - Session object with diceRolls array
 * @returns {Promise<void>}
 * @throws {Error} If database save fails
 */
export async function dismissAllDiceRolls(session) {
  if (!session.diceRolls) {
    return;
  }

  // Mark all rolls hidden, then prune — which drops every now-hidden roll, leaving
  // an empty array. This both clears the display and shrinks the persisted row.
  session.diceRolls.forEach(roll => {
    roll.visible = false;
  });
  session.diceRolls = pruneDiceRolls(session.diceRolls);

  // Save to database
  const { error } = await supabase
    .from('sessions')
    .update({
      dice_rolls: session.diceRolls,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id);

  if (error) {
    console.error('Failed to dismiss dice rolls:', error);
    throw error;
  }
}
