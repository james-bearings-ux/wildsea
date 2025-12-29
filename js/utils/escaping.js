/**
 * Character escaping utilities for safe HTML rendering and data storage
 *
 * PROBLEMATIC CHARACTERS:
 *
 * 1. " (double quote) - Breaks HTML attributes like value="text"
 * 2. ' (single quote/apostrophe) - Breaks HTML attributes like onclick='...' and data-params='...'
 * 3. & (ampersand) - HTML entity start character, can be interpreted as entity
 * 4. < (less than) - Can be interpreted as HTML tag start (XSS risk)
 * 5. > (greater than) - Can be interpreted as HTML tag end (XSS risk)
 * 6. \ (backslash) - Escape character in JSON and JavaScript
 * 7. ` (backtick) - Could break template literals if ever used in eval
 * 8. \n, \r (newlines) - Can break HTML attributes and JSON strings
 * 9. \t (tab) - Can break HTML attributes
 * 10. \0 (null byte) - Can cause string termination issues
 *
 * STORAGE vs RENDERING:
 * - Storage: Keep original user input unchanged in character state
 * - Rendering: Escape when generating HTML to prevent breaking markup
 */

/**
 * Escape text for safe insertion into HTML attributes (like value="text")
 * Converts special characters to HTML entities
 *
 * @param {string} text - Raw text to escape
 * @returns {string} HTML-safe text suitable for HTML attributes
 *
 * @example
 * const userInput = 'She said "Hello"';
 * html += `<input value="${escapeHtmlAttr(userInput)}">`;
 * // Results in: <input value="She said &quot;Hello&quot;">
 */
export function escapeHtmlAttr(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')   // Must be first to avoid double-escaping
    .replace(/"/g, '&quot;')  // Double quotes
    .replace(/'/g, '&#39;')   // Single quotes
    .replace(/</g, '&lt;')    // Less than
    .replace(/>/g, '&gt;')    // Greater than
    .replace(/\n/g, '&#10;')  // Newlines
    .replace(/\r/g, '&#13;')  // Carriage returns
    .replace(/\t/g, '&#9;');  // Tabs
}

/**
 * Escape text for safe insertion into HTML content (between tags)
 * Similar to escapeHtmlAttr but doesn't need to escape quotes as aggressively
 *
 * @param {string} text - Raw text to escape
 * @returns {string} HTML-safe text suitable for element content
 *
 * @example
 * html += `<p>${escapeHtmlContent(userText)}</p>`;
 */
export function escapeHtmlContent(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Create a properly escaped data-params attribute for event delegation
 * Uses JSON.stringify internally and escapes the result for HTML attribute insertion
 *
 * @param {Object} params - Object to serialize as data-params
 * @returns {string} Complete data-params attribute string ready for insertion
 *
 * @example
 * // Instead of: data-params='{"id":"' + id + '"}'
 * // Use: ${createDataParams({ id: milestoneId })}
 * html += `<button ${createDataParams({ id: milestone.id })}>Delete</button>`;
 * // Results in: <button data-params="{&quot;id&quot;:&quot;some-id&quot;}">Delete</button>
 *
 * @example
 * // Works safely with problematic characters
 * const milestoneName = 'Test "quotes" and \'apostrophes\'';
 * html += `<button ${createDataParams({ name: milestoneName })}>Save</button>`;
 */
export function createDataParams(params) {
  // JSON.stringify handles all JavaScript/JSON escaping automatically
  const jsonString = JSON.stringify(params);

  // Escape for use in double-quoted HTML attribute
  // This prevents any issues with quotes breaking out of the attribute
  const escapedJson = jsonString
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');

  return `data-params="${escapedJson}"`;
}

/**
 * Helper function to create a complete input element with proper escaping
 * Useful for text inputs where user content needs to be safely rendered
 *
 * @param {Object} options - Input configuration
 * @param {string} options.type - Input type (default: "text")
 * @param {string} options.value - Input value (will be escaped)
 * @param {string} options.placeholder - Placeholder text (will be escaped)
 * @param {string} options.className - CSS class names
 * @param {string} options.action - data-action value
 * @param {Object} options.params - data-params object (will be JSON-encoded)
 * @param {boolean} options.disabled - Whether input is disabled
 * @returns {string} Complete HTML input element
 *
 * @example
 * html += createSafeInput({
 *   value: milestone.name,
 *   placeholder: "Enter milestone name...",
 *   action: "updateMilestoneName",
 *   params: { id: milestone.id },
 *   disabled: milestone.used
 * });
 */
export function createSafeInput(options) {
  const {
    type = 'text',
    value = '',
    placeholder = '',
    className = '',
    action = '',
    params = {},
    disabled = false
  } = options;

  let html = '<input ';
  html += `type="${type}" `;
  if (className) html += `class="${className}" `;
  html += `value="${escapeHtmlAttr(value)}" `;
  if (placeholder) html += `placeholder="${escapeHtmlAttr(placeholder)}" `;
  if (disabled) html += 'disabled ';
  if (action) html += `data-action="${action}" `;
  if (Object.keys(params).length > 0) html += createDataParams(params);
  html += '>';

  return html;
}

/**
 * USAGE GUIDE:
 *
 * 1. For input values and other HTML attributes:
 *    OLD: html += 'value="' + userText + '" ';
 *    NEW: html += `value="${escapeHtmlAttr(userText)}" `;
 *
 * 2. For data-params attributes:
 *    OLD: html += 'data-params=\'{"id":"' + id + '"}\'';
 *    NEW: html += createDataParams({ id: id });
 *
 * 3. For complete inputs (recommended):
 *    html += createSafeInput({
 *      value: milestone.name,
 *      action: "updateMilestoneName",
 *      params: { id: milestone.id }
 *    });
 *
 * 4. For text content between tags:
 *    html += `<p>${escapeHtmlContent(userText)}</p>`;
 *
 * Remember: Store original user input in character state unchanged.
 * Only escape when rendering to HTML.
 */
