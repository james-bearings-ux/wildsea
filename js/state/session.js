/**
 * Session state management module
 * Manages the current play session (crew, active ship, active characters)
 */

/**
 * Generate a unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Session state structure
 */
export function createSession(crewName = 'New Crew') {
  return {
    id: generateId(),
    crewName,
    activeShipId: null,
    activeCharacterIds: [],
    activeView: 'character', // 'character' | 'ship'
    activeCharacterId: null,
    created: Date.now(),
    lastModified: Date.now()
  };
}

/**
 * Get the current session from localStorage
 */
export function loadSession() {
  const stored = localStorage.getItem('wildsea-session');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  }
  return null;
}

/**
 * Save session to localStorage
 */
export function saveSession(session) {
  session.lastModified = Date.now();
  localStorage.setItem('wildsea-session', JSON.stringify(session));
}

/**
 * Add a character to the session
 */
export function addCharacterToSession(session, characterId) {
  if (!session.activeCharacterIds.includes(characterId)) {
    session.activeCharacterIds.push(characterId);

    // If this is the first character, make it active
    if (session.activeCharacterId === null) {
      session.activeCharacterId = characterId;
      session.activeView = 'character';
    }

    saveSession(session);
  }
}

/**
 * Remove a character from the session
 */
export function removeCharacterFromSession(session, characterId) {
  const index = session.activeCharacterIds.indexOf(characterId);
  if (index >= 0) {
    session.activeCharacterIds.splice(index, 1);

    // If we removed the active character, switch to another
    if (session.activeCharacterId === characterId) {
      session.activeCharacterId = session.activeCharacterIds[0] || null;
    }

    saveSession(session);
  }
}

/**
 * Set the active ship for the session
 */
export function setActiveShip(session, shipId) {
  session.activeShipId = shipId;
  saveSession(session);
}

/**
 * Set the active view (character or ship)
 */
export function setActiveView(session, view) {
  session.activeView = view;
  saveSession(session);
}

/**
 * Set the active character
 */
export function setActiveCharacter(session, characterId) {
  if (session.activeCharacterIds.includes(characterId)) {
    session.activeCharacterId = characterId;
    session.activeView = 'character';
    saveSession(session);
  }
}
