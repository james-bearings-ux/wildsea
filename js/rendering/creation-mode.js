/**
 * Creation mode rendering
 */

import { getAvailableAspects, BUDGETS } from '../state/character.js';
import { renderSmallTrack } from '../components/aspects.js';
import { renderEdgesSkillsLanguagesRow } from '../components/edges.js';
import { renderSkills, renderLanguages } from '../components/skills.js';
import { renderResources } from '../components/resources.js';
import { renderDrives, renderMires } from '../components/drives-mires.js';
import {
  renderDamageTypeSelector,
  renderDamageTypeWarning,
  renderSelectedDamageTypes,
  highlightDamageTypesInDescription
} from '../components/damage-type-selector.js';

export function renderCreationMode(app, character, gameData) {
  const allAspects = getAvailableAspects(character);
  const bloodlineAspects = allAspects.filter(a => a.category === 'Bloodline');
  const originAspects = allAspects.filter(a => a.category === 'Origin');
  const postAspects = allAspects.filter(a => a.category === 'Post');

  const aspectsSelected = character.selectedAspects.length;

  app.innerHTML = `
    <div class="content-wrapper">
        <div class="section-spacing-sm">
        <label class="form-label">Character Name</label>
        <input type="text" value="${character.name}"
            data-action="onCharacterNameChange"
                placeholder="Enter name..."
                style="width: 300px; font-size: 16px;">
        </div>

        <div class="section-spacing">
        <h2 class="section-header">Core Elements</h2>
        <div class="grid-3col gap-lg">
            <div>
            <label class="form-label">Bloodline</label>
            <select data-action="onBloodlineChange" style="width: 100%; font-size: 16px;">
                ${gameData.bloodlines.map(b => '<option value="' + b + '"' + (character.bloodline === b ? ' selected' : '') + '>' + b + '</option>').join('')}
            </select>
            </div>
            <div>
            <label class="form-label">Origin</label>
            <select data-action="onOriginChange" style="width: 100%; font-size: 16px;">
                ${gameData.origins.map(o => '<option value="' + o + '"' + (character.origin === o ? ' selected' : '') + '>' + o + '</option>').join('')}
            </select>
            </div>
            <div>
            <label class="form-label">Post</label>
            <select data-action="onPostChange" style="width: 100%; font-size: 16px;">
                ${gameData.posts.map(p => '<option value="' + p + '"' + (character.post === p ? ' selected' : '') + '>' + p + '</option>').join('')}
            </select>
            </div>
        </div>
        </div>

        <div class="section-spacing">
        <div class="aspect-header">
            <h2 class="section-header">Aspects</h2>
            <div class="budget-indicator">${aspectsSelected}/${BUDGETS.aspects}</div>
        </div>
        <div class="grid-3col">
            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.bloodline}</h3>
            ${bloodlineAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                const isSelected = character.selectedAspects.some(a => a.id === id);
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.aspects;
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                        data-action="toggleAspect" data-params="{&quot;id&quot;:&quot;${escapedId}&quot;}">
                    ${renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name">${aspect.name}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${highlightDamageTypesInDescription(selectedAspect || aspect)}</div>
                    ${isSelected && selectedAspect ? renderDamageTypeWarning(selectedAspect) : ''}
                    ${isSelected && selectedAspect ? renderDamageTypeSelector(selectedAspect, 'creation') : ''}
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
                const isSelected = character.selectedAspects.some(a => a.id === id);
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.aspects;
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                        data-action="toggleAspect" data-params="{&quot;id&quot;:&quot;${escapedId}&quot;}">
                    ${renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name">${aspect.name}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${highlightDamageTypesInDescription(selectedAspect || aspect)}</div>
                    ${isSelected && selectedAspect ? renderDamageTypeWarning(selectedAspect) : ''}
                    ${isSelected && selectedAspect ? renderDamageTypeSelector(selectedAspect, 'creation') : ''}
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
                const isSelected = character.selectedAspects.some(a => a.id === id);
                const isDisabled = !isSelected && aspectsSelected >= BUDGETS.aspects;
                const selectedAspect = character.selectedAspects.find(a => a.id === id);
                return `
                <div class="aspect-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"
                        data-action="toggleAspect" data-params="{&quot;id&quot;:&quot;${escapedId}&quot;}">
                    ${renderSmallTrack(aspect.track)}
                    <div class="split">
                    <div class="aspect-name">${aspect.name}</div>
                    <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${highlightDamageTypesInDescription(selectedAspect || aspect)}</div>
                    ${isSelected && selectedAspect ? renderDamageTypeWarning(selectedAspect) : ''}
                    ${isSelected && selectedAspect ? renderDamageTypeSelector(selectedAspect, 'creation') : ''}
                    ${isSelected && selectedAspect ? renderSelectedDamageTypes(selectedAspect, character) : ''}
                </div>
                `;
            }).join('')}
            </div>
        </div>
        </div>
        <hr />

        ${renderEdgesSkillsLanguagesRow(renderSkills, renderLanguages, character, gameData)}
        <hr />

        ${renderResources(character)}
        <hr />

        <div class="section-spacing-lg">
        <div class="grid-2col gap-xxl">
            ${renderDrives(character)}
            ${renderMires(character)}
        </div>
        </div>
    </div>

    <div class="sticky-action-bar split">
        <div class="flex-gap-md">
            <button data-action="importCharacter">Import</button>
            <button data-action="generateRandomCharacter">Generate Random</button>
        </div>
        <div class="flex-gap-md">
            <button data-action="createCharacter" class="primary">Create Character</button>
            <button data-action="removeCharacter" data-params='{"characterId":"${character.id}"}'>Cancel</button>
        </div>
    </div>
    `;
}
