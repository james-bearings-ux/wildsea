/**
 * DM dashboard component
 *
 * Renders the DM screen's Dashboard tab as a wide, tabular crew overview with
 * three modes:
 *   - rp          — health, drives, mires, tasks (one row per character)
 *   - exploration — skills matrix + languages matrix (characters × abilities)
 *   - combat      — health, defenses (resist/immune/weak) and damage dealt (CQ/LR/UR)
 *
 * Data is read via existing helpers; this component only renders. See the
 * plan/GAME-RULES for the mode definitions.
 */

import { getGameData } from '../data/loader.js';
import { calculateCharacterHealth, calculateShipHealth } from '../utils/health-calculations.js';
import { getCharacterDamageTypes } from '../state/character.js';
import { generateCharacterGradient } from '../utils/character-image.js';
import { escapeHtmlContent } from '../utils/escaping.js';
import { createDataParams } from '../utils/escaping.js';

const DASH = '<span class="dash-empty">—</span>';

/**
 * Render the whole dashboard body (mode switch + the active mode's view).
 * @param {Object|null} ship - Active ship (for the health row), or null
 * @param {Array} characters - Active characters (pre-sorted by the caller)
 * @param {string} mode - 'rp' | 'exploration' | 'combat'
 * @param {Set<string>} onlineCharacterIds - ids of characters an online player controls
 * @returns {string} HTML string
 */
export function renderDashboard(ship, characters, mode = 'rp', onlineCharacterIds = new Set()) {
  let html = '<div class="dashboard">';
  html += renderModeSwitch(mode);

  if (!characters || characters.length === 0) {
    html += '<div class="dm-row dm-row-empty"><div class="dm-summary">No characters in session</div></div>';
    html += '</div>';
    return html;
  }

  if (mode === 'exploration') {
    html += renderExplorationMode(characters, onlineCharacterIds);
  } else if (mode === 'combat') {
    html += renderShipRow(ship);
    html += renderCombatMode(characters, onlineCharacterIds);
  } else {
    html += renderShipRow(ship);
    html += renderRPMode(characters, onlineCharacterIds);
  }

  html += '</div>';
  return html;
}

/* ---------------- shared bits ---------------- */

function renderModeSwitch(mode) {
  const modes = [['rp', 'RP'], ['exploration', 'Exploration'], ['combat', 'Combat']];
  let html = '<div class="dashboard-mode-switch">';
  for (const [key, label] of modes) {
    const active = mode === key ? ' dash-mode-btn-active' : '';
    html += `<button class="dash-mode-btn${active}" data-action="switchDashboardMode" data-params='{"mode":"${key}"}'>${label}</button>`;
  }
  html += '</div>';
  return html;
}

function renderHealthBar(current, max) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  let html = '<div class="dm-health">';
  html += '<div class="dm-health-bar-container"><div class="dm-health-bar-fill" style="width: ' + pct + '%;"></div></div>';
  html += '<span class="dm-health-value">' + current + '/' + max + '</span>';
  html += '</div>';
  return html;
}

function renderShipRow(ship) {
  if (!ship) return '';
  const health = calculateShipHealth(ship);
  let html = '<div class="dash-ship-row">';
  html += '<span class="dash-ship-name">' + escapeHtmlContent(ship.name || 'Unnamed Ship') + '</span>';
  html += renderHealthBar(health.current, health.max);
  html += '</div>';
  return html;
}

function renderCharCell(character, onlineCharacterIds = new Set()) {
  const gradient = generateCharacterGradient(character.name, 40, 40);
  const subtext = [character.bloodline, character.origin, character.post].filter(Boolean).join(', ');
  const online = onlineCharacterIds.has(character.id);
  let html = '<div class="dash-char">';
  html += '<span class="dash-accent" style="background: ' + gradient + ';"></span>';
  html += '<span class="dash-char-text">';
  html += '<span class="dash-char-name-row">';
  if (online) html += '<span class="dash-online-dot" title="Online"></span>';
  html += '<button class="dash-char-link" data-action="switchCharacter" ' + createDataParams({ characterId: character.id }) + '>';
  html += escapeHtmlContent(character.name || 'Unnamed Character') + '</button>';
  html += '</span>';
  if (subtext) html += '<span class="dash-char-sub">' + escapeHtmlContent(subtext) + '</span>';
  html += '</span></div>';
  return html;
}

/* ---------------- RP mode ---------------- */

function renderRPMode(characters, onlineCharacterIds) {
  let html = '<div class="dash-scroll"><table class="dash-table dash-rp">';
  html += '<thead><tr><th>Character</th><th>Health</th><th>Drives</th><th>Mires</th><th>Tasks</th></tr></thead><tbody>';
  for (const character of characters) {
    const health = calculateCharacterHealth(character);
    html += '<tr>';
    html += '<td class="dash-char-cell">' + renderCharCell(character, onlineCharacterIds) + '</td>';
    html += '<td>' + renderHealthBar(health.current, health.max) + '</td>';
    html += '<td>' + renderDrivesCell(character) + '</td>';
    html += '<td>' + renderMiresCell(character) + '</td>';
    html += '<td>' + renderTasksCell(character) + '</td>';
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

function renderDrivesCell(character) {
  const items = (character.drives || []).filter(d => d && d.trim());
  if (!items.length) return DASH;
  return items.map(d => '<div class="dash-line">' + escapeHtmlContent(d) + '</div>').join('');
}

function renderMiresCell(character) {
  const mires = (character.mires || []).filter(m => (m.text && m.text.trim()) || m.checkbox1 || m.checkbox2);
  if (!mires.length) return DASH;
  return mires.map(m => {
    const box1 = '<span class="dash-box' + (m.checkbox1 ? ' marked' : '') + '">' + (m.checkbox1 ? '/' : '') + '</span>';
    const box2 = '<span class="dash-box' + (m.checkbox2 ? ' marked' : '') + '">' + (m.checkbox2 ? '/' : '') + '</span>';
    return '<div class="dash-mire">' + box1 + box2 + '<span class="dash-mire-text">' + escapeHtmlContent(m.text || '') + '</span></div>';
  }).join('');
}

function renderTasksCell(character) {
  const tasks = character.tasks || [];
  if (!tasks.length) return DASH;
  return tasks.map(t =>
    '<div class="dash-line">' + escapeHtmlContent(t.name || 'Unnamed Task') +
    ' <span class="dash-task-prog">' + t.currentTicks + '/' + t.maxTicks + '</span></div>'
  ).join('');
}

/* ---------------- exploration mode ---------------- */

function renderExplorationMode(characters, onlineCharacterIds) {
  const GAME = getGameData();
  let html = '<h3 class="dash-subhead">Skills</h3>';
  html += renderMatrix(characters, GAME.skills, (c, name) => (c.skills && c.skills[name]) || 0, onlineCharacterIds);
  html += '<h3 class="dash-subhead">Languages</h3>';
  html += renderMatrix(characters, GAME.languages, (c, name) => (c.languages && c.languages[name]) || 0, onlineCharacterIds);
  return html;
}

function renderMatrix(characters, items, getRank, onlineCharacterIds = new Set()) {
  let html = '<div class="dash-scroll"><table class="skill-matrix"><thead><tr><th class="sm-corner"></th>';
  for (const item of items) {
    const name = item.name || item;
    html += '<th class="vhead"><span>' + escapeHtmlContent(name) + '</span></th>';
  }
  html += '</tr></thead><tbody>';
  for (const character of characters) {
    const online = onlineCharacterIds.has(character.id);
    html += '<tr><td class="sm-char">';
    if (online) html += '<span class="dash-online-dot" title="Online"></span>';
    html += '<button class="dash-char-link" data-action="switchCharacter" ' + createDataParams({ characterId: character.id }) + '>';
    html += escapeHtmlContent(character.name || 'Unnamed Character') + '</button></td>';
    for (const item of items) {
      const name = item.name || item;
      html += '<td class="sm-cell">' + renderRankDots(getRank(character, name)) + '</td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

function renderRankDots(rank) {
  let html = '<span class="rank-dots">';
  for (let i = 0; i < 3; i++) {
    html += '<span class="rank-dot' + (i < rank ? ' filled' : '') + '"></span>';
  }
  html += '</span>';
  return html;
}

/* ---------------- combat mode ---------------- */

function renderCombatMode(characters, onlineCharacterIds) {
  let html = '<div class="dash-scroll"><table class="dash-table dash-combat">';
  html += '<thead><tr><th>Character</th><th>Health</th><th>Resist</th><th>Immune</th><th>Weak</th>';
  html += '<th>Close (CQ)</th><th>Long (LR)</th><th>Ultra (UR)</th></tr></thead><tbody>';
  for (const character of characters) {
    const health = calculateCharacterHealth(character);
    const dt = getCharacterDamageTypes(character);
    html += '<tr>';
    html += '<td class="dash-char-cell">' + renderCharCell(character, onlineCharacterIds) + '</td>';
    html += '<td>' + renderHealthBar(health.current, health.max) + '</td>';
    html += '<td>' + renderChips(dt.resistance, 'resist') + '</td>';
    html += '<td>' + renderChips(dt.immunity, 'immune') + '</td>';
    html += '<td>' + renderChips(dt.weakness, 'weak') + '</td>';
    html += '<td>' + renderChips(dt.dealing.CQ, 'deal') + '</td>';
    html += '<td>' + renderChips(dt.dealing.LR, 'deal') + '</td>';
    html += '<td>' + renderChips(dt.dealing.UR, 'deal') + '</td>';
    html += '</tr>';
  }
  html += '</tbody></table></div>';
  return html;
}

function renderChips(arr, category) {
  if (!arr || !arr.length) return DASH;
  return arr.map(t => '<span class="dash-chip ' + category + '">' + escapeHtmlContent(t) + '</span>').join(' ');
}
