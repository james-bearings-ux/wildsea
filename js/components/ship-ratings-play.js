/**
 * Ship ratings rendering for play mode - Refactored with front-end best practices
 */

import { calculateShipRatings, calculateStakesSpent, calculateStakesBudget } from '../state/ship.js';
import { escapeHtmlContent, createDataParams } from '../utils/escaping.js';

// Constants
const RATING_NAMES = ['Armour', 'Seals', 'Speed', 'Saws', 'Stealth', 'Tilt'];
const DAMAGE_STATE_CHAR = '✕';

/**
 * Render a single rating track with damage boxes
 * @param {string} ratingName - Name of the rating
 * @param {number} value - Rating value (number of boxes)
 * @param {Array} damageArray - Array of damage states
 * @returns {string} HTML string for rating track
 */
function renderRatingTrack(ratingName, value, damageArray) {
  let html = '<div class="ship-rating-item">';
  html += `<div class="ship-rating-name">${escapeHtmlContent(ratingName)}</div>`;

  // Damage track boxes
  html += '<div class="ship-rating-track">';
  for (let i = 0; i < value; i++) {
    const state = damageArray[i] === 'burned' ? 'burned' : 'default';
    const stateChar = state === 'burned' ? DAMAGE_STATE_CHAR : '';

    html += `<div class="track-box ${state}" `;
    html += `${createDataParams({ rating: ratingName, index: i })} `;
    html += 'data-action="cycleRatingDamage" ';
    html += 'style="cursor: pointer;">';
    html += stateChar;
    html += '</div>';
  }
  html += '</div>';

  html += '</div>';
  return html;
}

/**
 * Render stakes accounting section
 * @param {Object} ship - Ship object
 * @returns {string} HTML string for stakes section
 */
function renderStakesSection(ship) {
  const stakesSpent = calculateStakesSpent(ship);
  const totalBudget = calculateStakesBudget(ship);
  const originalBudget = 6 + (ship.anticipatedCrewSize * 3);
  const additionalStakes = ship.additionalStakes || 0;
  const availableStakes = totalBudget - stakesSpent;

  let html = '<div class="ship-stakes-section">';
  html += '<div class="ship-ratings-heading">Stakes</div>';

  html += '<div class="ship-stakes-list">';
  html += `<div class="ship-stakes-row"><span class="ship-stakes-label">Original:</span><span class="ship-stakes-value">${originalBudget}</span></div>`;
  html += `<div class="ship-stakes-row"><span class="ship-stakes-label">Additional:</span><span class="ship-stakes-value">${additionalStakes}</span></div>`;
  html += `<div class="ship-stakes-row"><span class="ship-stakes-label">Spent:</span><span class="ship-stakes-value">${stakesSpent}</span></div>`;
  html += `<div class="ship-stakes-row-total"><span class="ship-stakes-label-bold">Available:</span><span class="ship-stakes-value-bold">${availableStakes}</span></div>`;
  html += '</div>';

  html += '</div>';
  return html;
}

/**
 * Render ship ratings with damage blocks for play mode
 * @param {Object} ship - Ship object
 * @returns {string} HTML string
 */
export function renderShipRatingsPlay(ship) {
  const ratings = calculateShipRatings(ship);

  let html = '<div class="ship-ratings-column">';
  html += '<div class="ship-ratings-heading">Ratings</div>';

  // Render all rating tracks
  RATING_NAMES.forEach(ratingName => {
    const value = ratings[ratingName];
    const damageArray = ship.ratingDamage[ratingName] || [];
    html += renderRatingTrack(ratingName, value, damageArray);
  });

  // Render stakes section
  html += renderStakesSection(ship);

  html += '</div>';
  return html;
}
