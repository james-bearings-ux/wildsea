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
  const selectedStyle = isSelected ? 'border: 3px solid #A91D3A; background: #FEF2F2;' : 'border: 2px solid #E5E7EB;';

  // Properly escape the JSON for HTML attribute
  const paramsJson = JSON.stringify({
    partType: partType,
    part: part
  }).replace(/"/g, '&quot;');

  let html = `<div class="aspect-card" style="${selectedStyle} cursor: pointer; padding: 16px; border-radius: 8px; background: white; margin-bottom: 12px;"
    data-action="selectShipPart"
    data-params="${paramsJson}"
  >`;

  // Name and Stakes on the same row
  html += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">`;
  html += `<div style="font-weight: 700; font-size: 16px; color: #1F2937;">${part.name}</div>`;
  html += `<div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">${part.stakes} ${part.stakes === 1 ? 'Stake' : 'Stakes'}</div>`;
  html += `</div>`;

  // Description
  html += `<div style="font-size: 14px; color: #4B5563; margin-bottom: 12px; line-height: 1.5;">${part.description}</div>`;

  // Bonuses as bullets
  if (part.bonuses && part.bonuses.length > 0) {
    html += '<ul style="margin: 0 0 8px 0; padding-left: 20px; font-size: 13px; color: #374151;">';
    part.bonuses.forEach(bonus => {
      const sign = bonus.value > 0 ? '+' : '';
      html += `<li>${bonus.rating} ${sign}${bonus.value}</li>`;
    });
    html += '</ul>';
  }

  // Specials in small text
  if (part.specials && part.specials.length > 0) {
    html += '<div style="font-size: 12px; color: #6B7280; font-style: italic; margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">';
    part.specials.forEach((special, idx) => {
      if (idx > 0) html += '<br>';
      html += special;
    });
    html += '</div>';
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

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 16px;">';

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

  let html = '<div style="flex: 1; display: flex; flex-direction: column;">';

  // Tab buttons
  html += '<div style="display: flex; gap: 4px; padding: 16px 16px 0 16px; border-bottom: 2px solid #E5E7EB;">';
  tabs.forEach(tab => {
    const isActive = tab.id === activeTab;
    const activeStyle = isActive
      ? 'background: #A91D3A; color: white; border-bottom: 2px solid #A91D3A;'
      : 'background: #F3F4F6; color: #6B7280; border-bottom: 2px solid transparent;';

    html += `<button
      data-action="switchShipTab"
      data-params='{"tab":"${tab.id}"}'
      style="${activeStyle} padding: 8px 16px; border: none; border-radius: 4px 4px 0 0; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s;"
    >${tab.label}</button>`;
  });
  html += '</div>';

  // Tab content
  html += '<div style="flex: 1; overflow-y: auto;">';

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
