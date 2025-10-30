/**
 * Health calculation utilities for DM screen
 * Computes health on-demand from damage states
 */

import { calculateShipRatings } from '../state/ship.js';

/**
 * Calculate character health from aspect damage states
 * @param {Object} character - Character object
 * @returns {Object} { current: number, max: number }
 */
export function calculateCharacterHealth(character) {
  if (!character || !character.selectedAspects) {
    return { current: 0, max: 0 };
  }

  const total = character.selectedAspects.reduce((sum, aspect) =>
    sum + aspect.trackSize, 0);

  // Count both 'marked' and 'burned' as damage
  const damaged = character.selectedAspects.reduce((sum, aspect) =>
    sum + aspect.damageStates.filter(s => s === 'marked' || s === 'burned').length, 0);

  return {
    current: total - damaged,
    max: total
  };
}

/**
 * Calculate ship health from rating damage states
 * @param {Object} ship - Ship object
 * @returns {Object} { current: number, max: number }
 */
export function calculateShipHealth(ship) {
  if (!ship) {
    return { current: 0, max: 0 };
  }

  const ratings = calculateShipRatings(ship);
  const total = Object.values(ratings).reduce((sum, val) => sum + val, 0);

  const damaged = Object.values(ship.ratingDamage || {})
    .reduce((sum, damageArray) =>
      sum + (damageArray ? damageArray.filter(s => s === 'burned').length : 0), 0);

  return {
    current: total - damaged,
    max: total
  };
}

/**
 * Calculate undercrew health from undercrew damage states
 * @param {Object} ship - Ship object
 * @returns {Object} { current: number, max: number }
 */
export function calculateUndercrewHealth(ship) {
  if (!ship || !ship.undercrew) {
    return { current: 0, max: 0 };
  }

  let totalTracks = 0;
  let totalDamaged = 0;

  // Count tracks from all undercrew
  const undercrewTypes = ['officers', 'gangs', 'packs'];
  undercrewTypes.forEach(type => {
    if (ship.undercrew[type]) {
      ship.undercrew[type].forEach(crew => {
        if (crew.track) {
          totalTracks += crew.track;
          // Count burned boxes for this crew member
          const damageArray = ship.undercrewDamage && ship.undercrewDamage[crew.name];
          if (damageArray) {
            totalDamaged += damageArray.filter(s => s === 'burned').length;
          }
        }
      });
    }
  });

  return {
    current: totalTracks - totalDamaged,
    max: totalTracks
  };
}
