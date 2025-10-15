/**
 * Ship upgrade mode rendering
 */

/**
 * Render ship upgrade mode
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} ship - Ship object
 * @param {Object} gameData - Game data
 */
export function renderShipUpgradeMode(container, ship, gameData) {
  let html = '<div style="display: flex; flex-direction: column; height: calc(100vh - 60px);">';

  html += '<div style="padding: 40px; text-align: center;">';
  html += '<h2 style="color: #1F2937; margin-bottom: 16px;">Ship Upgrade Mode</h2>';
  html += '<p style="color: #6B7280;">Upgrade mode UI coming soon...</p>';
  html += '</div>';

  // Bottom action bar
  html += '<div class="sticky-action-bar" style="display: flex; justify-content: flex-end;">';
  html += '<button data-action="saveShipUpgrade" class="primary">Save Changes</button>';
  html += '<button data-action="setShipMode" data-params=\'{"mode":"play"}\'>Cancel</button>';
  html += '</div>';

  html += '</div>';

  container.innerHTML = html;
}
