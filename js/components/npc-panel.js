/**
 * NPC panel component
 * Single role-aware table for viewing and editing synced NPC data.
 * DMs see all NPCs with inline editing and revealed toggle.
 * Players see only revealed NPCs, read-only.
 */

import { escapeHtmlAttr, escapeHtmlContent, createDataParams } from '../utils/escaping.js';

// Inline SVG so fill="currentColor" inherits from button's CSS color (theme-aware)
const visibilityIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor"><path d="M607.5-372.5Q660-425 660-500t-52.5-127.5Q555-680 480-680t-127.5 52.5Q300-575 300-500t52.5 127.5Q405-320 480-320t127.5-52.5Zm-204-51Q372-455 372-500t31.5-76.5Q435-608 480-608t76.5 31.5Q588-545 588-500t-31.5 76.5Q525-392 480-392t-76.5-31.5ZM214-281.5Q94-363 40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200q-146 0-266-81.5ZM480-500Zm207.5 160.5Q782-399 832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280q113 0 207.5-59.5Z"/></svg>`;

const STATUS_OPTIONS = ['alive', 'dead', 'missing', 'unknown'];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Returns true if the NPC was first seen (or created) within the past 30 days.
 * first_seen is a text date string from the sync; falls back to created_at for manual adds.
 */
function isNewNPC(npc) {
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  if (npc.first_seen) {
    const d = Date.parse(npc.first_seen);
    if (!isNaN(d)) return d >= cutoff;
  }
  if (npc.created_at) {
    const d = Date.parse(npc.created_at);
    if (!isNaN(d)) return d >= cutoff;
  }
  return false;
}

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

  // Header: search bar + count + add button (DM only)
  html += '<div class="npc-panel-header">';
  html += `<input type="text" class="npc-search" placeholder="Search NPCs…" value="${escapeHtmlAttr(search)}" data-action="searchNPCs" aria-label="Search NPCs">`;
  html += `<span class="npc-count">${filtered.length} NPC${filtered.length !== 1 ? 's' : ''}`;
  if (search) html += ` matching "${escapeHtmlContent(search)}"`;
  html += '</span>';
  if (isDM) {
    html += '<button class="btn-secondary npc-add-btn" data-action="addNPC">+ Add NPC</button>';
  }
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
    html += `<th class="npc-th npc-th-eye" title="Visible to players">${visibilityIcon}</th>`;
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
      html += `<button class="${eyeClass}" title="${eyeTitle}" data-action="toggleNPCRevealed" ${createDataParams({ id: npc.id })}>${visibilityIcon}</button>`;
      html += '</td>';
    }

    // Name
    const newBadge = isNewNPC(npc) ? '<span class="npc-new-badge">NEW</span>' : '';
    if (isDM) {
      html += `<td class="npc-td npc-td-name"><div class="npc-name-cell"><input type="text" class="npc-input" value="${escapeHtmlAttr(npc.name || '')}" placeholder="Name" data-action="updateNPCField" ${createDataParams({ id: npc.id, field: 'name' })}>${newBadge}</div></td>`;
    } else {
      html += `<td class="npc-td npc-td-name">${escapeHtmlContent(npc.name || '')}${newBadge}</td>`;
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
