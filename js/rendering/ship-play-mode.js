/**
 * Ship play mode rendering
 */

/**
 * Render ship play mode
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} ship - Ship object
 * @param {Object} gameData - Game data
 */
export function renderShipPlayMode(container, ship, gameData) {
  let html = '<div style="display: flex; flex-direction: column; height: calc(100vh - 60px);">';

  html += '<div style="padding: 40px; text-align: center;">';
  html += '<h2 style="color: #1F2937; margin-bottom: 16px;">Ship Play Mode</h2>';
  html += '<p style="color: #6B7280;">Play mode UI coming soon...</p>';
  html += '</div>';

  // Bottom action bar
  html += '<div style="margin-top: auto; padding: 16px 20px; background: #F3F4F6; border-top: 2px solid #D1D5DB; display: flex; justify-content: space-between; align-items: center;">';

  // Left side: Return to Creation and Export
  html += '<div style="display: flex; gap: 8px;">';
  html += '<button data-action="setShipMode" data-params=\'{"mode":"creation"}\' style="background: #6B7280; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">Return to Creation</button>';
  html += '<button data-action="exportShip" style="background: #6366F1; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">Export Ship</button>';
  html += '</div>';

  // Right side: Upgrade
  html += '<div style="display: flex; gap: 8px;">';
  html += '<button data-action="setShipMode" data-params=\'{"mode":"upgrade"}\' style="background: #10B981; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">Upgrade</button>';
  html += '</div>';

  html += '</div>';

  html += '</div>';

  container.innerHTML = html;
}
