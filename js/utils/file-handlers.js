/**
 * File import/export handlers
 */

import { createCharacter, saveCharacter } from '../state/character.js';
import { addCharacterToSession, setActiveCharacter } from '../state/session.js';
import { createShip, saveShip } from '../state/ship.js';
import { setActiveShip, switchToShip } from '../state/session.js';

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
export async function importCharacter(session, renderCallback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (event) {
      try {
        const importData = JSON.parse(event.target.result);

        if (!importData.version || !importData.character) {
          alert('Invalid character file format');
          return;
        }

        const importedData = importData.character;

        // Create a new character in the database (this handles all foreign keys properly)
        const newCharacter = await createCharacter(
          session.id,
          importedData.name || 'Imported Character',
          importedData.bloodline || 'Tzelicrae',
          importedData.origin || 'Ridgeback',
          importedData.post || 'Mesmer'
        );

        // Now update all properties from the imported data
        newCharacter.mode = importedData.mode || 'creation';
        newCharacter.selectedAspects = importedData.selectedAspects || [];
        newCharacter.selectedEdges = importedData.selectedEdges || [];
        newCharacter.skills = importedData.skills || {};
        newCharacter.languages = importedData.languages || { 'Low Sour': 3 };
        newCharacter.drives = importedData.drives || ['', '', ''];
        newCharacter.mires = importedData.mires || [
          { text: '', checkbox1: false, checkbox2: false },
          { text: '', checkbox1: false, checkbox2: false },
          { text: '', checkbox1: false, checkbox2: false }
        ];

        // Copy milestones with regenerated IDs
        if (importedData.milestones && Array.isArray(importedData.milestones)) {
          newCharacter.milestones = importedData.milestones.map(m => ({
            ...m,
            id: crypto.randomUUID()
          }));
        } else {
          newCharacter.milestones = [];
        }

        // Copy resources with regenerated IDs
        if (importedData.resources) {
          newCharacter.resources = {};
          ['charts', 'salvage', 'specimens', 'whispers'].forEach(type => {
            if (importedData.resources[type] && Array.isArray(importedData.resources[type])) {
              newCharacter.resources[type] = importedData.resources[type].map(item => ({
                ...item,
                id: crypto.randomUUID()
              }));
            } else {
              newCharacter.resources[type] = [];
            }
          });
        } else {
          newCharacter.resources = {
            charts: [],
            salvage: [],
            specimens: [],
            whispers: []
          };
        }

        // Save the updated character data
        await saveCharacter(newCharacter);

        // Add to session and set as active
        await addCharacterToSession(session, newCharacter.id);
        await setActiveCharacter(session, newCharacter.id);

        await renderCallback();
        alert('Character imported successfully!');
      } catch (error) {
        console.error('Error importing character:', error);
        alert('Error reading character file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  input.click();
}

/**
 * Export ship as JSON file
 * @param {Object} ship - Ship object to export
 */
export function exportShip(ship) {
  const exportData = {
    version: '1.0',
    ship: ship
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = (ship.name || 'ship') + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import ship from JSON file
 * @param {Object} session - Current session object
 * @param {Function} renderCallback - Callback to trigger re-render
 */
export async function importShip(session, renderCallback) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (event) {
      try {
        const importData = JSON.parse(event.target.result);

        if (!importData.version || !importData.ship) {
          alert('Invalid ship file format');
          return;
        }

        const importedData = importData.ship;

        // Create a new ship in the database (this handles all foreign keys properly)
        const newShip = await createShip(session.id);

        // Now update all properties from the imported data
        newShip.name = importedData.name || 'Imported Ship';
        newShip.mode = importedData.mode || 'creation';
        newShip.size = importedData.size || null;
        newShip.frame = importedData.frame || null;
        newShip.hull = importedData.hull || [];
        newShip.bite = importedData.bite || [];
        newShip.engine = importedData.engine || [];
        newShip.motifs = importedData.motifs || [];
        newShip.weapons = importedData.weapons || [];
        newShip.equipment = importedData.equipment || [];
        newShip.officers = importedData.officers || [];
        newShip.wards = importedData.wards || [];
        newShip.specimen = importedData.specimen || [];
        newShip.crew_size = importedData.crew_size || null;
        newShip.stakes = importedData.stakes || null;

        // Copy damage states if they exist
        if (importedData.ratingDamageStates) {
          newShip.ratingDamageStates = importedData.ratingDamageStates;
        }
        if (importedData.undercrewDamageStates) {
          newShip.undercrewDamageStates = importedData.undercrewDamageStates;
        }

        // Copy cargo with regenerated IDs
        if (importedData.cargo && Array.isArray(importedData.cargo)) {
          newShip.cargo = importedData.cargo.map(item => ({
            ...item,
            id: crypto.randomUUID()
          }));
        } else {
          newShip.cargo = [];
        }

        // Copy passengers with regenerated IDs
        if (importedData.passengers && Array.isArray(importedData.passengers)) {
          newShip.passengers = importedData.passengers.map(passenger => ({
            ...passenger,
            id: crypto.randomUUID()
          }));
        } else {
          newShip.passengers = [];
        }

        // Save the updated ship data
        await saveShip(newShip);

        // Set as active ship and switch to ship view
        await setActiveShip(session, newShip.id);
        await switchToShip(session);

        await renderCallback();
        alert('Ship imported successfully!');
      } catch (error) {
        console.error('Error importing ship:', error);
        alert('Error reading ship file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  input.click();
}
