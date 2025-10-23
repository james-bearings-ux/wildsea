/**
 * Notes component
 * Simple textarea for character notes
 */

export function renderNotes(character) {
  return `
    <div>
      <h2 class="section-header">Notes</h2>
      <textarea
        class="notes-textarea"
        data-action="updateNotes"
        placeholder="Add notes about your character..."
      >${character.notes}</textarea>
    </div>
  `;
}
