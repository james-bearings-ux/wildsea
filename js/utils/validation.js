/**
 * Validation utilities for character creation
 */

import { BUDGETS } from '../state/character.js';

/**
 * Validate character is ready to transition from creation to play mode
 * @param {Object} character - Character object
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validateCharacterCreation(character) {
  const errors = [];

  // Validate aspects
  if (character.selectedAspects.length !== BUDGETS.aspects) {
    errors.push(`Please select exactly ${BUDGETS.aspects} aspects`);
  }

  // Validate edges
  if (character.selectedEdges.length !== BUDGETS.edges) {
    errors.push(`Please select exactly ${BUDGETS.edges} edges`);
  }

  // Validate skill/language points
  const skillPoints = Object.values(character.skills).reduce((sum, v) => sum + v, 0);
  const languagePoints = Object.entries(character.languages)
    .filter(function (entry) { return entry[0] !== 'Low Sour'; })
    .reduce((sum, entry) => sum + entry[1], 0);

  if (skillPoints + languagePoints !== BUDGETS.skillPoints) {
    errors.push(`Please allocate all ${BUDGETS.skillPoints} skill/language points (currently allocated: ${skillPoints + languagePoints})`);
  }

  // Validate resources
  const totalResources = character.resources.charts.length +
    character.resources.salvage.length +
    character.resources.specimens.length +
    character.resources.whispers.length;

  if (totalResources > BUDGETS.resources) {
    errors.push('A new character can have up to 6 starting resources');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
