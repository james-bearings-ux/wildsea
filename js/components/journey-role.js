// js/components/journey-role.js
// Journey role selector and tooltip components

import { getGameData } from '../data/loader.js';

// Sailing icon SVG (inline with currentColor for theme support)
const sailingIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="m120-420 320-460v460H120Zm153-80h87v-125l-87 125Zm227 80q12-28 26-98t14-142q0-72-13.5-148T500-920q61 18 121.5 67t109 117q48.5 68 79 149.5T840-420H500Zm104-80h148q-17-77-55.5-141T615-750q2 21 3.5 43.5T620-660q0 47-4.5 87T604-500ZM360-200q-36 0-67-17t-53-43q-14 15-30.5 28T173-211q-35-26-59.5-64.5T80-360h800q-9 46-33.5 84.5T787-211q-20-8-36.5-21T720-260q-23 26-53.5 43T600-200q-36 0-67-17t-53-43q-22 26-53 43t-67 17ZM80-40v-80h40q32 0 62.5-10t57.5-30q27 20 57.5 29.5T360-121q32 0 62-9.5t58-29.5q27 20 57.5 29.5T600-121q32 0 62-9.5t58-29.5q28 20 58 30t62 10h40v80h-40q-31 0-61-7.5T720-70q-29 15-59 22.5T600-40q-31 0-61-7.5T480-70q-29 15-59 22.5T360-40q-31 0-61-7.5T240-70q-29 15-59 22.5T120-40H80Zm280-460Zm244 0Z"/></svg>`;

// Close icon SVG (inline with currentColor for theme support)
const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>`;

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

  // Mobile icon button to open role selector modal
  const mobileButton = `
    <button
      type="button"
      class="role-selector-mobile-btn"
      data-action="openRoleSelectorModal"
      aria-label="Select journey role">
      ${sailingIcon}
    </button>
  `;

  // Desktop role selector (hidden on mobile)
  const desktopSelector = `
    <div class="role-selector role-selector-desktop">
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

  return mobileButton + desktopSelector;
}

/**
 * Render the role selector modal (for mobile)
 * Full-screen modal with role dropdown centered
 * @param {string} currentRole - Currently selected role
 * @returns {string} HTML string
 */
export function renderRoleSelectorModal(currentRole) {
  const GAME_DATA = getGameData();
  const roles = GAME_DATA.journeyRoles || [];

  const roleOptions = roles.map(role => {
    const value = role.name.toLowerCase().replace(/ /g, '-');
    const selected = currentRole === value ? 'selected' : '';
    return `<option value="${value}" ${selected}>${role.name}</option>`;
  }).join('');

  return `
    <div class="role-selector-modal-overlay" data-action="closeRoleSelectorModal">
      <button
        type="button"
        class="role-selector-modal-close"
        data-action="closeRoleSelectorModal"
        aria-label="Close">
        ${closeIcon}
      </button>
      <div class="role-selector-modal-content" onclick="event.stopPropagation()">
        <label class="role-selector-modal-label">Role:</label>
        <select
          data-action="setJourneyRoleFromModal"
          class="role-selector-modal-dropdown">
          <option value="">Select a role</option>
          ${roleOptions}
        </select>
      </div>
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
