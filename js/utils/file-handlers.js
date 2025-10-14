/**
 * File import/export handlers
 */

import { getCharacter, replaceCharacter } from '../state/character.js';

/**
 * Export character as JSON file
 */
export function exportCharacter() {
  const character = getCharacter();
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
 * @param {Function} renderCallback - Callback to trigger re-render
 */
export function importCharacter(renderCallback) {
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

        replaceCharacter(importData.character);
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
