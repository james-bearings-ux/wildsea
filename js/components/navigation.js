/**
 * Navigation bar component for character/ship switching
 *
 * Renders synchronously from an in-memory crew roster and ship summary supplied
 * by main.js. It performs NO database/cache lookups — the roster is refreshed by
 * the caller only when crew membership or remote data actually changes (see
 * refreshCrewRoster in main.js), keeping the nav off the per-interaction critical path.
 */

import { escapeHtmlContent } from '../utils/escaping.js';

/**
 * Render the navigation bar
 * @param {Object} session - Current session object
 * @param {Map<string, {name: string, journeyRole: string}>} crewRoster - id -> roster entry
 * @param {{name: string, journeyActive: boolean, journeyName: string}|null} shipSummary - active ship summary
 * @param {{onlineCharacterIds: Set<string>, currentUserCharacterId: string|null}} navOnline
 *   - onlineCharacterIds: characters controlled by a signed-in player; currentUserCharacterId: the viewer's own character
 * @returns {string} HTML string for navigation bar
 */
export function renderNavigation(session, crewRoster = new Map(), shipSummary = null, navOnline = {}) {
  const { onlineCharacterIds = new Set(), currentUserCharacterId = null } = navOnline;
  const base = import.meta.env.BASE_URL;
  const journeyActive = !!(shipSummary && shipSummary.journeyActive);
  let html = '<div class="nav-bar split">';

  // Left side: DM and Ship buttons
  html += '<div style="display: flex; gap: 4px; align-items: stretch;">';

  // DM Screen button
  const isDMActive = session.activeView === 'dm-screen';
  const dmActiveClass = isDMActive ? 'nav-button-active' : 'nav-button-inactive';
  html += '<button data-action="switchToDMScreen" class="nav-button ' + dmActiveClass + '">Data</button>';

  if (session.activeShipId) {
    const isActive = session.activeView === 'ship';
    const activeClass = isActive ? 'nav-button-active' : 'nav-button-inactive';
    const journeyName = shipSummary ? shipSummary.journeyName : '';
    const shipName = (shipSummary && shipSummary.name) ? shipSummary.name : 'Ship';

    const shipStackedClass = journeyActive ? ' nav-button-stacked' : '';
    html += '<button data-action="switchToShip" class="nav-button ' + activeClass + shipStackedClass + '">';
    html += '<div>' + escapeHtmlContent(shipName) + '</div>';
    if (journeyActive && journeyName) {
      html += '<div class="nav-journey-subtitle">' + escapeHtmlContent(journeyName) + '</div>';
    }
    html += '</button>';
  } else {
    html += '<button data-action="createNewShip" class="nav-button nav-button-inactive">+ New Ship</button>';
  }

  html += '</div>';

  // Right side: Character buttons and actions
  html += '<div style="display: flex; gap: 4px; align-items: stretch;">';

  // Character buttons
  const allCharIds = session.activeCharacterIds || [];
  if (allCharIds.length > 0) {
    const MAX_VISIBLE_CHARS = 5;
    const nameOf = id => (crewRoster.get(id) ? crewRoster.get(id).name || '' : '');
    const byName = (a, b) => nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: 'base' });
    const roleLabel = entry => entry.journeyRole
      ? entry.journeyRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : '';

    // Inline list: only online players' characters, alpha-sorted, with the current
    // user's character pinned first (so it's always visible within the cap). Can be
    // empty (e.g. the DM is the only one signed in).
    let inlineIds = allCharIds.filter(id => onlineCharacterIds.has(id) && crewRoster.has(id));
    inlineIds.sort(byName);
    if (currentUserCharacterId && inlineIds.includes(currentUserCharacterId)) {
      inlineIds = [currentUserCharacterId, ...inlineIds.filter(id => id !== currentUserCharacterId)];
    }
    const visibleCharIds = inlineIds.slice(0, MAX_VISIBLE_CHARS);

    // Render inline buttons (hidden on mobile via CSS)
    for (let i = 0; i < visibleCharIds.length; i++) {
      const charId = visibleCharIds[i];
      const entry = crewRoster.get(charId);
      // Character is only active if we're in character view AND it's the active character
      const isActive = session.activeView === 'character' && charId === session.activeCharacterId;

      if (entry) {
        const activeClass = isActive ? 'nav-button-active' : 'nav-button-inactive';
        const roleDisplay = roleLabel(entry);

        const charStackedClass = journeyActive ? ' nav-button-stacked' : '';
        html += '<button data-action="switchCharacter" data-params=\'{"characterId":"' + charId + '"}\' ';
        html += 'class="nav-button nav-char-inline ' + activeClass + charStackedClass + '">';
        html += '<div>' + escapeHtmlContent(entry.name || 'Unnamed Character') + '</div>';
        if (journeyActive && roleDisplay) {
          html += '<div class="nav-role-subtitle">' + escapeHtmlContent(roleDisplay) + '</div>';
        }
        html += '</button>';
      }
    }

    // "Characters" dropdown with ALL characters, alpha-sorted (unaffected by presence).
    const sortedAllIds = allCharIds.slice().sort(byName);
    const isAnyCharActive = session.activeView === 'character';
    // On desktop, the dropdown is only active when the current character isn't shown
    // as an inline tab (inline tabs show their own active state).
    // On mobile there are no inline tabs, so the dropdown should always show active — handled via CSS.
    const isKeyCharActive = isAnyCharActive && visibleCharIds.includes(session.activeCharacterId);
    const charsActiveClass = (isAnyCharActive && !isKeyCharActive) ? 'nav-button-active' : 'nav-button-inactive';
    const charsMobileClass = isAnyCharActive ? ' nav-chars-any-active' : '';

    html += '<div class="nav-dropdown-container nav-chars-dropdown">';
    html += '<button data-action="toggleCharacterDropdown" class="nav-button ' + charsActiveClass + charsMobileClass + '">Characters ▾</button>';
    html += '<div class="nav-dropdown-menu" id="characterDropdown" style="display: none;">';

    for (let i = 0; i < sortedAllIds.length; i++) {
      const charId = sortedAllIds[i];
      const entry = crewRoster.get(charId);
      const isActive = session.activeView === 'character' && charId === session.activeCharacterId;

      if (entry) {
        const roleDisplay = roleLabel(entry);

        html += '<button data-action="switchCharacter" data-params=\'{"characterId":"' + charId + '"}\' ';
        html += 'class="nav-dropdown-item' + (isActive ? ' active' : '') + '">';
        html += '<div>' + escapeHtmlContent(entry.name || 'Unnamed Character') + '</div>';
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
