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

  let html = '<div class="ship-ratings-column" style="gap: 8px;">';

  // Ratings heading
  html += '<div class="ship-ratings-heading">Ratings</div>';

  const ratingNames = ['Armour', 'Seals', 'Speed', 'Saws', 'Stealth', 'Tilt'];

  ratingNames.forEach(ratingName => {
    const value = ratings[ratingName];
    html += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: white; border-radius: 4px;">';
    html += `<span class="ship-rating-name">${ratingName}</span>`;
    html += `<span style="font-size: 14px; font-weight: 700; color: #1F2937;">${value}</span>`;
    html += '</div>';
  });

  html += '</div>';

  return html;
}
