/**
 * Play mode rendering
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

export function renderPlayMode(app, character, gameData, showAddTaskForm = false) {

  app.innerHTML = `
    <div style="padding: 20px; max-width: 1400px; margin: 0 auto; padding-bottom: 80px;">
        <div data-section="character-header">
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
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 3fr; gap: 32px; margin-bottom: 32px;">
        <div data-section="edges">${renderEdges(character, gameData)}</div>
        <div data-section="skills">${renderSkills(character, gameData)}</div>
        <div data-section="languages">${renderLanguages(character, gameData)}</div>

        <div data-section="aspects">
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
        </div>
        </div>
        <hr />
        <div style="display: grid; grid-template-columns: 1fr 250px 1fr; gap: 32px; margin-bottom: 32px;">
            <div style="display: flex; flex-direction: column; gap: 32px;">
                <div data-section="resources" style="display: flex; flex-direction: column; gap: 24px;">
                    ${renderResources(character)}
                </div>
                <div data-section="notes">
                    ${renderNotes(character)}
                </div>
            </div>
            <div data-section="damage-types">
              ${renderDamageTypeTable(character)}
            </div>
            <div style="display: flex; flex-direction: column; gap: 32px;">
                <div data-section="drives">${renderDrives(character)}</div>
                <div data-section="mires">${renderMires(character)}</div>
                <div data-section="milestones">${renderMilestones(character)}</div>
                <div data-section="tasks">${renderTasks(character, showAddTaskForm)}</div>
            </div>
        </div>
    </div>

    <div class="sticky-action-bar split">
        <div style="display: flex; gap: 8px;">
            <button data-action="removeCharacter" data-params='{"characterId":"${character.id}"}' style="background-color: #A91D3A; color: #fff;">Delete</button>
            <button data-action="exportCharacter">Export</button>
        </div>
        <button data-action="setMode" data-params='{"mode":"advancement"}'>Advancement</button>
    </div>
    `;
}
