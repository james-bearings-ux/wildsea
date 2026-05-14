/**
 * Aspect rendering component
 */

import { TRACK_CONSTRAINTS } from '../constants/game-rules.js';
import { createDataParams } from '../utils/escaping.js';

/**
 * Render small track boxes (used in Creation and Advancement for unselected aspects)
 * Displays non-interactive track boxes showing the aspect's base track size
 * @param {number} trackSize - Number of track boxes to render (typically 2-8)
 * @returns {string} HTML string containing track boxes in a flex container
 */
export function renderSmallTrack(trackSize) {
  let html = '<div class="flex gap-sm" style="padding-top: 4px; margin-bottom: 4px;">';
  for (let i = 0; i < trackSize; i++) {
    html += '<div class="track-box small"></div>';
  }
  html += '</div>';
  return html;
}

/**
 * Render interactive track with expand/contract buttons (used in Advancement mode for selected aspects)
 * Shows +/- buttons to adjust track size from base value up to maximum of 8
 * New boxes (beyond base track) are highlighted with 'new' class
 * Uses TRACK_CONSTRAINTS.maxExpansion to enforce maximum track size
 * @param {Object} aspect - Aspect object with trackSize (current) and track (base) properties
 * @param {string} id - Raw aspect ID
 * @returns {string} HTML string containing interactive track with adjustment buttons
 */
export function renderInteractiveTrack(aspect, id) {
  let html = '<div class="flex gap-md items-center" style="padding-top: 4px; margin-bottom: 4px;">';
  html += '<button data-action="expandAspectTrack" ' + createDataParams({ id, delta: -1 }) + ' ';
  html += (aspect.trackSize <= 1 ? 'disabled ' : '');
  html += 'style="flex-shrink: 0; padding: 2px 8px; font-size: 14px;">−</button>';

  for (let i = 0; i < aspect.trackSize; i++) {
    const isNew = i >= aspect.track;
    html += '<div class="track-box' + (isNew ? ' new' : '') + '"></div>';
  }

  html += '<button data-action="expandAspectTrack" ' + createDataParams({ id, delta: 1 }) + ' ';
  // Use centralized constant for maximum track size (currently 8)
  html += (aspect.trackSize >= TRACK_CONSTRAINTS.maxExpansion ? 'disabled ' : '');
  html += 'style="flex-shrink: 0; padding: 2px 8px; font-size: 14px;">+</button>';
  html += '</div>';
  return html;
}
