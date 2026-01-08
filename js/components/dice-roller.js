/**
 * Dice roller component for Wildsea d6 pool system
 *
 * MULTIPLAYER FEATURE:
 * - Dice rolls are stored in session.diceRolls array
 * - All players in the session see each other's rolls in real-time
 * - Uses optimistic updates for instant UI feedback
 * - Roll data structure: { id, userId, userName, diceCount, values, timestamp, visible }
 *
 * MECHANICS:
 * - Pool: 1-6 d6 (Edge 1d6 + Skill/Language 1-3d6 + optional Aspect/Resource 1-2d6)
 * - Outcome based on highest die:
 *   - 6 = Triumph (green)
 *   - 5, 4 = Conflict (gold)
 *   - 3, 2, 1 = Disaster (red)
 * - Doubles = Twist (purple outline on matching dice)
 *
 * UI BEHAVIOR:
 * - Interactive dice stack in lower left (click to select pool size)
 * - Results display to the right, newest first
 * - Auto-expands when rolling, can be collapsed to reduce screen coverage
 * - Reset button clears all visible rolls (only shows when expanded)
 * - Results are CSS-toggled (not destroyed) for smooth expand/collapse
 *
 * INTEGRATION:
 * - Event handlers in js/main.js: rollDice, toggleDiceResults, dismissAllRolls
 * - State management in js/state/session.js: addDiceRoll, dismissAllDiceRolls
 * - Rendered on all views: character, ship, DM screen
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
 *
 * @param {number[]} values - Array of die values (should be sorted descending, highest first)
 * @returns {Object} Outcome object with the following properties:
 *   - result: 'triumph' | 'conflict' | 'disaster' (based on highest die)
 *   - color: hex color code for the outcome (#10b981, #f59e0b, or #ef4444)
 *   - hasDoubles: true if any dice have matching values
 *   - doubleIndices: array of indices for all dice that are part of doubles
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
 *
 * NOTE: This is a placeholder. Future integration with a dice rolling framework
 * (e.g., dice-box) should replace this function but maintain the same signature.
 *
 * @param {number} count - Number of dice to roll (1-6)
 * @returns {number[]} Array of die values (1-6), sorted descending (highest first)
 */
export function fakeDiceRoll(count) {
  return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1)
    .sort((a, b) => b - a); // Sort descending (highest first)
}

/**
 * Render a single die face
 *
 * @param {number} value - Die value (1-6)
 * @param {Object} options - Rendering options
 * @param {boolean} [options.isOutcome=false] - Whether this is the outcome die (gets colored background)
 * @param {boolean} [options.isDouble=false] - Whether this die is part of doubles (gets purple outline)
 * @param {boolean} [options.isDimmed=false] - Whether to dim this die (non-outcome dice in results, 40% opacity)
 * @param {string} [options.outcomeColor=null] - Hex color for outcome die background
 * @returns {string} HTML string with .dice-face element
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
 *
 * Creates a vertical stack of clickable dice (1-6) for pool selection.
 * Hover effect highlights the selected die and all dice below it.
 * Click triggers rollDice action with data-params='{"count": N}'.
 *
 * @returns {string} HTML string with .dice-stack container
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
 *
 * Displays a single dice roll with:
 * 1. RESULT label (Triumph/Conflict/Disaster)
 * 2. TWIST label (if doubles exist)
 * 3. WHO ROLLED (player name from roll.userName)
 * 4. TIMESTAMP (HH:MM:SS format)
 * 5. Dice stack (sorted highest to lowest, top die colored, others dimmed)
 *
 * @param {Object} roll - Roll data object
 * @param {string} roll.id - Unique roll ID
 * @param {string} roll.userId - User ID who rolled
 * @param {string} roll.userName - Display name/alias of user who rolled
 * @param {number} roll.diceCount - Number of dice rolled (1-6)
 * @param {number[]} roll.values - Die values, sorted descending
 * @param {number} roll.timestamp - Milliseconds since epoch
 * @param {boolean} roll.visible - Whether this roll should be shown
 * @returns {string} HTML string with .dice-result-column element (empty if not visible)
 */
export function renderRollColumn(roll) {
  if (!roll.visible) return '';

  const outcome = getOutcome(roll.values);

  let html = `<div class="dice-result-column" data-roll-id="${roll.id}">`;

  // 1. RESULT - Outcome label
  html += `<div class="dice-outcome-label">${outcome.result.toUpperCase()}</div>`;

  // 2. TWIST? - If doubles exist
  if (outcome.hasDoubles) {
    html += '<div class="dice-twist-label">TWIST</div>';
  }

  // 3. WHO ROLLED - Player name
  html += `<div class="dice-result-who">${roll.userName}</div>`;

  // 4. TIMESTAMP - Time of roll
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
 * Render complete dice roller UI
 *
 * Main rendering function for the dice roller feature. Creates:
 * - Control buttons (toggle show/hide, reset all)
 * - Interactive dice stack (1-6 selector)
 * - Results container with all roll columns (CSS-toggled, not destroyed)
 *
 * PERFORMANCE NOTE: Results HTML is always rendered but hidden with inline
 * display:none when collapsed. This prevents re-rendering overhead during
 * frequent expand/collapse operations.
 *
 * @param {Array} rolls - Array of roll objects (see renderRollColumn for structure)
 * @param {boolean} [showResults=true] - Whether to show the results panel
 * @param {string} [userRole='player'] - Current user's role ('player' or 'dm')
 * @returns {string} HTML string with .dice-roller-panel container
 */
export function renderDiceRoller(rolls = [], showResults = true, userRole = 'player') {
  const hasVisibleRolls = rolls.some(r => r.visible);
  const isDM = userRole === 'dm';

  return `
    <div class="dice-roller-panel">
      <div class="dice-roller-controls">
        <button class="dice-control-btn" data-action="toggleDiceResults" title="${showResults ? 'Hide' : 'Show'} Results">
          ${showResults ? '◀' : '▶'}
        </button>
        ${hasVisibleRolls && showResults && isDM ? '<button class="dice-control-btn dice-control-dismiss" data-action="dismissAllRolls" title="Reset All">× Reset</button> <span>Applies to all players.</span>' : ''}
      </div>
      <div class="dice-roller-wrapper">
        ${renderDiceStack()}
        <div class="dice-results-container" style="${showResults ? '' : 'display: none;'}">
          ${[...rolls].reverse().map(roll => renderRollColumn(roll)).join('')}
        </div>
      </div>
    </div>
  `;
}
