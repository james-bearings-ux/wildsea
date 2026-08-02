/**
 * Players panel (DM screen → Players tab, DM-only)
 *
 * Lets the DM associate each player (by login email) with a character. This
 * mapping + presence drives the dashboard's "pin online players to the top".
 * Backed by js/state/players.js (player_characters table, DM-only RLS).
 */

import { escapeHtmlAttr, escapeHtmlContent, createDataParams } from '../utils/escaping.js';

/**
 * @param {Array} players - rows { id, email, character_id }
 * @param {Array} characters - session characters (each { id, name })
 * @param {string} userRole - 'dm' | 'player'
 * @param {Set<string>} onlineEmails - lowercased emails currently online
 * @returns {string} HTML string
 */
export function renderPlayersPanel(players = [], characters = [], userRole = 'player', onlineEmails = new Set()) {
  // DM-only tab; render nothing for players (belt-and-suspenders — the tab button
  // and route are already DM-gated).
  if (userRole !== 'dm') return '';

  const sortedChars = characters.slice().sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

  let html = '<div class="players-panel">';

  // Add-player row
  html += '<div class="players-add">';
  html += '<input type="email" id="addPlayerEmail" class="players-add-input" placeholder="player@example.com" autocomplete="off">';
  html += '<button class="players-add-btn" data-action="addPlayer">+ Add player</button>';
  html += '</div>';

  if (!players.length) {
    html += '<div class="res-empty">No players yet. Add a player\'s login email, then assign their character.</div>';
    html += '</div>';
    return html;
  }

  html += '<div class="dash-scroll"><table class="dash-table players-table">';
  html += '<thead><tr><th>Player (email)</th><th>Character</th><th>Online</th><th></th></tr></thead><tbody>';

  for (const p of players) {
    const online = onlineEmails.has((p.email || '').toLowerCase());
    html += '<tr>';
    html += '<td class="players-email">' + escapeHtmlContent(p.email || '') + '</td>';

    // Character <select>
    html += '<td><select class="players-select" data-action="updatePlayerCharacter" ' + createDataParams({ id: p.id }) + '>';
    html += '<option value=""' + (!p.character_id ? ' selected' : '') + '>— none —</option>';
    for (const c of sortedChars) {
      const sel = c.id === p.character_id ? ' selected' : '';
      html += '<option value="' + escapeHtmlAttr(c.id) + '"' + sel + '>' + escapeHtmlContent(c.name || 'Unnamed Character') + '</option>';
    }
    html += '</select></td>';

    html += '<td>' + (online ? '<span class="dash-online-dot" title="Online"></span>' : '') + '</td>';

    html += '<td><button class="players-remove" title="Remove player" ' + createDataParams({ id: p.id }) + ' data-action="removePlayer">✕</button></td>';
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  html += '</div>';
  return html;
}
