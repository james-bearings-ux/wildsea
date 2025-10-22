// js/components/journey-clocks.js
// Journey clocks and controls components

/**
 * Render a single journey clock
 * @param {string} clockType - Type of clock (progress, risk, pathfinding, riot)
 * @param {object} clockData - Clock data with max and filled properties
 * @param {boolean} editMode - Whether in edit mode
 * @returns {string} HTML string
 */
export function renderJourneyClock(clockType, clockData, editMode = false) {
  const { max, filled } = clockData;
  const capitalizedType = clockType.charAt(0).toUpperCase() + clockType.slice(1);

  if (editMode) {
    // Edit mode: dropdown for setting max ticks
    const options = [1, 2, 3, 4, 5, 6].map(n =>
      `<option value="${n}" ${n === max ? 'selected' : ''}>${n}</option>`
    ).join('');

    return `
      <div class="clock ${clockType}-clock">
        <h4>${capitalizedType}</h4>
        <select
          data-action="setClockMax"
          data-params='${JSON.stringify({ clockType })}'
          class="clock-max-select border rounded px-2 py-1 bg-white">
          ${options}
        </select>
      </div>
    `;
  }

  // Display mode: clickable ticks
  const ticks = Array.from({ length: 6 }, (_, i) => {
    const isVisible = i < max;
    const isFilled = i < filled;

    if (!isVisible) return '';

    return `
      <div
        class="clock-tick ${isFilled ? 'filled' : ''}"
        data-action="toggleClockTick"
        data-params='${JSON.stringify({ clockType, tickIndex: i })}'
        title="Click to toggle">
      </div>
    `;
  }).join('');

  return `
    <div class="clock ${clockType}-clock">
      <h4>${capitalizedType}</h4>
      <div class="clock-ticks flex gap-1">
        ${ticks}
      </div>
    </div>
  `;
}

/**
 * Render the complete journey controls section
 * @param {object} journeyData - Journey data from ship state
 * @param {boolean} editMode - Whether in edit mode
 * @returns {string} HTML string
 */
export function renderJourneyControls(journeyData, editMode = false) {
  const { active, name, clocks } = journeyData;

  return `
    <div class="journey-controls p-8 mb-4">
      <!-- Journey Header -->
      <div class="journey-header">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            ${active ? 'checked' : ''}
            data-action="toggleJourney"
            class="journey-toggle">
          <span style="color: white;" class="font-semibold">Journey</span>
        </label>

        ${editMode ? `
          <div class="journey-name-container">
            <input
              type="text"
              value="${name || ''}"
              data-action="updateJourneyName"
              class="journey-name-input border rounded px-2 py-1 flex-grow"
              placeholder="Journey name">
            <button
              data-action="saveJourney"
              class="save-btn px-3 py-1 text-white rounded"
              style="background-color: white; hover:opacity-90;">
              Save
            </button>
          </div>
        ` : `
          
          ${active ? `
            <div class="journey-name-container">
              <span class="journey-name">${name || 'Unnamed Journey'}</span>
              <button
                data-action="editJourney" 
                class="journey-edit-btn hover:opacity-75" 
                style="padding: 8px 12px;">
                Edit
              </button>
            </div>
          ` : ''}
        `}
      </div>

      <!-- Journey Clocks (only when active) -->
      ${active ? `
        <div class="journey-clocks">
          ${renderJourneyClock('progress', clocks.progress, editMode)}
          ${renderJourneyClock('risk', clocks.risk, editMode)}
          ${renderJourneyClock('pathfinding', clocks.pathfinding, editMode)}
          ${renderJourneyClock('riot', clocks.riot, editMode)}
        </div>
      ` : ''}
    </div>
  `;
}
