/**
 * Dice roller component for Wildsea d6 pool system
 *
 * Mechanics:
 * - Pool: 1-6 d6 (Edge 1d6 + Skill/Language 1-3d6 + optional Aspect/Resource 1-2d6)
 * - Outcome based on highest die:
 *   - 6 = Triumph
 *   - 5, 4 = Conflict
 *   - 3, 2, 1 = Disaster
 * - Doubles = Twist (special condition)
 */

// Constants
const DICE_FACES = [1, 2, 3, 4, 5, 6];
const OUTCOME_COLORS = {
  triumph: '#10b981',    // Green
  conflict: '#f59e0b',   // Gold
  disaster: '#ef4444'    // Red
};

/**
 * Determine outcome based on dice values
 * @param {number[]} values - Array of die values (should be sorted descending)
 * @returns {Object} { result: string, color: string, hasDoubles: boolean, doubleIndices: number[] }
 */
export function getOutcome(values) {
  const highest = values[0];

  // Determine result based on highest die
  let result;
  if (highest === 6) {
    result = 'triumph';
  } else if (highest >= 4) {
    result = 'conflict';
  } else {
    result = 'disaster';
  }

  // Check for doubles (any matching values)
  const hasDoubles = values.some((val, idx) => values.indexOf(val) !== idx);
  const doubleIndices = [];

  if (hasDoubles) {
    const counts = {};
    values.forEach((val, idx) => {
      if (!counts[val]) counts[val] = [];
      counts[val].push(idx);
    });

    // Find all indices that are part of doubles
    Object.values(counts).forEach(indices => {
      if (indices.length > 1) {
        doubleIndices.push(...indices);
      }
    });
  }

  return {
    result,
    color: OUTCOME_COLORS[result],
    hasDoubles,
    doubleIndices
  };
}

/**
 * Fake dice roll (returns random values until we integrate a dice framework)
 * @param {number} count - Number of dice to roll
 * @returns {number[]} Array of die values, sorted descending
 */
export function fakeDiceRoll(count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1)
    .sort((a, b) => b - a); // Sort descending (highest first)
}

/**
 * Render a single die face
 * @param {number} value - Die value (1-6)
 * @param {Object} options - Rendering options
 * @param {boolean} options.isOutcome - Whether this is the outcome die (top die in results)
 * @param {boolean} options.isDouble - Whether this die is part of doubles
 * @param {boolean} options.isDimmed - Whether to dim this die (non-outcome dice)
 * @param {string} options.outcomeColor - Color for outcome die
 * @returns {string} HTML string
 */
function renderDie(value, { isOutcome = false, isDouble = false, isDimmed = false, outcomeColor = null } = {}) {
  const classes = ['dice-face'];
  if (isDouble) classes.push('dice-double');
  if (isDimmed) classes.push('dice-dimmed');

  const style = isOutcome && outcomeColor
    ? `background-color: ${outcomeColor};`
    : '';

  return `<div class="${classes.join(' ')}" style="${style}">${value}</div>`;
}

/**
 * Render interactive dice stack (1-6 selector)
 * @returns {string} HTML string
 */
export function renderDiceStack() {
  let html = '<div class="dice-stack">';

  // Render dice from 6 down to 1 (top to bottom visually, but 1 at bottom)
  for (let i = DICE_FACES.length - 1; i >= 0; i--) {
    const value = DICE_FACES[i];
    html += `<div class="dice-selector" data-action="rollDice" data-params='{"count":${value}}'>`;
    html += renderDie(value);
    html += '</div>';
  }

  html += '</div>';
  return html;
}

/**
 * Format timestamp to HH:MM military time
 * @param {number} timestamp - Milliseconds since epoch
 * @returns {string} Formatted time string (HH:MM)
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Render a single roll result column
 * @param {Object} roll - Roll data { id, diceCount, values, timestamp, visible }
 * @returns {string} HTML string
 */
export function renderRollColumn(roll) {
  if (!roll.visible) return '';

  const outcome = getOutcome(roll.values);

  let html = `<div class="dice-result-column" data-roll-id="${roll.id}">`;

  // Outcome label
  html += `<div class="dice-outcome-label">${outcome.result.toUpperCase()}</div>`;
  if (outcome.hasDoubles) {
    html += '<div class="dice-twist-label">TWIST</div>';
  }

  // Timestamp
  html += `<div class="dice-result-timestamp">${formatTimestamp(roll.timestamp)}</div>`;

  // Dice results
  html += '<div class="dice-result-stack">';
  roll.values.forEach((value, idx) => {
    const isOutcome = idx === 0; // Top die is outcome
    const isDouble = outcome.doubleIndices.includes(idx);
    const isDimmed = idx > 0; // Dim all dice except the top (outcome) die

    html += renderDie(value, {
      isOutcome,
      isDouble,
      isDimmed,
      outcomeColor: isOutcome ? outcome.color : null
    });
  });
  html += '</div>';

  html += '</div>';
  return html;
}

/**
 * Render all roll results
 * @param {Array} rolls - Array of roll objects
 * @returns {string} HTML string
 */
export function renderRollResults(rolls) {
  if (!rolls || rolls.length === 0) return '';

  let html = '<div class="dice-results-container">';
  // Reverse array so newest rolls appear on the left (closest to interactive dice)
  const reversedRolls = [...rolls].reverse();
  reversedRolls.forEach(roll => {
    html += renderRollColumn(roll);
  });
  html += '</div>';

  return html;
}

/**
 * Render complete dice roller UI
 * @param {Array} rolls - Array of roll objects
 * @param {boolean} showResults - Whether to show results (default: true)
 * @returns {string} HTML string
 */
export function renderDiceRoller(rolls = [], showResults = true) {
  const hasVisibleRolls = rolls.some(r => r.visible);

  return `
    <div class="dice-roller-panel">
      <div class="dice-roller-controls">
        <button class="dice-control-btn" data-action="toggleDiceResults" title="${showResults ? 'Hide' : 'Show'} Results">
          ${showResults ? '◀' : '▶'}
        </button>
        ${hasVisibleRolls ? '<button class="dice-control-btn dice-control-dismiss" data-action="dismissAllRolls" title="Dismiss All">×</button>' : ''}
      </div>
      <div class="dice-roller-wrapper">
        ${renderDiceStack()}
        ${showResults ? renderRollResults(rolls) : ''}
      </div>
    </div>
  `;
}
