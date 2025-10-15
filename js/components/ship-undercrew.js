/**
 * Ship undercrew selection component (for wizard stage 3)
 */

/**
 * Render tabbed interface for ship undercrew selection
 * @param {Object} ship - Ship object
 * @param {Object} gameData - Game data containing shipParts
 * @param {string} activeTab - Currently active tab
 * @returns {string} HTML string
 */
export function renderShipUndercrewTabs(ship, gameData, activeTab = 'officers') {
  const tabs = [
    { id: 'officers', label: 'Officers' },
    { id: 'gangs', label: 'Gangs' },
    { id: 'packs', label: 'Packs' }
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

  // Get undercrew data from nested structure
  const undercrewData = gameData.shipParts.undercrew || {};
  const undercrew = undercrewData[activeTab] || [];
  const selectedUndercrew = ship.undercrew?.[activeTab] || [];

  html += renderUndercrewList(undercrew, activeTab, selectedUndercrew);

  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render a list of undercrew
 * @param {Array} undercrewItems - Array of undercrew objects
 * @param {string} undercrewType - Type of undercrew (officers, gangs, packs)
 * @param {Array} selectedUndercrew - Currently selected undercrew (array)
 * @returns {string} HTML string
 */
function renderUndercrewList(undercrewItems, undercrewType, selectedUndercrew) {
  let html = '<div class="ship-parts-grid">';

  undercrewItems.forEach(undercrew => {
    // Check if this undercrew is in the selected array
    const isSelected = Array.isArray(selectedUndercrew) && selectedUndercrew.some(u => u.name === undercrew.name);
    html += renderUndercrewCard(undercrew, undercrewType, isSelected);
  });

  html += '</div>';

  return html;
}

/**
 * Render an undercrew card
 * @param {Object} undercrew - Undercrew data
 * @param {string} undercrewType - Type of undercrew
 * @param {boolean} isSelected - Whether this undercrew is currently selected
 * @returns {string} HTML string
 */
function renderUndercrewCard(undercrew, undercrewType, isSelected) {
  const selectedClass = isSelected ? 'ship-card-selected' : '';

  // Properly escape the JSON for HTML attribute
  const paramsJson = JSON.stringify({
    undercrewType: undercrewType,
    undercrew: undercrew
  }).replace(/"/g, '&quot;');

  let html = `<div class="ship-card ${selectedClass}"
    data-action="selectShipUndercrew"
    data-params="${paramsJson}"
  >`;

  // Name and Stakes on the same row
  html += `<div class="ship-card-header">`;
  html += `<div class="ship-card-name">${undercrew.name}</div>`;
  html += `<div class="ship-card-stakes">${undercrew.stakes} ${undercrew.stakes === 1 ? 'Stake' : 'Stakes'}</div>`;
  html += `</div>`;

  // Description
  html += `<div class="ship-card-description">${undercrew.description}</div>`;

  // Bonuses as pills (if present)
  if (undercrew.bonuses && undercrew.bonuses.length > 0) {
    html += `<div class="ship-bonuses">`;
    undercrew.bonuses.forEach(bonus => {
      const sign = bonus.value >= 0 ? '+' : '';
      html += `<span class="ship-bonus-pill">${sign}${bonus.value} ${bonus.rating}</span>`;
    });
    html += `</div>`;
  }

  // Specials in green italic text
  if (undercrew.specials && undercrew.specials.length > 0) {
    html += `<div class="ship-specials">`;
    undercrew.specials.forEach(special => {
      html += `<div class="ship-special-item">• ${special}</div>`;
    });
    html += `</div>`;
  }

  html += '</div>';

  return html;
}
