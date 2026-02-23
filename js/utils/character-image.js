/**
 * Character abstract image generator
 * Creates layered radial gradients based on character name hash
 */

/**
 * Simple hash function for strings
 * Returns a 32-bit integer hash
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded random number generator
 * Uses the hash as a seed for reproducible randomness
 * @param {number} seed - Seed value
 * @returns {function} Function that returns next random number (0-1)
 */
function seededRandom(seed) {
  let state = seed;
  return function() {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Generate HSL color with good saturation and lightness
 * @param {function} random - Seeded random function
 * @returns {Object} { h, s, l } values
 */
function generateColor(random) {
  return {
    h: Math.floor(random() * 360),
    s: 50 + Math.floor(random() * 30), // 50-80% saturation
    l: 40 + Math.floor(random() * 25)  // 40-65% lightness
  };
}

/**
 * Generate CSS for layered radial gradients
 * @param {string} name - Character name
 * @param {number} numLayers - Number of gradient layers (default 4)
 * @returns {string} CSS background property value
 */
export function generateCharacterGradient(name, numLayers = 4) {
  const hash = hashString(name || 'unnamed');
  const random = seededRandom(hash);

  const gradients = [];

  for (let i = 0; i < numLayers; i++) {
    const color = generateColor(random);

    // Position: spread across the image
    const x = 10 + Math.floor(random() * 80); // 10-90%
    const y = 10 + Math.floor(random() * 80); // 10-90%

    // Size: vary the radius
    const size = 30 + Math.floor(random() * 50); // 30-80%

    // Opacity: vary transparency for layering effect
    const opacity = 0.4 + random() * 0.4; // 0.4-0.8

    const hsl = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${opacity.toFixed(2)})`;
    const gradient = `radial-gradient(ellipse ${size}% ${size * (0.8 + random() * 0.4)}% at ${x}% ${y}%, ${hsl} 0%, transparent 70%)`;

    gradients.push(gradient);
  }

  // Add a subtle base gradient for depth
  const baseColor = generateColor(random);
  const baseGradient = `linear-gradient(135deg, hsla(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%, 0.3) 0%, hsla(${(baseColor.h + 60) % 360}, ${baseColor.s}%, ${baseColor.l}%, 0.3) 100%)`;
  gradients.push(baseGradient);

  return gradients.join(', ');
}

/**
 * Render character abstract image element
 * @param {string} name - Character name
 * @param {number} width - Width in pixels (default 300)
 * @param {number} height - Height in pixels (default 100)
 * @returns {string} HTML string for the image element
 */
export function renderCharacterImage(name, width = 300, height = 100) {
  const gradient = generateCharacterGradient(name);

  return `<div class="character-abstract-image" style="
    width: ${width}px;
    height: ${height}px;
    background: ${gradient};
    border-radius: 4px;
  "></div>`;
}
