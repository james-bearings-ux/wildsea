/**
 * Aspect rendering component
 */

/**
 * Render small track boxes (used in Creation and Advancement for unselected)
 */
export function renderSmallTrack(trackSize) {
  let html = '<div style="display: flex; gap: 4px; padding-top: 4px; margin-bottom: 4px;">';
  for (let i = 0; i < trackSize; i++) {
    html += '<div class="track-box small"></div>';
  }
  html += '</div>';
  return html;
}

/**
 * Render interactive track (used in Advancement for selected)
 */
export function renderInteractiveTrack(aspect, escapedId) {
  let html = '<div style="display: flex; gap: 8px; align-items: center; padding-top: 4px; margin-bottom: 4px;">';
  html += '<button data-action="expandAspectTrack" data-params=\'{"id":"' + escapedId + '","delta":-1}\' ';
  html += (aspect.trackSize <= 1 ? 'disabled ' : '');
  html += 'style="flex-shrink: 0; padding: 2px 8px; font-size: 14px;" class="bg-black">−</button>';

  for (let i = 0; i < aspect.trackSize; i++) {
    const isNew = i >= aspect.track;
    html += '<div class="track-box' + (isNew ? ' new' : '') + '"></div>';
  }

  html += '<button data-action="expandAspectTrack" data-params=\'{"id":"' + escapedId + '","delta":1}\' ';
  html += (aspect.trackSize >= 5 ? 'disabled ' : '');
  html += 'style="flex-shrink: 0; padding: 2px 8px; font-size: 14px;" class="bg-black">+</button>';
  html += '</div>';
  return html;
}
