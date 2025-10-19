/**
 * Damage Summary Component
 * Displays aggregated resistances, immunities, and weaknesses in play mode
 */

import { getCharacterDamageTypes, getCharacterDefenses } from '../state/character.js';
import { DAMAGE_TYPES, HAZARD_CONDITIONS } from '../constants/damage-types.js';

/**
 * Render complete damage types summary for play mode
 * Shows resistances, immunities, and weaknesses
 * @param {object} char - Character object
 * @returns {string} - HTML string for summary
 */
export function renderDamageSummary(char) {
  const { resistances, immunities, weaknesses } = getCharacterDefenses(char);

  // Don't show section if no defensive damage types
  if (resistances.length === 0 && immunities.length === 0 && weaknesses.length === 0) {
    return '';
  }

  return `
    <div class="damage-summary bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
      <h3 class="font-bold text-sm mb-3 text-gray-900">Resistances & Immunities</h3>

      ${resistances.length > 0 ? `
        <div class="mb-2">
          <span class="label font-semibold text-xs text-gray-600 mr-2">Resistant to:</span>
          ${resistances.map(type =>
            `<span class="badge resistance inline-block px-2 py-0.5 m-0.5 text-xs rounded-full bg-blue-100 text-blue-900 border border-blue-300">${type}</span>`
          ).join('')}
        </div>
      ` : ''}

      ${immunities.length > 0 ? `
        <div class="mb-2">
          <span class="label font-semibold text-xs text-gray-600 mr-2">Immune to:</span>
          ${immunities.map(type =>
            `<span class="badge immune inline-block px-2 py-0.5 m-0.5 text-xs rounded-full bg-green-100 text-green-900 border border-green-300">${type}</span>`
          ).join('')}
        </div>
      ` : ''}

      ${weaknesses.length > 0 ? `
        <div>
          <span class="label font-semibold text-xs text-gray-600 mr-2">Weak to:</span>
          ${weaknesses.map(type =>
            `<span class="badge weakness inline-block px-2 py-0.5 m-0.5 text-xs rounded-full bg-red-100 text-red-900 border border-red-300">${type}</span>`
          ).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render compact damage types summary (for sidebars or headers)
 * More condensed version of the full summary
 * @param {object} char - Character object
 * @returns {string} - HTML string for compact summary
 */
export function renderCompactDamageSummary(char) {
  const { resistances, immunities, weaknesses } = getCharacterDefenses(char);

  if (resistances.length === 0 && immunities.length === 0 && weaknesses.length === 0) {
    return '';
  }

  const defenseCount = resistances.length + immunities.length;
  const weaknessCount = weaknesses.length;

  return `
    <div class="damage-summary-compact text-xs text-gray-600">
      ${defenseCount > 0 ? `
        <span class="mr-2">
          🛡️ ${defenseCount} defense${defenseCount > 1 ? 's' : ''}
        </span>
      ` : ''}
      ${weaknessCount > 0 ? `
        <span>
          ⚠️ ${weaknessCount} weakness${weaknessCount > 1 ? 'es' : ''}
        </span>
      ` : ''}
    </div>
  `;
}

/**
 * Render dealing damage summary (what damage the character can deal)
 * @param {object} char - Character object
 * @returns {string} - HTML string for dealing damage summary
 */
export function renderDealingDamageSummary(char) {
  const { dealing } = getCharacterDamageTypes(char);

  const hasAnyDamage = dealing.CQ.length > 0 || dealing.LR.length > 0 || dealing.UR.length > 0;

  if (!hasAnyDamage) {
    return '';
  }

  return `
    <div class="dealing-damage-summary bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
      <h3 class="font-bold text-sm mb-3 text-gray-900">Damage Types Available</h3>

      ${dealing.CQ.length > 0 ? `
        <div class="mb-2">
          <span class="label font-semibold text-xs text-gray-600 mr-2">Close Quarters (CQ):</span>
          ${dealing.CQ.map(type =>
            `<span class="badge dealing inline-block px-2 py-0.5 m-0.5 text-xs rounded-full bg-purple-100 text-purple-900 border border-purple-300">${type}</span>`
          ).join('')}
        </div>
      ` : ''}

      ${dealing.LR.length > 0 ? `
        <div class="mb-2">
          <span class="label font-semibold text-xs text-gray-600 mr-2">Long Range (LR):</span>
          ${dealing.LR.map(type =>
            `<span class="badge dealing inline-block px-2 py-0.5 m-0.5 text-xs rounded-full bg-purple-100 text-purple-900 border border-purple-300">${type}</span>`
          ).join('')}
        </div>
      ` : ''}

      ${dealing.UR.length > 0 ? `
        <div>
          <span class="label font-semibold text-xs text-gray-600 mr-2">Undercrew (UR):</span>
          ${dealing.UR.map(type =>
            `<span class="badge dealing inline-block px-2 py-0.5 m-0.5 text-xs rounded-full bg-purple-100 text-purple-900 border border-purple-300">${type}</span>`
          ).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render full damage types report (both defensive and offensive)
 * Complete summary for advanced players
 * @param {object} char - Character object
 * @returns {string} - HTML string for complete report
 */
export function renderFullDamageReport(char) {
  const defensive = renderDamageSummary(char);
  const offensive = renderDealingDamageSummary(char);

  if (!defensive && !offensive) {
    return '';
  }

  return `
    <div class="full-damage-report">
      ${defensive}
      ${offensive}
    </div>
  `;
}

/**
 * Render experimental damage type table
 * Shows all damage types with their defense status in a grid
 * @param {object} char - Character object
 * @returns {string} - HTML string for damage type table
 */
export function renderDamageTypeTable(char) {
  const { resistances, immunities } = getCharacterDefenses(char);

  // Filter hazards to only show ones with resistance/immunity
  const relevantHazards = HAZARD_CONDITIONS.filter(hazard =>
    resistances.includes(hazard) || immunities.includes(hazard)
  );

  return `
    <div class="damage-type-table bg-white border border-gray-300 rounded-lg p-4 mt-4">
      <h3 class="font-bold text-sm mb-3 text-gray-900">Damage Type Matrix</h3>
      <table class="w-full text-xs">
        <thead>
          <tr class="border-b-2 border-gray-300">
            <th class="text-left py-2 px-3 font-semibold text-gray-700">Damage Type</th>
            <th class="text-left py-2 px-3 font-semibold text-gray-700">Defense Level</th>
          </tr>
        </thead>
        <tbody>
          ${DAMAGE_TYPES.map(type => {
            const isImmune = immunities.includes(type);
            const isResistant = resistances.includes(type);

            let defenseLevel = 'No Defense';
            let defenseLevelClass = 'text-gray-500';
            let pillClass = 'bg-gray-100 text-gray-700 border-gray-300';

            if (isImmune) {
              defenseLevel = 'Immune';
              defenseLevelClass = 'text-green-700 font-semibold';
              pillClass = 'bg-green-100 text-green-900 border-green-300';
            } else if (isResistant) {
              defenseLevel = 'Resistant';
              defenseLevelClass = 'text-blue-600 font-semibold';
              pillClass = 'bg-blue-100 text-blue-900 border-blue-300';
            }

            return `
              <tr class="border-b border-gray-200 hover:bg-gray-50">
                <td class="py-2 px-3">
                  <span class="badge inline-block px-2 py-0.5 text-xs rounded-full border ${pillClass}">${type}</span>
                </td>
                <td class="py-2 px-3">
                  <span class="${defenseLevelClass}">${defenseLevel}</span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      ${relevantHazards.length > 0 ? `
        <div class="mt-4">
          <h4 class="font-semibold text-xs mb-2 text-gray-700">Environmental Hazards</h4>
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-gray-300">
                <th class="text-left py-1.5 px-3 font-semibold text-gray-600 text-xs">Hazard</th>
                <th class="text-left py-1.5 px-3 font-semibold text-gray-600 text-xs">Defense Level</th>
              </tr>
            </thead>
            <tbody>
              ${relevantHazards.map(hazard => {
                const isImmune = immunities.includes(hazard);
                const isResistant = resistances.includes(hazard);

                let defenseLevel = 'Resistant';
                let defenseLevelClass = 'text-blue-600 font-semibold';
                let pillClass = 'bg-blue-100 text-blue-900 border-blue-300';

                if (isImmune) {
                  defenseLevel = 'Immune';
                  defenseLevelClass = 'text-green-700 font-semibold';
                  pillClass = 'bg-green-100 text-green-900 border-green-300';
                }

                return `
                  <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="py-1.5 px-3">
                      <span class="badge inline-block px-2 py-0.5 text-xs rounded-full border ${pillClass}">${hazard}</span>
                    </td>
                    <td class="py-1.5 px-3">
                      <span class="${defenseLevelClass}">${defenseLevel}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
    </div>
  `;
}
