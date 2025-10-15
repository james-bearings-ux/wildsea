/**
 * Ship creation mode rendering
 */

import { renderShipRatings } from '../components/ship-ratings.js';
import { renderShipPartsTabs } from '../components/ship-parts.js';
import { renderShipFittingsTabs } from '../components/ship-fittings.js';
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

  let html = '<div style="display: flex; flex-direction: column; height: calc(100vh - 60px);">';

  // Top bar: crew size (left), wizard stages (center)
  html += '<div style="display: flex; align-items: center; padding: 16px 20px; background: #1F2937; color: white; border-bottom: 2px solid #374151; gap: 24px;">';

  // Left: Crew size control
  html += '<div style="display: flex; align-items: center; gap: 8px;">';
  html += '<label style="font-size: 14px; font-weight: 600;">Anticipated Crew Size:</label>';
  html += `<input type="number" min="1" max="20" value="${ship.anticipatedCrewSize}"
    data-action="updateAnticipatedCrewSize"
    style="width: 60px; padding: 4px 8px; border-radius: 4px; border: 1px solid #4B5563; background: white; color: #1F2937; text-align: center;"
  />`;
  html += '</div>';

  // Center: Wizard stage buttons
  html += '<div style="display: flex; gap: 4px; margin-left: auto; margin-right: auto;">';
  const stages = [
    { id: 'design', label: 'Ship Design' },
    { id: 'fittings', label: 'Fittings' },
    { id: 'undercrew', label: 'Undercrew' }
  ];
  stages.forEach(stage => {
    const isActive = stage.id === wizardStage;
    const stageStyle = isActive
      ? 'background: #A91D3A; color: white;'
      : 'background: #374151; color: #9CA3AF;';
    html += `<button data-action="switchWizardStage" data-params='{"stage":"${stage.id}"}'
      style="${stageStyle} padding: 6px 12px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600; font-size: 13px;"
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
    // Placeholder for undercrew stage
    html += '<div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; text-align: center; color: #6B7280;">';
    html += '<p>Undercrew stage coming soon...</p>';
    html += '</div>';
  }

  html += '</div>';

  // Bottom action bar
  html += '<div style="padding: 16px 20px; background: #F3F4F6; border-top: 2px solid #D1D5DB; display: flex; justify-content: space-between; align-items: center;">';

  // Left side: Import
  html += '<div style="display: flex; gap: 8px;">';
  html += '<button data-action="importShip" style="background: #6366F1; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">Import Ship</button>';
  html += '</div>';

  // Right side: Create Ship
  html += '<div style="display: flex; gap: 8px;">';
  html += '<button data-action="createShip" style="background: #10B981; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: 600;">Create Ship</button>';
  html += '</div>';

  html += '</div>';

  html += '</div>';

  container.innerHTML = html;
}
