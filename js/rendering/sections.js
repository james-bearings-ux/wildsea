/**
 * Section-specific rendering logic for partial DOM updates
 * This module handles re-rendering individual sections without full page refresh
 */

import { renderEdges } from '../components/edges.js';
import { renderSkills, renderLanguages } from '../components/skills.js';
import { renderResources } from '../components/resources.js';
import { renderDrives, renderMires } from '../components/drives-mires.js';
import { renderMilestones } from '../components/milestones.js';
import { renderDamageTypeTable } from '../components/damage-summary.js';
import { getGameData } from '../data/loader.js';
import { highlightDamageTypesInDescription, renderDamageTypeWarning } from '../components/damage-type-selector.js';

/**
 * Render the character header section
 */
export function renderCharacterHeader(character) {
  return `
    <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #E5E7EB;">
      <div style="display: flex; gap: 48px; align-items: baseline;">
        <div>
          <div class="char-label">Character Name</div>
          <div class="char-name-header">${character.name}</div>
        </div>
        <div>
          <div class="char-label">Bloodline</div>
          <div class="char-name-header">${character.bloodline}</div>
        </div>
        <div>
          <div class="char-label">Origin</div>
          <div class="char-name-header">${character.origin}</div>
        </div>
        <div>
          <div class="char-label">Post</div>
          <div class="char-name-header">${character.post}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the aspects section (play mode)
 */
export function renderAspectsSection(character) {
  return `
    <div>
      <h2 class="section-header">Aspects</h2>
      ${character.selectedAspects.slice().sort((a, b) => a.name.localeCompare(b.name)).map(aspect => {
        let trackHTML = '<div style="display: flex; gap: 8px; padding-top: 4px; flex-shrink: 0; width: 165px;">';
        for (let i = 0; i < 5; i++) {
          if (i < aspect.trackSize) {
            const state = aspect.damageStates[i];
            const stateChar = state === 'marked' ? '/' : state === 'burned' ? 'X' : '';
            trackHTML += '<div class="track-box ' + state + '" data-action="cycleAspectDamage" data-params=\'{"id":"' + aspect.id + '","index":' + i + '}\' style="cursor: pointer;">' + stateChar + '</div>';
          } else {
            trackHTML += '<div style="width: 26px; height: 26px;"></div>';
          }
        }
        trackHTML += '</div>';

        return `
          <div style="margin-bottom: 8px; padding: 8px; border-radius: 2px;">
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              ${trackHTML}
              <div style="flex: 1; min-width: 0;">
                <div class="split">
                  <div class="aspect-name" style="margin-bottom: 4px;">${aspect.name}</div>
                  <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                </div>
                <div class="aspect-description">${highlightDamageTypesInDescription(aspect)}</div>
                ${renderDamageTypeWarning(aspect)}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Map of section names to their render functions
 * Each function takes (character, gameData) and returns HTML string
 */
export const SECTION_RENDERERS = {
  'character-header': (char) => renderCharacterHeader(char),
  'aspects': (char) => renderAspectsSection(char),
  'edges': (char, gameData) => renderEdges(char, gameData),
  'skills': (char, gameData) => renderSkills(char, gameData),
  'languages': (char, gameData) => renderLanguages(char, gameData),
  'resources': (char) => renderResources(char),
  'damage-types': (char) => renderDamageTypeTable(char),
  'drives': (char) => renderDrives(char),
  'mires': (char) => renderMires(char),
  'milestones': (char) => renderMilestones(char)
};

/**
 * Map actions to the sections they affect
 * This allows smart rendering to know which sections to update
 */
export const ACTION_TO_SECTIONS = {
  // Aspect actions
  'toggleAspect': ['aspects', 'damage-types'],
  'toggleAspectDamageType': ['aspects', 'damage-types'],
  'cycleAspectDamage': ['aspects', 'damage-types'],
  'expandAspectTrack': ['aspects'],

  // Edge/Skill/Language actions
  'toggleEdge': ['edges'],
  'adjustSkill': ['skills'],
  'adjustLanguage': ['languages'],

  // Resource actions
  'addResource': ['resources'],
  'removeResource': ['resources'],
  'updateResourceName': ['resources'],
  'populateDefaultResources': ['resources'],

  // Drive/Mire actions
  'updateDrive': ['drives'],
  'updateMire': ['mires'],
  'toggleMireCheckbox': ['mires'],

  // Milestone actions
  'addMilestone': ['milestones'],
  'toggleMilestoneUsed': ['milestones'],
  'deleteMilestone': ['milestones'],
  'updateMilestoneName': ['milestones'],
  'updateMilestoneScale': ['milestones'],

  // Character header actions
  'onCharacterNameChange': ['character-header'],
  'onBloodlineChange': ['character-header'],
  'onOriginChange': ['character-header'],
  'onPostChange': ['character-header']
};

/**
 * Render a specific section by name
 * @param {string} sectionName - Name of the section to render
 * @param {object} character - Character data
 * @returns {boolean} - True if section was found and updated
 */
export function renderSection(sectionName, character) {
  const container = document.querySelector(`[data-section="${sectionName}"]`);
  if (!container) {
    return false; // Section not found in current DOM
  }

  const renderer = SECTION_RENDERERS[sectionName];
  if (!renderer) {
    console.warn(`No renderer found for section: ${sectionName}`);
    return false;
  }

  const gameData = getGameData();
  container.innerHTML = renderer(character, gameData);
  return true;
}
