/**
 * Ship inventory rendering for play mode - Refactored with front-end best practices
 * Shows full ship part cards in a three-column layout
 */

import { renderShipCargo } from './ship-cargo.js';
import { renderShipPassengers } from './ship-passengers.js';
import { renderShipFactions } from './ship-factions.js';
import { escapeHtmlContent, createDataParams } from '../utils/escaping.js';

// Constants
const FITTING_TYPES = [
  { key: 'motifs', label: 'Motifs' },
  { key: 'generalAdditions', label: 'General Additions' },
  { key: 'bounteousAdditions', label: 'Bounteous Additions' },
  { key: 'rooms', label: 'Rooms' },
  { key: 'armaments', label: 'Armaments' }
];

const UNDERCREW_TYPES = ['officers', 'gangs', 'packs'];
const DAMAGE_STATE_CHAR = '✕';

/**
 * Render damage track for undercrew
 * @param {Object} part - Ship part with track size
 * @param {Object} ship - Ship object with damage data
 * @returns {string} HTML string for damage track
 */
function renderUndercrewDamageTrack(part, ship) {
  const trackSize = part.track || 0;
  const damageArray = ship.undercrewDamage?.[part.name] || [];

  let html = '<div class="ship-rating-track" style="margin-bottom: 12px;">';
  for (let i = 0; i < trackSize; i++) {
    const state = damageArray[i] === 'burned' ? 'burned' : 'default';
    const stateChar = state === 'burned' ? DAMAGE_STATE_CHAR : '';

    html += `<div class="track-box ${state}" `;
    html += `${createDataParams({ undercrewName: part.name, index: i })} `;
    html += 'data-action="cycleUndercrewDamage" ';
    html += 'style="cursor: pointer;">';
    html += stateChar;
    html += '</div>';
  }
  html += '</div>';

  return html;
}

/**
 * Render bonuses section for a ship part
 * @param {Array} bonuses - Array of bonus objects
 * @returns {string} HTML string for bonuses
 */
function renderPartBonuses(bonuses) {
  if (!bonuses || bonuses.length === 0) return '';

  let html = '<div class="ship-bonuses">';
  bonuses.forEach(bonus => {
    const sign = bonus.value >= 0 ? '+' : '';
    html += `<span class="ship-bonus-pill">${sign}${bonus.value} ${escapeHtmlContent(bonus.rating)}</span>`;
  });
  html += '</div>';

  return html;
}

/**
 * Render specials section for a ship part
 * @param {Array} specials - Array of special ability strings
 * @returns {string} HTML string for specials
 */
function renderPartSpecials(specials) {
  if (!specials || specials.length === 0) return '';

  let html = '<div class="ship-specials">';
  specials.forEach(special => {
    html += `<div class="ship-special-item">• ${escapeHtmlContent(special)}</div>`;
  });
  html += '</div>';

  return html;
}

/**
 * Render a ship part card (non-interactive version for play mode)
 * @param {Object} part - Ship part data
 * @param {boolean} isUndercrew - Whether this is an undercrew card (needs damage track)
 * @param {Object} ship - Ship object (needed for undercrew damage data)
 * @returns {string} HTML string
 */
export function renderPartCard(part, isUndercrew = false, ship = null) {
  let html = '<div class="ship-card">';

  // Damage track for undercrew (above name/stakes)
  if (isUndercrew && ship) {
    html += renderUndercrewDamageTrack(part, ship);
  }

  // Name and Stakes on the same row
  html += '<div class="ship-card-header">';
  html += `<div class="ship-card-name">${escapeHtmlContent(part.name)}</div>`;
  html += `<div class="ship-card-stakes">${part.stakes} ${part.stakes === 1 ? 'Stake' : 'Stakes'}</div>`;
  html += '</div>';

  html += `<div class="ship-card-description">${escapeHtmlContent(part.description)}</div>`;

  // Bonuses and Specials
  html += renderPartBonuses(part.bonuses);
  html += renderPartSpecials(part.specials);

  html += '</div>';
  return html;
}

/**
 * Collect all fittings from ship into a single array
 * @param {Object} ship - Ship object
 * @returns {Array} Array of all fitting parts
 */
function collectAllFittings(ship) {
  const allFittings = [];

  FITTING_TYPES.forEach(fittingType => {
    if (ship[fittingType.key] && Array.isArray(ship[fittingType.key]) && ship[fittingType.key].length > 0) {
      allFittings.push(...ship[fittingType.key]);
    }
  });

  return allFittings;
}

/**
 * Collect all undercrew from ship into a single array
 * @param {Object} ship - Ship object
 * @returns {Array} Array of all undercrew
 */
function collectAllUndercrew(ship) {
  const allUndercrew = [];

  if (ship.undercrew) {
    UNDERCREW_TYPES.forEach(type => {
      if (ship.undercrew[type] && Array.isArray(ship.undercrew[type])) {
        allUndercrew.push(...ship.undercrew[type]);
      }
    });
  }

  return allUndercrew;
}

/**
 * Render design elements column (size, frame, hull, bite, engine)
 * @param {Object} ship - Ship object
 * @returns {string} HTML string for design elements
 */
function renderDesignElements(ship) {
  let html = '<div>';
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

  return html;
}

/**
 * Render fittings column (2xN grid)
 * @param {Array} allFittings - Array of all fitting parts
 * @returns {string} HTML string for fittings section
 */
function renderFittingsSection(allFittings) {
  let html = '<div>';
  html += '<h2 class="section-header">Fittings</h2>';

  html += '<div class="ship-fittings-grid">';
  allFittings.forEach(fitting => {
    html += renderPartCard(fitting);
  });
  html += '</div>';

  html += '</div>';

  return html;
}

/**
 * Render undercrew column
 * @param {Array} allUndercrew - Array of all undercrew
 * @param {Object} ship - Ship object (needed for damage tracking)
 * @returns {string} HTML string for undercrew section
 */
function renderUndercrewSection(allUndercrew, ship) {
  let html = '<div>';
  html += '<h2 class="section-header">Undercrew</h2>';

  html += '<div class="ship-card-list">';
  if (allUndercrew.length > 0) {
    allUndercrew.forEach(undercrew => {
      html += renderPartCard(undercrew, true, ship);
    });
  }
  html += '</div>';

  html += '</div>';

  return html;
}

/**
 * Render three-column grid with design elements, fittings, and undercrew
 * @param {Object} ship - Ship object
 * @param {Array} allFittings - Pre-collected fittings
 * @param {Array} allUndercrew - Pre-collected undercrew
 * @returns {string} HTML string for three-column grid
 */
function renderThreeColumnGrid(ship, allFittings, allUndercrew) {
  return `
    <div class="ship-three-col-grid">
      ${renderDesignElements(ship)}
      ${renderFittingsSection(allFittings)}
      ${renderUndercrewSection(allUndercrew, ship)}
    </div>
  `;
}

/**
 * Render cargo, passengers, and factions section (three columns at bottom)
 * @param {Object} ship - Ship object
 * @param {string} userRole - Current user's role ('dm' or 'player')
 * @returns {string} HTML string for cargo/passengers/factions
 */
function renderCargoPassengersFactions(ship, userRole) {
  return `
    <div class="ship-three-col-grid-equal">
      ${renderShipCargo(ship)}
      ${renderShipPassengers(ship)}
      ${renderShipFactions(ship, userRole)}
    </div>
  `;
}

/**
 * Render ship inventory for play mode with three columns
 * @param {Object} ship - Ship object
 * @param {string} userRole - Current user's role ('dm' or 'player')
 * @returns {string} HTML string
 */
export function renderShipInventoryPlay(ship, userRole = 'player') {
  const allFittings = collectAllFittings(ship);
  const allUndercrew = collectAllUndercrew(ship);

  return `
    <div class="ship-play-container">
      ${renderThreeColumnGrid(ship, allFittings, allUndercrew)}
      <hr class="ship-separator" />
      ${renderCargoPassengersFactions(ship, userRole)}
    </div>
  `;
}
