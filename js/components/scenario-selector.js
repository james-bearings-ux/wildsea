/**
 * Scenario selector component
 * Renders scenario indicator and selection modal for character creation
 */

import { SCENARIO_BUDGETS, BUDGETS } from '../state/character.js';

/**
 * Render scenario indicator next to character name
 * Shows current scenario with a [Change] button
 * @param {Object} character - Character object with scenario property
 * @returns {string} HTML string for scenario indicator
 */
export function renderScenarioIndicator(character) {
  const scenario = character.scenario || 'old dog';
  const scenarioData = SCENARIO_BUDGETS[scenario];

  return `
    <div class="scenario-indicator">
      <span class="scenario-label">${scenarioData.name}</span>
      <button class="btn-subtle" data-action="openScenarioModal">Change</button>
    </div>
  `;
}

/**
 * Render scenario selection modal
 * Displays both scenarios side by side with their budgets
 * @param {Object} character - Character object with scenario property
 * @returns {string} HTML string for scenario selection modal
 */
export function renderScenarioModal(character) {
  const currentScenario = character.scenario || 'old dog';

  return `
    <div class="modal-overlay" id="scenario-modal-overlay">
      <div class="modal-content" id="scenario-modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h2>Choose Character Scenario</h2>
          <button class="btn-icon" data-action="closeScenarioModal">✕</button>
        </div>

        <div class="modal-body">
          <p class="mb-lg" style="color: var(--text-secondary);">
            Select your character's experience level. Old Dogs start with more aspects and skill points,
            while Young Guns start with fewer but have more room to grow.
          </p>

          <div class="grid-2col gap-xl">
            ${renderScenarioOption('old dog', currentScenario)}
            ${renderScenarioOption('young gun', currentScenario)}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" data-action="closeScenarioModal">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a single scenario option card
 * @param {string} scenarioKey - Scenario key ('old dog' or 'young gun')
 * @param {string} currentScenario - Currently selected scenario
 * @returns {string} HTML string for scenario option card
 */
function renderScenarioOption(scenarioKey, currentScenario) {
  const scenarioData = SCENARIO_BUDGETS[scenarioKey];
  const isSelected = scenarioKey === currentScenario;
  const escapedKey = scenarioKey.replace(/'/g, "\\'");

  return `
    <div class="scenario-option ${isSelected ? 'selected' : ''}"
         data-action="selectScenario"
         data-params='{"scenario":"${scenarioKey}"}'>
      <div class="scenario-option-header">
        <h3>${scenarioData.name}</h3>
        ${isSelected ? '<span class="badge-success">Current</span>' : ''}
      </div>

      <p class="scenario-description">${scenarioData.description}</p>

      <div class="scenario-budgets">
        <h4>Starting Budgets:</h4>
        <ul class="budget-list">
          <li class="budget-highlight"><strong>${scenarioData.aspects}</strong> Aspects</li>
          <li><strong>${BUDGETS.edges}</strong> Edges</li>
          <li class="budget-highlight"><strong>${scenarioData.skillPoints}</strong> Skill/Language Points</li>
          <li class="budget-highlight"><strong>${scenarioData.resources}</strong> Resources</li>
          <li><strong>3</strong> Drives</li>
          <li><strong>3</strong> Mires</li>
        </ul>
      </div>
    </div>
  `;
}
