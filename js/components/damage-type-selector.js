/**
 * Damage Type Selector Component
 * Renders UI for selecting damage types on aspects that require choices
 */

import { aspectNeedsDamageTypeSelection } from '../state/character.js';

/**
 * Render inline damage type selector for an aspect
 * Shows chips/buttons for each damage type option
 * Handles multiple categories per aspect (e.g., weakness AND immunity)
 * @param {object} aspect - The aspect requiring damage type selection
 * @param {string} mode - Current character mode (creation/play/advancement)
 * @returns {string} - HTML string for the selector
 */
export function renderDamageTypeSelector(aspect, mode = 'creation') {
  if (!aspect.damageTypes) return '';

  // Handle both array (new) and object (old) formats
  const damageTypesArray = Array.isArray(aspect.damageTypes) ? aspect.damageTypes : [aspect.damageTypes];

  const isPlayMode = mode === 'play';
  let html = '';

  // Render a selector for each "choose" category
  for (const dt of damageTypesArray) {
    if (dt.selectionType !== 'choose') continue;

    const { category, chooseCount, options } = dt;
    const selected = (aspect.selectedDamageTypes && aspect.selectedDamageTypes[category]) || [];
    const isComplete = selected.length >= chooseCount;

    // In play mode with complete selection, don't show selector (read-only)
    if (isPlayMode && isComplete) {
      continue;
    }

    html += `
      <div class="damage-type-selector mt-2">
        <p class="text-xs text-gray-600 mb-1">
          ${isPlayMode ? 'Complete selection:' : 'Choose'}
          ${chooseCount} ${category} type${chooseCount > 1 ? 's' : ''}
          ${selected.length > 0 ? `<span class="text-gray-500 ml-1">(${selected.length}/${chooseCount})</span>` : ''}
        </p>
        <div class="flex flex-wrap gap-1.5">
          ${options.map(type => {
            const isSelected = selected.includes(type);
            const isDisabled = !isSelected && selected.length >= chooseCount;

            return `
              <button
                class="dt-chip ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                data-action="toggleDamageType"
                data-params='${JSON.stringify({ aspectId: aspect.id, category, damageType: type })}'
                ${isDisabled ? 'disabled' : ''}
                title="${type}"
              >
                ${type}${isSelected ? ' ✓' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  return html;
}

/**
 * Render warning pill for aspect needing damage type selection
 * @param {object} aspect - The aspect to check
 * @returns {string} - HTML string for warning pill
 */
export function renderDamageTypeWarning(aspect) {
  if (!aspectNeedsDamageTypeSelection(aspect)) {
    return '';
  }

  // Calculate total remaining across all categories
  const damageTypesArray = Array.isArray(aspect.damageTypes) ? aspect.damageTypes : [aspect.damageTypes];
  let totalRemaining = 0;

  for (const dt of damageTypesArray) {
    if (dt.selectionType === 'choose') {
      const selected = (aspect.selectedDamageTypes && aspect.selectedDamageTypes[dt.category]) || [];
      const remaining = dt.chooseCount - selected.length;
      totalRemaining += Math.max(0, remaining);
    }
  }

  if (totalRemaining === 0) return '';

  return `
    <span class="warning-pill inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-800 border border-yellow-300">
      ⚠️ Select ${totalRemaining} more damage type${totalRemaining > 1 ? 's' : ''}
    </span>
  `;
}

/**
 * Render selected damage types as compact display
 * Shows what has been selected in a read-only format
 * Handles multiple categories per aspect (e.g., weakness AND immunity)
 * If character is provided, shows immunity upgrades from double resistance
 * @param {object} aspect - The aspect with damage types
 * @param {object} char - Optional character object for showing upgraded immunities
 * @returns {string} - HTML string for selected types display
 */
export function renderSelectedDamageTypes(aspect, char = null) {
  if (!aspect.damageTypes) return '';

  // Handle both array (new) and object (old) formats
  const damageTypesArray = Array.isArray(aspect.damageTypes) ? aspect.damageTypes : [aspect.damageTypes];

  let html = '';

  for (const dt of damageTypesArray) {
    const category = dt.category;
    const selectionType = dt.selectionType;

    let types = [];
    if (selectionType === 'fixed') {
      types = dt.options || [];
    } else if (selectionType === 'choose') {
      types = (aspect.selectedDamageTypes && aspect.selectedDamageTypes[category]) || [];
    }

    if (types.length === 0) continue;

    // For resistance category, check if character has upgraded any to immunity
    let resistantTypes = types;
    let immuneTypes = [];

    if (category === 'resistance' && char) {
      // Count resistance sources for this character
      const resistanceCounts = new Map();
      char.selectedAspects.forEach(a => {
        if (!a.damageTypes) return;

        const aDamageTypesArray = Array.isArray(a.damageTypes) ? a.damageTypes : [a.damageTypes];

        for (const aDt of aDamageTypesArray) {
          if (aDt.category !== 'resistance') continue;

          const aTypes = aDt.selectionType === 'fixed'
            ? (aDt.options || [])
            : ((a.selectedDamageTypes && a.selectedDamageTypes[aDt.category]) || []);

          aTypes.forEach(t => {
            resistanceCounts.set(t, (resistanceCounts.get(t) || 0) + 1);
          });
        }
      });

      // Split into immune (2+ sources) and resistant (1 source)
      immuneTypes = types.filter(t => resistanceCounts.get(t) >= 2);
      resistantTypes = types.filter(t => resistanceCounts.get(t) === 1);
    }

    // Determine prefix and styling based on category
    let content = '';
    if (category === 'dealing') {
      const range = dt.range || '';
      const prefix = range ? `${range}:` : 'Deals:';
      content = `
        <span class="text-gray-500 mr-1">${prefix}</span>
        ${types.map(type =>
          `<span class="damage-type-badge inline-block px-1.5 py-0.5 m-0.5 rounded text-xs bg-purple-100 text-purple-900 border border-purple-300">${type}</span>`
        ).join('')}
      `;
    } else if (category === 'immunity') {
      content = `
        <span class="text-gray-500 mr-1">Immune:</span>
        ${types.map(type =>
          `<span class="damage-type-badge inline-block px-1.5 py-0.5 m-0.5 rounded text-xs bg-green-100 text-green-900 border border-green-300">${type}</span>`
        ).join('')}
      `;
    } else if (category === 'weakness') {
      content = `
        <span class="text-gray-500 mr-1">Weak:</span>
        ${types.map(type =>
          `<span class="damage-type-badge inline-block px-1.5 py-0.5 m-0.5 rounded text-xs bg-red-100 text-red-900 border border-red-300">${type}</span>`
        ).join('')}
      `;
    } else if (category === 'resistance') {
      // Show both resistant and immune types (upgraded from double resistance)
      const parts = [];
      if (resistantTypes.length > 0) {
        parts.push(`
          <span class="text-gray-500 mr-1">Resistant:</span>
          ${resistantTypes.map(type =>
            `<span class="damage-type-badge inline-block px-1.5 py-0.5 m-0.5 rounded text-xs bg-blue-100 text-blue-900 border border-blue-300">${type}</span>`
          ).join('')}
        `);
      }
      if (immuneTypes.length > 0) {
        parts.push(`
          <span class="text-gray-500 mr-1">Immune:</span>
          ${immuneTypes.map(type =>
            `<span class="damage-type-badge inline-block px-1.5 py-0.5 m-0.5 rounded text-xs bg-green-100 text-green-900 border border-green-300 font-semibold">${type}</span>`
          ).join('')}
        `);
      }
      content = parts.join(' <span class="text-gray-400">|</span> ');
    }

    html += `
      <div class="selected-damage-types mt-1.5 text-xs">
        ${content}
      </div>
    `;
  }

  return html;
}

/**
 * Highlight damage types in aspect description text
 * Wraps damage type keywords in spans for visual emphasis
 * @param {object} aspect - The aspect with description
 * @returns {string} - HTML string with highlighted damage types
 */
export function highlightDamageTypesInDescription(aspect) {
  if (!aspect.damageTypes) return aspect.description;

  // Handle both array (new) and object (old) formats
  const damageTypesArray = Array.isArray(aspect.damageTypes) ? aspect.damageTypes : [aspect.damageTypes];

  let description = aspect.description;

  for (const dt of damageTypesArray) {
    if (dt.selectionType !== 'choose') continue;

    const selected = (aspect.selectedDamageTypes && aspect.selectedDamageTypes[dt.category]) || [];
    const options = dt.options || [];

    // Highlight each option
    options.forEach(type => {
      const isSelected = selected.includes(type);
      const regex = new RegExp(`\\b${type}\\b`, 'gi');

      description = description.replace(regex, (match) => {
        if (isSelected) {
          return `<span class="dt-option selected font-medium text-blue-600 underline decoration-2 decoration-blue-400">${match}</span>`;
        } else {
          return `<span class="dt-option font-medium text-gray-700">${match}</span>`;
        }
      });
    });
  }

  return description;
}

/**
 * Render popover for play mode failsafe
 * Allows incomplete selections to be finished in play mode
 * @param {object} aspect - The aspect needing selection
 * @returns {string} - HTML string for popover
 */
export function renderDamageTypePopover(aspect) {
  if (!aspect.damageTypes) return '';

  // Handle both array (new) and object (old) formats
  const damageTypesArray = Array.isArray(aspect.damageTypes) ? aspect.damageTypes : [aspect.damageTypes];

  let html = '';

  for (const dt of damageTypesArray) {
    if (dt.selectionType !== 'choose') continue;

    const { category, chooseCount, options } = dt;
    const selected = (aspect.selectedDamageTypes && aspect.selectedDamageTypes[category]) || [];
    const popoverId = `popover-${aspect.id.replace(/[^a-zA-Z0-9]/g, '-')}-${category}`;

    html += `
      <div id="${popoverId}" class="damage-type-popover hidden absolute z-50 mt-1 p-3 bg-white border border-gray-300 rounded-lg shadow-lg">
        <div class="text-sm font-medium mb-2">Select ${chooseCount} ${category} types:</div>
        <div class="flex flex-wrap gap-1.5 mb-2">
          ${options.map(type => {
            const isSelected = selected.includes(type);
            const isDisabled = !isSelected && selected.length >= chooseCount;

            return `
              <button
                class="dt-chip ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                data-action="toggleDamageType"
                data-params='${JSON.stringify({ aspectId: aspect.id, category, damageType: type })}'
                ${isDisabled ? 'disabled' : ''}
              >
                ${type}${isSelected ? ' ✓' : ''}
              </button>
            `;
          }).join('')}
        </div>
        <div class="text-xs text-gray-500">
          ${selected.length}/${chooseCount} selected
        </div>
      </div>
    `;
  }

  return html;
}

/**
 * Show popover for damage type selection
 * @param {string} popoverId - ID of the popover element
 */
export function showDamageTypePopover(popoverId) {
  const popover = document.getElementById(popoverId);
  if (!popover) return;

  // Hide any other open popovers
  document.querySelectorAll('.damage-type-popover').forEach(p => {
    if (p.id !== popoverId) {
      p.classList.add('hidden');
    }
  });

  // Toggle this popover
  popover.classList.toggle('hidden');
}

/**
 * Close all damage type popovers
 */
export function closeAllDamageTypePopovers() {
  document.querySelectorAll('.damage-type-popover').forEach(p => {
    p.classList.add('hidden');
  });
}

// Global click handler to close popovers when clicking outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.damage-type-popover') && !e.target.closest('.warning-pill')) {
      closeAllDamageTypePopovers();
    }
  });
}
