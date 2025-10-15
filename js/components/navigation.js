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
  let html = '<div style="background: #1F2937; color: white; padding: 12px 20px; display: flex; gap: 16px; align-items: center; border-bottom: 2px solid #374151;">';

  // Ship button
  if (session.activeShipId) {
    const ship = loadShip(session.activeShipId);
    const isActive = session.activeView === 'ship';
    html += '<button data-action="switchToShip" style="background: ' + (isActive ? '#3B82F6' : '#374151') + '; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px;">';
    html += ship ? (ship.name || 'Ship') : 'Ship';
    html += '</button>';
  } else {
    html += '<button data-action="createNewShip" style="background: #10B981; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px;">+ New Ship</button>';
  }

  html += '<div style="width: 1px; height: 24px; background: #4B5563;"></div>';

  // Character buttons
  if (session.activeCharacterIds.length > 0) {
    for (let i = 0; i < session.activeCharacterIds.length; i++) {
      const charId = session.activeCharacterIds[i];
      const character = loadCharacter(charId);
      const isActive = charId === session.activeCharacterId;

      if (character) {
        html += '<div style="display: flex; gap: 8px; align-items: center; background: ' + (isActive ? '#3B82F6' : '#374151') + '; padding: 8px 12px; border-radius: 4px;">';
        html += '<button data-action="switchCharacter" data-params=\'{"characterId":"' + charId + '"}\' ';
        html += 'style="background: transparent; color: white; padding: 0; border: none; cursor: pointer; font-size: 14px;">';
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

  html += '<div style="width: 1px; height: 24px; background: #4B5563;"></div>';

  // Create character button
  html += '<button data-action="createNewCharacter" style="background: #10B981; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px;">';
  html += '+ New Character';
  html += '</button>';

  // Import character button
  html += '<button data-action="importCharacter" style="background: #6366F1; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px;">';
  html += '↓ Import Character';
  html += '</button>';

  html += '</div>';

  return html;
}
