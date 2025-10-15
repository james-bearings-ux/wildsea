/**
 * Ship passengers rendering component
 * Parallel to cargo management
 */

/**
 * Render passengers management interface
 * @param {Object} ship - Ship object
 * @returns {string} HTML string
 */
export function renderShipPassengers(ship) {
  const passengers = ship.passengers || [];

  let html = '<div>';

  html += '<h2 class="section-header">Passengers</h2>';

  html += '<div style="display: flex; flex-direction: column; gap: 12px;">';

  // Render each passenger item
  for (let i = 0; i < passengers.length; i++) {
    const item = passengers[i];
    html += '<div style="display: flex; gap: 8px; align-items: center;">';
    html += '<input type="text" ';
    html += 'value="' + item.name + '" ';
    html += 'placeholder="Name your passenger..." ';
    html += 'data-action="updatePassengerName" ';
    html += 'data-params=\'{"id":"' + item.id + '"}\' ';
    html += 'style="width: 100%; font-size: 16px; padding: 8px;">';
    html += '<button data-action="removePassenger" ';
    html += 'data-params=\'{"id":"' + item.id + '"}\' ';
    html += 'style="flex-shrink: 0; border: 0; font-size: 20px; padding: 8px 12px; cursor: pointer;">✕</button>';
    html += '</div>';
  }

  // Add new passenger button
  html += '<button class="ghost" data-action="addPassenger" style="width: 100%;">+ New Passenger</button>';

  html += '</div>';
  html += '</div>';

  return html;
}
