/**
 * Ship inventory rendering for play mode
 * Shows full ship part cards in a three-column layout
 */

import { renderShipCargo } from './ship-cargo.js';
import { renderShipPassengers } from './ship-passengers.js';

/**
 * Render a ship part card (non-interactive version for play mode)
 * @param {Object} part - Ship part data
 * @param {boolean} isUndercrew - Whether this is an undercrew card (needs damage track)
 * @param {Object} ship - Ship object (needed for undercrew damage data)
 * @returns {string} HTML string
 */
function renderPartCard(part, isUndercrew = false, ship = null) {
  let html = `<div class="ship-card">`;

  // Damage track for undercrew (above name/stakes)
  if (isUndercrew && ship) {
    const trackSize = part.track || 0;
    const damageArray = ship.undercrewDamage?.[part.name] || [];

    html += '<div class="ship-rating-track" style="margin-bottom: 12px;">';
    for (let i = 0; i < trackSize; i++) {
      const state = damageArray[i] === 'burned' ? 'burned' : 'default';
      const stateChar = state === 'burned' ? '✕' : '';
      // Escape the name for JSON
      const escapedName = part.name.replace(/"/g, '&quot;');
      html += `<div class="track-box ${state}" data-action="cycleUndercrewDamage" data-params='{"undercrewName":"${escapedName}","index":${i}}' style="cursor: pointer;">${stateChar}</div>`;
    }
    html += '</div>';
  }

  // Name and Stakes on the same row
  html += `<div class="ship-card-header">`;
  html += `<div class="ship-card-name">${part.name}</div>`;
  html += `<div class="ship-card-stakes">${part.stakes} ${part.stakes === 1 ? 'Stake' : 'Stakes'}</div>`;
  html += `</div>`;

  html += `<div class="ship-card-description">${part.description}</div>`;

  // Bonuses
  if (part.bonuses && part.bonuses.length > 0) {
    html += `<div class="ship-bonuses">`;
    part.bonuses.forEach(bonus => {
      const sign = bonus.value >= 0 ? '+' : '';
      html += `<span class="ship-bonus-pill">${sign}${bonus.value} ${bonus.rating}</span>`;
    });
    html += `</div>`;
  }

  // Specials
  if (part.specials && part.specials.length > 0) {
    html += `<div class="ship-specials">`;
    part.specials.forEach(special => {
      html += `<div class="ship-special-item">• ${special}</div>`;
    });
    html += `</div>`;
  }

  html += '</div>';
  return html;
}

/**
 * Render ship inventory for play mode with three columns
 * @param {Object} ship - Ship object
 * @returns {string} HTML string
 */
export function renderShipInventoryPlay(ship) {
  let html = '<div class="ship-play-container">';

  // Three-column grid for main content
  html += '<div class="ship-three-col-grid">';

  // Column 1: Design Elements
  html += '<div>';
  html += '<h2 class="section-header">Design Elements</h2>';
  html += '<div class="ship-card-list">';

  if (ship.size) {
    html += renderPartCard(ship.size);
  }
  if (ship.frame) {
    html += renderPartCard(ship.frame);
  }
  if (ship.hull && Array.isArray(ship.hull)) {
    ship.hull.forEach(part => {
      html += renderPartCard(part);
    });
  }
  if (ship.bite && Array.isArray(ship.bite)) {
    ship.bite.forEach(part => {
      html += renderPartCard(part);
    });
  }
  if (ship.engine && Array.isArray(ship.engine)) {
    ship.engine.forEach(part => {
      html += renderPartCard(part);
    });
  }

  html += '</div>';
  html += '</div>';

  // Column 2: Fittings (2xN grid)
  html += '<div>';
  html += '<h2 class="section-header">Fittings</h2>';

  // Collect all fittings into a single array
  const allFittings = [];
  const fittingTypes = [
    { key: 'motifs', label: 'Motifs' },
    { key: 'generalAdditions', label: 'General Additions' },
    { key: 'bounteousAdditions', label: 'Bounteous Additions' },
    { key: 'rooms', label: 'Rooms' },
    { key: 'armaments', label: 'Armaments' }
  ];

  fittingTypes.forEach(fittingType => {
    if (ship[fittingType.key] && Array.isArray(ship[fittingType.key]) && ship[fittingType.key].length > 0) {
      allFittings.push(...ship[fittingType.key]);
    }
  });

  // Render in 2-column grid
  html += '<div class="ship-fittings-grid">';
  allFittings.forEach(fitting => {
    html += renderPartCard(fitting);
  });
  html += '</div>';

  html += '</div>';

  // Column 3: Undercrew
  html += '<div>';
  html += '<h2 class="section-header">Undercrew</h2>';

  // Collect all undercrew into a single array
  const allUndercrew = [];
  if (ship.undercrew) {
    if (ship.undercrew.officers && Array.isArray(ship.undercrew.officers)) {
      allUndercrew.push(...ship.undercrew.officers);
    }
    if (ship.undercrew.gangs && Array.isArray(ship.undercrew.gangs)) {
      allUndercrew.push(...ship.undercrew.gangs);
    }
    if (ship.undercrew.packs && Array.isArray(ship.undercrew.packs)) {
      allUndercrew.push(...ship.undercrew.packs);
    }
  }

  // Render undercrew cards
  html += '<div class="ship-card-list">';
  if (allUndercrew.length > 0) {
    allUndercrew.forEach(undercrew => {
      html += renderPartCard(undercrew, true, ship);  // Pass true for isUndercrew and ship object
    });
  }
  html += '</div>';

  html += '</div>';

  html += '</div>'; // End three-column grid

  // Separator
  html += '<hr class="ship-separator" />';

  // Cargo and Passengers - two column layout at the bottom
  html += '<div class="ship-two-col-grid">';
  html += renderShipCargo(ship);
  html += renderShipPassengers(ship);
  html += '</div>';

  html += '</div>'; // End container
  return html;
}
