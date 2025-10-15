/**
 * Ship cargo rendering component
 * Similar to character salvage/resources management
 */

/**
 * Render cargo management interface
 * @param {Object} ship - Ship object
 * @returns {string} HTML string
 */
export function renderShipCargo(ship) {
  const cargo = ship.cargo || [];

  let html = '<div>';

  html += '<h2 class="section-header">Cargo</h2>';

  html += '<div style="display: flex; flex-direction: column; gap: 12px;">';

  // Render each cargo item
  for (let i = 0; i < cargo.length; i++) {
    const item = cargo[i];
    html += '<div style="display: flex; gap: 8px; align-items: center;">';
    html += '<input type="text" ';
    html += 'value="' + item.name + '" ';
    html += 'placeholder="Name your cargo..." ';
    html += 'data-action="updateCargoName" ';
    html += 'data-params=\'{"id":"' + item.id + '"}\' ';
    html += 'style="width: 100%; font-size: 16px; padding: 8px;">';
    html += '<button data-action="removeCargo" ';
    html += 'data-params=\'{"id":"' + item.id + '"}\' ';
    html += 'style="flex-shrink: 0; border: 0; font-size: 20px; padding: 8px 12px; cursor: pointer;">✕</button>';
    html += '</div>';
  }

  // Add new cargo button
  html += '<button class="ghost" data-action="addCargo" style="width: 100%;">+ New Cargo</button>';

  html += '</div>';
  html += '</div>';

  return html;
}
