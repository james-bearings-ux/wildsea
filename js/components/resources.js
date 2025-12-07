/**
 * Resources rendering component
 */

/**
 * Render the resources management component for all 4 resource types
 * Displays charts, salvage, specimens, and whispers with interactive controls
 * - Creation mode: 4-column grid layout with suggested resources button (max 6 starting resources)
 * - Play mode: Single column stacked layout
 * Each resource item has: checkbox (used/unused), text input (name), and delete button
 * @param {Object} character - Character object with mode and resources object
 * @param {Array} character.resources.charts - Array of chart resource items
 * @param {Array} character.resources.salvage - Array of salvage resource items
 * @param {Array} character.resources.specimens - Array of specimen resource items
 * @param {Array} character.resources.whispers - Array of whisper resource items
 * @returns {string} HTML string for the complete resources component
 */
export function renderResources(character) {
  const char = character;
  const resourceTypes = [
    { key: 'charts', label: 'Charts', placeholder: 'Name your Chart...', singular: 'Chart' },
    { key: 'salvage', label: 'Salvage', placeholder: 'Name your Salvage...', singular: 'Salvage' },
    { key: 'specimens', label: 'Specimens', placeholder: 'Name your Specimen...', singular: 'Specimen' },
    { key: 'whispers', label: 'Whispers', placeholder: 'Name your Whisper...', singular: 'Whisper' }
  ];

  const isCreationMode = char.mode === 'creation';
  const isPlayMode = char.mode === 'play';

  let html = '';

  // Add header based on mode
  if (isCreationMode) {
    html += '<div class="mb-xl">';
    html += '<div class="flex-between mb-lg">';
    html += '<h2 class="section-header">Resources</h2>';
    html += '<p>A new character may have up to 6 starting resources.</p> <button class="medium" data-action="populateDefaultResources">Load Suggested Resources</button>';
    html += '</div>';
  } else if (isPlayMode) {
    // Add header for play mode too
    html += '<h2 class="section-header">Resources</h2>';
  }

  // Use column layout for play mode, grid for creation mode
  if (isPlayMode) {
    // No wrapper, resources will be stacked by parent container
  } else if (isCreationMode) {
    html += '<div class="grid-4col gap-xxl">';
  }

  for (let i = 0; i < resourceTypes.length; i++) {
    const type = resourceTypes[i];
    const items = char.resources[type.key];

    // Wrap in a container div for proper stacking in play mode
    html += '<div>';
    html += '<h3 class="subsection-header mb-lg">' + type.label + '</h3>';
    html += '<div class="flex-col-gap">';

    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      html += '<div class="resource-item-row">';
      html += '<input type="checkbox" ';
      if (item.used) html += 'checked ';
      html += 'data-action="toggleResourceUsed" title="used" ';
      html += 'data-params=\'{"type":"' + type.key + '","id":"' + item.id + '"}\'>';
      html += '<input type="text" ';
      html += 'value="' + item.name + '" ';
      html += 'placeholder="' + type.placeholder + '" ';
      if (item.used) html += 'disabled ';
      html += 'data-action="updateResourceName" ';
      html += 'data-params=\'{"type":"' + type.key + '","id":"' + item.id + '"}\'>';
      html += '<button data-action="removeResource" ';
      html += 'class="btn-tertiary" ';
      html += 'data-params=\'{"type":"' + type.key + '","id":"' + item.id + '"}\'>✕</button>';
      html += '</div>';
    }

    html += '<button class="btn-subtle" data-action="addResource" data-params=\'{"type":"' + type.key + '"}\'>+ New ' + type.singular + '</button>';
    html += '</div>';
    html += '</div>';
  }

  // Close grid wrapper for creation mode
  if (isCreationMode) {
    html += '</div>';
    html += '</div>'; // Close outer wrapper
  }

  return html;
}
