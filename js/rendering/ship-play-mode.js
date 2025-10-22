/**
 * Ship play mode rendering
 */

import { renderShipRatingsPlay } from '../components/ship-ratings-play.js';
import { renderShipInventoryPlay } from '../components/ship-inventory-play.js';
import { renderJourneyControls } from '../components/journey-clocks.js';

/**
 * Render ship play mode
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} ship - Ship object
 * @param {Object} gameData - Game data
 * @param {boolean} journeyEditMode - Whether journey is in edit mode
 */
export function renderShipPlayMode(container, ship, gameData, journeyEditMode = false) {
  let html = '<div class="ship-main-container" style="height: calc(100vh - 60px);">';

  // Journey controls at the top
  if (ship.journey) {
    html += renderJourneyControls(ship.journey, journeyEditMode);
  }

  // Main content area with ratings and inventory (inventory includes cargo)
  html += '<div class="ship-content-row">';
  html += renderShipRatingsPlay(ship);
  html += renderShipInventoryPlay(ship);
  html += '</div>';

  // Bottom action bar
  html += '<div class="sticky-action-bar split">';
  html += '<button data-action="exportShip">Export Ship</button>';
  html += '<button data-action="setShipMode" data-params=\'{"mode":"creation"}\'>Ship Drydock</button>';
  html += '</div>';

  html += '</div>';

  container.innerHTML = html;
}
