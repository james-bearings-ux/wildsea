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
    <div class="role-selector">
      <label class="role-label">Role:</label>
      <select
        data-action="setJourneyRole"
        class="role-dropdown">
        <option value="">Select a role</option>
        ${roleOptions}
      </select>
      <button
        type="button"
        data-action="showRoleTooltip"
        data-params='${JSON.stringify({ role: currentRole })}'
        class="info-icon"
        ${!currentRole ? 'disabled' : ''}
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

  // Find role by converting kebab-case back to match the original name
  // Do case-insensitive comparison since we don't know the exact casing
  const roleData = roles.find(r => {
    const kebabName = r.name.toLowerCase().replace(/ /g, '-');
    return kebabName === roleName;
  });

  if (!roleData) {
    console.warn('Role not found:', roleName);
    return '';
  }

  return `
    <div
      class="role-tooltip-overlay"
      data-action="closeTooltip">
      <div class="role-tooltip">
        <h3 class="role-tooltip-title">${roleData.name}</h3>
        <p class="role-tooltip-text">${roleData.instructions}</p>
        <button
          type="button"
          data-action="closeTooltip"
          class="role-tooltip-close-btn">
          Close
        </button>
      </div>
    </div>
  `;
}
