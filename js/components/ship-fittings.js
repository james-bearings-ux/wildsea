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

  let html = '<div class="ship-content-column">';

  // Tab buttons
  html += '<div class="ship-tabs-container">';
  tabs.forEach(tab => {
    const isActive = tab.id === activeTab;
    const activeClass = isActive ? 'ship-tab-active' : 'ship-tab-inactive';

    html += `<button
      data-action="switchShipTab"
      data-params='{"tab":"${tab.id}"}'
      class="ship-tab ${activeClass}"
    >${tab.label}</button>`;
  });
  html += '</div>';

  // Tab content
  html += '<div class="ship-content-scrollable">';

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
  let html = '<div class="ship-parts-grid">';

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
  const selectedClass = isSelected ? 'ship-card-selected' : '';

  // Properly escape the JSON for HTML attribute
  const paramsJson = JSON.stringify({
    fittingType: fittingType,
    fitting: fitting
  }).replace(/"/g, '&quot;');

  let html = `<div class="ship-card ${selectedClass}"
    data-action="selectShipFitting"
    data-params="${paramsJson}"
  >`;

  // Name and Stakes on the same row
  html += `<div class="ship-card-header">`;
  html += `<div class="ship-card-name">${fitting.name}</div>`;
  html += `<div class="ship-card-stakes">${fitting.stakes} ${fitting.stakes === 1 ? 'Stake' : 'Stakes'}</div>`;
  html += `</div>`;

  // Description
  html += `<div class="ship-card-description">${fitting.description}</div>`;

  // Bonuses as pills (if present)
  if (fitting.bonuses && fitting.bonuses.length > 0) {
    html += `<div class="ship-bonuses">`;
    fitting.bonuses.forEach(bonus => {
      const sign = bonus.value >= 0 ? '+' : '';
      html += `<span class="ship-bonus-pill">${sign}${bonus.value} ${bonus.rating}</span>`;
    });
    html += `</div>`;
  }

  // Specials in green italic text
  if (fitting.specials && fitting.specials.length > 0) {
    html += `<div class="ship-specials">`;
    fitting.specials.forEach(special => {
      html += `<div class="ship-special-item">• ${special}</div>`;
    });
    html += `</div>`;
  }

  html += '</div>';

  return html;
}
