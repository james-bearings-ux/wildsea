/**
 * Ship faction reputation rendering component
 * Shows factions with reputation scale from -3 to +3
 * Scale: Nemesis (-3), Attack on Sight (-2), Dislike (-1), Neutral (0),
 *        Favored (+1), Friends (+2), Family (+3), Unknown (null)
 */

import { escapeHtmlAttr, createDataParams } from '../utils/escaping.js';

/**
 * Reputation scale mapping from numerical value to alias
 * Sorted from highest (+3) to lowest (-3), with Unknown (null) at end
 */
const REPUTATION_SCALE = [
  { value: 3, alias: 'Family' },
  { value: 2, alias: 'Friends' },
  { value: 1, alias: 'Favored' },
  { value: 0, alias: 'Neutral' },
  { value: -1, alias: 'Dislike' },
  { value: -2, alias: 'Attack on Sight' },
  { value: -3, alias: 'Nemesis' },
  { value: null, alias: 'Unknown' }
];

/**
 * Get alias for a reputation value
 * @param {number|null} reputation - Reputation value (-3 to +3) or null
 * @returns {string} Alias string
 */
function getReputationAlias(reputation) {
  const entry = REPUTATION_SCALE.find(r => r.value === reputation);
  return entry ? entry.alias : 'Unknown';
}

/**
 * Render reputation display for players (read-only alias text)
 * @param {Object} faction - Faction object with id and reputation
 * @returns {string} HTML string for reputation display
 */
function renderReputationDisplay(faction) {
  const alias = getReputationAlias(faction.reputation);
  return `<span class="faction-reputation-display">${escapeHtmlAttr(alias)}</span>`;
}

/**
 * Render reputation dropdown for DMs (editable)
 * @param {Object} faction - Faction object with id and reputation
 * @returns {string} HTML string for reputation dropdown
 */
function renderReputationDropdown(faction) {
  let html = '<select class="faction-reputation-select" ';
  html += 'data-action="updateFactionReputation" ';
  html += createDataParams({ id: faction.id }) + '>';

  for (const { value, alias } of REPUTATION_SCALE) {
    const isSelected = faction.reputation === value;
    const optionValue = value === null ? 'null' : value;
    html += `<option value="${optionValue}" ${isSelected ? 'selected' : ''}>`;
    html += escapeHtmlAttr(alias);
    html += '</option>';
  }

  html += '</select>';
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
    html += isDM ? renderReputationDropdown(faction) : renderReputationDisplay(faction);

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
