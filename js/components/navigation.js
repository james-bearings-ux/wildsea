/**
 * Navigation bar component for character/ship switching
 */

import { loadCharacter } from '../state/character.js';
import { loadShip } from '../state/ship.js';

/**
 * Render the navigation bar
 * @param {Object} session - Current session object
 * @returns {Promise<string>} HTML string for navigation bar
 */
export async function renderNavigation(session) {
  let html = '<div class="nav-bar split">';

  // Left side: Ship button
  html += '<div style="display: flex; gap: 16px; align-items: center;">';

  if (session.activeShipId) {
    const ship = await loadShip(session.activeShipId);
    const isActive = session.activeView === 'ship';
    const activeClass = isActive ? 'nav-button-active' : 'nav-button-inactive';
    const journeyActive = ship && ship.journey && ship.journey.active;
    const journeyName = ship && ship.journey ? ship.journey.name : '';

    html += '<button data-action="switchToShip" class="nav-button ' + activeClass + '" style="display: flex; flex-direction: column; align-items: center;">';
    html += '<div>' + (ship ? (ship.name || 'Ship') : 'Ship') + '</div>';
    if (journeyActive && journeyName) {
      html += '<div class="nav-journey-subtitle">' + journeyName + '</div>';
    }
    html += '</button>';
  } else {
    html += '<button data-action="createNewShip" class="nav-button nav-button-inactive">+ New Ship</button>';
  }

  html += '</div>';

  // Right side: Character buttons and actions
  html += '<div style="display: flex; gap: 4px; align-items: center;">';

  // Character buttons
  if (session.activeCharacterIds.length > 0) {
    // Load ship to check journey status
    const ship = session.activeShipId ? await loadShip(session.activeShipId) : null;
    const journeyActive = ship && ship.journey && ship.journey.active;

    for (let i = 0; i < session.activeCharacterIds.length; i++) {
      const charId = session.activeCharacterIds[i];
      const character = await loadCharacter(charId);
      // Character is only active if we're in character view AND it's the active character
      const isActive = session.activeView === 'character' && charId === session.activeCharacterId;

      if (character) {
        const activeClass = isActive ? 'nav-button-active' : 'nav-button-inactive';
        const roleDisplay = character.journeyRole
          ? character.journeyRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : '';

        html += '<button data-action="switchCharacter" data-params=\'{"characterId":"' + charId + '"}\' ';
        html += 'class="nav-button ' + activeClass + '" style="display: flex; flex-direction: column; align-items: center;">';
        html += '<div>' + (character.name || 'Unnamed Character') + '</div>';
        if (journeyActive && roleDisplay) {
          html += '<div class="nav-role-subtitle">' + roleDisplay + '</div>';
        }
        html += '</button>';
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
