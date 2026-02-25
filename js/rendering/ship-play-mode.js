/**
 * Ship play mode rendering
 */

import { renderShipRatingsPlay } from '../components/ship-ratings-play.js';
import { renderShipInventoryPlay } from '../components/ship-inventory-play.js';
import { renderJourneyControls } from '../components/journey-clocks.js';
import { renderDiceRoller } from '../components/dice-roller.js';
import { createDataParams } from '../utils/escaping.js';

// Icons (inline SVG so currentColor inherits from button's CSS color)
const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>`;

/**
 * Render ship play mode
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} ship - Ship object
 * @param {Object} gameData - Game data
 * @param {boolean} journeyEditMode - Whether journey is in edit mode
 * @param {string} userRole - Current user's role ('dm' or 'player')
 * @param {Array} diceRolls - Current dice rolls from session
 * @param {boolean} showDiceResults - Whether dice results panel is expanded
 */
export function renderShipPlayMode(container, ship, gameData, journeyEditMode = false, userRole = 'player', diceRolls = [], showDiceResults = true) {
  let html = '<div class="ship-main-container" style="height: calc(100vh - 60px);">';

  // Main content area with ratings and inventory (inventory includes cargo)
  html += '<div class="ship-content-row">';
  html += renderShipRatingsPlay(ship);
  html += '<div class="ship-main">';

  // Journey controls at the top
  if (ship.journey) {
    html += renderJourneyControls(ship.journey, journeyEditMode);
  }

  html += renderShipInventoryPlay(ship, userRole);
  html += '</div>';
  html += '</div>';

  // Bottom action bar: dice roller | space | drydock + export
  html += '<div class="sticky-action-bar">';
  html += renderDiceRoller(diceRolls, showDiceResults, userRole);
  html += '<div class="flex flex-1"></div>';
  html += '<div class="flex-gap-md">';
  html += `<button data-action="setShipMode" ${createDataParams({ mode: 'creation' })}>Ship Drydock</button>`;
  html += `<button data-action="exportShip" title="Export Ship" aria-label="Export Ship">${downloadIcon}</button>`;
  html += '</div>';
  html += '</div>';

  html += '</div>';

  container.innerHTML = html;
}
