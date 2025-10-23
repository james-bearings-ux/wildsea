// Test improved immunity pattern for multi-word hazards

const desc1 = 'You are immune to hallucinations, mesmerics and mental compulsions.';
const desc2 = "You're immune to chemical, arconautic, and mesmeric effects designed to draw information from you.";

// Original pattern (broken)
const oldPattern = /immune to ([a-z]+(?:(?:,\s*| and | or )[a-z]+)*)(?: damage)?/i;

// New pattern with negative lookahead to stop at "effects" or "damage"
const newPattern = /immune to ((?:(?!effects|damage|designed)[a-z]+(?:\s+(?!effects|damage|designed)[a-z]+)*(?:,\s*| and | or )?)+?)(?:\s+(?:damage|effects)|\s*\.|$)/i;

console.log('=== OLD PATTERN ===');
const oldMatch1 = desc1.match(oldPattern);
const oldMatch2 = desc2.match(oldPattern);
console.log('Ironclad Mind:', oldMatch1 ? oldMatch1[1].trim() : 'NO MATCH');
console.log('Oathbound:', oldMatch2 ? oldMatch2[1].trim() : 'NO MATCH');

console.log('\n=== NEW PATTERN ===');
const newMatch1 = desc1.match(newPattern);
const newMatch2 = desc2.match(newPattern);
console.log('Ironclad Mind:', newMatch1 ? newMatch1[1].trim() : 'NO MATCH');
console.log('Oathbound:', newMatch2 ? newMatch2[1].trim() : 'NO MATCH');

// Test splitting into individual types
function splitTypes(typeString) {
  // Handle both ", and" and " and" cases
  return typeString
    .split(/,?\s+(?:and|or)\s+|,\s*/)
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

if (newMatch1) {
  const types1 = splitTypes(newMatch1[1]);
  console.log('\nIronclad Mind types:', types1);
}

if (newMatch2) {
  const types2 = splitTypes(newMatch2[1]);
  console.log('Oathbound types:', types2);
}
