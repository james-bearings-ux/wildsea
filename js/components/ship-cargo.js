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

  html += '<div class="flex-col-gap">';

  // Render each cargo item
  for (let i = 0; i < cargo.length; i++) {
    const item = cargo[i];
    html += '<div class="cargo-row">';
    html += '<input type="text" ';
    html += 'value="' + item.name + '" ';
    html += 'placeholder="Name your cargo..." ';
    html += 'data-action="updateCargoName" ';
    html += 'data-params=\'{"id":"' + item.id + '"}\' ';
    html += 'class="cargo-input">';
    html += '<button data-action="removeCargo" ';
    html += 'data-params=\'{"id":"' + item.id + '"}\' ';
    html += 'class="btn-icon-only">✕</button>';
    html += '</div>';
  }

  // Add new cargo button
  html += '<button class="btn-subtle" data-action="addCargo">+ New Cargo</button>';

  html += '</div>';
  html += '</div>';

  return html;
}
