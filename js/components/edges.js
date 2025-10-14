/**
 * Edges rendering component
 */

import { getGameData } from '../data/loader.js';
import { getCharacter, BUDGETS } from '../state/character.js';

export function renderEdges() {
  const GAME_DATA = getGameData();
  const character = getCharacter();
  const isCreationMode = character.mode === 'creation';
  const edgesSelected = character.selectedEdges.length;

  if (isCreationMode) {
    let html = '<div>';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">';
    html += '<h2 class="section-header" style="margin: 0;">Edges</h2>';
    html += '<div class="budget-indicator">' + edgesSelected + '/' + BUDGETS.edges + '</div>';
    html += '</div>';
    html += '<div style="display: flex; flex-direction: column; gap: 12px;">';

    for (let i = 0; i < GAME_DATA.edges.length; i++) {
      const edge = GAME_DATA.edges[i];
      const isSelected = character.selectedEdges.includes(edge.name);
      const isDisabled = !isSelected && edgesSelected >= BUDGETS.edges;

      html += '<div class="edge-card';
      if (isSelected) html += ' selected';
      if (isDisabled) html += ' disabled';
      html += '" data-action="toggleEdge" data-params=\'{"name":"' + edge.name + '"}\'>';
      html += '<div class="aspect-name" style="margin-bottom: 4px;">' + edge.name + '</div>';
      html += '<div class="edge-tagline" style="font-size: 12px; color: ';
      html += isSelected ? '#9CA3AF' : '#6B7280';
      html += ';">' + edge.tagline + '</div>';
      html += '</div>';
    }

    html += '</div></div>';
    return html;
  } else {
    let html = '<div><h2 class="section-header">Edges</h2>';

    for (let i = 0; i < character.selectedEdges.length; i++) {
      html += '<div class="aspect-name" style="color: #111827; margin-bottom: 4px;">';
      html += character.selectedEdges[i];
      html += '</div>';
    }

    html += '</div>';
    return html;
  }
}

export function renderEdgesSkillsLanguagesRow(renderSkills, renderLanguages) {
  const character = getCharacter();
  const isCreationMode = character.mode === 'creation';

  if (isCreationMode) {
    const skillPoints = Object.values(character.skills).reduce(function (sum, v) { return sum + v; }, 0);
    const languagePoints = Object.entries(character.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; })
      .reduce(function (sum, entry) { return sum + entry[1]; }, 0);
    const totalPoints = skillPoints + languagePoints;

    let html = '<div style="display: grid; grid-template-columns: 1fr 2fr; gap: 32px; margin-bottom: 40px;">';
    html += renderEdges();
    html += '<div>';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">';
    html += '<h2 class="section-header" style="margin: 0;">Skills & Languages</h2>';
    html += '<div class="budget-indicator">' + totalPoints + '/' + BUDGETS.skillPoints + '</div>';
    html += '</div>';
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">';
    html += renderSkills();
    html += renderLanguages();
    html += '</div></div></div>';

    return html;
  } else {
    let html = '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; margin-bottom: 32px;">';
    html += renderEdges();
    html += renderSkills();
    html += renderLanguages();
    html += '</div>';

    return html;
  }
}
