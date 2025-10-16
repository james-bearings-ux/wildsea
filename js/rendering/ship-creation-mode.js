/**
 * Ship creation mode rendering
 */

import { renderShipRatings } from '../components/ship-ratings.js';
import { renderShipPartsTabs } from '../components/ship-parts.js';
import { renderShipFittingsTabs } from '../components/ship-fittings.js';
import { renderShipUndercrewTabs } from '../components/ship-undercrew.js';
import { renderShipInventory } from '../components/ship-inventory.js';
import { calculateStakesSpent, calculateStakesBudget } from '../state/ship.js';

/**
 * Render ship creation mode
 * @param {HTMLElement} container - Container element to render into
 * @param {Object} ship - Ship object
 * @param {Object} gameData - Game data
 * @param {string} activeTab - Currently active parts tab
 * @param {string} wizardStage - Current wizard stage ('design' | 'fittings' | 'undercrew')
 */
export function renderShipCreationMode(container, ship, gameData, activeTab = 'size', wizardStage = 'design') {
  const stakesSpent = calculateStakesSpent(ship);
  const stakesBudget = calculateStakesBudget(ship);

  let html = '<div class="ship-main-container">';

  // Top bar: ship name and crew size (left), wizard stages (center)
  html += '<div class="ship-top-bar">';

  // Left: Ship name and crew size controls
  html += '<div class="ship-top-bar-controls">';

  // Ship name input
  html += '<div class="ship-control-group">';
  html += '<label class="ship-name-label">Name:</label>';
  html += `<input type="text" value="${ship.name || ''}"
    data-action="updateShipName"
    placeholder="Enter ship name..."
    class="ship-input"
  />`;
  html += '</div>';

  html += '</div>';

  // Center: Wizard stage buttons
  html += '<div class="ship-wizard-buttons">';
  const stages = [
    { id: 'design', label: 'Ship Design' },
    { id: 'fittings', label: 'Fittings' },
    { id: 'undercrew', label: 'Undercrew' }
  ];
  stages.forEach(stage => {
    const isActive = stage.id === wizardStage;
    const activeClass = isActive ? 'ship-wizard-button-active' : 'ship-wizard-button-inactive';
    html += `<button data-action="switchWizardStage" data-params='{"stage":"${stage.id}"}'
      class="ship-wizard-button ${activeClass}"
    >${stage.label}</button>`;
  });
  html += '</div>';

  html += '</div>';

  // Main content area
  html += '<div class="ship-content-row">';

  // Left column: ratings
  html += renderShipRatings(ship);

  // Middle-left column: inventory
  html += renderShipInventory(ship);

  // Right: content based on wizard stage
  if (wizardStage === 'design') {
    html += renderShipPartsTabs(ship, gameData, activeTab);
  } else if (wizardStage === 'fittings') {
    html += renderShipFittingsTabs(ship, gameData, activeTab);
  } else if (wizardStage === 'undercrew') {
    html += renderShipUndercrewTabs(ship, gameData, activeTab);
  }

  html += '</div>';

  // Bottom action bar
  html += '<div class="sticky-action-bar split">';
  html += '<button data-action="importShip">Import Ship</button>';
  html += '<button data-action="createShip" class="primary">Create Ship</button>';
  html += '</div>';

  html += '</div>';

  container.innerHTML = html;
}
