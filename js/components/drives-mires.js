/**
 * Drives and Mires rendering components
 */

import { escapeHtmlAttr, createDataParams } from '../utils/escaping.js';

/**
 * Render the drives component
 * Displays 3 text inputs for character drives (motivations/goals)
 * Behavior is consistent across all modes
 * @param {Object} character - Character object with drives array
 * @param {Array<string>} character.drives - Array of 3 drive strings
 * @returns {string} HTML string for the drives component
 */
export function renderDrives(character) {
  const char = character;
  let html = '<div><h2 class="section-header">Drives</h2>';
  html += '<div class="flex-col gap-md">';

  for (let i = 0; i < char.drives.length; i++) {
    html += '<input type="text" ';
    html += 'class="drive-input" ';
    html += `value="${escapeHtmlAttr(char.drives[i])}" `;
    html += 'placeholder="Enter a drive..." ';
    html += 'data-action="updateDrive" ';
    html += createDataParams({ index: i }) + '>';
  }

  html += '</div></div>';
  return html;
}

/**
 * Render the mires component
 * Displays 3 mires (problems/complications) with mode-specific behavior
 * - Creation/advancement mode: Text inputs only
 * - Play mode: Two track boxes (checkboxes) + text input per mire
 * @param {Object} character - Character object with mode and mires array
 * @param {Array<Object>} character.mires - Array of 3 mire objects with text, checkbox1, and checkbox2 properties
 * @returns {string} HTML string for the mires component
 */
export function renderMires(character) {
  const char = character;
  const showCheckboxes = char.mode === 'play';

  let html = '<div><h2 class="section-header">Mires</h2>';
  html += '<div class="flex-col gap-md">';

  for (let i = 0; i < char.mires.length; i++) {
    const mire = char.mires[i];

    if (showCheckboxes) {
      html += '<div class="mire-row">';

      // First track box
      const state1 = mire.checkbox1 ? 'marked' : '';
      const stateChar1 = mire.checkbox1 ? '/' : '';
      html += '<div class="track-box ' + state1 + '" ';
      html += 'data-action="toggleMireCheckbox" ';
      html += createDataParams({ index: i, num: 1 }) + ' ';
      html += 'style="cursor: pointer;">' + stateChar1 + '</div>';

      // Second track box
      const state2 = mire.checkbox2 ? 'marked' : '';
      const stateChar2 = mire.checkbox2 ? '/' : '';
      html += '<div class="track-box ' + state2 + '" ';
      html += 'data-action="toggleMireCheckbox" ';
      html += createDataParams({ index: i, num: 2 }) + ' ';
      html += 'style="cursor: pointer;">' + stateChar2 + '</div>';

      html += '<input type="text" ';
      html += 'class="mire-input" ';
      html += `value="${escapeHtmlAttr(mire.text)}" `;
      html += 'placeholder="Enter a mire..." ';
      html += 'data-action="updateMire" ';
      html += createDataParams({ index: i }) + '>';
      html += '</div>';
    } else {
      html += '<input type="text" ';
      html += 'class="mire-input" ';
      html += `value="${escapeHtmlAttr(mire.text)}" `;
      html += 'placeholder="Enter a mire..." ';
      html += 'data-action="updateMire" ';
      html += createDataParams({ index: i }) + '>';
    }
  }

  html += '</div></div>';
  return html;
}
