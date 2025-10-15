/**
 * Ship parts selection component
 */

/**
 * Render a ship part card (similar to aspect card)
 * @param {Object} part - Part data
 * @param {string} partType - Type of part (size, frame, hull, bite, engine)
 * @param {boolean} isSelected - Whether this part is currently selected
 * @returns {string} HTML string
 */
function renderPartCard(part, partType, isSelected) {
  const selectedClass = isSelected ? 'ship-card-selected' : '';

  // Properly escape the JSON for HTML attribute
  const paramsJson = JSON.stringify({
    partType: partType,
    part: part
  }).replace(/"/g, '&quot;');

  let html = `<div class="ship-card ${selectedClass}"
    data-action="selectShipPart"
    data-params="${paramsJson}"
  >`;

  // Name and Stakes on the same row
  html += `<div class="ship-card-header">`;
  html += `<div class="ship-card-name">${part.name}</div>`;
  html += `<div class="ship-card-stakes">${part.stakes} ${part.stakes === 1 ? 'Stake' : 'Stakes'}</div>`;
  html += `</div>`;

  // Description
  html += `<div class="ship-card-description">${part.description}</div>`;

  // Bonuses as pills
  if (part.bonuses && part.bonuses.length > 0) {
    html += `<div class="ship-bonuses">`;
    part.bonuses.forEach(bonus => {
      const sign = bonus.value >= 0 ? '+' : '';
      html += `<span class="ship-bonus-pill">${sign}${bonus.value} ${bonus.rating}</span>`;
    });
    html += `</div>`;
  }

  // Specials in green italic text
  if (part.specials && part.specials.length > 0) {
    html += `<div class="ship-specials">`;
    part.specials.forEach(special => {
      html += `<div class="ship-special-item">• ${special}</div>`;
    });
    html += `</div>`;
  }

  html += '</div>';

  return html;
}

/**
 * Render a list of parts for a specific category
 * @param {Array} parts - Array of part objects
 * @param {string} partType - Type of part (size, frame, hull, bite, engine)
 * @param {Object|Array|null} selectedPart - Currently selected part(s)
 * @returns {string} HTML string
 */
export function renderPartsList(parts, partType, selectedPart) {
  const multiSelectParts = ['hull', 'bite', 'engine'];
  const isMultiSelect = multiSelectParts.includes(partType);

  let html = '<div class="ship-parts-grid">';

  parts.forEach(part => {
    let isSelected = false;

    if (isMultiSelect && Array.isArray(selectedPart)) {
      // Multi-select: check if part is in the array
      isSelected = selectedPart.some(p => p.name === part.name);
    } else if (!isMultiSelect && selectedPart) {
      // Single-select: direct comparison
      isSelected = selectedPart.name === part.name;
    }

    html += renderPartCard(part, partType, isSelected);
  });

  html += '</div>';

  return html;
}

/**
 * Render tabbed interface for ship parts selection
 * @param {Object} ship - Ship object
 * @param {Object} gameData - Game data containing shipParts
 * @param {string} activeTab - Currently active tab (size, frame, hull, bite, engine)
 * @returns {string} HTML string
 */
export function renderShipPartsTabs(ship, gameData, activeTab = 'size') {
  const tabs = [
    { id: 'size', label: 'Size' },
    { id: 'frame', label: 'Frame' },
    { id: 'hull', label: 'Hull' },
    { id: 'bite', label: 'Bite' },
    { id: 'engine', label: 'Engine' }
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

  // Map tab IDs to JSON keys (bite is singular in the JSON)
  const partKeys = {
    'size': 'sizes',
    'frame': 'frames',
    'hull': 'hulls',
    'bite': 'bite',
    'engine': 'engines'
  };

  const parts = gameData.shipParts[partKeys[activeTab]] || [];
  const selectedPart = ship[activeTab];

  html += renderPartsList(parts, activeTab, selectedPart);

  html += '</div>';
  html += '</div>';

  return html;
}
