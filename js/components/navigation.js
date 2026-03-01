/**
 * Navigation bar component for character/ship switching
 */

import { loadCharacter } from '../state/character.js';
import { loadShip } from '../state/ship.js';
import { loadCharacterCached, loadShipCached } from '../cache/supabase-cache.js';
import { escapeHtmlContent } from '../utils/escaping.js';

/**
 * Render the navigation bar
 * @param {Object} session - Current session object
 * @returns {Promise<string>} HTML string for navigation bar
 */
export async function renderNavigation(session) {
  const base = import.meta.env.BASE_URL;
  let html = '<div class="nav-bar split">';

  // Left side: DM and Ship buttons
  html += '<div style="display: flex; gap: 4px; align-items: stretch;">';

  // DM Screen button
  const isDMActive = session.activeView === 'dm-screen';
  const dmActiveClass = isDMActive ? 'nav-button-active' : 'nav-button-inactive';
  html += '<button data-action="switchToDMScreen" class="nav-button ' + dmActiveClass + '">DM</button>';

  if (session.activeShipId) {
    const ship = await loadShipCached(session.activeShipId, loadShip);
    const isActive = session.activeView === 'ship';
    const activeClass = isActive ? 'nav-button-active' : 'nav-button-inactive';
    const journeyActive = ship && ship.journey && ship.journey.active;
    const journeyName = ship && ship.journey ? ship.journey.name : '';

    const shipStackedClass = journeyActive ? ' nav-button-stacked' : '';
    html += '<button data-action="switchToShip" class="nav-button ' + activeClass + shipStackedClass + '">';
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
  html += '<div style="display: flex; gap: 4px; align-items: stretch;">';

  // Character buttons
  if (session.activeCharacterIds.length > 0) {
    // Load ship to check journey status
    const ship = session.activeShipId ? await loadShipCached(session.activeShipId, loadShip) : null;
    const journeyActive = ship && ship.journey && ship.journey.active;

    const MAX_VISIBLE_CHARS = 5;
    const visibleCharIds = session.activeCharacterIds.slice(0, MAX_VISIBLE_CHARS);

    // Render first 5 characters as inline buttons (hidden on mobile via CSS)
    for (let i = 0; i < visibleCharIds.length; i++) {
      const charId = visibleCharIds[i];
      const character = await loadCharacterCached(charId, loadCharacter);
      // Character is only active if we're in character view AND it's the active character
      const isActive = session.activeView === 'character' && charId === session.activeCharacterId;

      if (character) {
        const activeClass = isActive ? 'nav-button-active' : 'nav-button-inactive';
        const roleDisplay = character.journeyRole
          ? character.journeyRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : '';

        const charStackedClass = journeyActive ? ' nav-button-stacked' : '';
        html += '<button data-action="switchCharacter" data-params=\'{"characterId":"' + charId + '"}\' ';
        html += 'class="nav-button nav-char-inline ' + activeClass + charStackedClass + '">';
        html += '<div>' + escapeHtmlContent(character.name || 'Unnamed Character') + '</div>';
        if (journeyActive && roleDisplay) {
          html += '<div class="nav-role-subtitle">' + escapeHtmlContent(roleDisplay) + '</div>';
        }
        html += '</button>';
      }
    }

    // "Characters" dropdown with ALL characters (visible on all viewports)
    const isAnyCharActive = session.activeView === 'character';
    // On desktop, the dropdown is only active when the current character isn't a key character
    // (key characters have their own inline tab showing the active state).
    // On mobile there are no inline tabs, so the dropdown should always show active — handled via CSS.
    const isKeyCharActive = isAnyCharActive && visibleCharIds.includes(session.activeCharacterId);
    const charsActiveClass = (isAnyCharActive && !isKeyCharActive) ? 'nav-button-active' : 'nav-button-inactive';
    const charsMobileClass = isAnyCharActive ? ' nav-chars-any-active' : '';

    html += '<div class="nav-dropdown-container nav-chars-dropdown">';
    html += '<button data-action="toggleCharacterDropdown" class="nav-button ' + charsActiveClass + charsMobileClass + '">Characters ▾</button>';
    html += '<div class="nav-dropdown-menu" id="characterDropdown" style="display: none;">';

    for (let i = 0; i < session.activeCharacterIds.length; i++) {
      const charId = session.activeCharacterIds[i];
      const character = await loadCharacterCached(charId, loadCharacter);
      const isActive = session.activeView === 'character' && charId === session.activeCharacterId;

      if (character) {
        const roleDisplay = character.journeyRole
          ? character.journeyRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
          : '';

        html += '<button data-action="switchCharacter" data-params=\'{"characterId":"' + charId + '"}\' ';
        html += 'class="nav-dropdown-item' + (isActive ? ' active' : '') + '">';
        html += '<div>' + escapeHtmlContent(character.name || 'Unnamed Character') + '</div>';
        if (journeyActive && roleDisplay) {
          html += '<div class="nav-dropdown-role">' + escapeHtmlContent(roleDisplay) + '</div>';
        }
        html += '</button>';
      }
    }

    html += '</div>';
    html += '</div>';
  }

  // Create character button
  html += '<button data-action="createNewCharacter" class="nav-button nav-button-minor nav-button-icon" title="New Character" aria-label="New Character">';
  html += '<img src="' + base + 'images/person-add.svg" alt="" width="20" height="20">';
  html += '</button>';

  // Import character button
  html += '<button data-action="importCharacter" class="nav-button nav-button-minor nav-button-icon" title="Import Character" aria-label="Import Character">';
  html += '<img src="' + base + 'images/upload.svg" alt="" width="20" height="20">';
  html += '</button>';

  html += '</div>';
  html += '</div>';

  return html;
}
