/**
 * Ship faction reputation rendering component
 * Shows factions with checkbox reputation tracking (0-3)
 */

import { escapeHtmlAttr, createDataParams } from '../utils/escaping.js';

/**
 * Render faction reputation checkboxes (1, 2, 3)
 * Similar to rating checkboxes but for reputation levels
 * @param {Object} faction - Faction object with id and reputation
 * @param {boolean} isEditable - Whether checkboxes should be editable (DM only)
 * @returns {string} HTML string for reputation checkboxes
 */
function renderReputationCheckboxes(faction, isEditable = true) {
  let html = '<div class="faction-reputation-checkboxes">';

  // Three checkboxes for reputation levels 1, 2, 3
  for (let level = 1; level <= 3; level++) {
    const isChecked = faction.reputation >= level;
    html += `<input type="checkbox" `;
    html += `${isChecked ? 'checked' : ''} `;
    if (isEditable) {
      html += 'data-action="updateFactionReputation" ';
      html += createDataParams({ id: faction.id, reputation: level }) + ' ';
    } else {
      html += 'disabled ';
    }
    html += 'class="faction-reputation-checkbox">';
  }

  html += '</div>';
  return html;
}

/**
 * Render faction reputation management interface
 * @param {Object} ship - Ship object
 * @param {string} userRole - Current user's role ('dm' or 'player')
 * @returns {string} HTML string
 */
export function renderShipFactions(ship, userRole = 'player') {
  const factions = ship.factions || [];
  const isDM = userRole === 'dm';

  let html = '<div>';

  html += '<h2 class="section-header">Faction Reputation</h2>';

  html += '<div class="flex-col-gap">';

  // Render each faction item
  for (let i = 0; i < factions.length; i++) {
    const faction = factions[i];
    html += '<div class="faction-row">';
    html += '<input type="text" ';
    html += `value="${escapeHtmlAttr(faction.name)}" `;
    html += 'placeholder="Faction name..." ';
    if (isDM) {
      html += 'data-action="updateFactionName" ';
      html += createDataParams({ id: faction.id }) + ' ';
    } else {
      html += 'readonly ';
    }
    html += 'class="faction-input">';
    html += renderReputationCheckboxes(faction, isDM);

    // Only show delete button for DMs
    if (isDM) {
      html += '<button data-action="removeFaction" ';
      html += createDataParams({ id: faction.id }) + ' ';
      html += 'class="btn-tertiary">✕</button>';
    }
    html += '</div>';
  }

  // Add new faction button (DM only)
  if (isDM) {
    html += '<button class="btn-subtle" data-action="addFaction">+ New Faction</button>';
  }

  html += '</div>';
  html += '</div>';

  return html;
}
