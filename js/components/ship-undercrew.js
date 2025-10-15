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
  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; padding: 16px;">';

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
  const selectedStyle = isSelected ? 'border: 3px solid #A91D3A; background: #FEF2F2;' : 'border: 2px solid #E5E7EB;';

  // Properly escape the JSON for HTML attribute
  const paramsJson = JSON.stringify({
    undercrewType: undercrewType,
    undercrew: undercrew
  }).replace(/"/g, '&quot;');

  let html = `<div class="aspect-card" style="${selectedStyle} cursor: pointer; padding: 16px; border-radius: 8px; background: white; margin-bottom: 12px;"
    data-action="selectShipUndercrew"
    data-params="${paramsJson}"
  >`;

  // Name and Stakes on the same row
  html += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">`;
  html += `<div style="font-weight: 700; font-size: 16px; color: #1F2937;">${undercrew.name}</div>`;
  html += `<div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">${undercrew.stakes} ${undercrew.stakes === 1 ? 'Stake' : 'Stakes'}</div>`;
  html += `</div>`;

  // Description
  html += `<div style="font-size: 14px; color: #4B5563; margin-bottom: 12px; line-height: 1.5;">${undercrew.description}</div>`;

  // Bonuses as pills (if present)
  if (undercrew.bonuses && undercrew.bonuses.length > 0) {
    html += `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">`;
    undercrew.bonuses.forEach(bonus => {
      const sign = bonus.value >= 0 ? '+' : '';
      html += `<span style="background: #DBEAFE; color: #1E40AF; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${sign}${bonus.value} ${bonus.rating}</span>`;
    });
    html += `</div>`;
  }

  // Specials in green italic text
  if (undercrew.specials && undercrew.specials.length > 0) {
    html += `<div style="margin-top: 8px;">`;
    undercrew.specials.forEach(special => {
      html += `<div style="font-size: 13px; color: #059669; font-style: italic; margin-bottom: 4px;">• ${special}</div>`;
    });
    html += `</div>`;
  }

  html += '</div>';

  return html;
}
