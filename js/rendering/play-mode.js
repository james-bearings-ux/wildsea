/**
 * Play mode rendering - Refactored with front-end best practices
 */

import { renderEdges } from '../components/edges.js';
import { renderSkills, renderLanguages } from '../components/skills.js';
import { renderResources } from '../components/resources.js';
import { renderDrives, renderMires } from '../components/drives-mires.js';
import { renderMilestones } from '../components/milestones.js';
import { renderTasks } from '../components/tasks.js';
import { renderNotes } from '../components/notes.js';
import { renderDamageTypeTable } from '../components/damage-summary.js';
import { highlightDamageTypesInDescription, renderDamageTypeWarning } from '../components/damage-type-selector.js';
import { renderRoleSelector } from '../components/journey-role.js';
import { escapeHtmlContent, createDataParams } from '../utils/escaping.js';

// Constants
const MAX_ASPECT_TRACK_DISPLAY = 8;
const DAMAGE_STATE_SYMBOLS = {
  marked: '/',
  burned: '✕',
  default: ''
};

/**
 * Prepare aspects sorted alphabetically
 * @param {Object} character - Character object
 * @returns {Array} Sorted array of aspects
 */
function prepareSortedAspects(character) {
  return character.selectedAspects.slice().sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Render interactive aspect track boxes
 * @param {Object} aspect - Aspect object with id, trackSize, damageStates
 * @returns {string} HTML string for track
 */
function renderAspectTrack(aspect) {
  let html = '<div class="aspect-play-track">';

  for (let i = 0; i < MAX_ASPECT_TRACK_DISPLAY; i++) {
    if (i < aspect.trackSize) {
      const state = aspect.damageStates[i];
      const stateChar = DAMAGE_STATE_SYMBOLS[state] || DAMAGE_STATE_SYMBOLS.default;

      html += `<div class="track-box ${state}" `;
      html += `${createDataParams({ id: aspect.id, index: i })} `;
      html += 'data-action="cycleAspectDamage" ';
      html += 'style="cursor: pointer;">';
      html += stateChar;
      html += '</div>';
    } else {
      html += '<div class="track-spacer"></div>';
    }
  }

  html += '</div>';
  return html;
}

/**
 * Render complete aspect card with track and content
 * @param {Object} aspect - Aspect object
 * @returns {string} HTML string for aspect card
 */
function renderAspectCard(aspect) {
  return `
    <div class="aspect-play-row">
      ${renderAspectTrack(aspect)}
      <div class="aspect-play-content">
        <div class="split">
          <div class="aspect-name">${escapeHtmlContent(aspect.name)}</div>
          <div class="aspect-meta">${escapeHtmlContent(aspect.source)} ${escapeHtmlContent(aspect.type)}</div>
        </div>
        <div class="aspect-description">${highlightDamageTypesInDescription(aspect)}</div>
        ${renderDamageTypeWarning(aspect)}
      </div>
    </div>
  `;
}

/**
 * Render character header with name, bloodline, origin, post
 * @param {Object} character - Character object
 * @returns {string} HTML string for header
 */
function renderCharacterHeader(character) {
  return `
    <div data-section="character-header">
      <div class="char-header">
        <div class="char-header-row">
          <div>
            <div class="char-label">Character Name</div>
            <div class="char-name-header">${escapeHtmlContent(character.name)}</div>
          </div>
          <div>
            <div class="char-label">Bloodline</div>
            <div class="char-name-header">${escapeHtmlContent(character.bloodline)}</div>
          </div>
          <div>
            <div class="char-label">Origin</div>
            <div class="char-name-header">${escapeHtmlContent(character.origin)}</div>
          </div>
          <div>
            <div class="char-label">Post</div>
            <div class="char-name-header">${escapeHtmlContent(character.post)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render aspects section with all aspect cards
 * @param {Array} sortedAspects - Sorted array of aspects
 * @returns {string} HTML string for aspects section
 */
function renderAspectsSection(sortedAspects) {
  return `
    <div data-section="aspects">
      <div>
        <h2 class="section-header">Aspects</h2>
        ${sortedAspects.map(aspect => renderAspectCard(aspect)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render main play grid (edges, skills, languages, aspects)
 * @param {Object} character - Character object
 * @param {Object} gameData - Game data
 * @param {Array} sortedAspects - Pre-sorted aspects
 * @returns {string} HTML string for main grid
 */
function renderMainGrid(character, gameData, sortedAspects) {
  return `
    <div class="grid-play-main">
      <div data-section="edges">${renderEdges(character, gameData)}</div>
      <div data-section="skills">${renderSkills(character, gameData)}</div>
      <div data-section="languages">${renderLanguages(character, gameData)}</div>
      ${renderAspectsSection(sortedAspects)}
    </div>
  `;
}

/**
 * Render secondary play grid (resources, damage types, drives/mires/milestones/tasks)
 * @param {Object} character - Character object
 * @param {boolean} showAddTaskForm - Whether to show task form
 * @returns {string} HTML string for secondary grid
 */
function renderSecondaryGrid(character, showAddTaskForm) {
  return `
    <div class="grid-play-secondary">
      <div class="section-group resource-col">
        <div data-section="resources" class="section-group-sm">
          ${renderResources(character)}
        </div>
        <div data-section="notes">
          ${renderNotes(character)}
        </div>
      </div>
      <div data-section="damage-types">
        ${renderDamageTypeTable(character)}
      </div>
      <div class="section-group">
        <div data-section="drives">${renderDrives(character)}</div>
        <div data-section="mires">${renderMires(character)}</div>
        <div data-section="milestones">${renderMilestones(character)}</div>
        <div data-section="tasks">${renderTasks(character, showAddTaskForm)}</div>
      </div>
    </div>
  `;
}

/**
 * Render sticky action bar with delete, export, role selector, advancement
 * @param {Object} character - Character object
 * @param {Object|null} ship - Ship object (optional)
 * @returns {string} HTML string for action bar
 */
function renderActionBar(character, ship) {
  const roleSelector = ship && ship.journey && ship.journey.active
    ? renderRoleSelector(character.journeyRole, ship.journey.active)
    : '';

  return `
    <div class="sticky-action-bar flex-between">
      <div class="flex-gap-md">
        <button ${createDataParams({ characterId: character.id })} data-action="removeCharacter" class="btn-danger">Delete</button>
        <button data-action="exportCharacter">Export</button>
      </div>
      <div class="flex flex-1 justify-center">
        ${roleSelector}
      </div>
      <div>
        <button data-action="setMode" ${createDataParams({ mode: 'advancement' })}>Advancement</button>
      </div>
    </div>
  `;
}

/**
 * Main render function for play mode
 * @param {HTMLElement} app - App container element
 * @param {Object} character - Character object
 * @param {Object} gameData - Game data
 * @param {boolean} showAddTaskForm - Whether to show task form
 * @param {Object|null} ship - Ship object (optional)
 */
export function renderPlayMode(app, character, gameData, showAddTaskForm = false, ship = null) {
  const sortedAspects = prepareSortedAspects(character);

  app.innerHTML = `
    <div class="content-wrapper">
      ${renderCharacterHeader(character)}
      ${renderMainGrid(character, gameData, sortedAspects)}
      <hr />
      ${renderSecondaryGrid(character, showAddTaskForm)}
    </div>
    ${renderActionBar(character, ship)}
  `;
}
