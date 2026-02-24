/**
 * Advancement mode rendering
 */

import { getAvailableAspects, BUDGETS } from '../state/character.js';
import { renderSmallTrack, renderInteractiveTrack } from '../components/aspects.js';
import { renderEdgesSkillsLanguagesRow } from '../components/edges.js';
import { renderSkills, renderLanguages } from '../components/skills.js';
import { renderMilestones } from '../components/milestones.js';
import { renderAspectCustomizationModal } from '../components/aspect-customization-modal.js';
import { renderAspectSelectionModal } from '../components/aspect-selection-modal.js';
import {
  renderDamageTypeSelector,
  renderDamageTypeWarning,
  renderSelectedDamageTypes,
  highlightDamageTypesInDescription
} from '../components/damage-type-selector.js';
import { escapeHtmlAttr, escapeHtmlContent, createDataParams } from '../utils/escaping.js';
import { generateCharacterGradient } from '../utils/character-image.js';

/**
 * Render character header for advancement mode
 */
export function renderAdvancementCharacterHeader(character) {
  const backgroundGradient = generateCharacterGradient(character.name, 800, 120);
  return `
    <div class="char-header" style="background: ${backgroundGradient};">
      <div class="char-header-row">
        <div>
          <div class="char-label">Character Name</div>
          <input type="text" value="${escapeHtmlAttr(character.name)}"
                  data-action="onCharacterNameChange"
                  placeholder="Enter name..."
                  class="char-header-input">
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
  `;
}

/**
 * Render a single aspect card for advancement mode
 */
function renderAspectCard(aspect, character, aspectsSelected) {
  const id = aspect.source + '-' + aspect.name;
  const escapedId = id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const selectedAspect = character.selectedAspects.find(a => a.id === id);
  const isSelected = !!selectedAspect;
  const isDisabled = !isSelected && aspectsSelected >= BUDGETS.maxAspectsAdvancement;

  const displayName = isSelected && selectedAspect ? selectedAspect.name : aspect.name;
  const displayDescription = isSelected && selectedAspect ? selectedAspect.description : aspect.description;

  return `
    <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
         data-action="toggleAspect" ${createDataParams({ id })}>
      ${isSelected ? renderInteractiveTrack(selectedAspect, escapedId) : renderSmallTrack(aspect.track)}
      <div class="split">
        <div class="aspect-name">${displayName}</div>
        <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
      </div>
      <div class="aspect-description">${highlightDamageTypesInDescription(selectedAspect || aspect)}</div>
      ${isSelected && selectedAspect ? renderDamageTypeWarning(selectedAspect) : ''}
      ${isSelected && selectedAspect ? renderDamageTypeSelector(selectedAspect, 'advancement') : ''}
      ${isSelected && selectedAspect ? renderSelectedDamageTypes(selectedAspect, character) : ''}
    </div>
  `;
}

/**
 * Render bloodline aspects section for advancement mode
 */
export function renderBloodlineAspectsSection(character) {
  const allAspects = getAvailableAspects(character);
  const bloodlineAspects = allAspects.filter(a => a.category === 'Bloodline').sort((a, b) => a.name.localeCompare(b.name));
  const aspectsSelected = character.selectedAspects.length;

  return `
    <div class="flex-col-gap">
      <h3 class="subsection-header">${character.bloodline}</h3>
      ${bloodlineAspects.map(aspect => renderAspectCard(aspect, character, aspectsSelected)).join('')}
    </div>
  `;
}

/**
 * Render origin aspects section for advancement mode
 */
export function renderOriginAspectsSection(character) {
  const allAspects = getAvailableAspects(character);
  const originAspects = allAspects.filter(a => a.category === 'Origin').sort((a, b) => a.name.localeCompare(b.name));
  const aspectsSelected = character.selectedAspects.length;

  return `
    <div class="flex-col-gap">
      <h3 class="subsection-header">${character.origin}</h3>
      ${originAspects.map(aspect => renderAspectCard(aspect, character, aspectsSelected)).join('')}
    </div>
  `;
}

/**
 * Render post aspects section for advancement mode
 */
export function renderPostAspectsSection(character) {
  const allAspects = getAvailableAspects(character);
  const postAspects = allAspects.filter(a => a.category === 'Post').sort((a, b) => a.name.localeCompare(b.name));
  const aspectsSelected = character.selectedAspects.length;

  return `
    <div class="flex-col-gap">
      <h3 class="subsection-header">${character.post}</h3>
      ${postAspects.map(aspect => renderAspectCard(aspect, character, aspectsSelected)).join('')}
    </div>
  `;
}

/**
 * Render more aspects section for advancement mode
 */
export function renderMoreAspectsSection(character) {
  const moreAspects = character.selectedAspects.filter(aspect => {
    return aspect.source !== character.bloodline &&
           aspect.source !== character.origin &&
           aspect.source !== character.post;
  }).sort((a, b) => a.name.localeCompare(b.name));

  if (moreAspects.length === 0) {
    return '';
  }

  return `
    <div class="more-aspects-section">
      <h3 class="subsection-header">More Aspects</h3>
      <div class="grid-3col">
        ${moreAspects.map(selectedAspect => {
          const escapedId = selectedAspect.id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          return `
            <div class="aspect-card selected">
              ${renderInteractiveTrack(selectedAspect, escapedId)}
              <div class="split">
                <div class="aspect-name">${escapeHtmlContent(selectedAspect.name)}</div>
                <div class="aspect-meta">${escapeHtmlContent(selectedAspect.source)} ${escapeHtmlContent(selectedAspect.type)}</div>
              </div>
              <div class="aspect-description">${highlightDamageTypesInDescription(selectedAspect)}</div>
              ${renderDamageTypeWarning(selectedAspect)}
              ${renderDamageTypeSelector(selectedAspect, 'advancement')}
              ${renderSelectedDamageTypes(selectedAspect, character)}
              <button data-action="toggleAspect" ${createDataParams({ id: selectedAspect.id })}
                      class="btn-danger aspect-card-remove">
                Remove
              </button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

export function renderAdvancementMode(app, character, gameData, showCustomizeModal = false, selectedModalAspectId = null, modalUnsavedEdits = {}, showSelectAspectModal = false, searchQuery = '', selectedAspectForAdding = null) {
  const aspectsSelected = character.selectedAspects.length;

  app.innerHTML = `
    <div class="content-wrapper">
      <!-- Character Header: Editable name + read-only bloodline/origin/post -->
      <div data-section="character-header-advancement">
        ${renderAdvancementCharacterHeader(character)}
      </div>

      <!-- Aspects Section: 3-column grid + "More" section for extra aspects -->
      <!-- Interactive track expansion with +/- buttons, customization and selection modals -->
      <div class="advancement-aspects">
        <div class="advancement-aspects-header">
          <h2 class="section-header">Aspects</h2>
          <div class="flex-gap-md">
            <button data-action="openCustomizeModal" class="medium">Customize an Aspect</button>
            <button data-action="openSelectAspectModal" class="medium" ${aspectsSelected >= BUDGETS.maxAspectsAdvancement ? 'disabled' : ''}>Select More Aspects</button>
          </div>
        </div>
        <!-- 3-column grid for Bloodline, Origin, and Post aspects -->
        <div class="grid-3col">
          <div data-section="aspects-bloodline-advancement">
            ${renderBloodlineAspectsSection(character)}
          </div>
          <div data-section="aspects-origin-advancement">
            ${renderOriginAspectsSection(character)}
          </div>
          <div data-section="aspects-post-advancement">
            ${renderPostAspectsSection(character)}
          </div>
        </div>

        <!-- Additional aspects beyond bloodline/origin/post -->
        <div data-section="aspects-more-advancement">
          ${renderMoreAspectsSection(character)}
        </div>
      </div>
      <hr />

      <!-- Edges, Skills, Languages Section -->
      <div data-section="edges-skills-languages-advancement">
        ${renderEdgesSkillsLanguagesRow(renderSkills, renderLanguages, character, gameData)}
      </div>
      <hr />

      <!-- Milestones Section -->
      <div data-section="milestones-advancement">
        ${renderMilestones(character)}
      </div>
    </div>

    <!-- Sticky Action Bar: Save or cancel changes and return to play mode -->
    <div class="sticky-action-bar justify-end">
      <button data-action="setMode" data-params='{"mode":"play"}' class="primary">Save Changes</button>
      <button data-action="setMode" data-params='{"mode":"play"}'>Cancel</button>
    </div>

    <!-- Conditional Modals: Only rendered when showCustomizeModal or showSelectAspectModal is true -->
    ${showCustomizeModal ? renderAspectCustomizationModal(character, selectedModalAspectId, modalUnsavedEdits) : ''}
    ${showSelectAspectModal ? renderAspectSelectionModal(character, gameData, searchQuery, selectedAspectForAdding) : ''}
    `;
}
