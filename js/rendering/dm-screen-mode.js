/**
 * DM Screen rendering mode
 * Routes between the DM screen tabs (Dashboard / NPCs / Resources / Aspects / Players).
 * The Dashboard body is delegated to js/components/dm-dashboard.js.
 */

import { loadShip } from '../state/ship.js';
import { loadCharacter } from '../state/character.js';
import { loadCharacterCached, loadShipCached } from '../cache/supabase-cache.js';
import { renderNPCPanel } from '../components/npc-panel.js';
import { renderResourcesPanel } from '../components/resources-panel.js';
import { renderAspectsPanel } from '../components/aspects-panel.js';
import { renderPlayersPanel } from '../components/players-panel.js';
import { renderDashboard } from '../components/dm-dashboard.js';

/**
 * Order characters for the DM screen: alphabetical by name, with characters
 * controlled by an online player pinned to the top (stable within each group).
 * @param {Array} characters
 * @param {Set<string>} onlineCharacterIds
 * @returns {Array} new sorted array
 */
export function sortCharacters(characters, onlineCharacterIds = new Set()) {
  const alpha = characters.slice().sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  // Stable sort: online first (JS Array.sort is stable, so alpha order is preserved within groups).
  return alpha.sort((a, b) =>
    (onlineCharacterIds.has(b.id) ? 1 : 0) - (onlineCharacterIds.has(a.id) ? 1 : 0));
}

async function loadSessionCharacters(session) {
  const characters = [];
  for (const charId of session.activeCharacterIds || []) {
    const character = await loadCharacterCached(charId, loadCharacter);
    if (character) characters.push(character);
  }
  return characters;
}

/**
 * Render DM screen with tabs: Dashboard, NPCs, Resources, Aspects, Players (DM-only)
 * @param {Object} session - Current session object
 * @param {string|null} expandedAccordion - Reserved (unused by the tabular dashboard)
 * @param {string} activeDMTab - 'dashboard' | 'npcs' | 'resources' | 'aspects' | 'players'
 * @param {Array} npcs - NPC data from Supabase
 * @param {string} userRole - Current user's role ('dm' or 'player')
 * @param {Object} npcState - { sortBy, sortDir, search }
 * @param {Object} resourceState - { sortBy, sortDir }
 * @param {Object} aspectState - { filters, sortBy, sortDir }
 * @param {Object} dashboardState - { mode, players, onlineCharacterIds, onlineEmails }
 * @returns {Promise<string>} HTML string
 */
export async function renderDMScreen(session, expandedAccordion = null, activeDMTab = 'dashboard', npcs = [], userRole = 'player', npcState = {}, resourceState = {}, aspectState = {}, dashboardState = {}) {
  const {
    mode = 'rp',
    players = [],
    onlineCharacterIds = new Set(),
    onlineEmails = new Set(),
  } = dashboardState;

  const isDM = userRole === 'dm';
  // Non-DMs never reach the DM-only Players tab.
  const effectiveTab = (activeDMTab === 'players' && !isDM) ? 'dashboard' : activeDMTab;

  let html = '<div class="dm-screen-outer">';

  // Tab bar
  html += '<div class="dm-tabs">';
  html += `<button class="dm-tab${effectiveTab === 'dashboard' ? ' dm-tab-active' : ''}" data-action="switchDMTab" data-params='{"tab":"dashboard"}'>Dashboard</button>`;
  html += `<button class="dm-tab${effectiveTab === 'npcs' ? ' dm-tab-active' : ''}" data-action="switchDMTab" data-params='{"tab":"npcs"}'>NPCs</button>`;
  html += `<button class="dm-tab${effectiveTab === 'resources' ? ' dm-tab-active' : ''}" data-action="switchDMTab" data-params='{"tab":"resources"}'>Resources</button>`;
  html += `<button class="dm-tab${effectiveTab === 'aspects' ? ' dm-tab-active' : ''}" data-action="switchDMTab" data-params='{"tab":"aspects"}'>Aspects</button>`;
  if (isDM) {
    html += `<button class="dm-tab${effectiveTab === 'players' ? ' dm-tab-active' : ''}" data-action="switchDMTab" data-params='{"tab":"players"}'>Players</button>`;
  }
  html += '</div>';

  if (effectiveTab === 'npcs') {
    html += '<div class="dm-npcs-container">';
    html += '<h1 class="dm-screen-title">NPCs</h1>';
    html += renderNPCPanel(npcs, userRole, npcState);
    html += '</div>';
  } else if (effectiveTab === 'resources') {
    const characters = await loadSessionCharacters(session);
    html += '<div class="dm-resources-container">';
    html += '<h1 class="dm-screen-title">Resources</h1>';
    html += renderResourcesPanel(characters, resourceState.sortBy, resourceState.sortDir);
    html += '</div>';
  } else if (effectiveTab === 'aspects') {
    html += '<div class="dm-aspects-container">';
    html += '<h1 class="dm-screen-title">Aspects</h1>';
    html += renderAspectsPanel(aspectState.filters, aspectState.sortBy, aspectState.sortDir);
    html += '</div>';
  } else if (effectiveTab === 'players') {
    const characters = await loadSessionCharacters(session);
    html += '<div class="dm-players-container">';
    html += '<h1 class="dm-screen-title">Players</h1>';
    html += renderPlayersPanel(players, characters, userRole, onlineEmails);
    html += '</div>';
  } else {
    // Dashboard tab — full-width, mode-driven crew overview
    const characters = sortCharacters(await loadSessionCharacters(session), onlineCharacterIds);
    let ship = null;
    if (session.activeShipId) {
      ship = await loadShipCached(session.activeShipId, loadShip);
    }

    html += '<div class="dm-screen-container">';
    html += '<h1 class="dm-screen-title">DM Screen</h1>';
    html += renderDashboard(ship, characters, mode, onlineCharacterIds);
    html += '</div>';
  }

  html += '</div>'; // dm-screen-outer

  return html;
}
