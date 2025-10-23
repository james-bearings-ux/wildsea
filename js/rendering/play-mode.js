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
import { renderRoleSelector } from '../components/journey-role.js';

export function renderPlayMode(app, character, gameData, showAddTaskForm = false, ship = null) {

  app.innerHTML = `
    <div class="content-wrapper">
        <div data-section="character-header">
          <div class="char-header">
            <div class="char-header-row">
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

        <div class="grid-play-main">
        <div data-section="edges">${renderEdges(character, gameData)}</div>
        <div data-section="skills">${renderSkills(character, gameData)}</div>
        <div data-section="languages">${renderLanguages(character, gameData)}</div>

        <div data-section="aspects">
            <div>
              <h2 class="section-header">Aspects</h2>
              ${character.selectedAspects.slice().sort((a, b) => a.name.localeCompare(b.name)).map(aspect => {
            let trackHTML = '<div class="aspect-play-track">';
            for (let i = 0; i < 5; i++) {
                if (i < aspect.trackSize) {
                const state = aspect.damageStates[i];
                const stateChar = state === 'marked' ? '/' : state === 'burned' ? 'X' : '';
                trackHTML += '<div class="track-box ' + state + '" data-action="cycleAspectDamage" data-params=\'{"id":"' + aspect.id + '","index":' + i + '}\' style="cursor: pointer;">' + stateChar + '</div>';
                } else {
                trackHTML += '<div class="track-spacer"></div>';
                }
            }
            trackHTML += '</div>';

            return `
                <div class="aspect-play-row">
                    ${trackHTML}
                    <div class="aspect-play-content">
                    <div class="split">
                        <div class="aspect-name">${aspect.name}</div>
                        <div class="aspect-meta">${aspect.source} ${aspect.type}</div>
                    </div>
                    <div class="aspect-description">${highlightDamageTypesInDescription(aspect)}</div>
                    ${renderDamageTypeWarning(aspect)}
                    </div>
                </div>
            `;
            }).join('')}
            </div>
        </div>
        </div>
        <hr />
        <div class="grid-play-secondary">
            <div class="section-group">
                <div data-section="resources" class="section-group-sm">
                    ${renderResources(character)}
                </div>
                <div data-section="notes">
                    ${renderNotes(character)}
                </div>
            </div>
            <div data-section="damage-types">
              ${renderDamageTypeTable(character)}
            </div>
            <div class="section-group">
                <div data-section="drives">${renderDrives(character)}</div>
                <div data-section="mires">${renderMires(character)}</div>
                <div data-section="milestones">${renderMilestones(character)}</div>
                <div data-section="tasks">${renderTasks(character, showAddTaskForm)}</div>
            </div>
        </div>
    </div>

    <div class="sticky-action-bar flex-between">
        <div class="flex-gap-md">
            <button data-action="removeCharacter" data-params='{"characterId":"${character.id}"}' class="btn-danger">Delete</button>
            <button data-action="exportCharacter">Export</button>
        </div>
        <div class="flex flex-1 justify-center">
            ${ship && ship.journey && ship.journey.active ? renderRoleSelector(character.journeyRole, ship.journey.active) : ''}
        </div>
        <div>
            <button data-action="setMode" data-params='{"mode":"advancement"}'>Advancement</button>
        </div>
    </div>
    `;
}
