/**
 * Validation utilities for character creation
 */

import { getBudgets } from '../state/character.js';

/**
 * Validate character is ready to transition from creation to play mode
 * @param {Object} character - Character object
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateCharacterCreation(character) {
  const errors = [];
  const budgets = getBudgets(character);

  // Validate aspects (scenario-dependent)
  if (character.selectedAspects.length !== budgets.aspects) {
    errors.push(`Please select exactly ${budgets.aspects} aspects`);
  }

  // Validate edges
  if (character.selectedEdges.length !== budgets.edges) {
    errors.push(`Please select exactly ${budgets.edges} edges`);
  }

  // Validate skill/language points (scenario-dependent)
  const skillPoints = Object.values(character.skills).reduce((sum, v) => sum + v, 0);
  const languagePoints = Object.entries(character.languages)
    .filter(function (entry) { return entry[0] !== 'Low Sour'; })
    .reduce((sum, entry) => sum + entry[1], 0);

  if (skillPoints + languagePoints !== budgets.skillPoints) {
    errors.push(`Please allocate all ${budgets.skillPoints} skill/language points (currently allocated: ${skillPoints + languagePoints})`);
  }

  // Validate resources (same for all scenarios)
  const totalResources = character.resources.charts.length +
    character.resources.salvage.length +
    character.resources.specimens.length +
    character.resources.whispers.length;

  if (totalResources > budgets.resources) {
    errors.push(`A new character can have up to ${budgets.resources} starting resources`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
