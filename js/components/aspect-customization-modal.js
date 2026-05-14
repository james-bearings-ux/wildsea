/**
 * Aspect Customization Modal Component
 */

import { renderInteractiveTrack } from './aspects.js';
import { createDataParams } from '../utils/escaping.js';

/**
 * Render the aspect customization modal
 * @param {Object} character - Character object
 * @param {string} selectedAspectId - Currently selected aspect ID in modal
 * @param {Object} modalUnsavedEdits - Unsaved edits { aspectId: { name, description } }
 * @returns {string} HTML string
 */
export function renderAspectCustomizationModal(character, selectedAspectId = null, modalUnsavedEdits = {}) {
  // Default to first aspect if none selected
  const aspectToShow = selectedAspectId || (character.selectedAspects[0]?.id || null);

  if (!aspectToShow || character.selectedAspects.length === 0) {
    return ''; // No aspects to customize
  }

  const currentAspect = character.selectedAspects.find(a => a.id === aspectToShow);
  if (!currentAspect) return '';

  // Check for unsaved edits for this aspect
  const unsavedEdits = modalUnsavedEdits[aspectToShow] || {};

  let html = '<div class="modal-overlay" data-action="closeCustomizeModal">';
  html += '  <div class="modal-container">';

  // Header
  html += '    <div class="modal-header">';
  html += '      <h2 class="modal-title">Customize Aspects</h2>';
  html += '    </div>';

  // Body
  html += '    <div class="modal-body">';

  // Aspect card with editable fields
  html += '      <div class="modal-aspect-card">';

  // Meta info (non-editable)
  html += `        <div class="aspect-meta">${currentAspect.type} • ${currentAspect.category}</div>`;

  // Editable name - use unsaved edit if available
  const nameValue = unsavedEdits.name !== undefined ? unsavedEdits.name : (currentAspect.name || '');
  html += '        <input type="text" ';
  html += '               class="aspect-name-input" ';
  html += '               id="modal-aspect-name" ';
  html += `               value="${nameValue.replace(/"/g, '&quot;')}" `;
  html += '               placeholder="Aspect Name" ';
  html += '               maxlength="250" />';
  html += '        <div class="modal-char-count">';
  html += `          <span id="name-char-count">${nameValue.length}</span>/250`;
  html += '        </div>';

  // Track (non-editable in modal)
  html += renderInteractiveTrack(currentAspect, currentAspect.id);

  // Editable description - use unsaved edit if available
  const descValue = unsavedEdits.description !== undefined ? unsavedEdits.description : (currentAspect.description || '');
  html += '        <textarea ';
  html += '               class="aspect-description-textarea" ';
  html += '               id="modal-aspect-description" ';
  html += '               placeholder="Aspect Description" ';
  html += '               maxlength="800">';
  html += descValue.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html += '</textarea>';
  html += '        <div class="modal-char-count">';
  html += `          <span id="description-char-count">${descValue.length}</span>/800`;
  html += '        </div>';

  html += '      </div>';

  html += '    </div>';

  // Footer with actions
  html += '    <div class="modal-footer">';
  html += '      <div class="modal-footer-left">';
  html += '        <button data-action="resetAspectCustomization" ';
  html += '                ' + createDataParams({ id: currentAspect.id }) + '>';
  html += '          Reset Changes';
  html += '        </button>';
  html += '      </div>';
  html += '      <div class="modal-footer-right">';
  html += '        <button data-action="closeCustomizeModal">Cancel</button>';
  html += '        <button data-action="saveAspectCustomization" ';
  html += '                ' + createDataParams({ id: currentAspect.id }) + '>';
  html += '          Save';
  html += '        </button>';
  html += '      </div>';
  html += '    </div>';

  html += '  </div>';
  html += '</div>';

  return html;
}
