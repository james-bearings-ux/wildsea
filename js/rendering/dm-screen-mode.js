/**
 * DM Screen rendering mode
 * Routes between the DM screen tabs (Dashboard / NPCs / Resources / Aspects).
 * The Dashboard body is delegated to js/components/dm-dashboard.js.
 */

import { loadShip } from '../state/ship.js';
import { loadCharacter } from '../state/character.js';
import { loadCharacterCached, loadShipCached } from '../cache/supabase-cache.js';
import { renderNPCPanel } from '../components/npc-panel.js';
import { renderResourcesPanel } from '../components/resources-panel.js';
import { renderAspectsPanel } from '../components/aspects-panel.js';
import { renderDashboard } from '../components/dm-dashboard.js';

/**
 * Render DM screen with tabs: Dashboard, NPCs, Resources, Aspects
 * @param {Object} session - Current session object
 * @param {string|null} expandedAccordion - Reserved (unused by the tabular dashboard)
 * @param {string} activeDMTab - Active tab: 'dashboard' | 'npcs' | 'resources' | 'aspects'
 * @param {Array} npcs - NPC data from Supabase
 * @param {string} userRole - Current user's role ('dm' or 'player')
 * @param {Object} npcState - { sortBy, sortDir, search }
 * @param {Object} resourceState - { sortBy, sortDir }
 * @param {Object} aspectState - { filters, sortBy, sortDir }
 * @param {string} dashboardMode - Dashboard mode: 'rp' | 'exploration' | 'combat'
 * @returns {Promise<string>} HTML string
 */
export async function renderDMScreen(session, expandedAccordion = null, activeDMTab = 'dashboard', npcs = [], userRole = 'player', npcState = {}, resourceState = {}, aspectState = {}, dashboardMode = 'rp') {
  let html = '<div class="dm-screen-outer">';

  // Tab bar
  html += '<div class="dm-tabs">';
  html += `<button class="dm-tab${activeDMTab === 'dashboard' ? ' dm-tab-active' : ''}" data-action="switchDMTab" data-params='{"tab":"dashboard"}'>Dashboard</button>`;
  html += `<button class="dm-tab${activeDMTab === 'npcs' ? ' dm-tab-active' : ''}" data-action="switchDMTab" data-params='{"tab":"npcs"}'>NPCs</button>`;
  html += `<button class="dm-tab${activeDMTab === 'resources' ? ' dm-tab-active' : ''}" data-action="switchDMTab" data-params='{"tab":"resources"}'>Resources</button>`;
  html += `<button class="dm-tab${activeDMTab === 'aspects' ? ' dm-tab-active' : ''}" data-action="switchDMTab" data-params='{"tab":"aspects"}'>Aspects</button>`;
  html += '</div>';

  if (activeDMTab === 'npcs') {
    // NPCs tab — full-width content area
    html += '<div class="dm-npcs-container">';
    html += '<h1 class="dm-screen-title">NPCs</h1>';
    html += renderNPCPanel(npcs, userRole, npcState);
    html += '</div>';
  } else if (activeDMTab === 'resources') {
    // Resources tab — aggregated view of all character resources
    const characters = [];
    for (const charId of session.activeCharacterIds || []) {
      const character = await loadCharacterCached(charId, loadCharacter);
      if (character) characters.push(character);
    }
    html += '<div class="dm-resources-container">';
    html += '<h1 class="dm-screen-title">Resources</h1>';
    html += renderResourcesPanel(characters, resourceState.sortBy, resourceState.sortDir);
    html += '</div>';
  } else if (activeDMTab === 'aspects') {
    // Aspects tab — full game aspects reference with filters
    html += '<div class="dm-aspects-container">';
    html += '<h1 class="dm-screen-title">Aspects</h1>';
    html += renderAspectsPanel(aspectState.filters, aspectState.sortBy, aspectState.sortDir);
    html += '</div>';
  } else {
    // Dashboard tab — full-width, mode-driven crew overview
    const characters = [];
    for (const charId of session.activeCharacterIds || []) {
      const character = await loadCharacterCached(charId, loadCharacter);
      if (character) characters.push(character);
    }
    let ship = null;
    if (session.activeShipId) {
      ship = await loadShipCached(session.activeShipId, loadShip);
    }

    html += '<div class="dm-screen-container">';
    html += '<h1 class="dm-screen-title">DM Screen</h1>';
    html += renderDashboard(ship, characters, dashboardMode);
    html += '</div>';
  }

  html += '</div>'; // dm-screen-outer

  return html;
}
