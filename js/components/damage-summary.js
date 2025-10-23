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
 * Table format with range in column 1, damage type pills in column 2
 * @param {object} char - Character object
 * @returns {string} - HTML string for dealing damage summary
 */
export function renderDealingDamageSummary(char) {
  const { dealing } = getCharacterDamageTypes(char);

  const hasAnyDamage = dealing.CQ.length > 0 || dealing.LR.length > 0 || dealing.UR.length > 0;

  if (!hasAnyDamage) {
    return '';
  }

  const ranges = [];
  if (dealing.CQ.length > 0) {
    ranges.push({ label: 'CQ', types: dealing.CQ });
  }
  if (dealing.LR.length > 0) {
    ranges.push({ label: 'LR', types: dealing.LR });
  }
  if (dealing.UR.length > 0) {
    ranges.push({ label: 'UR', types: dealing.UR });
  }

  return `
    <div class="dealing-damage-section">
      <h4 class="subsection-header">Types Dealt</h4>
      <table>
        <thead>
          <tr>
            <th class="table-header-left">Range</th>
            <th class="table-header-left">Types</th>
          </tr>
        </thead>
        <tbody>
          ${ranges.map(range => `
            <tr>
              <td class="range-cell">
                <span class="range-label">${range.label}</span>
              </td>
              <td class="types-cell">
                ${range.types.map(type =>
                  `<span class="badge dealing">${type}</span>`
                ).join('')}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
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
  const { resistances, immunities, weaknesses } = getCharacterDefenses(char);

  // Filter hazards to only show ones with resistance/immunity
  // Use case-insensitive comparison
  const resistancesLower = resistances.map(r => r.toLowerCase());
  const immunitiesLower = immunities.map(i => i.toLowerCase());
  const relevantHazards = HAZARD_CONDITIONS.filter(hazard =>
    resistancesLower.includes(hazard.toLowerCase()) || immunitiesLower.includes(hazard.toLowerCase())
  );

  return `
    <div class="damage-type-table">
      <h3 class="section-header">Damage Type Matrix</h3>

      ${renderDealingDamageSummary(char)}

      <div class="resistances-section">
        <h4 class="subsection-header">Resistances</h4>
        <table>
        <thead>
          <tr>
            <th class="table-header-left">Type</th>
            <th class="table-header-left">Status</th>
          </tr>
        </thead>
        <tbody>
          ${DAMAGE_TYPES.map(type => {
            const isImmune = immunities.includes(type);
            const isResistant = resistances.includes(type);
            const isWeak = weaknesses.includes(type);

            let defenseLevel = 'None';
            let statusClass = 'status-none';
            let badgeClass = 'badge';

            if (isImmune) {
              defenseLevel = 'Immune';
              statusClass = 'status-text';
              badgeClass = 'badge immune';
            } else if (isResistant) {
              defenseLevel = 'Resistant';
              statusClass = 'status-text';
              badgeClass = 'badge resistance';
            } else if (isWeak) {
              defenseLevel = 'Weak';
              statusClass = 'status-text';
              badgeClass = 'badge weakness';
            }

            return `
              <tr>
                <td>
                  <span class="${badgeClass}">${type}</span>
                </td>
                <td>
                  <span class="${statusClass}">${defenseLevel}</span>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      </div>

      ${relevantHazards.length > 0 ? `
        <div class="hazards-section">
          <h4 class="subsection-header">Environmental Hazards</h4>
          <table>
            <thead>
              <tr>
                <th class="table-header-left">Type</th>
                <th class="table-header-left">Status</th>
              </tr>
            </thead>
            <tbody>
              ${relevantHazards.map(hazard => {
                // Find the actual capitalized version from character's immunities/resistances
                const actualImmunity = immunities.find(i => i.toLowerCase() === hazard.toLowerCase());
                const actualResistance = resistances.find(r => r.toLowerCase() === hazard.toLowerCase());
                const displayName = actualImmunity || actualResistance || hazard;

                const isImmune = !!actualImmunity;
                const isResistant = !!actualResistance;

                let defenseLevel = 'Resistant';
                let statusClass = 'status-text';
                let badgeClass = 'badge resistance';

                if (isImmune) {
                  defenseLevel = 'Immune';
                  badgeClass = 'badge immune';
                }

                return `
                  <tr>
                    <td>
                      <span class="${badgeClass}">${displayName}</span>
                    </td>
                    <td>
                      <span class="${statusClass}">${defenseLevel}</span>
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
