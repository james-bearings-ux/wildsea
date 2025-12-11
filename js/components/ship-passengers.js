/**
 * Ship passengers rendering component
 * Parallel to cargo management
 */

import { escapeHtmlAttr, createDataParams } from '../utils/escaping.js';

/**
 * Render passengers management interface
 * @param {Object} ship - Ship object
 * @returns {string} HTML string
 */
export function renderShipPassengers(ship) {
  const passengers = ship.passengers || [];

  let html = '<div>';

  html += '<h2 class="section-header">Passengers</h2>';

  html += '<div class="flex-col-gap">';

  // Render each passenger item
  for (let i = 0; i < passengers.length; i++) {
    const item = passengers[i];
    html += '<div class="passenger-row">';
    html += '<input type="text" ';
    html += `value="${escapeHtmlAttr(item.name)}" `;
    html += 'placeholder="Name your passenger..." ';
    html += 'data-action="updatePassengerName" ';
    html += createDataParams({ id: item.id }) + ' ';
    html += 'class="passenger-input">';
    html += '<button data-action="removePassenger" ';
    html += createDataParams({ id: item.id }) + ' ';
    html += 'class="btn-tertiary">✕</button>';
    html += '</div>';
  }

  // Add new passenger button
  html += '<button class="btn-subtle" data-action="addPassenger">+ New Passenger</button>';

  html += '</div>';
  html += '</div>';

  return html;
}
