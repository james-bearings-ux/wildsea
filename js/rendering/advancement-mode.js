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

export function renderAdvancementMode(app, character, gameData, showCustomizeModal = false, selectedModalAspectId = null, modalUnsavedEdits = {}, showSelectAspectModal = false, searchQuery = '', selectedAspectForAdding = null) {
  const allAspects = getAvailableAspects(character);
  const bloodlineAspects = allAspects.filter(a => a.category === 'Bloodline').sort((a, b) => a.name.localeCompare(b.name));
  const originAspects = allAspects.filter(a => a.category === 'Origin').sort((a, b) => a.name.localeCompare(b.name));
  const postAspects = allAspects.filter(a => a.category === 'Post').sort((a, b) => a.name.localeCompare(b.name));

  const aspectsSelected = character.selectedAspects.length;

  // Find "more aspects" - aspects not from character's bloodline/origin/post
  const moreAspects = character.selectedAspects.filter(aspect => {
    return aspect.source !== character.bloodline &&
           aspect.source !== character.origin &&
           aspect.source !== character.post;
  }).sort((a, b) => a.name.localeCompare(b.name));

  app.innerHTML = `
    <div style="padding: 20px; max-width: 1400px; margin: 0 auto; padding-bottom: 80px;">
        <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #E5E7EB;">
        <div style="display: flex; gap: 48px; align-items: baseline;">
            <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Character Name</label>
            <input type="text" value="${character.name}"
                    data-action="onCharacterNameChange"
                    placeholder="Enter name..."
                    style="width: 300px; font-size: 16px;">
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

        <div style="margin-bottom: 40px;">
        <div class="flex-between" style="margin-bottom: 12px;">
            <h2 class="section-header" style="margin: 0;">Aspects</h2>
            <div style="display: flex; gap: 12px;">
                <button data-action="openCustomizeModal" class="medium">Customize an Aspect</button>
                <button data-action="openSelectAspectModal" class="medium" ${aspectsSelected >= BUDGETS.maxAspectsAdvancement ? 'disabled' : ''}>Select More Aspects</button>
            </div>
        </div>
        <div class="grid-3col">
            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.bloodline}</h3>
            ${bloodlineAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                const isSelected = !!selectedAspect;
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.maxAspectsAdvancement;

                // Use customized name/description if aspect is selected
                const displayName = isSelected && selectedAspect ? selectedAspect.name : aspect.name;
                const displayDescription = isSelected && selectedAspect ? selectedAspect.description : aspect.description;

                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                        data-action="toggleAspect" data-params="{&quot;id&quot;:&quot;${escapedId}&quot;}"
                        style="position: relative;">
                    ${isSelected ? renderInteractiveTrack(selectedAspect, escapedId) : renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${displayName}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${highlightDamageTypesInDescription(selectedAspect || aspect)}</div>
                    ${isSelected && selectedAspect ? renderDamageTypeWarning(selectedAspect) : ''}
                    ${isSelected && selectedAspect ? renderDamageTypeSelector(selectedAspect, 'advancement') : ''}
                    ${isSelected && selectedAspect ? renderSelectedDamageTypes(selectedAspect, character) : ''}
                </div>
                `;
            }).join('')}
            </div>

            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.origin}</h3>
            ${originAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                const isSelected = !!selectedAspect;
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.maxAspectsAdvancement;

                // Use customized name/description if aspect is selected
                const displayName = isSelected && selectedAspect ? selectedAspect.name : aspect.name;
                const displayDescription = isSelected && selectedAspect ? selectedAspect.description : aspect.description;

                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                        data-action="toggleAspect" data-params="{&quot;id&quot;:&quot;${escapedId}&quot;}"
                        style="position: relative;">
                    ${isSelected ? renderInteractiveTrack(selectedAspect, escapedId) : renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${displayName}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${highlightDamageTypesInDescription(selectedAspect || aspect)}</div>
                    ${isSelected && selectedAspect ? renderDamageTypeWarning(selectedAspect) : ''}
                    ${isSelected && selectedAspect ? renderDamageTypeSelector(selectedAspect, 'advancement') : ''}
                    ${isSelected && selectedAspect ? renderSelectedDamageTypes(selectedAspect, character) : ''}
                </div>
                `;
            }).join('')}
            </div>

            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.post}</h3>
            ${postAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                const isSelected = !!selectedAspect;
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.maxAspectsAdvancement;

                // Use customized name/description if aspect is selected
                const displayName = isSelected && selectedAspect ? selectedAspect.name : aspect.name;
                const displayDescription = isSelected && selectedAspect ? selectedAspect.description : aspect.description;

                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                        data-action="toggleAspect" data-params="{&quot;id&quot;:&quot;${escapedId}&quot;}"
                        style="position: relative;">
                    ${isSelected ? renderInteractiveTrack(selectedAspect, escapedId) : renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${displayName}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${highlightDamageTypesInDescription(selectedAspect || aspect)}</div>
                    ${isSelected && selectedAspect ? renderDamageTypeWarning(selectedAspect) : ''}
                    ${isSelected && selectedAspect ? renderDamageTypeSelector(selectedAspect, 'advancement') : ''}
                    ${isSelected && selectedAspect ? renderSelectedDamageTypes(selectedAspect, character) : ''}
                </div>
                `;
            }).join('')}
            </div>
        </div>

        ${moreAspects.length > 0 ? `
        <div style="margin-top: 24px;">
            <h3 class="subsection-header">More Aspects</h3>
            <div class="grid-3col">
            ${moreAspects.map(selectedAspect => {
                const escapedId = selectedAspect.id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

                return `
                <div class="aspect-card selected" style="position: relative;">
                    ${renderInteractiveTrack(selectedAspect, escapedId)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${selectedAspect.name}</div>
                    <div class="aspect-meta">${selectedAspect.source} ${selectedAspect.type}</div>
                    </div>
                    <div class="aspect-description">${highlightDamageTypesInDescription(selectedAspect)}</div>
                    ${renderDamageTypeWarning(selectedAspect)}
                    ${renderDamageTypeSelector(selectedAspect, 'advancement')}
                    ${renderSelectedDamageTypes(selectedAspect, character)}
                    <button data-action="toggleAspect" data-params="{&quot;id&quot;:&quot;${escapedId}&quot;}"
                            style="position: absolute; top: 12px; right: 12px; padding: 4px 12px; font-size: 14px; background: #DC2626; color: white; border: none;">
                        Remove
                    </button>
                </div>
                `;
            }).join('')}
            </div>
        </div>
        ` : ''}
        </div>
        <hr />

        ${renderEdgesSkillsLanguagesRow(renderSkills, renderLanguages, character, gameData)}
        <hr />

        <div style="margin-bottom: 32px;">
        ${renderMilestones(character)}
        </div>
    </div>

    <div class="sticky-action-bar" style="display: flex; justify-content: flex-end;">
        <button data-action="setMode" data-params='{"mode":"play"}' class="primary">Save Changes</button>
        <button data-action="setMode" data-params='{"mode":"play"}'>Cancel</button>
    </div>

    ${showCustomizeModal ? renderAspectCustomizationModal(character, selectedModalAspectId, modalUnsavedEdits) : ''}
    ${showSelectAspectModal ? renderAspectSelectionModal(character, gameData, searchQuery, selectedAspectForAdding) : ''}
    `;
}
