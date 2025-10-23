/**
 * Regenerate aspects.json with corrected damage type parsing
 * Uses the updated parseDamageTypesFromDescription function
 */

import fs from 'fs';
import { parseDamageTypesFromDescription } from './js/constants/damage-types.js';

// Read aspects.json
const aspectsData = JSON.parse(fs.readFileSync('./public/data/aspects.json', 'utf8'));

let updatedCount = 0;
let parsedCount = 0;

// Process each source (bloodline, origin, post)
for (const source in aspectsData) {
  const aspects = aspectsData[source];

  aspects.forEach(aspect => {
    if (!aspect.description) return;

    // Re-parse damage types from description
    const parsedDamageTypes = parseDamageTypesFromDescription(aspect.description);

    if (parsedDamageTypes) {
      // Compare with existing damageTypes to see if it changed
      const oldDamageTypes = JSON.stringify(aspect.damageTypes || null);
      const newDamageTypes = JSON.stringify(parsedDamageTypes);

      if (oldDamageTypes !== newDamageTypes) {
        console.log(`\n📝 Updating: ${aspect.name} (${source})`);
        console.log(`   Description: ${aspect.description.substring(0, 100)}...`);
        console.log(`   Old:`, aspect.damageTypes);
        console.log(`   New:`, parsedDamageTypes);
        updatedCount++;
      }

      aspect.damageTypes = parsedDamageTypes;
      parsedCount++;
    } else if (aspect.damageTypes) {
      // Aspect had damageTypes before but doesn't parse now - remove it
      console.log(`\n⚠️  Removing damageTypes from: ${aspect.name} (${source})`);
      console.log(`   Description: ${aspect.description}`);
      console.log(`   Old damageTypes:`, aspect.damageTypes);
      delete aspect.damageTypes;
      updatedCount++;
    }
  });
}

// Write updated data back to file
fs.writeFileSync('./public/data/aspects.json', JSON.stringify(aspectsData, null, 2), 'utf8');

console.log(`\n✅ Regeneration complete!`);
console.log(`   Total aspects with damage types: ${parsedCount}`);
console.log(`   Aspects updated: ${updatedCount}`);
