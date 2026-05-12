/**
 * Parse new aspects from raw PDF copy/paste into JSON for QA.
 *
 * Input:  css/fresh-aspects.raw.txt
 * Output: fresh-aspects-parsed.json (project root)
 *
 * Format expected:
 *   SOURCE NAME - Post/Origin/Bloodline
 *   (blank lines)
 *   Aspect Name
 *   N-Track Type
 *   Description spread over
 *   multiple lines with haphazard breaks.
 *   Next Aspect Name
 *   ...
 */

import { readFileSync, writeFileSync } from 'fs';

const INPUT  = 'css/fresh-aspects.raw.txt';
const OUTPUT = 'fresh-aspects-parsed.json';

// ---------------------------------------------------------------------------
// Regexes
// ---------------------------------------------------------------------------

// Source header: "BROADCASTER - Post", "SPIELOGRAPHER - POST", etc.
const SOURCE_RE = /^([A-Z][A-Z\s'''-]+?)\s+-\s+(post|origin|bloodline)$/i;

// Track line: "4-Track Trait", "2-Track Complex Gear", "3-Track Companion"
const TRACK_RE = /^(\d+)-Track\s+(.+)$/i;

// Sources whose type prefix should be stripped (e.g. "Aeronautic Trait" → "Trait")
const STRIP_TYPE_PREFIX_RE = /^(aeronautic|submeric)\s+/i;

// Open Aspects type field encodes the real source + type (e.g. "Ardent Gear", "Spit-Born Trait")
// Regex captures source name and the type suffix (handles Complex variants)
const OPEN_ASPECT_TYPE_RE = /^(.+?)\s+((?:Complex\s+)?(?:Trait|Gear|Companion))$/i;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toTitleCase(str) {
  // "BROADCASTER" → "Broadcaster", "SPIT-BORN" → "Spit-Born"
  return str.trim().toLowerCase().replace(/(?:^|[\s-])\w/g, c => c.toUpperCase());
}

/**
 * Join description lines with spaces.
 * Note: genuine PDF mid-word breaks (e.g. "wax" + "en") will need manual
 * correction during QA — far less common than normal line breaks.
 */
function joinDescriptionLines(lines) {
  return lines.join(' ').trim();
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

const raw   = readFileSync(INPUT, 'utf8');
let lines = raw.split(/\r?\n/);

// ---------------------------------------------------------------------------
// Pre-process: rejoin split track lines
// The PDF sometimes breaks "2-Track Trait" across two lines as "2" then "-Track Trait".
// Merge any lone digit line that is immediately followed by a "-Track ..." line.
// ---------------------------------------------------------------------------
const rejoined = [];
for (let i = 0; i < lines.length; i++) {
  if (/^\d+$/.test(lines[i].trim()) && i + 1 < lines.length && /^-Track\s+/i.test(lines[i + 1].trim())) {
    rejoined.push(lines[i].trim() + lines[i + 1].trim());
    i++; // skip the next line — it's been merged
  } else {
    rejoined.push(lines[i]);
  }
}
lines = rejoined;

// Tag every line
const tagged = lines.map(line => {
  const srcMatch = line.match(SOURCE_RE);
  if (srcMatch) {
    return { kind: 'source', name: toTitleCase(srcMatch[1]), category: srcMatch[2].toLowerCase() };
  }
  const trackMatch = line.match(TRACK_RE);
  if (trackMatch) {
    return { kind: 'track', track: parseInt(trackMatch[1], 10), typeRaw: trackMatch[2].trim() };
  }
  return { kind: 'text', content: line.trim() };
});

// Locate all track-line indices
const trackIdxs = tagged.reduce((acc, t, i) => { if (t.kind === 'track') acc.push(i); return acc; }, []);

const result   = {}; // { sourceName: [aspects] }
const warnings = [];

for (let ti = 0; ti < trackIdxs.length; ti++) {
  const idx   = trackIdxs[ti];
  const track = tagged[idx];

  // --- Find source: scan back to nearest source tag (ignore track lines) ---
  let source = null;
  for (let i = idx - 1; i >= 0; i--) {
    if (tagged[i].kind === 'source') { source = tagged[i].name; break; }
  }
  if (!source) {
    warnings.push(`Line ${idx + 1}: could not find source for track line "${lines[idx]}"`);
    continue;
  }

  // --- Find aspect name: last non-empty text line before this track ---
  let aspectName = null;
  for (let i = idx - 1; i >= 0; i--) {
    if (tagged[i].kind === 'track')  { break; } // no name found before prev track
    if (tagged[i].kind === 'source') { break; }
    if (tagged[i].kind === 'text' && tagged[i].content) {
      aspectName = tagged[i].content;
      break;
    }
  }
  if (!aspectName) {
    warnings.push(`Line ${idx + 1}: could not find name for track "${lines[idx]}" under "${source}"`);
    continue;
  }

  // --- Find description: lines after track until the name line of next aspect ---
  const nextIdx = trackIdxs[ti + 1]; // may be undefined

  let descEnd; // exclusive upper bound
  if (nextIdx !== undefined) {
    // The name of the next aspect is the last non-empty text line before nextIdx
    let nameLineIdx = nextIdx - 1;
    while (nameLineIdx > idx && tagged[nameLineIdx].kind === 'text' && !tagged[nameLineIdx].content) {
      nameLineIdx--;
    }
    descEnd = nameLineIdx; // stop before the next name line
  } else {
    descEnd = tagged.length; // run to end of file
  }

  const descLines = [];
  for (let i = idx + 1; i < descEnd; i++) {
    const t = tagged[i];
    if (t.kind === 'source') break; // hit a new source block
    if (t.kind === 'text' && t.content && t.content !== '·') {
      descLines.push(t.content);
    }
    // Bullet points (·) are dropped — they mark sub-options in Complex aspects.
    // The option text itself is still captured on the surrounding lines.
  }

  const description = joinDescriptionLines(descLines);

  // --- Normalise type ---
  // Keep typeRaw for QA; derive canonical type for the JSON field.
  // For Aeronautic/Submeric sources, strip the location prefix (e.g. "Aeronautic Trait" → "Trait").
  const typeRaw = track.typeRaw;
  // Strip location prefix; then title-case and preserve full type name (including Complex variants)
  const typeNorm = typeRaw.replace(STRIP_TYPE_PREFIX_RE, '').trim();
  // Normalise capitalisation only — do not collapse "Complex Trait" to "Trait"
  const type = typeNorm.replace(/\b\w/g, c => c.toUpperCase());

  if (!result[source]) result[source] = [];
  result[source].push({
    name: aspectName,
    type,
    typeRaw: typeRaw !== type ? typeRaw : undefined, // only include if different from normalised
    track: track.track,
    description,
    new: true,
  });
}

// ---------------------------------------------------------------------------
// Post-process: redistribute "Open Aspects" to their real sources
// Each Open Aspect's typeRaw encodes its real source + type ("Ardent Gear" → source Ardent, type Gear)
// ---------------------------------------------------------------------------
if (result['Open Aspects']) {
  const redistributed = [];
  for (const aspect of result['Open Aspects']) {
    const m = (aspect.typeRaw || aspect.type).match(OPEN_ASPECT_TYPE_RE);
    if (m) {
      const realSource = m[1].trim().replace(/\b\w/g, c => c.toUpperCase());
      const realType   = m[2].trim().replace(/\b\w/g, c => c.toUpperCase());
      if (!result[realSource]) result[realSource] = [];
      result[realSource].push({ ...aspect, type: realType, typeRaw: undefined });
    } else {
      warnings.push(`Open Aspects: could not parse source from type "${aspect.typeRaw || aspect.type}" (aspect: "${aspect.name}")`);
      redistributed.push(aspect); // keep unresolved aspects under Open Aspects
    }
  }
  if (redistributed.length === 0) {
    delete result['Open Aspects'];
  } else {
    result['Open Aspects'] = redistributed;
  }
}

// Strip undefined fields (typeRaw when not needed)
const clean = {};
for (const [src, aspects] of Object.entries(result)) {
  clean[src] = aspects.map(a => {
    const out = { name: a.name, type: a.type };
    if (a.typeRaw) out.typeRaw = a.typeRaw;
    out.track = a.track;
    out.description = a.description;
    out.new = true;
    return out;
  });
}

writeFileSync(OUTPUT, JSON.stringify(clean, null, 2));

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const totalAspects = Object.values(clean).reduce((n, arr) => n + arr.length, 0);

console.log(`\nParsed ${totalAspects} aspects across ${Object.keys(clean).length} sources:\n`);
for (const [src, aspects] of Object.entries(clean)) {
  const types = [...new Set(aspects.map(a => a.typeRaw || a.type))].join(', ');
  console.log(`  ${src.padEnd(24)} ${String(aspects.length).padStart(3)} aspects  (${types})`);
}

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  warnings.forEach(w => console.log('  ⚠', w));
} else {
  console.log('\nNo warnings.');
}

console.log(`\nOutput: ${OUTPUT}`);
