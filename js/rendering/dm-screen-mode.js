/**
 * DM Screen rendering mode
 * Displays prioritized summary of ship and character status
 */

import { calculateShipHealth, calculateCharacterHealth } from '../utils/health-calculations.js';
import { loadShip } from '../state/ship.js';
import { loadCharacter } from '../state/character.js';

/**
 * Render read-only drives for DM screen
 * Reuses drive-input styling but displays as read-only divs
 * @param {Object} character - Character object
 * @returns {string} HTML string
 */
function renderDrivesReadOnly(character) {
  let html = '<div><h2 class="section-header">Drives</h2>';
  html += '<div class="flex-col gap-md">';

  for (let i = 0; i < character.drives.length; i++) {
    const drive = character.drives[i];
    const displayText = drive || '<span style="color: #9CA3AF; font-style: italic;">No drive set</span>';
    html += '<div class="drive-input" style="cursor: default;">';
    html += displayText;
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

/**
 * Render read-only mires for DM screen
 * Reuses mire-row styling but non-interactive
 * @param {Object} character - Character object
 * @returns {string} HTML string
 */
function renderMiresReadOnly(character) {
  let html = '<div><h2 class="section-header">Mires</h2>';
  html += '<div class="flex-col gap-md">';

  for (let i = 0; i < character.mires.length; i++) {
    const mire = character.mires[i];
    html += '<div class="mire-row">';

    // First track box
    const state1 = mire.checkbox1 ? 'marked' : '';
    const stateChar1 = mire.checkbox1 ? '/' : '';
    html += '<div class="track-box ' + state1 + '">' + stateChar1 + '</div>';

    // Second track box
    const state2 = mire.checkbox2 ? 'marked' : '';
    const stateChar2 = mire.checkbox2 ? '/' : '';
    html += '<div class="track-box ' + state2 + '">' + stateChar2 + '</div>';

    // Mire text
    const displayText = mire.text || '<span style="color: #9CA3AF; font-style: italic;">No mire set</span>';
    html += '<div class="mire-input" style="cursor: default;">';
    html += displayText;
    html += '</div>';
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

/**
 * Render read-only tasks for DM screen
 * Reuses task-row styling but hides buttons
 * @param {Object} character - Character object
 * @returns {string} HTML string
 */
function renderTasksReadOnly(character) {
  let html = '<div><h2 class="section-header">Tasks</h2>';

  if (character.tasks.length === 0) {
    html += '<div style="color: #9CA3AF; font-style: italic; padding: 12px 0;">No tasks</div>';
  } else {
    for (let i = 0; i < character.tasks.length; i++) {
      const task = character.tasks[i];

      html += '<div class="task-row" style="margin-bottom: 8px;">';
      html += '<div style="flex: 1; display: flex; align-items: center; gap: 12px;">';
      html += '<div class="task-name">' + (task.name || 'Unnamed Task') + '</div>';

      // Render clock (non-interactive)
      html += '<div class="task-clock">';
      for (let j = 0; j < task.maxTicks; j++) {
        const filled = j < task.currentTicks;
        html += '<div class="clock-tick ' + (filled ? 'filled' : '') + '"></div>';
      }
      html += '</div>';

      html += '<div class="task-progress">' + task.currentTicks + '/' + task.maxTicks + '</div>';
      html += '</div>';
      html += '</div>';
    }
  }

  html += '</div>';
  return html;
}

/**
 * Render DM screen with ship and character summaries
 * @param {Object} session - Current session object
 * @param {string|null} expandedAccordion - ID of expanded accordion (null if all collapsed)
 * @returns {Promise<string>} HTML string
 */
export async function renderDMScreen(session, expandedAccordion = null) {
  let html = '<div class="dm-screen-container">';

  html += '<h1 class="dm-screen-title">DM Screen</h1>';

  // Ship summary row
  if (session.activeShipId) {
    const ship = await loadShip(session.activeShipId);
    if (ship) {
      html += renderShipSummary(ship);
    }
  } else {
    html += '<div class="dm-row dm-row-empty">';
    html += '<div class="dm-summary">No ship in session</div>';
    html += '</div>';
  }

  // Character summary rows
  if (session.activeCharacterIds && session.activeCharacterIds.length > 0) {
    for (const charId of session.activeCharacterIds) {
      const character = await loadCharacter(charId);
      if (character) {
        html += renderCharacterSummary(character, expandedAccordion === charId);
      }
    }
  } else {
    html += '<div class="dm-row dm-row-empty">';
    html += '<div class="dm-summary">No characters in session</div>';
    html += '</div>';
  }

  html += '</div>';

  return html;
}

/**
 * Render health bar visual
 * @param {number} current - Current health
 * @param {number} max - Max health
 * @returns {string} HTML string for health bar
 */
function renderHealthBar(current, max) {
  const percentage = max > 0 ? (current / max) * 100 : 0;

  let html = '<div class="dm-health-bar-container">';
  html += '<div class="dm-health-bar-fill" style="width: ' + percentage + '%;"></div>';
  html += '</div>';

  return html;
}

/**
 * Render ship summary row (static, no accordion)
 * @param {Object} ship - Ship object
 * @returns {string} HTML string
 */
function renderShipSummary(ship) {
  const health = calculateShipHealth(ship);

  let html = '<div class="dm-row dm-ship-static">';
  html += '<div class="dm-header-content">';
  html += '<div class="dm-name-section">';
  html += '<div class="dm-name">' + (ship.name || 'Unnamed Ship') + '</div>';
  html += '</div>';
  html += '<div class="dm-health">';
  html += renderHealthBar(health.current, health.max);
  html += '<span class="dm-health-value">' + health.current + '/' + health.max + '</span>';
  html += '</div>';
  html += '</div>';
  html += '</div>';

  return html;
}

/**
 * Render character summary row
 * @param {Object} character - Character object
 * @param {boolean} expanded - Whether accordion is expanded
 * @returns {string} HTML string
 */
function renderCharacterSummary(character, expanded) {
  const health = calculateCharacterHealth(character);

  // Build subtext: bloodline, origin, post
  const subtext = [character.bloodline, character.origin, character.post]
    .filter(Boolean)
    .join(', ');

  let html = '<div class="dm-row dm-row-character">';

  // Accordion header (always visible)
  html += '<button class="dm-accordion-header" data-action="toggleDMAccordion" data-params=\'{"id":"' + character.id + '"}\'>';
  html += '<div class="dm-header-content">';
  html += '<span class="dm-accordion-icon">' + (expanded ? '▼' : '▶') + '</span>';
  html += '<div class="dm-name-section">';
  html += '<div class="dm-name">' + (character.name || 'Unnamed Character') + '</div>';
  if (subtext) {
    html += '<div class="dm-subtext">' + subtext + '</div>';
  }
  html += '</div>';
  html += '<div class="dm-health">';
  html += renderHealthBar(health.current, health.max);
  html += '<span class="dm-health-value">' + health.current + '/' + health.max + '</span>';
  html += '</div>';
  html += '</div>';
  html += '</button>';

  // Accordion body (only visible when expanded)
  if (expanded) {
    html += '<div class="dm-accordion-body">';
    html += '<div class="dm-character-columns">';
    html += '<div class="dm-character-column">' + renderDrivesReadOnly(character) + '</div>';
    html += '<div class="dm-character-column">' + renderMiresReadOnly(character) + '</div>';
    html += '<div class="dm-character-column">' + renderTasksReadOnly(character) + '</div>';
    html += '</div>';
    html += '</div>';
  }

  html += '</div>';

  return html;
}
