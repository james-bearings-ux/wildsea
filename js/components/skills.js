/**
 * Skills and Languages rendering component
 */

import { getGameData } from '../data/loader.js';
import { getCharacter, BUDGETS } from '../state/character.js';

export function renderSkills(character = null, gameData = null) {
  const GAME_DATA = gameData || getGameData();
  const char = character || getCharacter();
  const isCreationMode = char.mode === 'creation';
  const isPlayMode = char.mode === 'play';

  if (isPlayMode) {
    let html = '<div><h2 class="section-header">Skills</h2>';

    for (let i = 0; i < GAME_DATA.skills.length; i++) {
      const skill = GAME_DATA.skills[i];
      const rank = char.skills[skill] || 0;

      html += '<div class="skill-row">';
      html += '<div class="skill-name">' + skill + '</div>';
      html += '<div style="display: flex; gap: 4px;">';

      for (let j = 0; j < 3; j++) {
        html += '<div class="track-box small';
        if (j < rank) html += ' active';
        html += '"></div>';
      }

      html += '</div></div>';
    }

    html += '</div>';
    return html;
  } else if (isCreationMode) {
    let html = '<div style="display: flex; flex-direction: column; gap: 4px;">';
    html += '<h3 class="subsection-header" style="margin-bottom: 12px;">Skills</h3>';

    const skillPoints = Object.values(char.skills).reduce(function (sum, v) { return sum + v; }, 0);
    const languagePoints = Object.entries(char.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; })
      .reduce(function (sum, entry) { return sum + entry[1]; }, 0);
    const totalPoints = skillPoints + languagePoints;

    for (let i = 0; i < GAME_DATA.skills.length; i++) {
      const skill = GAME_DATA.skills[i];
      const rank = char.skills[skill] || 0;
      const canIncrease = rank < 2 && totalPoints < BUDGETS.skillPoints;

      html += '<div class="flex-between" style="margin-bottom: 8px;">';
      html += '<div class="skill-name">' + skill + '</div>';
      html += '<div style="display: flex; gap: 8px; align-items: center;">';
      html += '<button data-action="adjustSkill" data-params=\'{"name":"' + skill + '","delta":-1}\'';
      if (rank === 0) html += ' disabled';
      html += '>−</button>';

      for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
      }

      html += '<button data-action="adjustSkill" data-params=\'{"name":"' + skill + '","delta":1}\'';
      if (!canIncrease) html += ' disabled';
      html += '>+</button>';
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  } else {
    let html = '<div><h2 class="section-header">Skills</h2>';

    for (let i = 0; i < GAME_DATA.skills.length; i++) {
      const skill = GAME_DATA.skills[i];
      const rank = char.skills[skill] || 0;

      html += '<div class="flex-between" style="margin-bottom: 8px;">';
      html += '<div class="skill-name">' + skill + '</div>';
      html += '<div style="display: flex; gap: 8px; align-items: center;">';
      html += '<button data-action="adjustSkill" data-params=\'{"name":"' + skill + '","delta":-1}\'';
      if (rank === 0) html += ' disabled';
      html += '>−</button>';

      for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
      }

      html += '<button data-action="adjustSkill" data-params=\'{"name":"' + skill + '","delta":1}\'';
      if (rank >= 3) html += ' disabled';
      html += '>+</button>';
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }
}

export function renderLanguages(character = null, gameData = null) {
  const GAME_DATA = gameData || getGameData();
  const char = character || getCharacter();
  const isCreationMode = char.mode === 'creation';
  const isPlayMode = char.mode === 'play';

  if (isPlayMode) {
    let html = '<div><h2 class="section-header">Languages</h2>';

    for (let i = 0; i < GAME_DATA.languages.length; i++) {
      const lang = GAME_DATA.languages[i];
      const rank = char.languages[lang] || 0;

      html += '<div class="skill-row">';
      html += '<div class="skill-name">' + lang + '</div>';
      html += '<div style="display: flex; gap: 4px;">';

      for (let j = 0; j < 3; j++) {
        html += '<div class="track-box small';
        if (j < rank) html += ' active';
        html += '"></div>';
      }

      html += '</div></div>';
    }

    html += '</div>';
    return html;
  } else if (isCreationMode) {
    let html = '<div style="display: flex; flex-direction: column; gap: 4px;">';
    html += '<h3 class="subsection-header" style="margin-bottom: 12px;">Languages</h3>';

    const skillPoints = Object.values(char.skills).reduce(function (sum, v) { return sum + v; }, 0);
    const languagePoints = Object.entries(char.languages)
      .filter(function (entry) { return entry[0] !== 'Low Sour'; })
      .reduce(function (sum, entry) { return sum + entry[1]; }, 0);
    const totalPoints = skillPoints + languagePoints;

    for (let i = 0; i < GAME_DATA.languages.length; i++) {
      const lang = GAME_DATA.languages[i];
      const rank = char.languages[lang] || 0;
      const isLowSour = lang === 'Low Sour';
      const canIncrease = !isLowSour && rank < 2 && totalPoints < BUDGETS.skillPoints;
      const canDecrease = !isLowSour && rank > 0;

      html += '<div class="flex-between" style="margin-bottom: 8px;">';
      html += '<div class="skill-name">' + lang + '</div>';
      html += '<div style="display: flex; gap: 8px; align-items: center;">';
      html += '<button data-action="adjustLanguage" data-params=\'{"name":"' + lang + '","delta":-1}\'';
      if (!canDecrease) html += ' disabled';
      html += '>−</button>';

      for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
      }

      html += '<button data-action="adjustLanguage" data-params=\'{"name":"' + lang + '","delta":1}\'';
      if (!canIncrease) html += ' disabled';
      html += '>+</button>';
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  } else {
    let html = '<div><h2 class="section-header">Languages</h2>';

    for (let i = 0; i < GAME_DATA.languages.length; i++) {
      const lang = GAME_DATA.languages[i];
      const rank = char.languages[lang] || 0;

      html += '<div class="flex-between" style="margin-bottom: 8px;">';
      html += '<div class="skill-name">' + lang + '</div>';
      html += '<div style="display: flex; gap: 8px; align-items: center;">';
      html += '<button data-action="adjustLanguage" data-params=\'{"name":"' + lang + '","delta":-1}\'';
      if (rank === 0 || lang === 'Low Sour') html += ' disabled';
      html += '>−</button>';

      for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
      }

      html += '<button data-action="adjustLanguage" data-params=\'{"name":"' + lang + '","delta":1}\'';
      if (rank >= 3) html += ' disabled';
      html += '>+</button>';
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }
}
