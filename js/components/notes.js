/**
 * Notes component
 * Simple textarea for character notes
 */

import { escapeHtmlContent } from '../utils/escaping.js';

export function renderNotes(character) {
  return `
    <div>
      <h2 class="section-header">Notes</h2>
      <textarea
        class="notes-textarea"
        data-action="updateNotes"
        placeholder="Add notes about your character..."
      >${escapeHtmlContent(character.notes)}</textarea>
    </div>
  `;
}
