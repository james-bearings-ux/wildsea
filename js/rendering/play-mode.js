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
import { renderDiceRoller } from '../components/dice-roller.js';
import { escapeHtmlContent, createDataParams } from '../utils/escaping.js';
import { generateCharacterGradient } from '../utils/character-image.js';

// Icons (inline SVG so currentColor inherits from button's CSS color)
const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="currentColor"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>`;

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
 * @param {Object|null} ship - Ship object (optional, for journey mode)
 * @returns {string} HTML string for header
 */
function renderCharacterHeader(character, ship) {
  // Check if journey mode is active and character has a role
  const journeyActive = ship?.journey?.active;
  const roleDisplay = character.journeyRole
    ? character.journeyRole.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';

  // Mobile-only role indicator (shown when journey is active and role is set)
  const mobileRoleIndicator = journeyActive && roleDisplay
    ? `<button type="button" class="char-header-role-mobile" data-action="openRoleSelectorModal" aria-label="Change journey role">${escapeHtmlContent(roleDisplay)}</button>`
    : '';

  // Generate abstract background gradient based on character name
  const backgroundGradient = generateCharacterGradient(character.name, 800, 120);

  return `
    <div data-section="character-header">
      <div class="char-header" style="background: ${backgroundGradient};">
        ${mobileRoleIndicator}
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
 * On mobile, these are presented as tabs: Resources, Damage Types, Motivations
 * @param {Object} character - Character object
 * @param {boolean} showAddTaskForm - Whether to show task form
 * @param {string} activeTab - Active tab for mobile view ('resources', 'damage-types', 'motivations')
 * @returns {string} HTML string for secondary grid
 */
function renderSecondaryGrid(character, showAddTaskForm, activeTab = 'resources') {
  return `
    <div class="play-secondary-tabs">
      <div class="play-tab-buttons">
        <button class="play-tab-btn ${activeTab === 'resources' ? 'active' : ''}"
                data-action="switchPlayTab" ${createDataParams({ tab: 'resources' })}>Resources</button>
        <button class="play-tab-btn ${activeTab === 'damage-types' ? 'active' : ''}"
                data-action="switchPlayTab" ${createDataParams({ tab: 'damage-types' })}>Damage Types</button>
        <button class="play-tab-btn ${activeTab === 'motivations' ? 'active' : ''}"
                data-action="switchPlayTab" ${createDataParams({ tab: 'motivations' })}>Motivations</button>
      </div>
    </div>
    <div class="grid-play-secondary">
      <div class="section-group resource-col play-tab-panel ${activeTab === 'resources' ? 'active' : ''}" data-tab="resources">
        <div data-section="resources" class="section-group-sm">
          ${renderResources(character)}
        </div>
        <div data-section="notes">
          ${renderNotes(character)}
        </div>
      </div>
      <div data-section="damage-types" class="play-tab-panel ${activeTab === 'damage-types' ? 'active' : ''}" data-tab="damage-types">
        ${renderDamageTypeTable(character)}
      </div>
      <div class="section-group play-tab-panel ${activeTab === 'motivations' ? 'active' : ''}" data-tab="motivations">
        <div data-section="drives">${renderDrives(character)}</div>
        <div data-section="mires">${renderMires(character)}</div>
        <div data-section="milestones">${renderMilestones(character)}</div>
        <div data-section="tasks">${renderTasks(character, showAddTaskForm)}</div>
      </div>
    </div>
  `;
}

/**
 * Render sticky action bar: dice roller | journey role | advancement + export + delete
 * @param {Object} character - Character object
 * @param {Object|null} ship - Ship object (optional)
 * @param {Array} diceRolls - Current dice rolls from session
 * @param {boolean} showDiceResults - Whether dice results panel is expanded
 * @param {string} userRole - Current user's role ('player' or 'dm')
 * @returns {string} HTML string for action bar
 */
function renderActionBar(character, ship, diceRolls, showDiceResults, userRole) {
  const roleSelector = ship && ship.journey && ship.journey.active
    ? renderRoleSelector(character.journeyRole, ship.journey.active)
    : '';

  return `
    <div class="sticky-action-bar">
      ${renderDiceRoller(diceRolls, showDiceResults, userRole)}
      <div class="flex flex-1 justify-center">
        ${roleSelector}
      </div>
      <div class="flex-gap-md">
        <button data-action="setMode" ${createDataParams({ mode: 'advancement' })}>Advancement</button>
        <button data-action="exportCharacter" title="Export Character" aria-label="Export Character" class="btn-icon-only">${downloadIcon}</button>
        <button ${createDataParams({ characterId: character.id })} data-action="removeCharacter" title="Delete" aria-label="Delete" class="btn-danger btn-icon-only"><img src="/wildsea/images/delete.svg" alt="" width="30" height="30"></button>
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
 * @param {string} activePlayTab - Active tab for mobile secondary grid
 * @param {Array} diceRolls - Current dice rolls from session
 * @param {boolean} showDiceResults - Whether dice results panel is expanded
 * @param {string} userRole - Current user's role ('player' or 'dm')
 */
export function renderPlayMode(app, character, gameData, showAddTaskForm = false, ship = null, activePlayTab = 'resources', diceRolls = [], showDiceResults = true, userRole = 'player') {
  const sortedAspects = prepareSortedAspects(character);

  app.innerHTML = `
    <div class="content-wrapper">
      ${renderCharacterHeader(character, ship)}
      ${renderMainGrid(character, gameData, sortedAspects)}
      <hr />
      ${renderSecondaryGrid(character, showAddTaskForm, activePlayTab)}
    </div>
    ${renderActionBar(character, ship, diceRolls, showDiceResults, userRole)}
  `;
}
