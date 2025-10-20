/**
 * Notes component
 * Simple textarea for character notes
 */

export function renderNotes(character) {
  return `
    <div>
      <h2 class="section-header">Notes</h2>
      <textarea
        data-action="updateNotes"
        placeholder="Add notes about your character..."
        style="width: 100%; min-height: 250px; padding: 12px; border: 1px solid #E5E7EB; border-radius: 4px; font-family: inherit; font-size: 14px; resize: vertical;"
      >${character.notes}</textarea>
    </div>
  `;
}
