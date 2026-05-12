/**
 * Aspects panel component for DM screen
 * Displays all available character aspects from game data with filters
 * and sortable columns. Read-only reference — not player-modified data.
 */

import { escapeHtmlContent, createDataParams } from '../utils/escaping.js';
import { getGameData } from '../data/loader.js';

function renderSortHeader(label, col, sortBy, sortDir) {
  const isActive = sortBy === col;
  const arrow = isActive ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
  const activeClass = isActive ? ' npc-th-active' : '';
  return `<th class="npc-th npc-th-sortable${activeClass}" data-action="sortAspectTable" ${createDataParams({ col })}>${label}${arrow}</th>`;
}

/**
 * Render the aspects reference panel.
 * @param {Object} filters - { bloodline, origin, post } — empty string = no filter
 * @param {string} sortBy - Column to sort by: 'name' | 'source' | 'type' | 'track'
 * @param {string} sortDir - 'asc' | 'desc'
 * @returns {string} HTML string
 */
export function renderAspectsPanel(filters = {}, sortBy = 'source', sortDir = 'asc') {
  const gameData = getGameData();
  const aspectsData = gameData.aspects || {};
  const bloodlines = gameData.bloodlines || [];
  const origins = gameData.origins || [];
  const posts = gameData.posts || [];

  // Build source → category lookup
  const categoryOf = {};
  bloodlines.forEach(b => categoryOf[b] = 'Bloodline');
  origins.forEach(o => categoryOf[o] = 'Origin');
  posts.forEach(p => categoryOf[p] = 'Post');

  // Flatten all aspects into rows
  let rows = [];
  for (const [source, aspects] of Object.entries(aspectsData)) {
    for (const aspect of aspects) {
      rows.push({
        name: aspect.name || '',
        type: aspect.type || '',
        track: aspect.track ?? '',
        description: aspect.description || '',
        source,
        category: categoryOf[source] || ''
      });
    }
  }

  // Apply filters — selected sources from any category are OR'd together
  const { bloodline = '', origin = '', post = '' } = filters;
  const activeFilters = [bloodline, origin, post].filter(Boolean);
  if (activeFilters.length > 0) {
    const allowed = new Set(activeFilters);
    rows = rows.filter(r => allowed.has(r.source));
  }

  // Sort — numeric for track, lexicographic for everything else
  rows.sort((a, b) => {
    if (sortBy === 'track') {
      const cmp = (Number(a.track) || 0) - (Number(b.track) || 0);
      return sortDir === 'asc' ? cmp : -cmp;
    }
    const cmp = String(a[sortBy] || '').localeCompare(String(b[sortBy] || ''));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // --- Render ---
  let html = '';

  // Filter dropdowns
  html += '<div class="aspects-filters">';

  html += `<select class="aspects-filter-select" data-action="filterAspects" ${createDataParams({ filterType: 'bloodline' })}>`;
  html += '<option value="">Bloodlines</option>';
  for (const b of bloodlines) {
    html += `<option value="${escapeHtmlContent(b)}"${filters.bloodline === b ? ' selected' : ''}>${escapeHtmlContent(b)}</option>`;
  }
  html += '</select>';

  html += `<select class="aspects-filter-select" data-action="filterAspects" ${createDataParams({ filterType: 'origin' })}>`;
  html += '<option value="">Origins</option>';
  for (const o of origins) {
    html += `<option value="${escapeHtmlContent(o)}"${filters.origin === o ? ' selected' : ''}>${escapeHtmlContent(o)}</option>`;
  }
  html += '</select>';

  html += `<select class="aspects-filter-select" data-action="filterAspects" ${createDataParams({ filterType: 'post' })}>`;
  html += '<option value="">Posts</option>';
  for (const p of posts) {
    html += `<option value="${escapeHtmlContent(p)}"${filters.post === p ? ' selected' : ''}>${escapeHtmlContent(p)}</option>`;
  }
  html += '</select>';

  html += `<span class="aspects-count">${rows.length} aspect${rows.length !== 1 ? 's' : ''}</span>`;
  html += '</div>';

  if (rows.length === 0) {
    html += '<p class="res-empty">No aspects match the current filters.</p>';
    return html;
  }

  html += '<div class="npc-table-wrapper">';
  html += '<table class="npc-table">';
  html += '<thead><tr>';
  html += renderSortHeader('Aspect Name', 'name', sortBy, sortDir);
  html += renderSortHeader('Type', 'type', sortBy, sortDir);
  html += '<th class="npc-th npc-th-description">Description</th>';
  html += renderSortHeader('Track', 'track', sortBy, sortDir);
  html += renderSortHeader('Source', 'source', sortBy, sortDir);
  html += '</tr></thead>';

  html += '<tbody>';
  for (const row of rows) {
    html += '<tr class="npc-row">';
    html += `<td class="npc-td npc-td-name">${escapeHtmlContent(row.name)}</td>`;
    html += `<td class="npc-td">${escapeHtmlContent(row.type)}</td>`;
    html += `<td class="npc-td npc-td-description">${escapeHtmlContent(row.description)}</td>`;
    html += `<td class="npc-td aspects-td-track">${escapeHtmlContent(String(row.track))}</td>`;
    html += `<td class="npc-td">${escapeHtmlContent(row.source)}</td>`;
    html += '</tr>';
  }
  html += '</tbody>';
  html += '</table>';
  html += '</div>';

  return html;
}
