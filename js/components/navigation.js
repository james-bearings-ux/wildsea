/**
 * Navigation bar component for character/ship switching
 */

import { loadCharacter } from '../state/character.js';
import { loadShip } from '../state/ship.js';

/**
 * Render the navigation bar
 * @param {Object} session - Current session object
 * @returns {string} HTML string for navigation bar
 */
export function renderNavigation(session) {
  let html = '<div class="nav-bar split">';

  // Left side: Ship button
  html += '<div style="display: flex; gap: 16px; align-items: center;">';

  if (session.activeShipId) {
    const ship = loadShip(session.activeShipId);
    const isActive = session.activeView === 'ship';
    const activeClass = isActive ? 'nav-button-active' : 'nav-button-inactive';
    html += '<button data-action="switchToShip" class="nav-button ' + activeClass + '">';
    html += ship ? (ship.name || 'Ship') : 'Ship';
    html += '</button>';
  } else {
    html += '<button data-action="createNewShip" class="nav-button nav-button-inactive">+ New Ship</button>';
  }

  html += '</div>';

  // Right side: Character buttons and actions
  html += '<div style="display: flex; gap: 16px; align-items: center;">';

  // Character buttons
  if (session.activeCharacterIds.length > 0) {
    for (let i = 0; i < session.activeCharacterIds.length; i++) {
      const charId = session.activeCharacterIds[i];
      const character = loadCharacter(charId);
      // Character is only active if we're in character view AND it's the active character
      const isActive = session.activeView === 'character' && charId === session.activeCharacterId;

      if (character) {
        const activeClass = isActive ? 'nav-button-active' : 'nav-button-inactive';
        html += '<div class="nav-character-wrapper ' + activeClass + '">';
        html += '<button data-action="switchCharacter" data-params=\'{"characterId":"' + charId + '"}\' ';
        html += 'class="nav-character-label">';
        html += character.name || 'Unnamed Character';
        html += '</button>';
        html += '<button data-action="removeCharacter" data-params=\'{"characterId":"' + charId + '"}\' ';
        html += 'class="remove" title="Remove from crew">';
        html += '✕';
        html += '</button>';
        html += '</div>';
      }
    }
  }

  // Create character button
  html += '<button data-action="createNewCharacter" class="nav-button nav-button-minor">';
  html += '+ New Character';
  html += '</button>';

  // Import character button
  html += '<button data-action="importCharacter" class="nav-button nav-button-minor">';
  html += '↓ Import Character';
  html += '</button>';

  html += '</div>';
  html += '</div>';

  return html;
}
