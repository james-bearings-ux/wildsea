/**
 * Resources rendering component
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
    html += '<div style="margin-bottom: 32px;">';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">';
    html += '<h2 class="section-header" style="margin: 0;">Resources</h2>';
    html += '<p>A new character may have up to 6 starting resources.</p> <button data-action="populateDefaultResources">Load Suggested Resources</button>';
    html += '</div>';
  } else if (isPlayMode) {
    // Add header for play mode too
    html += '<h2 class="section-header">Resources</h2>';
  }

  // Use column layout for play mode, grid for creation mode
  if (isPlayMode) {
    // No wrapper, resources will be stacked by parent container
  } else if (isCreationMode) {
    html += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px;">';
  }

  for (let i = 0; i < resourceTypes.length; i++) {
    const type = resourceTypes[i];
    const items = char.resources[type.key];

    // Wrap in a container div for proper stacking in play mode
    html += '<div>';
    html += '<h3 class="subsection-header" style="margin-bottom: 12px;">' + type.label + '</h3>';
    html += '<div style="display: flex; flex-direction: column; gap: 12px;">';

    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      html += '<div style="display: flex; gap: 8px; align-items: center;">';
      html += '<input type="text" ';
      html += 'value="' + item.name + '" ';
      html += 'placeholder="' + type.placeholder + '" ';
      html += 'data-action="updateResourceName" ';
      html += 'data-params=\'{"type":"' + type.key + '","id":"' + item.id + '"}\' ';
      html += 'style="width: 100%;">';
      html += '<button data-action="removeResource" ';
      html += 'class="remove" ';
      html += 'data-params=\'{"type":"' + type.key + '","id":"' + item.id + '"}\' ';
      html += 'style="flex-shrink: 0; border: 0;">✕</button>';
      html += '</div>';
    }

    const marginTop = items.length > 0 ? '0' : '0';
    html += '<button class="ghost" data-action="addResource" data-params=\'{"type":"' + type.key + '"}\' style="width: 100%; margin-top: ' + marginTop + 'px;">+ New ' + type.singular + '</button>';
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
