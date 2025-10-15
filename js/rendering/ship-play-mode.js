/**
 * Ship play mode rendering
 */

import { renderShipRatingsPlay } from '../components/ship-ratings-play.js';
import { renderShipInventoryPlay } from '../components/ship-inventory-play.js';

/**
 * Render ship play mode
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} ship - Ship object
 * @param {Object} gameData - Game data
 */
export function renderShipPlayMode(container, ship, gameData) {
  let html = '<div style="display: flex; flex-direction: column; height: calc(100vh - 60px);">';

  // Main content area with ratings and inventory (inventory includes cargo)
  html += '<div style="display: flex; flex: 1; overflow: hidden;">';
  html += renderShipRatingsPlay(ship);
  html += renderShipInventoryPlay(ship);
  html += '</div>';

  // Bottom action bar
  html += '<div class="sticky-action-bar split">';
  html += '<div>';
  html += '<button data-action="setShipMode" data-params=\'{"mode":"creation"}\'>Return to Creation</button>';
  html += '<button data-action="exportShip">Export Ship</button>';
  html += '</div>';
  html += '<button data-action="setShipMode" data-params=\'{"mode":"upgrade"}\'>Upgrade</button>';
  html += '</div>';

  html += '</div>';

  container.innerHTML = html;
}
