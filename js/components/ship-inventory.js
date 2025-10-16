/**
 * Ship inventory component - running list of selected parts
 */

import { calculateStakesSpent, calculateStakesBudget } from '../state/ship.js';

/**
 * Render the ship inventory sidebar
 * @param {Object} ship - Ship object
 * @returns {string} HTML string
 */
export function renderShipInventory(ship) {
  let html = '<div class="ship-inventory-column" style="min-width: 250px; max-width: 250px;">';

  html += '<div style="margin-bottom:24px">';

    // Crew size control
  html += '<div class="ship-control-group">';
  html += '<label class="ship-control-label">Anticipated Crew Size:</label>';
  html += `<input type="number" min="1" max="20" value="${ship.anticipatedCrewSize}"
    data-action="updateAnticipatedCrewSize"
    class="ship-input-small"
  />`;
  html += '</div>';

  // Additional stakes control
  html += '<div class="ship-control-group">';
  html += '<label class="ship-control-label">Additional Stakes:</label>';
  html += `<input type="number" min="0" value="${ship.additionalStakes || 0}"
    data-action="updateAdditionalStakes"
    class="ship-input-small"
  />`;
  html += '</div>';

  html += '</div>';


  // Design Elements section
  html += renderInventorySection('Design Elements', [
    { label: 'Size', items: ship.size ? [ship.size] : [], required: true },
    { label: 'Frame', items: ship.frame ? [ship.frame] : [], required: true },
    { label: 'Hull', items: ship.hull || [], required: true },
    { label: 'Bite', items: ship.bite || [], required: true },
    { label: 'Engine', items: ship.engine || [], required: true }
  ]);

  // Fittings section
  html += renderInventorySection('Fittings', [
    { label: 'Motifs', items: ship.motifs || [] },
    { label: 'General Additions', items: ship.generalAdditions || [] },
    { label: 'Bounteous Additions', items: ship.bounteousAdditions || [] },
    { label: 'Rooms', items: ship.rooms || [] },
    { label: 'Armaments', items: ship.armaments || [] }
  ]);

  // Undercrew section
  const undercrewCategories = [];
  if (ship.undercrew) {
    if (ship.undercrew.officers && ship.undercrew.officers.length > 0) {
      undercrewCategories.push({ label: 'Officers', items: ship.undercrew.officers });
    }
    if (ship.undercrew.gangs && ship.undercrew.gangs.length > 0) {
      undercrewCategories.push({ label: 'Gangs', items: ship.undercrew.gangs });
    }
    if (ship.undercrew.packs && ship.undercrew.packs.length > 0) {
      undercrewCategories.push({ label: 'Packs', items: ship.undercrew.packs });
    }
  }
  html += renderInventorySection('Undercrew', undercrewCategories);

  // Stakes indicator inline under the list
  const stakesSpent = calculateStakesSpent(ship);
  const stakesBudget = calculateStakesBudget(ship);
  const budgetColor = stakesSpent > stakesBudget ? '#EF4444' : stakesSpent === stakesBudget ? '#10B981' : '#1F2937';

  html += '<div style="padding-top: 16px; border-top: 2px solid #D1D5DB;">';
  html += '<div style="display: flex; justify-content: space-between; align-items: baseline;">';
  html += '<span style="font-size: 12px; font-weight: 600; color: #374151;">Stakes</span>';
  html += `<span style="font-size: 14px; font-weight: 700; color: ${budgetColor};">${stakesSpent} / ${stakesBudget}</span>`;
  html += '</div>';
  html += '</div>';

  html += '</div>';

  return html;
}

/**
 * Render a section of the inventory
 * @param {string} sectionTitle - Title for the section
 * @param {Array} categories - Array of {label, items} objects
 * @returns {string} HTML string
 */
function renderInventorySection(sectionTitle, categories) {
  let html = '<div style="margin-bottom: 24px;">';

  // Section title
  html += `<div class="ship-ratings-heading">${sectionTitle}</div>`;

  // Categories
  categories.forEach(category => {
    // Category label (show if required or if there are items)
    if (category.required || category.items.length > 0) {
      html += `<div style="font-size: 10px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; margin-top: 8px; margin-bottom: 4px;">${category.label}</div>`;
    }

    // Items
    if (category.items.length > 0) {
      category.items.forEach(item => {
        html += renderInventoryItem(item);
      });
    } else if (category.required) {
      // Show error message for required but empty items
      html += '<div style="font-size: 12px; color: #EF4444; font-weight: 600; padding: 2px 0;">REQUIRED</div>';
    }
  });

  html += '</div>';

  return html;
}

/**
 * Render a single inventory item
 * @param {Object} item - Item with name and stakes
 * @returns {string} HTML string
 */
function renderInventoryItem(item) {
  return `<div style="display: flex; justify-content: space-between; align-items: baseline; padding: 2px 0; font-size: 12px; color: #374151;">
    <span style="flex: 1;">${item.name}</span>
    <span style="font-size: 10px; color: #6B7280; margin-left: 8px;">${item.stakes}</span>
  </div>`;
}
