/**
 * One-time legacy migration: extract dated session sections from a hand-written
 * Notion "Locale" prep page and port them into the Session Log database (Option B:
 * verbatim body + a brief LLM summary + a 📜 banner, Source = "Legacy import").
 * Non-destructive — only reads the source page. Dry-run by default.
 *
 *   node scripts/session-notes/migrate-legacy.mjs "Page Name"           # dry run (no writes)
 *   node scripts/session-notes/migrate-legacy.mjs "Page Name" --write   # publish to Notion
 *
 * Never overwrites a page whose Source isn't "Legacy import" (protects audio sessions).
 * See docs/guides/session-notes-pipeline.md.
 */
import { Client } from '@notionhq/client';
import Anthropic from '@anthropic-ai/sdk';
import { loadEnv, notionConfig } from './_lib.mjs';

loadEnv();
const PAGE_QUERY = process.argv[2];
const WRITE = process.argv.includes('--write');
if (!PAGE_QUERY || PAGE_QUERY.startsWith('--')) {
  console.error('Usage: node scripts/session-notes/migrate-legacy.mjs "Page Name" [--write]');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const { dataSourceId } = notionConfig();

// ---- date parsing (full + abbreviated months, incl. the "Sept" quirk) ----
const MONTHS = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, may: 5,
  june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9,
  october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
};
const DATE_RE = new RegExp(`\\b(${Object.keys(MONTHS).join('|')})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'i');
function parseDate(text) {
  const m = text.match(DATE_RE);
  if (!m) return null;
  const mo = MONTHS[m[1].toLowerCase()];
  return `${m[3]}-${String(mo).padStart(2, '0')}-${String(+m[2]).padStart(2, '0')}`;
}

const textOf = b => (Array.isArray(b[b.type]?.rich_text) ? b[b.type].rich_text.map(t => t.plain_text).join('') : '');

const res = await notion.search({ query: PAGE_QUERY, filter: { property: 'object', value: 'page' } });
const page = res.results.find(p => {
  const tp = Object.values(p.properties || {}).find(v => v.type === 'title');
  return tp?.title?.map(t => t.plain_text).join('').toLowerCase().includes(PAGE_QUERY.toLowerCase());
}) || res.results[0];
if (!page) { console.error('page not found:', PAGE_QUERY); process.exit(1); }
const pageName = Object.values(page.properties || {}).find(v => v.type === 'title')?.title?.map(t => t.plain_text).join('') || PAGE_QUERY;

let blocks = [], cursor;
do {
  const r = await notion.blocks.children.list({ block_id: page.id, start_cursor: cursor, page_size: 100 });
  blocks.push(...r.results);
  cursor = r.has_more ? r.next_cursor : undefined;
} while (cursor);

// ---- split into sessions (each date-bearing heading starts one) ----
const sessions = [];
let cur = null, nestedInSessions = 0;
for (const b of blocks) {
  const iso = b.type.startsWith('heading_') ? parseDate(textOf(b)) : null;
  if (iso) { cur = { date: iso, title: textOf(b).trim(), body: [] }; sessions.push(cur); }
  else if (cur) { cur.body.push(b); if (b.has_children) nestedInSessions++; }
}

// ---- port a read block into a create-block (preserve formatting + checkbox state) ----
const mapRich = (rt = []) => rt
  .map(r => ({ type: 'text', text: { content: r.text?.content ?? r.plain_text ?? '', link: r.text?.link || null }, annotations: r.annotations || undefined }))
  .filter(x => x.text.content.length);
const NESTABLE = new Set(['paragraph', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'quote']);

function shallow(b) {
  const t = b.type;
  const wrap = obj => ({ object: 'block', type: t, [t]: obj });
  switch (t) {
    case 'paragraph': case 'heading_1': case 'heading_2': case 'heading_3':
    case 'bulleted_list_item': case 'numbered_list_item': case 'quote':
      return wrap({ rich_text: mapRich(b[t].rich_text) });
    case 'to_do':
      return wrap({ rich_text: mapRich(b.to_do.rich_text), checked: !!b.to_do.checked });
    case 'divider':
      return { object: 'block', type: 'divider', divider: {} };
    default: {
      const txt = (b[t]?.rich_text || []).map(r => r.plain_text).join('');
      return { object: 'block', type: 'paragraph', paragraph: { rich_text: txt ? [{ type: 'text', text: { content: txt } }] : [] } };
    }
  }
}
async function fetchChildren(id) {
  let out = [], c;
  do {
    const r = await notion.blocks.children.list({ block_id: id, start_cursor: c, page_size: 100 });
    out.push(...r.results);
    c = r.has_more ? r.next_cursor : undefined;
  } while (c);
  return out;
}
// Flatten a block's entire descendant tree into a flat list (used past the 2-level cap).
async function flatten(id) {
  const out = [];
  for (const k of await fetchChildren(id)) {
    out.push(shallow(k));
    if (k.has_children && NESTABLE.has(k.type)) out.push(...await flatten(k.id));
  }
  return out;
}
// Port a block, preserving nesting up to Notion's 2-level append limit; deeper
// descendants are flattened into the level-2 list (content kept, one indent shallower).
async function portBlock(b, depth = 0) {
  const ported = shallow(b);
  if (!(b.has_children && NESTABLE.has(b.type))) return ported;
  const kids = [];
  for (const k of await fetchChildren(b.id)) {
    if (depth < 1) kids.push(await portBlock(k, depth + 1));
    else { kids.push(shallow(k)); if (k.has_children && NESTABLE.has(k.type)) kids.push(...await flatten(k.id)); }
  }
  ported[b.type].children = kids;
  return ported;
}

async function summarize(session) {
  const notes = session.body.map(b => {
    const t = textOf(b);
    if (b.type === 'to_do') return `[${b.to_do.checked ? 'x' : ' '}] ${t}`;
    return t;
  }).filter(Boolean).join('\n').slice(0, 6000);
  if (!notes.trim()) return 'No substantive notes recorded for this session.';
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 300,
    system: 'You summarize a tabletop RPG group\'s terse session notes into 1–3 plain sentences. Be faithful — summarize only what is written, invent nothing. If the notes are very sparse (e.g. "mostly socializing"), a single short sentence is fine. No preamble.',
    messages: [{ role: 'user', content: `Session "${session.title}":\n\n${notes}` }],
  });
  return msg.content.filter(b => b.type === 'text').map(b => b.text).join(' ').trim();
}

console.log(`PAGE: ${pageName}  (${blocks.length} blocks, ${sessions.length} sessions${nestedInSessions ? `, ${nestedInSessions} session block(s) have nested children — ported recursively` : ''})`);
console.log(WRITE ? '=== WRITING to Session Log ===\n' : '=== DRY RUN (no writes) ===\n');

const banner = () => ({
  object: 'block', type: 'callout',
  callout: {
    icon: { type: 'emoji', emoji: '📜' }, color: 'gray_background',
    rich_text: [{ type: 'text', text: { content: `Legacy import from "${pageName}" — the DM's original pre-automation notes, ported for continuity. Format and fidelity differ from automated session logs.` } }],
  },
});
async function ensureSourceProperty() {
  const ds = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
  if (!ds.properties.Source) {
    await notion.dataSources.update({ data_source_id: dataSourceId, properties: { Source: { select: {} } } });
  }
}
async function upsert(session, summary) {
  const existing = await notion.dataSources.query({ data_source_id: dataSourceId, filter: { property: 'Date', date: { equals: session.date } } });
  // Safety: never overwrite a page this migrator didn't create (e.g. an audio-sourced session).
  if (existing.results.length && existing.results[0].properties?.Source?.select?.name !== 'Legacy import') {
    return 'SKIPPED (existing non-legacy page)';
  }
  const bodyBlocks = [];
  for (const b of session.body) bodyBlocks.push(await portBlock(b));
  const children = [banner(),
    { object: 'block', type: 'heading_3', heading_3: { rich_text: [{ type: 'text', text: { content: 'Summary' } }] } },
    { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: summary } }] } },
    { object: 'block', type: 'divider', divider: {} },
    ...bodyBlocks];
  const createProps = {
    Name: { title: [{ text: { content: session.title.slice(0, 2000) } }] },
    Date: { date: { start: session.date } },
    Locale: { multi_select: [{ name: pageName.replace(/,/g, '').slice(0, 100) }] },
    Summary: { rich_text: [{ type: 'text', text: { content: summary.slice(0, 2000) } }] },
    Source: { select: { name: 'Legacy import' } },
  };
  const machineProps = { Date: createProps.Date, Summary: createProps.Summary };
  let pageId, action;
  if (existing.results.length) {
    pageId = existing.results[0].id; action = 'updated';
    await notion.pages.update({ page_id: pageId, properties: machineProps });
    let c;
    do {
      const kids = await notion.blocks.children.list({ block_id: pageId, start_cursor: c, page_size: 100 });
      for (const k of kids.results) await notion.blocks.delete({ block_id: k.id });
      c = kids.has_more ? kids.next_cursor : undefined;
    } while (c);
  } else {
    const p = await notion.pages.create({ parent: { type: 'data_source_id', data_source_id: dataSourceId }, properties: createProps, children: children.slice(0, 100) });
    pageId = p.id; action = 'created';
  }
  const start = action === 'created' ? 100 : 0;
  for (let i = start; i < children.length; i += 100) {
    await notion.blocks.children.append({ block_id: pageId, children: children.slice(i, i + 100) });
  }
  return action;
}

if (WRITE) await ensureSourceProperty();
for (const s of sessions) {
  const summary = await summarize(s);
  if (WRITE) {
    console.log(`${await upsert(s, summary)}  ${s.date}  ${s.body.length} blocks  "${s.title}"`);
  } else {
    console.log(`${s.date}  |  ${String(s.body.length).padStart(2)} blocks  |  "${s.title}"`);
    console.log(`   summary: ${summary}\n`);
  }
}
console.log(`\n${sessions.length} sessions ${WRITE ? 'published' : 'detected'}.`);
