/**
 * Creation mode rendering
 */

import { getAvailableAspects, getBudgets } from '../state/character.js';
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
import { renderScenarioIndicator, renderScenarioModal } from '../components/scenario-selector.js';
import { escapeHtmlAttr, escapeHtmlContent } from '../utils/escaping.js';

export function renderCreationMode(app, character, gameData, showScenarioModal = false) {
  const budgets = getBudgets(character);
  const allAspects = getAvailableAspects(character);
  const bloodlineAspects = allAspects.filter(a => a.category === 'Bloodline').sort((a, b) => a.name.localeCompare(b.name));
  const originAspects = allAspects.filter(a => a.category === 'Origin').sort((a, b) => a.name.localeCompare(b.name));
  const postAspects = allAspects.filter(a => a.category === 'Post').sort((a, b) => a.name.localeCompare(b.name));

  const aspectsSelected = character.selectedAspects.length;

  app.innerHTML = `
    <div class="content-wrapper">
        <!-- Character Name Input with Scenario Indicator -->
        <div class="section-spacing-sm">
        <label class="form-label">Character Name</label>
        <div style="display: flex; align-items: center;">
          <input type="text" value="${escapeHtmlAttr(character.name)}"
              data-action="onCharacterNameChange"
              placeholder="Enter name..."
              style="width: 300px; font-size: 16px;">
          ${renderScenarioIndicator(character)}
        </div>
        </div>

        <!-- Core Elements Section: Bloodline, Origin, Post dropdowns in 3-column grid -->
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

        <!-- Aspects Section: 3-column grid (Bloodline | Origin | Post) with budget tracking (scenario-based) -->
        <!-- Selected aspects show damage type selectors, disabled aspects are grayed out when budget is full -->
        <div class="section-spacing">
        <div class="aspect-header">
            <h2 class="section-header">Aspects</h2>
            <div class="budget-indicator">${aspectsSelected}/${budgets.aspects}</div>
        </div>
        <div class="grid-3col">
            <div class="flex-col-gap">
            <h3 class="subsection-header">${character.bloodline}</h3>
            ${bloodlineAspects.map(aspect => {
                const id = aspect.source + '-' + aspect.name;
                const escapedId = id.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
                const isSelected = character.selectedAspects.some(a => a.id === id);
                const isDisabled = !isSelected && aspectsSelected >= budgets.aspects;
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
                const isDisabled = !isSelected && aspectsSelected >= budgets.aspects;
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
                const isDisabled = !isSelected && aspectsSelected >= budgets.aspects;
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

        <!-- Edges, Skills, Languages Section: Custom layout from renderEdgesSkillsLanguagesRow -->
        <!-- Creation mode: Grid with edges (1 col) | skills & languages (2 cols) with shared 8-point budget -->
        <div data-section="edges-skills-languages-creation">
        ${renderEdgesSkillsLanguagesRow(renderSkills, renderLanguages, character, gameData)}
        </div>
        <hr />

        <!-- Resources Section: 4-column grid (charts, salvage, specimens, whispers) -->
        <!-- Max 6 starting resources with "Load Suggested Resources" button -->
        <div data-section="resources-creation">
        ${renderResources(character)}
        </div>
        <hr />

        <!-- Drives & Mires Section: 2-column grid -->
        <!-- Drives: 3 text inputs for character motivations -->
        <!-- Mires: 3 text inputs for character problems/complications -->
        <div class="section-spacing-lg">
        <div class="grid-2col gap-xxl">
            <div data-section="drives-creation">
            ${renderDrives(character)}
            </div>
            <div data-section="mires-creation">
            ${renderMires(character)}
            </div>
        </div>
        </div>
    </div>

    <!-- Sticky Action Bar: Import/Random buttons on left, Create/Cancel buttons on right -->
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

    <!-- Scenario Selection Modal -->
    ${showScenarioModal ? renderScenarioModal(character) : ''}
    `;
}
