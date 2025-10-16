/**
 * Ship ratings rendering for play mode
 */

import { calculateShipRatings, calculateStakesSpent, calculateStakesBudget } from '../state/ship.js';

/**
 * Render ship ratings with damage blocks for play mode
 * @param {Object} ship - Ship object
 * @returns {string} HTML string
 */
export function renderShipRatingsPlay(ship) {
  const ratings = calculateShipRatings(ship);

  let html = '<div class="ship-ratings-column">';

  // Ratings heading
  html += '<div class="ship-ratings-heading">RATINGS</div>';

  const ratingNames = ['Armour', 'Seals', 'Speed', 'Saws', 'Stealth', 'Tilt'];

  ratingNames.forEach(ratingName => {
    const value = ratings[ratingName];
    const damageArray = ship.ratingDamage[ratingName] || [];

    html += '<div class="ship-rating-item">';
    html += `<div class="ship-rating-name">${ratingName}</div>`;

    // Damage track boxes
    html += '<div class="ship-rating-track">';
    for (let i = 0; i < value; i++) {
      const state = damageArray[i] === 'burned' ? 'burned' : 'default';
      const stateChar = state === 'burned' ? 'X' : '';
      html += `<div class="track-box ${state}" data-action="cycleRatingDamage" data-params='{"rating":"${ratingName}","index":${i}}' style="cursor: pointer;">${stateChar}</div>`;
    }
    html += '</div>';

    html += '</div>';
  });

  // Stakes accounting section
  const stakesSpent = calculateStakesSpent(ship);
  const totalBudget = calculateStakesBudget(ship);
  const originalBudget = 6 + (ship.anticipatedCrewSize * 3);
  const additionalStakes = ship.additionalStakes || 0;
  const availableStakes = totalBudget - stakesSpent;

  html += '<div class="ship-stakes-section">';
  html += '<div class="ship-ratings-heading">STAKES</div>';

  html += '<div class="ship-stakes-list">';
  html += `<div class="ship-stakes-row"><span class="ship-stakes-label">Original:</span><span class="ship-stakes-value">${originalBudget}</span></div>`;
  html += `<div class="ship-stakes-row"><span class="ship-stakes-label">Additional:</span><span class="ship-stakes-value">${additionalStakes}</span></div>`;
  html += `<div class="ship-stakes-row"><span class="ship-stakes-label">Spent:</span><span class="ship-stakes-value">${stakesSpent}</span></div>`;
  html += `<div class="ship-stakes-row-total"><span class="ship-stakes-label-bold">Available:</span><span class="ship-stakes-value-bold">${availableStakes}</span></div>`;
  html += '</div>';

  html += '</div>';

  html += '</div>';
  return html;
}
