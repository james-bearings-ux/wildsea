/**
 * Aspect Customization Modal Component
 */

import { renderInteractiveTrack } from './aspects.js';

/**
 * Render the aspect customization modal
 * @param {Object} character - Character object
 * @param {string} selectedAspectId - Currently selected aspect ID in modal
 * @returns {string} HTML string
 */
export function renderAspectCustomizationModal(character, selectedAspectId = null) {
  // Default to first aspect if none selected
  const aspectToShow = selectedAspectId || (character.selectedAspects[0]?.id || null);

  if (!aspectToShow || character.selectedAspects.length === 0) {
    return ''; // No aspects to customize
  }

  const currentAspect = character.selectedAspects.find(a => a.id === aspectToShow);
  if (!currentAspect) return '';

  const escapedId = currentAspect.id.replace(/'/g, "\\'");

  let html = '<div class="modal-overlay" data-action="closeCustomizeModal">';
  html += '  <div class="modal-container">';

  // Header
  html += '    <div class="modal-header">';
  html += '      <h2 class="modal-title">Customize Aspects</h2>';
  html += '    </div>';

  // Body
  html += '    <div class="modal-body">';

  // Dropdown to select aspect
  html += '      <div class="modal-aspect-dropdown">';
  html += '        <label for="modal-aspect-select">Select Aspect:</label>';
  html += '        <select id="modal-aspect-select" class="select-input" ';
  html += '                data-action="selectAspectInModal" style="width: 100%;">';

  character.selectedAspects.forEach(aspect => {
    const selected = aspect.id === aspectToShow ? ' selected' : '';
    html += `          <option value="${aspect.id}"${selected}>${aspect.name}</option>`;
  });

  html += '        </select>';
  html += '      </div>';

  // Aspect card with editable fields
  html += '      <div class="modal-aspect-card">';

  // Meta info (non-editable)
  html += `        <div class="aspect-meta">${currentAspect.type} • ${currentAspect.category}</div>`;

  // Editable name
  const nameValue = currentAspect.name || '';
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
  html += renderInteractiveTrack(currentAspect, escapedId);

  // Editable description
  const descValue = currentAspect.description || '';
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
  html += `                data-params='{"id":"${escapedId}"}'>`;
  html += '          Reset Changes';
  html += '        </button>';
  html += '      </div>';
  html += '      <div class="modal-footer-right">';
  html += '        <button data-action="closeCustomizeModal">Cancel</button>';
  html += '        <button class="bg-black" data-action="saveAspectCustomization" ';
  html += `                data-params='{"id":"${escapedId}"}'>`;
  html += '          Save';
  html += '        </button>';
  html += '      </div>';
  html += '    </div>';

  html += '  </div>';
  html += '</div>';

  return html;
}
