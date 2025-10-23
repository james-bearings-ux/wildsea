// Test updated damage type parsing with Ironclad Mind and Oathbound

import { parseDamageTypesFromDescription, DAMAGE_CATEGORIES } from './js/constants/damage-types.js';

const aspects = [
  {
    name: 'Ironclad Mind',
    description: 'You are immune to hallucinations, mesmerics and mental compulsions.'
  },
  {
    name: 'Oathbound',
    description: "You're immune to chemical, arconautic, and mesmeric effects designed to draw information from you."
  }
];

console.log('=== Testing Updated Damage Type Parsing ===\n');

aspects.forEach(aspect => {
  console.log(`\n${aspect.name}:`);
  console.log(`Description: "${aspect.description}"`);

  const parsed = parseDamageTypesFromDescription(aspect.description);

  if (parsed) {
    console.log('\nParsed damage types:');
    parsed.forEach((entry, i) => {
      console.log(`  [${i}] Category: ${entry.category}`);
      console.log(`      Selection: ${entry.selectionType}`);
      console.log(`      Options: ${JSON.stringify(entry.options)}`);
    });
  } else {
    console.log('  ❌ NO MATCH');
  }
  console.log('---');
});
