/**
 * Integrate fresh-aspects-parsed.json into public/data/aspects.json
 * and update public/data/game-constants.json with new sources.
 *
 * - Existing sources: appends new aspects (deduplicates by name)
 * - New sources: adds them to aspects.json and the correct list in game-constants.json
 * - Strips typeRaw (QA-only field) from output
 * - Preserves new:true on new aspects
 */

import { readFileSync, writeFileSync } from 'fs';

const PARSED   = 'fresh-aspects-parsed.json';
const ASPECTS  = 'public/data/aspects.json';
const CONSTANTS = 'public/data/game-constants.json';

// ---------------------------------------------------------------------------
// Category map: source name → 'bloodline' | 'origin' | 'post'
// Derived from the raw file headers; existing sources already in game-constants.
// ---------------------------------------------------------------------------
const SOURCE_CATEGORY = {
  'Broadcaster':              'post',
  'Spielographer':            'post',
  'Augmentor':                'post',
  'Open Aeronautic Aspects':  'post',
  'Open Submeric Aspects':    'post',
  'Itzenko':                  'bloodline',
  'Kosmer':                   'origin',
  'Heartskavo':               'origin',
  'Stowaway':                 'origin',
  'Submerged':                'origin',
  'Windward':                 'origin',
  'Augur':                    'post',
  'Cannoneer':                'post',
  'Diver':                    'post',
  'Kitesailor':               'post',
  'Marketeer':                'post',
  'Pilot':                    'post',
  'Rattlewing':               'post',
  'Raveller':                 'post',
  'Smuggler':                 'post',
  'Swarmjack':                'post',
  'Thorn':                    'post',
  'Zealot':                   'post',
};

// ---------------------------------------------------------------------------
// Load files
// ---------------------------------------------------------------------------
const parsed    = JSON.parse(readFileSync(PARSED, 'utf8'));
const aspects   = JSON.parse(readFileSync(ASPECTS, 'utf8'));
const constants = JSON.parse(readFileSync(CONSTANTS, 'utf8'));

const stats = { added: 0, skipped: 0, newSources: [] };

// ---------------------------------------------------------------------------
// Merge each source from parsed data
// ---------------------------------------------------------------------------
for (const [source, newAspects] of Object.entries(parsed)) {
  // Build set of existing names for deduplication
  const existing = aspects[source] || [];
  const existingNames = new Set(existing.map(a => a.name.toLowerCase()));

  let addedToSource = 0;
  for (const aspect of newAspects) {
    if (existingNames.has(aspect.name.toLowerCase())) {
      stats.skipped++;
      continue;
    }
    // Strip typeRaw (QA field); keep everything else including new:true
    const { typeRaw, ...clean } = aspect;
    existing.push(clean);
    existingNames.add(aspect.name.toLowerCase());
    addedToSource++;
    stats.added++;
  }

  if (!aspects[source]) {
    aspects[source] = existing;

    // Register in game-constants if it's a brand-new source
    const category = SOURCE_CATEGORY[source];
    if (category === 'bloodline' && !constants.bloodlines.includes(source)) {
      constants.bloodlines.push(source);
      constants.bloodlines.sort();
      stats.newSources.push(`${source} (bloodline)`);
    } else if (category === 'origin' && !constants.origins.includes(source)) {
      constants.origins.push(source);
      constants.origins.sort();
      stats.newSources.push(`${source} (origin)`);
    } else if (category === 'post' && !constants.posts.includes(source)) {
      constants.posts.push(source);
      constants.posts.sort();
      stats.newSources.push(`${source} (post)`);
    } else if (!category) {
      console.warn(`  ⚠ No category defined for new source "${source}" — added to aspects.json but NOT to game-constants.json`);
    }
  } else {
    aspects[source] = existing; // already existed, just extended
  }
}

// ---------------------------------------------------------------------------
// Write output files
// ---------------------------------------------------------------------------
writeFileSync(ASPECTS,   JSON.stringify(aspects,   null, 2));
writeFileSync(CONSTANTS, JSON.stringify(constants, null, 2));

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const totalAspects = Object.values(aspects).reduce((n, arr) => n + arr.length, 0);
console.log(`\nIntegration complete.`);
console.log(`  Aspects added:   ${stats.added}`);
console.log(`  Duplicates skipped: ${stats.skipped}`);
console.log(`  Total aspects now: ${totalAspects} across ${Object.keys(aspects).length} sources`);
if (stats.newSources.length) {
  console.log(`\nNew sources added to game-constants.json:`);
  stats.newSources.forEach(s => console.log(`  + ${s}`));
}
console.log(`\nWrote: ${ASPECTS}`);
console.log(`Wrote: ${CONSTANTS}`);
