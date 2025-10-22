// js/components/journey-role.js
// Journey role selector and tooltip components

import { getGameData } from '../data/loader.js';

/**
 * Render the role selector dropdown with info button
 * Only rendered when journey is active
 * @param {string} currentRole - Currently selected role
 * @param {boolean} journeyActive - Whether journey mode is active
 * @returns {string} HTML string
 */
export function renderRoleSelector(currentRole, journeyActive) {
  if (!journeyActive) return '';

  const GAME_DATA = getGameData();
  const roles = GAME_DATA.journeyRoles || [];

  const roleOptions = roles.map(role => {
    const value = role.name.toLowerCase().replace(/ /g, '-');
    const selected = currentRole === value ? 'selected' : '';
    return `<option value="${value}" ${selected}>${role.name}</option>`;
  }).join('');

  return `
    <div class="role-selector flex items-center gap-2">
      <label class="font-semibold mg-0">Role:</label>
      <select
        data-action="setJourneyRole"
        class="role-dropdown border rounded px-2 py-1 bg-white">
        <option value="">Select a role</option>
        ${roleOptions}
      </select>
      <button
        data-action="showRoleTooltip"
        data-params='${JSON.stringify({ role: currentRole })}'
        class="info-icon hover:opacity-75"
        style="color: white;"
        aria-label="Role information">
        ⓘ
      </button>
    </div>
  `;
}

/**
 * Render the role tooltip/modal
 * @param {string} roleName - Role name (kebab-case)
 * @returns {string} HTML string
 */
export function renderRoleTooltip(roleName) {
  if (!roleName) return '';

  const GAME_DATA = getGameData();
  const roles = GAME_DATA.journeyRoles || [];

  // Convert kebab-case to title case for lookup
  const roleTitle = roleName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const roleData = roles.find(r => r.name === roleTitle);

  if (!roleData) return '';

  return `
    <div
      class="role-tooltip-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-action="closeTooltip">
      <div
        class="role-tooltip bg-white rounded-lg p-6 shadow-xl max-w-md"
        style="border: 3px solid #FF8C42;"
        onclick="event.stopPropagation()">
        <h3 style="color: #FF8C42;" class="font-bold text-xl mb-3">${roleData.name}</h3>
        <p class="whitespace-pre-line text-sm text-gray-700 mb-4">${roleData.instructions}</p>
        <button
          data-action="closeTooltip"
          class="px-4 py-2 text-white rounded hover:opacity-90"
          style="background-color: #FF8C42;">
          Close
        </button>
      </div>
    </div>
  `;
}
