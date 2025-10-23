/**
 * Milestones rendering component
 */

export function renderMilestones(character) {
  const char = character;
  let html = '<div><h2 class="section-header">Milestones</h2>';

  if (char.milestones.length > 0) {
    html += '<div class="grid-milestone mb-md">';
    html += '<h3 class="subsection-header">Used</h3>';
    html += '<h3 class="subsection-header">Name</h3>';
    html += '<h3 class="subsection-header">Scale</h3>';
    html += '</div>';
  }

  for (let i = 0; i < char.milestones.length; i++) {
    const milestone = char.milestones[i];

    html += '<div class="grid-milestone mb-md">';
    html += '<div class="flex items-center gap-md">';
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
    html += 'data-params=\'{"id":"' + milestone.id + '"}\'>';
    html += '<select ';
    if (milestone.used) html += 'disabled ';
    html += 'data-action="updateMilestoneScale" ';
    html += 'data-params=\'{"id":"' + milestone.id + '"}\'>';
    html += '<option value="Minor"';
    if (milestone.scale === 'Minor') html += ' selected';
    html += '>Minor</option>';
    html += '<option value="Major"';
    if (milestone.scale === 'Major') html += ' selected';
    html += '>Major</option>';
    html += '</select>';
    html += '</div>';
  }

  const marginClass = char.milestones.length > 0 ? 'mt-lg' : '';
  html += '<button class="btn-subtle ' + marginClass + '" data-action="addMilestone">+ New Milestone</button>';
  html += '</div>';

  return html;
}
