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

  let html = '<div class="ship-ratings-column">';

  // Ratings heading
  html += '<div class="ship-ratings-heading">Ratings</div>';

  const ratingNames = ['Armour', 'Seals', 'Speed', 'Saws', 'Stealth', 'Tilt'];

  ratingNames.forEach(ratingName => {
    const value = ratings[ratingName];
    html += '<div class="rating-display-row">';
    html += `<span class="ship-rating-name">${ratingName}</span>`;
    html += `<span class="rating-value">${value}</span>`;
    html += '</div>';
  });

  html += '</div>';

  return html;
}
