/**
 * File import/export handlers
 */

import { saveCharacter } from '../state/character.js';
import { addCharacterToSession, setActiveCharacter } from '../state/session.js';

/**
 * Export character as JSON file
 * @param {Object} character - Character object to export
 */
export function exportCharacter(character) {
  const exportData = {
    version: '1.0',
    character: character
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = (character.name || 'character') + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import character from JSON file
 * @param {Object} session - Current session object
 * @param {Function} renderCallback - Callback to trigger re-render
 */
export function importCharacter(session, renderCallback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const importData = JSON.parse(event.target.result);

        if (!importData.version || !importData.character) {
          alert('Invalid character file format');
          return;
        }

        const character = importData.character;
        // Regenerate ID to avoid conflicts
        character.id = Date.now().toString(36) + Math.random().toString(36).substr(2);

        saveCharacter(character);
        addCharacterToSession(session, character.id);
        setActiveCharacter(session, character.id);

        renderCallback();
        alert('Character imported successfully!');
      } catch (error) {
        alert('Error reading character file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  input.click();
}
