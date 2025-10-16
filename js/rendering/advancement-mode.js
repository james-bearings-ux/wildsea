/**
 * Advancement mode rendering
 */

import { getAvailableAspects, BUDGETS } from '../state/character.js';
import { renderSmallTrack, renderInteractiveTrack } from '../components/aspects.js';
import { renderEdgesSkillsLanguagesRow } from '../components/edges.js';
import { renderSkills, renderLanguages } from '../components/skills.js';
import { renderMilestones } from '../components/milestones.js';
import { renderAspectCustomizationModal } from '../components/aspect-customization-modal.js';

export function renderAdvancementMode(app, character, gameData, showCustomizeModal = false, selectedModalAspectId = null) {
  const allAspects = getAvailableAspects(character);
  const bloodlineAspects = allAspects.filter(a => a.category === 'Bloodline');
  const originAspects = allAspects.filter(a => a.category === 'Origin');
  const postAspects = allAspects.filter(a => a.category === 'Post');

  const aspectsSelected = character.selectedAspects.length;

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
            <button data-action="openCustomizeModal" class="bg-black">Customize an Aspect</button>
        </div>
        <div class="grid-3col">
            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.bloodline}</h3>
            ${bloodlineAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/'/g, "\\'");
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                const isSelected = !!selectedAspect;
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.maxAspectsAdvancement;

                // Use customized name/description if aspect is selected
                const displayName = isSelected && selectedAspect ? selectedAspect.name : aspect.name;
                const displayDescription = isSelected && selectedAspect ? selectedAspect.description : aspect.description;

                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                        data-action="toggleAspect" data-params='{"id":"${escapedId}"}'
                        style="position: relative;">
                    ${isSelected ? renderInteractiveTrack(selectedAspect, escapedId) : renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${displayName}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${displayDescription}</div>
                </div>
                `;
            }).join('')}
            </div>

            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.origin}</h3>
            ${originAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/'/g, "\\'");
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                const isSelected = !!selectedAspect;
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.maxAspectsAdvancement;

                // Use customized name/description if aspect is selected
                const displayName = isSelected && selectedAspect ? selectedAspect.name : aspect.name;
                const displayDescription = isSelected && selectedAspect ? selectedAspect.description : aspect.description;

                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                        data-action="toggleAspect" data-params='{"id":"${escapedId}"}'
                        style="position: relative;">
                    ${isSelected ? renderInteractiveTrack(selectedAspect, escapedId) : renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${displayName}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${displayDescription}</div>
                </div>
                `;
            }).join('')}
            </div>

            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.post}</h3>
            ${postAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/'/g, "\\'");
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                const isSelected = !!selectedAspect;
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.maxAspectsAdvancement;

                // Use customized name/description if aspect is selected
                const displayName = isSelected && selectedAspect ? selectedAspect.name : aspect.name;
                const displayDescription = isSelected && selectedAspect ? selectedAspect.description : aspect.description;

                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                        data-action="toggleAspect" data-params='{"id":"${escapedId}"}'
                        style="position: relative;">
                    ${isSelected ? renderInteractiveTrack(selectedAspect, escapedId) : renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name" style="margin-bottom: 4px;">${displayName}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${displayDescription}</div>
                </div>
                `;
            }).join('')}
            </div>
        </div>
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

    ${showCustomizeModal ? renderAspectCustomizationModal(character, selectedModalAspectId) : ''}
    `;
}
