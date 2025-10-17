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
  const { data, error } = await supabase
    .from('sessions')
    .insert([{ name: crewName }])
    .select()
    .single();

  if (error) {
    console.error('Failed to create session:', error);
    throw error;
  }

  // Store session ID in localStorage for quick access
  localStorage.setItem('wildsea-current-session-id', data.id);

  return data;
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

  // Convert database format to app format
  return {
    id: data.id,
    crewName: data.name,
    activeShipId: data.active_ship_id,
    activeCharacterIds: characterLinks ? characterLinks.map(link => link.character_id) : [],
    activeView: data.active_view,
    activeCharacterId: data.active_character_id,
    created: new Date(data.created_at).getTime(),
    lastModified: new Date(data.updated_at).getTime()
  };
}

/**
 * Save session to Supabase
 */
export async function saveSession(session) {
  const { error } = await supabase
    .from('sessions')
    .update({
      name: session.crewName,
      active_character_id: session.activeCharacterId,
      active_ship_id: session.activeShipId,
      active_view: session.activeView,
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
 * Set the active character
 */
export async function setActiveCharacter(session, characterId) {
  if (session.activeCharacterIds.includes(characterId)) {
    session.activeCharacterId = characterId;
    session.activeView = 'character';
    await saveSession(session);
  }
}
