/**
 * Stage 3 (structuring): read a session's transcript.json + roster, ask Claude
 * (Sonnet) to produce structured notes with roster-based name normalization and
 * inline (NPC) tags, and write notes.md + notes.meta.json.
 *
 * Run:  node scripts/session-notes/3_structure.mjs <YYYY-MM-DD>
 */
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { REPO, DATA_ROOT, loadEnv, readJson, sessionDir, configPath, requireDate } from './_lib.mjs';

loadEnv();
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not found (checked env and repo .env). Aborting.');
  process.exit(1);
}
const SESSION_DATE = requireDate(process.argv, 'scripts/session-notes/3_structure.mjs');
const SESSION_DIR = sessionDir(SESSION_DATE);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const segments = readJson(path.join(SESSION_DIR, 'transcript.json'));
const roster = readJson(configPath('roster.json'));

// Build the roster + alias section, and an explicit entity-resolution list.
const aliasClause = e => e.aliases && e.aliases.length
  ? ` — also called ${e.aliases.map(a => `"${a}"`).join(', ')}`
  : '';
const noteClause = e => e.note ? ` (${e.note})` : '';
const pcLines = roster.characters
  .map(c => `- ${c.name} — played by ${c.player}${aliasClause(c)}${noteClause(c)}`)
  .join('\n');
const npcLines = roster.npcs
  .map(n => `- ${n.name}${aliasClause(n)}${noteClause(n)}`)
  .join('\n');
const aliasResolution = [...roster.characters, ...roster.npcs]
  .filter(e => e.aliases && e.aliases.length)
  .map(e => `- ${[e.name, ...e.aliases].join(' = ')}  → always use "${e.name}"`)
  .join('\n');

const mmss = sec => {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
const transcriptText = segments.map(s => `[${mmss(s.start)}] ${s.speaker}: ${s.text}`).join('\n');

const system = `You are a meticulous scribe for a Wildsea (tabletop RPG) campaign. You are given the full transcript of one game session, produced by automatic speech recognition (ASR) from separate per-player audio tracks merged in chronological order. Each line is "[mm:ss] Speaker: text".

GM: ${roster.gm} — the referee; voices all NPCs and narrates the world.

PLAYER CHARACTERS (use these exact spellings; correct ASR misspellings to match):
${pcLines}

KNOWN NPCs (use these exact spellings):
${npcLines}

ENTITY RESOLUTION — these names refer to the SAME entity. Merge every mention and always use the canonical name:
${aliasResolution}
Spelling is not the only issue here: different people at the table may call the same character by a different name (first name vs last name vs nickname). Collapse them into one entity — do NOT create separate NPC entries for aliases of the same person.

The exact spellings and parenthetical notes in the roster above are AUTHORITATIVE. Some names are spelled in deliberately unusual ways — reproduce them EXACTLY and never "correct" a roster name to a more common or expected spelling, even when the ASR transcript consistently uses the common form.

Wildsea setting terms are frequently mangled by ASR — normalize to canonical spellings, e.g. Tzelicrae (often heard "Zellicray"/"Zellacrae"), Gau ("Gao"), plus Ardent, Ektus, Ketra, Ironbound, Itzenko, Mothryn.

ASR CAVEATS you must handle:
- NPC and place names not in the roster above are often misspelled and INCONSISTENT across mentions. Infer the intended name, pick ONE spelling, and use it throughout.
- The transcript mixes in-fiction narration/roleplay with out-of-character table talk, jokes, and logistics. Capture the STORY, not the banter.
- Ignore obvious ASR artifacts (a word repeated many times, garbled fragments).

Produce clean Markdown with EXACTLY these sections:
# Session Notes — ${SESSION_DATE}
## Summary
3–5 sentences on what happened this session.
## What Happened
Chronological bullet beats of the in-fiction events.
## NPCs
One bullet per NPC. On first mention write the name as "Name (NPC)". One line each: who/what they are and how they appeared.
## Locations & Things
Notable places, objects, creatures, ships.
## Resources & Mechanics
Rolls of note, resources gained/spent, drives/mires touched, clocks/tracks advanced.
## Threads & Hooks
Unresolved questions, foreshadowing, things to follow up next session.
## Table Notes
Brief: scheduling and out-of-character decisions only.

Be faithful to the transcript — do not invent events. Where something is genuinely unclear, note the uncertainty briefly rather than fabricating.

After the "## Table Notes" section, output a line containing exactly <<<META>>> and then, on the next line, a single JSON object (no code fences) with one field:
{"locales": ["..."]}
where "locales" is an array of the specific in-fiction locations where this session actually took place (not merely mentioned) — use canonical names where known (ship names, named places/districts). Keep it to the 1–3 primary locations.`;

console.log(`Structuring ${segments.length} segments (~${Math.round(transcriptText.length / 4)} tokens) with claude-sonnet-4-6...\n`);

const stream = anthropic.messages.stream({
  model: 'claude-sonnet-4-6',
  max_tokens: 16000,
  thinking: { type: 'adaptive' },
  system,
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: `SESSION TRANSCRIPT:\n\n${transcriptText}`, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: 'Write the session notes now, following the section structure exactly.' },
    ],
  }],
});
stream.on('text', t => process.stdout.write(t));

const final = await stream.finalMessage();
const fullText = final.content.filter(b => b.type === 'text').map(b => b.text).join('\n');

const [notes, metaRaw = ''] = fullText.split('<<<META>>>');
let locales = [];
try {
  const json = metaRaw.replace(/```json|```/g, '').trim();
  if (json) locales = (JSON.parse(json).locales || []).filter(Boolean);
} catch (e) {
  console.warn('\n[meta] could not parse locales:', e.message);
}
const sumMatch = notes.match(/##\s*Summary\s*\n+([\s\S]*?)(?:\n+---|\n+##\s)/);
const summary = (sumMatch ? sumMatch[1] : '').trim();

fs.writeFileSync(path.join(SESSION_DIR, 'notes.md'), notes.trimEnd() + '\n', 'utf8');
fs.writeFileSync(path.join(SESSION_DIR, 'notes.meta.json'),
  JSON.stringify({ date: SESSION_DATE, locales, summary }, null, 2) + '\n', 'utf8');

const u = final.usage;
const inCost = ((u.input_tokens + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0)) / 1e6) * 3;
const outCost = (u.output_tokens / 1e6) * 15;
console.log(`\n\n--- done ---  locales: ${JSON.stringify(locales)}`);
console.log(`usage: input=${u.input_tokens} cache_write=${u.cache_creation_input_tokens || 0} cache_read=${u.cache_read_input_tokens || 0} output=${u.output_tokens}  ~cost: $${(inCost + outCost).toFixed(3)}`);
console.log(`wrote ${path.relative(REPO, path.join(SESSION_DIR, 'notes.md'))}`);
