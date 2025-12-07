/**
 * Skills and Languages rendering component
 */

import { getGameData } from '../data/loader.js';
import { BUDGETS } from '../state/character.js';

/**
 * Render the skills component with mode-specific behavior
 * - Creation mode: Interactive controls with +/- buttons, max rank 2, shared 8-point budget with languages
 * - Play mode: Read-only display with rank indicators (0-3 boxes)
 * - Advancement mode: Interactive controls with +/- buttons, max rank 3
 * @param {Object} character - Character object with mode and skills object (name -> rank mapping)
 * @param {Object|null} gameData - Optional game data object containing skills array (fetched if not provided)
 * @returns {string} HTML string for the skills component
 */
export function renderSkills(character, gameData = null) {
  const GAME_DATA = gameData || getGameData();
  const char = character;
  const isCreationMode = char.mode === 'creation';
  const isPlayMode = char.mode === 'play';

  if (isPlayMode) {
    let html = '<div><h2 class="section-header">Skills</h2>';

    for (let i = 0; i < GAME_DATA.skills.length; i++) {
      const skill = GAME_DATA.skills[i];
      const skillName = skill.name || skill;
      const tagline = skill.tagline || '';
      const rank = char.skills[skillName] || 0;

      html += '<div class="skill-row" data-tooltip="' + tagline + '">';
      html += '<div class="skill-name">' + skillName + '</div>';
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
      const skillName = skill.name || skill;
      const tagline = skill.tagline || '';
      const rank = char.skills[skillName] || 0;
      const canIncrease = rank < 2 && totalPoints < BUDGETS.skillPoints;
      const escapedSkill = skillName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      html += '<div class="flex-between" style="margin-bottom: 8px;" data-tooltip="' + tagline + '">';
      html += '<div class="skill-name">' + skillName + '</div>';
      html += '<div style="display: flex; gap: 8px; align-items: center;">';
      html += '<button data-action="adjustSkill" data-params="{&quot;name&quot;:&quot;' + escapedSkill + '&quot;,&quot;delta&quot;:-1}"';
      if (rank === 0) html += ' disabled';
      html += '>−</button>';

      for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
      }

      html += '<button data-action="adjustSkill" data-params="{&quot;name&quot;:&quot;' + escapedSkill + '&quot;,&quot;delta&quot;:1}"';
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
      const skillName = skill.name || skill;
      const tagline = skill.tagline || '';
      const rank = char.skills[skillName] || 0;
      const escapedSkill = skillName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      html += '<div class="flex-between" style="margin-bottom: 8px;" data-tooltip="' + tagline + '">';
      html += '<div class="skill-name">' + skillName + '</div>';
      html += '<div style="display: flex; gap: 8px; align-items: center;">';
      html += '<button data-action="adjustSkill" data-params="{&quot;name&quot;:&quot;' + escapedSkill + '&quot;,&quot;delta&quot;:-1}"';
      if (rank === 0) html += ' disabled';
      html += '>−</button>';

      for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
      }

      html += '<button data-action="adjustSkill" data-params="{&quot;name&quot;:&quot;' + escapedSkill + '&quot;,&quot;delta&quot;:1}"';
      if (rank >= 3) html += ' disabled';
      html += '>+</button>';
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }
}

/**
 * Render the languages component with mode-specific behavior
 * - Creation mode: Interactive controls with +/- buttons, max rank 2, shared 8-point budget with skills
 *   Note: Low Sour is locked at rank 3 and cannot be modified in creation mode
 * - Play mode: Read-only display with rank indicators (0-3 boxes)
 * - Advancement mode: Interactive controls with +/- buttons, max rank 3, Low Sour can be decreased
 * @param {Object} character - Character object with mode and languages object (name -> rank mapping)
 * @param {Object|null} gameData - Optional game data object containing languages array (fetched if not provided)
 * @returns {string} HTML string for the languages component
 */
export function renderLanguages(character, gameData = null) {
  const GAME_DATA = gameData || getGameData();
  const char = character;
  const isCreationMode = char.mode === 'creation';
  const isPlayMode = char.mode === 'play';

  if (isPlayMode) {
    let html = '<div><h2 class="section-header">Languages</h2>';

    for (let i = 0; i < GAME_DATA.languages.length; i++) {
      const lang = GAME_DATA.languages[i];
      const langName = lang.name || lang;
      const tagline = lang.tagline || '';
      const rank = char.languages[langName] || 0;

      html += '<div class="skill-row" data-tooltip="' + tagline + '">';
      html += '<div class="skill-name">' + langName + '</div>';
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
      const langName = lang.name || lang;
      const tagline = lang.tagline || '';
      const rank = char.languages[langName] || 0;
      const isLowSour = langName === 'Low Sour';
      const canIncrease = !isLowSour && rank < 2 && totalPoints < BUDGETS.skillPoints;
      const canDecrease = !isLowSour && rank > 0;
      const escapedLang = langName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      html += '<div class="flex-between" style="margin-bottom: 8px;" data-tooltip="' + tagline + '">';
      html += '<div class="skill-name">' + langName + '</div>';
      html += '<div style="display: flex; gap: 8px; align-items: center;">';
      html += '<button data-action="adjustLanguage" data-params="{&quot;name&quot;:&quot;' + escapedLang + '&quot;,&quot;delta&quot;:-1}"';
      if (!canDecrease) html += ' disabled';
      html += '>−</button>';

      for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
      }

      html += '<button data-action="adjustLanguage" data-params="{&quot;name&quot;:&quot;' + escapedLang + '&quot;,&quot;delta&quot;:1}"';
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
      const langName = lang.name || lang;
      const tagline = lang.tagline || '';
      const rank = char.languages[langName] || 0;
      const escapedLang = langName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

      html += '<div class="flex-between" style="margin-bottom: 8px;" data-tooltip="' + tagline + '">';
      html += '<div class="skill-name">' + langName + '</div>';
      html += '<div style="display: flex; gap: 8px; align-items: center;">';
      html += '<button data-action="adjustLanguage" data-params="{&quot;name&quot;:&quot;' + escapedLang + '&quot;,&quot;delta&quot;:-1}"';
      if (rank === 0 || langName === 'Low Sour') html += ' disabled';
      html += '>−</button>';

      for (let j = 0; j < 3; j++) {
        html += '<div class="track-box';
        if (j < rank) html += ' active';
        html += '"></div>';
      }

      html += '<button data-action="adjustLanguage" data-params="{&quot;name&quot;:&quot;' + escapedLang + '&quot;,&quot;delta&quot;:1}"';
      if (rank >= 3) html += ' disabled';
      html += '>+</button>';
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  }
}
