/**
 * Resources panel component for DM screen
 * Aggregates resources from all session characters into a single sortable table.
 */

import { escapeHtmlContent, createDataParams } from '../utils/escaping.js';

const RESOURCE_TYPE_LABELS = {
  charts: 'Chart',
  salvage: 'Salvage',
  specimens: 'Specimen',
  whispers: 'Whisper'
};

/**
 * Build sort header <th> element
 */
function renderSortHeader(label, col, sortBy, sortDir) {
  const isActive = sortBy === col;
  const arrow = isActive ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
  const activeClass = isActive ? ' npc-th-active' : '';
  return `<th class="npc-th npc-th-sortable${activeClass}" data-action="sortResourceTable" ${createDataParams({ col })}>${label}${arrow}</th>`;
}

/**
 * Render aggregated resources table for the DM screen Resources tab.
 * @param {Array} characters - All session character objects
 * @param {string} sortBy - Sort column: 'name' | 'type' | 'character'
 * @param {string} sortDir - Sort direction: 'asc' | 'desc'
 * @returns {string} HTML string
 */
export function renderResourcesPanel(characters, sortBy = 'character', sortDir = 'asc') {
  const rows = [];

  for (const character of characters) {
    if (!character.resources) continue;
    for (const typeKey of ['charts', 'salvage', 'specimens', 'whispers']) {
      const items = character.resources[typeKey] || [];
      for (const item of items) {
        if (!item.name || item.used) continue;
        rows.push({
          name: item.name,
          type: RESOURCE_TYPE_LABELS[typeKey],
          character: character.name || 'Unnamed Character'
        });
      }
    }
  }

  rows.sort((a, b) => {
    const cmp = (a[sortBy] || '').localeCompare(b[sortBy] || '');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  let html = '';

  if (rows.length === 0) {
    html += '<p class="res-empty">No resources found across session characters.</p>';
    return html;
  }

  html += '<div class="npc-table-wrapper">';
  html += '<table class="npc-table">';
  html += '<thead><tr>';
  html += renderSortHeader('Name', 'name', sortBy, sortDir);
  html += renderSortHeader('Type', 'type', sortBy, sortDir);
  html += renderSortHeader('Character', 'character', sortBy, sortDir);
  html += '</tr></thead>';

  html += '<tbody>';
  for (const row of rows) {
    html += '<tr class="npc-row">';
    html += `<td class="npc-td npc-td-name">${escapeHtmlContent(row.name)}</td>`;
    html += `<td class="npc-td">${escapeHtmlContent(row.type)}</td>`;
    html += `<td class="npc-td">${escapeHtmlContent(row.character)}</td>`;
    html += '</tr>';
  }
  html += '</tbody>';

  html += '</table>';
  html += '</div>';

  return html;
}
