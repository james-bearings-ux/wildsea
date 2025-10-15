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

  let html = '<div style="display: flex; flex-direction: column; height: calc(100vh - 80px);">';

  // Top bar: ship name and crew size (left), wizard stages (center)
  html += '<div style="display: flex; align-items: stretch; padding: 0 20px; background: #FFFFFF; color: #000000; border-bottom: 2px solid #E5E7EB; gap: 24px; height: 80px;">';

  // Left: Ship name and crew size controls
  html += '<div style="display: flex; align-items: center; gap: 16px;">';

  // Ship name input
  html += '<div style="display: flex; align-items: center; gap: 8px;">';
  html += '<label style="font-family: \'Faustina\', serif; font-size: 22px; font-weight: 600; color: #000000;">Name:</label>';
  html += `<input type="text" value="${ship.name || ''}"
    data-action="updateShipName"
    placeholder="Enter ship name..."
    style="width: 200px; padding: 3px 6px; border: none; border-bottom: 2px solid #000000; background: white; color: #000000; outline: none; font-size: 14px;"
  />`;
  html += '</div>';

  // Crew size control
  html += '<div style="display: flex; align-items: center; gap: 8px;">';
  html += '<label style="font-size: 14px; font-weight: 600; color: #000000; width: 5em;">Anticipated Crew Size:</label>';
  html += `<input type="number" min="1" max="20" value="${ship.anticipatedCrewSize}"
    data-action="updateAnticipatedCrewSize"
    style="width: 60px; padding: 3px 6px; border: none; border-bottom: 2px solid #000000; background: white; color: #000000; text-align: center; outline: none; font-size: 14px;"
  />`;
  html += '</div>';

  // Additional stakes control
  html += '<div style="display: flex; align-items: center; gap: 8px;">';
  html += '<label style="font-size: 14px; font-weight: 600; color: #000000; width: 5em;">Additional Stakes:</label>';
  html += `<input type="number" min="0" value="${ship.additionalStakes || 0}"
    data-action="updateAdditionalStakes"
    style="width: 60px; padding: 3px 6px; border: none; border-bottom: 2px solid #000000; background: white; color: #000000; text-align: center; outline: none; font-size: 14px;"
  />`;
  html += '</div>';

  html += '</div>';

  // Center: Wizard stage buttons
  html += '<div style="display: flex; gap: 0; margin-left: auto; margin-right: auto; height: 100%;">';
  const stages = [
    { id: 'design', label: 'Ship Design' },
    { id: 'fittings', label: 'Fittings' },
    { id: 'undercrew', label: 'Undercrew' }
  ];
  stages.forEach(stage => {
    const isActive = stage.id === wizardStage;
    const bgColor = isActive ? '#000000' : '#E5E7EB';
    const textColor = isActive ? '#FFFFFF' : '#6B7280';
    html += `<button data-action="switchWizardStage" data-params='{"stage":"${stage.id}"}'
      style="background: ${bgColor}; color: ${textColor}; padding: 0 20px; border: none; border-radius: 0; cursor: pointer; font-family: 'Faustina', serif; font-weight: 600; font-size: 22px; height: 100%; display: flex; align-items: center;"
    >${stage.label}</button>`;
  });
  html += '</div>';

  html += '</div>';

  // Main content area
  html += '<div style="display: flex; flex: 1; overflow: hidden;">';

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
