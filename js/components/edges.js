/**
 * Edges rendering component
 */

import { getGameData } from '../data/loader.js';
import { BUDGETS } from '../state/character.js';

export function renderEdges(character, gameData = null) {
  const GAME_DATA = gameData || getGameData();
  const char = character;
  const isCreationMode = char.mode === 'creation';
  const edgesSelected = char.selectedEdges.length;

  if (isCreationMode) {
    let html = '<div>';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">';
    html += '<h2 class="section-header" style="margin: 0;">Edges</h2>';
    html += '<div class="budget-indicator">' + edgesSelected + '/' + BUDGETS.edges + '</div>';
    html += '</div>';
    html += '<div style="display: flex; flex-direction: column; gap: 12px;">';

    for (let i = 0; i < GAME_DATA.edges.length; i++) {
      const edge = GAME_DATA.edges[i];
      const isSelected = char.selectedEdges.includes(edge.name);
      const isDisabled = !isSelected && edgesSelected >= BUDGETS.edges;
      const escapedName = edge.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      html += '<div class="edge-card';
      if (isSelected) html += ' selected';
      if (isDisabled) html += ' disabled';
      html += '" data-action="toggleEdge" data-params="{&quot;name&quot;:&quot;' + escapedName + '&quot;}">';
      html += '<div class="edge-name" style="margin-bottom: 4px;">' + edge.name + '</div>';
      html += '<div class="edge-tagline" style="font-size: 12px; color: ';
      html += isSelected ? '#9CA3AF' : '#6B7280';
      html += ';">' + edge.tagline + '</div>';
      html += '</div>';
    }

    html += '</div></div>';
    return html;
  } else {
    let html = '<div><h2 class="section-header">Edges</h2>';

    for (let i = 0; i < char.selectedEdges.length; i++) {
      const edgeName = char.selectedEdges[i];
      const edge = GAME_DATA.edges.find(e => e.name === edgeName);
      const tagline = edge ? edge.tagline : '';

      html += '<div class="edge-name" style="color: #111827; margin-bottom: 4px;" data-tooltip="' + tagline + '">';
      html += edgeName;
      html += '</div>';
    }

    html += '</div>';
    return html;
  }
}

export function renderEdgesSkillsLanguagesRow(renderSkills, renderLanguages, character, gameData = null) {
  const char = character;
  const GAME_DATA = gameData || getGameData();
  const isCreationMode = char.mode === 'creation';

  if (isCreationMode) {
    const skillPoints = Object.values(char.skills).reduce(function (sum, v) { return sum + v; }, 0);
    const languagePoints = Object.entries(char.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; })
      .reduce(function (sum, entry) { return sum + entry[1]; }, 0);
    const totalPoints = skillPoints + languagePoints;

    let html = '<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 32px; margin-bottom: 40px;">';
    html += renderEdges(char, GAME_DATA);
    html += '<div>';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">';
    html += '<h2 class="section-header" style="margin: 0;">Skills & Languages</h2>';
    html += '<div class="budget-indicator">' + totalPoints + '/' + BUDGETS.skillPoints + '</div>';
    html += '</div>';
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">';
    html += renderSkills(char, GAME_DATA);
    html += renderLanguages(char, GAME_DATA);
    html += '</div></div></div>';

    return html;
  } else {
    let html = '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; margin-bottom: 32px;">';
    html += renderEdges(char, GAME_DATA);
    html += renderSkills(char, GAME_DATA);
    html += renderLanguages(char, GAME_DATA);
    html += '</div>';

    return html;
  }
}
