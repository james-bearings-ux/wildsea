/**
 * Milestones rendering component
 */

import { getCharacter } from '../state/character.js';

export function renderMilestones(character = null) {
  const char = character || getCharacter();
  let html = '<div><h2 class="section-header">Milestones</h2>';

  if (char.milestones.length > 0) {
    html += '<div class="grid-milestone" style="margin-bottom: 8px;">';
    html += '<h3 class="subsection-header">Used</h3>';
    html += '<h3 class="subsection-header">Name</h3>';
    html += '<h3 class="subsection-header">Scale</h3>';
    html += '</div>';
  }

  for (let i = 0; i < char.milestones.length; i++) {
    const milestone = char.milestones[i];

    html += '<div class="grid-milestone" style="margin-bottom: 8px;">';
    html += '<div style="display: flex; align-items: center; gap: 10px;">';
    html += '<div style="width: 34px;"></div>';
    html += '<input type="checkbox" ';
    if (milestone.used) html += 'checked ';
    html += 'data-action="toggleMilestoneUsed" ';
    html += 'data-params=\'{"id":"' + milestone.id + '"}\'>';
    html += '</div>';
    html += '<input type="text" ';
    html += 'value="' + milestone.name + '" ';
    html += 'placeholder="Enter milestone name..." ';
    if (milestone.used) html += 'disabled ';
    html += 'data-action="updateMilestoneName" ';
    html += 'data-params=\'{"id":"' + milestone.id + '"}\' ';
    html += 'style="width: 100%;">';
    html += '<select ';
    if (milestone.used) html += 'disabled ';
    html += 'data-action="updateMilestoneScale" ';
    html += 'data-params=\'{"id":"' + milestone.id + '"}\' ';
    html += 'style="width: 100%;">';
    html += '<option value="Minor"';
    if (milestone.scale === 'Minor') html += ' selected';
    html += '>Minor</option>';
    html += '<option value="Major"';
    if (milestone.scale === 'Major') html += ' selected';
    html += '>Major</option>';
    html += '</select>';
    html += '</div>';
  }

  const marginTop = char.milestones.length > 0 ? '12' : '0';
  html += '<button class="ghost" data-action="addMilestone" style="width: 100%; margin-top: ' + marginTop + 'px;">+ New Milestone</button>';
  html += '</div>';

  return html;
}
