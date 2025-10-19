/**
 * Drives and Mires rendering components
 */

export function renderDrives(character) {
  const char = character;
  let html = '<div><h2 class="section-header">Drives</h2>';
  html += '<div style="display: flex; flex-direction: column; gap: 8px;">';

  for (let i = 0; i < char.drives.length; i++) {
    html += '<input type="text" ';
    html += 'value="' + char.drives[i] + '" ';
    html += 'placeholder="Enter a drive..." ';
    html += 'data-action="updateDrive" ';
    html += 'data-params=\'{"index":' + i + '}\' ';
    html += 'style="width: 100%;">';
  }

  html += '</div></div>';
  return html;
}

export function renderMires(character) {
  const char = character;
  const showCheckboxes = char.mode === 'play';

  let html = '<div><h2 class="section-header">Mires</h2>';
  html += '<div style="display: flex; flex-direction: column; gap: 8px;">';

  for (let i = 0; i < char.mires.length; i++) {
    const mire = char.mires[i];

    if (showCheckboxes) {
      html += '<div style="display: flex; gap: 8px; align-items: center;">';

      // First track box
      const state1 = mire.checkbox1 ? 'marked' : '';
      const stateChar1 = mire.checkbox1 ? '/' : '';
      html += '<div class="track-box ' + state1 + '" ';
      html += 'data-action="toggleMireCheckbox" ';
      html += 'data-params=\'{"index":' + i + ',"num":1}\' ';
      html += 'style="cursor: pointer;">' + stateChar1 + '</div>';

      // Second track box
      const state2 = mire.checkbox2 ? 'marked' : '';
      const stateChar2 = mire.checkbox2 ? '/' : '';
      html += '<div class="track-box ' + state2 + '" ';
      html += 'data-action="toggleMireCheckbox" ';
      html += 'data-params=\'{"index":' + i + ',"num":2}\' ';
      html += 'style="cursor: pointer;">' + stateChar2 + '</div>';

      html += '<input type="text" ';
      html += 'value="' + mire.text + '" ';
      html += 'placeholder="Enter a mire..." ';
      html += 'data-action="updateMire" ';
      html += 'data-params=\'{"index":' + i + '}\' ';
      html += 'style="width: 100%;">';
      html += '</div>';
    } else {
      html += '<input type="text" ';
      html += 'value="' + mire.text + '" ';
      html += 'placeholder="Enter a mire..." ';
      html += 'data-action="updateMire" ';
      html += 'data-params=\'{"index":' + i + '}\' ';
      html += 'style="width: 100%;">';
    }
  }

  html += '</div></div>';
  return html;
}
