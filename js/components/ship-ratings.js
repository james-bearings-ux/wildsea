/**
 * Ship ratings display component
 */

import { calculateShipRatings } from '../state/ship.js';

/**
 * Render ship ratings in a vertical column
 * @param {Object} ship - Ship object
 * @returns {string} HTML string
 */
export function renderShipRatings(ship) {
  const ratings = calculateShipRatings(ship);

  let html = '<div style="display: flex; flex-direction: column; gap: 8px; padding: 16px; background: #F3F4F6; border-right: 2px solid #D1D5DB; min-width: 120px;">';

  const ratingNames = ['Armour', 'Seals', 'Speed', 'Saws', 'Stealth', 'Tilt'];

  ratingNames.forEach(ratingName => {
    const value = ratings[ratingName];
    html += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: white; border-radius: 4px;">';
    html += `<span style="font-size: 12px; font-weight: 600; color: #374151;">${ratingName}</span>`;
    html += `<span style="font-size: 14px; font-weight: 700; color: #1F2937;">${value}</span>`;
    html += '</div>';
  });

  html += '</div>';

  return html;
}
