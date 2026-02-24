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
    s: 45 + Math.floor(random() * 50), // 45-95% saturation
    l: 40 + Math.floor(random() * 25)  // 60-85% lightness
  };
}

/**
 * Generate CSS for layered radial gradients
 * @param {string} name - Character name
 * @param {number} width - Image width in pixels
 * @param {number} height - Image height in pixels
 * @param {number} numLayers - Number of gradient layers (default 4)
 * @returns {string} CSS background property value
 */
export function generateCharacterGradient(name, width = 300, height = 100, numLayers = 3) {
  const hash = hashString(name || 'unnamed');
  const random = seededRandom(hash);

  // Calculate aspect ratio to adjust gradient positioning
  const aspectRatio = width / height;
  const isWide = aspectRatio > 1;

  const gradients = [];

  for (let i = 0; i < numLayers; i++) {
    const color = generateColor(random);

    // Position: spread beyond boundaries for skinny shapes
    // For tall/skinny images, spread more horizontally (-30% to 130%)
    // For wide images, keep within bounds (10-90%)
    let x, y;
    if (isWide) {
      x = 10 + Math.floor(random() * 80); // 10-90%
      y = -20 + Math.floor(random() * 140); // -20% to 120%
    } else {
      x = -30 + Math.floor(random() * 160); // -30% to 130%
      y = 10 + Math.floor(random() * 80); // 10-90%
    }

    // Size: based on width for consistency across aspect ratios
    // Base size is percentage of width, then calculate height% to appear circular
    const baseWidthPercent = 24 + Math.floor(random() * 30); // 24-54% of width (20% larger than 20-45%)
    const widthMultiplier = 1.0 + random() * 0.3; // 1.0-1.3x (slightly wider than tall)

    const ellipseWidth = baseWidthPercent * widthMultiplier;
    // Multiply by aspect ratio so height% renders same pixel size as width%
    const ellipseHeight = baseWidthPercent * aspectRatio;

    // Opacity: vary transparency for layering effect
    const opacity = 0.4 + random() * 0.4; // 0.4-0.8

    const hsl = `hsla(${color.h}, ${color.s}%, ${color.l}%, ${opacity.toFixed(2)})`;
    const gradient = `radial-gradient(ellipse ${ellipseWidth.toFixed(0)}% ${ellipseHeight.toFixed(0)}% at ${x}% ${y}%, ${hsl} 0%, transparent 70%)`;

    gradients.push(gradient);
  }

  // Base layer: three solid colour bands at 75 degrees
  // c1 sets the base hue; c2 and c3 are derived from it for complementary harmony
  const baseHue = Math.floor(random() * 360);
  const c1 = { h: baseHue,                                           s: 45 + Math.floor(random() * 50), l: 40 + Math.floor(random() * 25) };
  const c2 = { h: (baseHue + 30 + Math.floor(random() * 30)) % 360,  s: 45 + Math.floor(random() * 50), l: 40 + Math.floor(random() * 25) }; // analogous: 30–60° from c1
  const c3 = { h: (baseHue + 165 + Math.floor(random() * 30)) % 360, s: 45 + Math.floor(random() * 50), l: 40 + Math.floor(random() * 25) }; // complementary: 165–195° from c1

  // Two split points; ensure each band is roughly 15-45% wide
  const p1 = 15 + random() * 30; // 15–45%
  const p2 = Math.min(p1 + 15 + random() * 30, 85); // p1+15 to p1+45, capped at 85%

  const hsl1 = `hsl(${c1.h}, ${c1.s}%, ${c1.l}%)`;
  const hsl2 = `hsl(${c2.h}, ${c2.s}%, ${c2.l}%)`;
  const hsl3 = `hsl(${c3.h}, ${c3.s}%, ${c3.l}%)`;

  const baseGradient = `linear-gradient(75deg, ${hsl1} 0%, ${hsl1} ${p1.toFixed(1)}%, ${hsl2} ${p1.toFixed(1)}%, ${hsl2} ${p2.toFixed(1)}%, ${hsl3} ${p2.toFixed(1)}%, ${hsl3} 100%)`;
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
  const gradient = generateCharacterGradient(name, width, height);

  return `<div class="character-abstract-image" style="
    width: ${width}px;
    height: ${height}px;
    background: ${gradient};
    border-radius: 4px;
  "></div>`;
}
