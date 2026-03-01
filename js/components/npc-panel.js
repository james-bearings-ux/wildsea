/**
 * NPC panel component
 * Single role-aware table for viewing and editing synced NPC data.
 * DMs see all NPCs with inline editing and revealed toggle.
 * Players see only revealed NPCs, read-only.
 */

import { escapeHtmlAttr, escapeHtmlContent, createDataParams } from '../utils/escaping.js';

const STATUS_OPTIONS = ['alive', 'dead', 'missing', 'unknown'];

const STATUS_LABELS = {
  alive: 'Alive',
  dead: 'Dead',
  missing: 'Missing',
  unknown: 'Unknown',
};

/**
 * Render a sortable column header cell
 */
function renderSortHeader(label, field, sortBy, sortDir) {
  const isActive = sortBy === field;
  const arrow = isActive ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
  const activeClass = isActive ? ' npc-th-active' : '';
  return `<th class="npc-th npc-th-sortable${activeClass}" data-action="sortNPCTable" ${createDataParams({ field })}>${label}${arrow}</th>`;
}

/**
 * Render NPC panel — single component, role-aware
 * @param {Array} npcs - Array of NPC objects from Supabase
 * @param {string} userRole - 'dm' or 'player'
 * @param {Object} state - { sortBy, sortDir, search }
 * @returns {string} HTML string
 */
export function renderNPCPanel(npcs, userRole, { sortBy = 'name', sortDir = 'asc', search = '' } = {}) {
  const isDM = userRole === 'dm';

  // Filter
  const q = search.toLowerCase();
  const filtered = npcs.filter(npc => {
    if (!q) return true;
    return (npc.name || '').toLowerCase().includes(q)
      || (npc.location || '').toLowerCase().includes(q)
      || (npc.faction || '').toLowerCase().includes(q)
      || (npc.status || '').toLowerCase().includes(q)
      || (npc.description || '').toLowerCase().includes(q);
  });

  // Sort
  filtered.sort((a, b) => {
    const av = (a[sortBy] || '').toString().toLowerCase();
    const bv = (b[sortBy] || '').toString().toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  let html = '<div class="npc-panel">';

  // Header: search bar + count
  html += '<div class="npc-panel-header">';
  html += `<input type="text" class="npc-search" placeholder="Search NPCs…" value="${escapeHtmlAttr(search)}" data-action="searchNPCs" aria-label="Search NPCs">`;
  html += `<span class="npc-count">${filtered.length} NPC${filtered.length !== 1 ? 's' : ''}`;
  if (search) html += ` matching "${escapeHtmlContent(search)}"`;
  html += '</span>';
  html += '</div>';

  if (npcs.length === 0) {
    html += '<div class="npc-empty">';
    html += isDM
      ? 'No NPCs synced yet. Run the NPC sync workflow to populate from Notion.'
      : 'No NPCs to display yet.';
    html += '</div></div>';
    return html;
  }

  if (filtered.length === 0) {
    html += '<div class="npc-empty">No NPCs match your search.</div>';
    html += '</div>';
    return html;
  }

  html += '<div class="npc-table-wrapper">';
  html += '<table class="npc-table">';
  html += '<thead><tr>';

  if (isDM) {
    html += '<th class="npc-th npc-th-eye" title="Visible to players">👁</th>';
  }
  html += renderSortHeader('Name', 'name', sortBy, sortDir);
  html += renderSortHeader('Location', 'location', sortBy, sortDir);
  html += renderSortHeader('Faction', 'faction', sortBy, sortDir);
  html += renderSortHeader('Status', 'status', sortBy, sortDir);
  html += '<th class="npc-th npc-th-description">Description</th>';
  if (isDM) {
    html += '<th class="npc-th npc-th-actions"></th>';
  }

  html += '</tr></thead>';
  html += '<tbody>';

  for (const npc of filtered) {
    const rowClass = isDM && !npc.revealed ? 'npc-row npc-row-hidden' : 'npc-row';
    html += `<tr class="${rowClass}">`;

    // Revealed toggle (DM only)
    if (isDM) {
      const eyeClass = npc.revealed ? 'npc-eye npc-eye-on' : 'npc-eye npc-eye-off';
      const eyeTitle = npc.revealed
        ? 'Visible to players — click to hide'
        : 'Hidden from players — click to reveal';
      html += '<td class="npc-td npc-td-eye">';
      html += `<button class="${eyeClass}" title="${eyeTitle}" data-action="toggleNPCRevealed" ${createDataParams({ id: npc.id })}>👁</button>`;
      html += '</td>';
    }

    // Name
    if (isDM) {
      html += `<td class="npc-td npc-td-name"><input type="text" class="npc-input" value="${escapeHtmlAttr(npc.name || '')}" placeholder="Name" data-action="updateNPCField" ${createDataParams({ id: npc.id, field: 'name' })}></td>`;
    } else {
      html += `<td class="npc-td npc-td-name">${escapeHtmlContent(npc.name || '')}</td>`;
    }

    // Location
    if (isDM) {
      html += `<td class="npc-td"><input type="text" class="npc-input" value="${escapeHtmlAttr(npc.location || '')}" placeholder="Location" data-action="updateNPCField" ${createDataParams({ id: npc.id, field: 'location' })}></td>`;
    } else {
      html += `<td class="npc-td">${escapeHtmlContent(npc.location || '')}</td>`;
    }

    // Faction
    if (isDM) {
      html += `<td class="npc-td"><input type="text" class="npc-input" value="${escapeHtmlAttr(npc.faction || '')}" placeholder="Faction" data-action="updateNPCField" ${createDataParams({ id: npc.id, field: 'faction' })}></td>`;
    } else {
      html += `<td class="npc-td">${escapeHtmlContent(npc.faction || '')}</td>`;
    }

    // Status
    if (isDM) {
      html += '<td class="npc-td npc-td-status">';
      html += `<select class="npc-status-select" data-action="updateNPCField" ${createDataParams({ id: npc.id, field: 'status' })}>`;
      for (const s of STATUS_OPTIONS) {
        html += `<option value="${s}"${npc.status === s ? ' selected' : ''}>${STATUS_LABELS[s]}</option>`;
      }
      html += '</select>';
      html += '</td>';
    } else {
      const statusClass = `npc-status-${npc.status || 'unknown'}`;
      html += `<td class="npc-td npc-td-status"><span class="npc-status-badge ${statusClass}">${escapeHtmlContent(STATUS_LABELS[npc.status] || 'Unknown')}</span></td>`;
    }

    // Description
    if (isDM) {
      html += `<td class="npc-td npc-td-description"><textarea class="npc-textarea" placeholder="Description" data-action="updateNPCField" ${createDataParams({ id: npc.id, field: 'description' })}>${escapeHtmlContent(npc.description || '')}</textarea></td>`;
    } else {
      html += `<td class="npc-td npc-td-description">${escapeHtmlContent(npc.description || '')}</td>`;
    }

    // Delete (DM only)
    if (isDM) {
      html += '<td class="npc-td npc-td-actions">';
      html += `<button class="btn-tertiary" data-action="deleteNPC" ${createDataParams({ id: npc.id })} title="Delete NPC">✕</button>`;
      html += '</td>';
    }

    html += '</tr>';
  }

  html += '</tbody></table>';
  html += '</div>'; // npc-table-wrapper
  html += '</div>'; // npc-panel
  return html;
}
