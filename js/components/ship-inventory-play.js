/**
 * Ship inventory rendering for play mode
 * Shows full ship part cards in a three-column layout
 */

import { renderShipCargo } from './ship-cargo.js';
import { renderShipPassengers } from './ship-passengers.js';

/**
 * Render a ship part card (non-interactive version for play mode)
 * @param {Object} part - Ship part data
 * @returns {string} HTML string
 */
function renderPartCard(part) {
  let html = `<div class="aspect-card" style="border: 2px solid #E5E7EB; padding: 16px; border-radius: 8px; background: white; margin-bottom: 12px;">`;

  // Name and Stakes on the same row
  html += `<div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">`;
  html += `<div style="font-weight: 700; font-size: 16px; color: #1F2937;">${part.name}</div>`;
  html += `<div style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px;">${part.stakes} ${part.stakes === 1 ? 'Stake' : 'Stakes'}</div>`;
  html += `</div>`;

  html += `<div style="font-size: 14px; color: #4B5563; margin-bottom: 12px; line-height: 1.5;">${part.description}</div>`;

  // Bonuses
  if (part.bonuses && part.bonuses.length > 0) {
    html += `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">`;
    part.bonuses.forEach(bonus => {
      const sign = bonus.value >= 0 ? '+' : '';
      html += `<span style="background: #DBEAFE; color: #1E40AF; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${sign}${bonus.value} ${bonus.rating}</span>`;
    });
    html += `</div>`;
  }

  // Specials
  if (part.specials && part.specials.length > 0) {
    html += `<div style="margin-top: 8px;">`;
    part.specials.forEach(special => {
      html += `<div style="font-size: 13px; color: #059669; font-style: italic; margin-bottom: 4px;">• ${special}</div>`;
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
  let html = '<div style="flex: 1; display: flex; flex-direction: column; padding: 20px; padding-bottom: 100px; overflow-y: auto;">';

  // Three-column grid for main content
  html += '<div style="display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 24px; margin-bottom: 32px;">';

  // Column 1: Design Elements
  html += '<div>';
  html += '<h2 class="section-header">Design Elements</h2>';

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
  html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">';
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
  if (allUndercrew.length > 0) {
    allUndercrew.forEach(undercrew => {
      html += renderPartCard(undercrew);
    });
  }

  html += '</div>';

  html += '</div>'; // End three-column grid

  // Separator
  html += '<hr style="border: none; border-top: 1px solid #000000; margin: 32px 0;" />';

  // Cargo and Passengers - two column layout at the bottom
  html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">';
  html += renderShipCargo(ship);
  html += renderShipPassengers(ship);
  html += '</div>';

  html += '</div>'; // End container
  return html;
}
