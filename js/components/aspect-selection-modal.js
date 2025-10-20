/**
 * Aspect Selection Modal Component
 * Allows players to search and select aspects from the full aspects list
 */

import { renderSmallTrack } from './aspects.js';
import { highlightDamageTypesInDescription } from './damage-type-selector.js';

/**
 * Get all aspects from game data as a flat list
 * @param {Object} gameData - Game data object
 * @returns {Array} - Array of all aspects with source metadata
 */
function getAllAspectsFlat(gameData) {
  const allAspects = [];

  // Iterate through all sources (bloodlines, origins, posts)
  for (const [source, aspects] of Object.entries(gameData.aspects)) {
    aspects.forEach(aspect => {
      allAspects.push({
        ...aspect,
        source: source,
        // Determine category based on game data structure
        category: gameData.bloodlines.includes(source) ? 'Bloodline' :
                 gameData.origins.includes(source) ? 'Origin' :
                 gameData.posts.includes(source) ? 'Post' : 'Unknown'
      });
    });
  }

  return allAspects;
}

/**
 * Filter aspects based on search query
 * @param {Array} aspects - List of all aspects
 * @param {string} query - Search query
 * @returns {Array} - Filtered and sorted aspects
 */
function filterAspects(aspects, query) {
  if (!query || query.trim() === '') {
    return aspects.slice(0, 50); // Return first 50 if no query
  }

  const lowerQuery = query.toLowerCase().trim();

  // Score each aspect by relevance
  const scored = aspects.map(aspect => {
    let score = 0;
    const lowerName = aspect.name.toLowerCase();
    const lowerDescription = aspect.description.toLowerCase();
    const lowerSource = aspect.source.toLowerCase();

    // Exact name match - highest priority
    if (lowerName === lowerQuery) {
      score += 1000;
    }
    // Name starts with query
    else if (lowerName.startsWith(lowerQuery)) {
      score += 500;
    }
    // Name contains query
    else if (lowerName.includes(lowerQuery)) {
      score += 200;
    }

    // Source matches
    if (lowerSource.includes(lowerQuery)) {
      score += 100;
    }

    // Description contains query
    if (lowerDescription.includes(lowerQuery)) {
      score += 50;
    }

    // Type matches
    if (aspect.type.toLowerCase().includes(lowerQuery)) {
      score += 30;
    }

    return { aspect, score };
  });

  // Filter out non-matches and sort by score
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.aspect)
    .slice(0, 50); // Limit to 50 results
}

/**
 * Render the aspect selection modal
 * @param {Object} character - Character object
 * @param {Object} gameData - Game data object
 * @param {string} searchQuery - Current search query
 * @param {Object} selectedAspect - Currently selected aspect for preview
 * @returns {string} HTML string
 */
export function renderAspectSelectionModal(character, gameData, searchQuery = '', selectedAspect = null) {
  const allAspects = getAllAspectsFlat(gameData);
  const filteredAspects = filterAspects(allAspects, searchQuery);

  // Auto-select first aspect if none selected
  const aspectToShow = selectedAspect || (filteredAspects[0] || null);

  let html = '<div class="modal-overlay" data-action="closeSelectAspectModal">';
  html += '  <div class="modal-container">';

  // Header
  html += '    <div class="modal-header">';
  html += '      <h2 class="modal-title">Select More Aspects</h2>';
  html += '    </div>';

  // Body
  html += '    <div class="modal-body">';

  // Search box
  html += '      <div style="margin-bottom: 16px;">';
  html += '        <label for="aspect-search-input" style="display: block; margin-bottom: 8px; font-weight: 600;">Search Aspects:</label>';
  html += '        <input type="text" ';
  html += '               id="aspect-search-input" ';
  html += '               class="select-input" ';
  html += '               data-action="searchAspects" ';
  html += `               value="${(searchQuery || '').replace(/"/g, '&quot;')}" `;
  html += '               placeholder="Type to search by name, source, or description..." ';
  html += '               style="width: 100%; padding: 8px 12px;" />';
  html += '      </div>';

  // Results area - two columns
  html += '      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; min-height: 400px;">';

  // Left column - list of results
  html += '        <div style="border: 1px solid #E5E7EB; border-radius: 4px; overflow-y: auto; max-height: 500px;">';

  if (filteredAspects.length === 0) {
    html += '          <div style="padding: 24px; text-align: center; color: #6B7280;">';
    html += searchQuery ? 'No aspects found matching your search.' : 'Start typing to search for aspects.';
    html += '          </div>';
  } else {
    filteredAspects.forEach(aspect => {
      const isSelected = aspectToShow && aspect.name === aspectToShow.name && aspect.source === aspectToShow.source;
      const aspectId = aspect.source + '-' + aspect.name;
      const escapedId = aspectId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      // Check if already selected by character
      const alreadyAdded = character.selectedAspects.some(a => a.id === aspectId);

      html += `        <div class="aspect-search-result ${isSelected ? 'selected' : ''} ${alreadyAdded ? 'disabled' : ''}" `;
      html += `             data-action="selectAspectForAdding" `;
      html += `             data-params='{"aspectId":"${escapedId}"}' `;
      html += `             style="padding: 12px; border-bottom: 1px solid #E5E7EB; cursor: pointer;">`;
      html += `          <div style="font-weight: 600; margin-bottom: 4px;">${aspect.name}</div>`;
      html += `          <div style="font-size: 12px; color: #6B7280;">${aspect.source} • ${aspect.type}</div>`;
      if (alreadyAdded) {
        html += `          <div style="font-size: 12px; color: #A91D3A; margin-top: 4px;">Already added</div>`;
      }
      html += '        </div>';
    });
  }

  html += '        </div>';

  // Right column - preview
  html += '        <div>';

  if (aspectToShow) {
    html += '          <div class="aspect-card" style="height: fit-content;">';
    html += renderSmallTrack(aspectToShow.track);
    html += '            <div class="split">';
    html += `              <div class="aspect-name" style="margin-bottom: 4px;">${aspectToShow.name}</div>`;
    html += `              <div class="aspect-meta">${aspectToShow.source} ${aspectToShow.type}</div>`;
    html += '            </div>';
    html += `            <div class="aspect-description">${highlightDamageTypesInDescription(aspectToShow)}</div>`;
    html += '          </div>';
  } else {
    html += '          <div style="padding: 24px; text-align: center; color: #6B7280; border: 1px solid #E5E7EB; border-radius: 4px;">';
    html += '            Select an aspect to preview';
    html += '          </div>';
  }

  html += '        </div>';

  html += '      </div>'; // End results area

  html += '    </div>'; // End modal body

  // Footer with actions
  html += '    <div class="modal-footer">';
  html += '      <div class="modal-footer-left">';
  html += '      </div>';
  html += '      <div class="modal-footer-right">';
  html += '        <button data-action="closeSelectAspectModal">Cancel</button>';

  // Only show Add button if an aspect is selected and not already added
  if (aspectToShow) {
    const aspectId = aspectToShow.source + '-' + aspectToShow.name;
    const escapedId = aspectId.replace(/'/g, "\\'");
    const alreadyAdded = character.selectedAspects.some(a => a.id === aspectId);

    html += '        <button class="bg-black" ';
    html += `                data-action="addSelectedAspect" `;
    html += `                data-params='{"aspectId":"${escapedId}"}' `;
    html += (alreadyAdded ? ' disabled' : '');
    html += '>';
    html += alreadyAdded ? 'Already Added' : 'Add Aspect';
    html += '        </button>';
  }

  html += '      </div>';
  html += '    </div>';

  html += '  </div>';
  html += '</div>';

  return html;
}
