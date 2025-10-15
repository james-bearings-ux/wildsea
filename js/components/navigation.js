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
  let html = '<div class="split" style="background: #000000; color: white; padding: 12px 20px; border-bottom: 2px solid #374151;">';

  // Left side: Ship button
  html += '<div style="display: flex; gap: 16px; align-items: center;">';

  if (session.activeShipId) {
    const ship = loadShip(session.activeShipId);
    const isActive = session.activeView === 'ship';
    const bgColor = isActive ? '#FFFFFF' : '#374151';
    const textColor = isActive ? '#000000' : '#FFFFFF';
    html += '<button data-action="switchToShip" style="background: ' + bgColor + '; color: ' + textColor + '; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px; font-weight: ' + (isActive ? '600' : '400') + ';">';
    html += ship ? (ship.name || 'Ship') : 'Ship';
    html += '</button>';
  } else {
    html += '<button data-action="createNewShip" style="background: #374151; color: #FFFFFF; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px;">+ New Ship</button>';
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
        const bgColor = isActive ? '#FFFFFF' : '#374151';
        const textColor = isActive ? '#000000' : '#FFFFFF';
        html += '<div style="display: flex; gap: 8px; align-items: center; background: ' + bgColor + '; padding: 8px 12px; border-radius: 4px;">';
        html += '<button data-action="switchCharacter" data-params=\'{"characterId":"' + charId + '"}\' ';
        html += 'style="background: transparent; color: ' + textColor + '; padding: 0; border: none; cursor: pointer; font-size: 14px; font-weight: ' + (isActive ? '600' : '400') + ';">';
        html += character.name || 'Unnamed Character';
        html += '</button>';
        html += '<button data-action="removeCharacter" data-params=\'{"characterId":"' + charId + '"}\' ';
        html += 'style="background: transparent; color: #EF4444; padding: 0 4px; border: none; cursor: pointer; font-size: 16px; line-height: 1;" ';
        html += 'title="Remove from crew">';
        html += '×';
        html += '</button>';
        html += '</div>';
      }
    }
  }

  // Create character button
  html += '<button data-action="createNewCharacter" style="background: #374151; color: #FFFFFF; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px;">';
  html += '+ New Character';
  html += '</button>';

  // Import character button
  html += '<button data-action="importCharacter" style="background: #374151; color: #FFFFFF; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px;">';
  html += '↓ Import Character';
  html += '</button>';

  html += '</div>';
  html += '</div>';

  return html;
}
