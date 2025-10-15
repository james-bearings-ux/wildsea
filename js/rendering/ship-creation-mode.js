/**
 * Ship creation mode rendering
 */

import { renderShipRatings } from '../components/ship-ratings.js';
import { renderShipPartsTabs } from '../components/ship-parts.js';
import { calculateStakesSpent, calculateStakesBudget } from '../state/ship.js';

/**
 * Render ship creation mode
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} ship - Ship object
 * @param {Object} gameData - Game data
 * @param {string} activeTab - Currently active parts tab
 */
export function renderShipCreationMode(container, ship, gameData, activeTab = 'size') {
  const stakesSpent = calculateStakesSpent(ship);
  const stakesBudget = calculateStakesBudget(ship);

  let html = '<div style="display: flex; flex-direction: column; height: calc(100vh - 60px);">';

  // Top bar: crew size and stakes budget
  html += '<div style="display: flex; gap: 24px; align-items: center; padding: 16px 20px; background: #1F2937; color: white; border-bottom: 2px solid #374151;">';

  // Crew size control
  html += '<div style="display: flex; align-items: center; gap: 8px;">';
  html += '<label style="font-size: 14px; font-weight: 600;">Anticipated Crew Size:</label>';
  html += `<input type="number" min="1" max="20" value="${ship.anticipatedCrewSize}"
    data-action="updateAnticipatedCrewSize"
    style="width: 60px; padding: 4px 8px; border-radius: 4px; border: 1px solid #4B5563; background: white; color: #1F2937; text-align: center;"
  />`;
  html += '</div>';

  // Stakes budget indicator
  const budgetColor = stakesSpent > stakesBudget ? '#EF4444' : stakesSpent === stakesBudget ? '#10B981' : '#3B82F6';
  html += '<div style="display: flex; align-items: center; gap: 8px;">';
  html += '<span style="font-size: 14px; font-weight: 600;">Stakes:</span>';
  html += `<span style="font-size: 18px; font-weight: 700; color: ${budgetColor};">${stakesSpent} / ${stakesBudget}</span>`;
  html += '</div>';

  html += '</div>';

  // Main content area
  html += '<div style="display: flex; flex: 1; overflow: hidden;">';

  // Left column: ratings
  html += renderShipRatings(ship);

  // Middle: tabbed ship parts selection
  html += renderShipPartsTabs(ship, gameData, activeTab);

  html += '</div>';

  // Bottom action bar
  html += '<div style="padding: 16px 20px; background: #F3F4F6; border-top: 2px solid #D1D5DB; display: flex; justify-content: space-between; align-items: center;">';

  // Left side: mode switchers
  html += '<div style="display: flex; gap: 8px;">';
  html += '<button data-action="setShipMode" data-params=\'{"mode":"creation"}\' style="background: #A91D3A; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">Creation</button>';
  html += '<button data-action="setShipMode" data-params=\'{"mode":"play"}\' style="background: #6B7280; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">Play</button>';
  html += '<button data-action="setShipMode" data-params=\'{"mode":"upgrade"}\' style="background: #6B7280; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">Upgrade</button>';
  html += '</div>';

  html += '</div>';

  html += '</div>';

  container.innerHTML = html;
}
