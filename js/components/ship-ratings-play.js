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

  let html = '<div style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #F3F4F6; border-right: 2px solid #D1D5DB; min-width: 180px;">';

  // Ratings heading
  html += '<div style="font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #D1D5DB;">RATINGS</div>';

  const ratingNames = ['Armour', 'Seals', 'Speed', 'Saws', 'Stealth', 'Tilt'];

  ratingNames.forEach(ratingName => {
    const value = ratings[ratingName];
    const damageArray = ship.ratingDamage[ratingName] || [];

    html += '<div style="margin-bottom: 4px;">';
    html += `<div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px;">${ratingName}</div>`;

    // Damage track boxes
    html += '<div style="display: flex; gap: 4px; flex-wrap: wrap;">';
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

  html += '<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #D1D5DB;">';
  html += '<div style="font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">STAKES</div>';

  html += '<div style="display: flex; flex-direction: column; gap: 4px;">';
  html += `<div style="display: flex; justify-content: space-between; font-size: 12px;"><span style="color: #6B7280;">Original:</span><span style="font-weight: 600; color: #374151;">${originalBudget}</span></div>`;
  html += `<div style="display: flex; justify-content: space-between; font-size: 12px;"><span style="color: #6B7280;">Additional:</span><span style="font-weight: 600; color: #374151;">${additionalStakes}</span></div>`;
  html += `<div style="display: flex; justify-content: space-between; font-size: 12px;"><span style="color: #6B7280;">Spent:</span><span style="font-weight: 600; color: #374151;">${stakesSpent}</span></div>`;
  html += `<div style="display: flex; justify-content: space-between; font-size: 12px; padding-top: 4px; border-top: 1px solid #D1D5DB;"><span style="color: #6B7280; font-weight: 600;">Available:</span><span style="font-weight: 700; color: #000000;">${availableStakes}</span></div>`;
  html += '</div>';

  html += '</div>';

  html += '</div>';
  return html;
}
