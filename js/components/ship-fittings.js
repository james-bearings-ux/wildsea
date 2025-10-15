/**
 * Ship fittings selection component (for wizard stage 2)
 */

/**
 * Render tabbed interface for ship fittings selection
 * @param {Object} ship - Ship object
 * @param {Object} gameData - Game data containing shipParts
 * @param {string} activeTab - Currently active tab
 * @returns {string} HTML string
 */
export function renderShipFittingsTabs(ship, gameData, activeTab = 'motifs') {
  const tabs = [
    { id: 'motifs', label: 'Motifs' },
    { id: 'general', label: 'General Additions' },
    { id: 'bounteous', label: 'Bounteous Additions' },
    { id: 'rooms', label: 'Rooms' },
    { id: 'armaments', label: 'Armaments' }
  ];

  let html = '<div style="flex: 1; display: flex; flex-direction: column;">';

  // Tab buttons
  html += '<div style="display: flex; gap: 4px; padding: 16px 16px 0 16px; border-bottom: 2px solid #E5E7EB;">';
  tabs.forEach(tab => {
    const isActive = tab.id === activeTab;
    const activeStyle = isActive
      ? 'background: #000000; color: white; border-bottom: 2px solid #000000;'
      : 'background: #F3F4F6; color: #6B7280; border-bottom: 2px solid transparent;';

    html += `<button
      data-action="switchShipTab"
      data-params='{"tab":"${tab.id}"}'
      style="${activeStyle} padding: 8px 16px; border: none; border-radius: 4px 4px 0 0; cursor: pointer; font-family: 'Faustina', serif; font-weight: 600; font-size: 18px; transition: all 0.2s;"
    >${tab.label}</button>`;
  });
  html += '</div>';

  // Tab content
  html += '<div style="flex: 1; overflow-y: auto;">';

  // Map tab IDs to JSON keys and ship properties
  const tabMapping = {
    'motifs': { key: 'motifs', shipProp: 'motifs' },
    'general': { key: 'generalAdditions', shipProp: 'generalAdditions' },
    'bounteous': { key: 'bounteousAdditions', shipProp: 'bounteousAdditions' },
    'rooms': { key: 'rooms', shipProp: 'rooms' },
    'armaments': { key: 'armaments', shipProp: 'armaments' }
  };

  const mapping = tabMapping[activeTab];
  if (mapping) {
    const fittings = gameData.shipParts[mapping.key] || [];
    const selectedFittings = ship[mapping.shipProp] || [];
    html += renderFittingsList(fittings, mapping.shipProp, selectedFittings);
  }

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render a list of fittings
 * @param {Array} fittings - Array of fitting objects
 * @param {string} fittingType - Type of fitting
 * @param {Array} selectedFittings - Currently selected fittings (array)
 * @returns {string} HTML string
 */
function renderFittingsList(fittings, fittingType, selectedFittings) {
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 16px;">';

  fittings.forEach(fitting => {
    // Check if this fitting is in the selected array
    const isSelected = Array.isArray(selectedFittings) && selectedFittings.some(f => f.name === fitting.name);
    html += renderFittingCard(fitting, fittingType, isSelected);
  });

  html += '</div>';

  return html;
}

/**
 * Render a fitting card
 * @param {Object} fitting - Fitting data
 * @param {string} fittingType - Type of fitting
 * @param {boolean} isSelected - Whether this fitting is currently selected
 * @returns {string} HTML string
 */
function renderFittingCard(fitting, fittingType, isSelected) {
  const selectedStyle = isSelected ? 'border: 3px solid #A91D3A; background: #FEF2F2;' : 'border: 2px solid #E5E7EB;';

  // Properly escape the JSON for HTML attribute
  const paramsJson = JSON.stringify({
    fittingType: fittingType,
    fitting: fitting
  }).replace(/"/g, '&quot;');

  let html = `<div class="aspect-card" style="${selectedStyle} cursor: pointer; padding: 16px; border-radius: 8px; background: white;"
    data-action="selectShipFitting"
    data-params="${paramsJson}"
  >`;

  // Name and Stakes on the same row
  html += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">`;
  html += `<div style="font-weight: 700; font-size: 16px; color: #1F2937;">${fitting.name}</div>`;
  html += `<div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">${fitting.stakes} ${fitting.stakes === 1 ? 'Stake' : 'Stakes'}</div>`;
  html += `</div>`;

  // Description
  html += `<div style="font-size: 14px; color: #4B5563; margin-bottom: 12px; line-height: 1.5;">${fitting.description}</div>`;

  // Bonuses as pills (if present)
  if (fitting.bonuses && fitting.bonuses.length > 0) {
    html += `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">`;
    fitting.bonuses.forEach(bonus => {
      const sign = bonus.value >= 0 ? '+' : '';
      html += `<span style="background: #DBEAFE; color: #1E40AF; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${sign}${bonus.value} ${bonus.rating}</span>`;
    });
    html += `</div>`;
  }

  // Specials in green italic text
  if (fitting.specials && fitting.specials.length > 0) {
    html += `<div style="margin-top: 8px;">`;
    fitting.specials.forEach(special => {
      html += `<div style="font-size: 13px; color: #059669; font-style: italic; margin-bottom: 4px;">• ${special}</div>`;
    });
    html += `</div>`;
  }

  html += '</div>';

  return html;
}
