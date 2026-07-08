/**
 * Stage 4 (publish): upsert a session's notes into the Notion "Session Log"
 * database (data-source model), keyed by Date. Re-runs replace the body in place
 * and refresh Summary, but preserve the human-curated Name + Locale.
 *
 * Run:  node scripts/session-notes/4_publish.mjs <YYYY-MM-DD>
 */
import fs from 'node:fs';
import path from 'node:path';
import { Client } from '@notionhq/client';
import { loadEnv, readJson, sessionDir, notionConfig, requireDate } from './_lib.mjs';

loadEnv();
const SESSION_DATE = requireDate(process.argv, 'scripts/session-notes/4_publish.mjs');
const SESSION_DIR = sessionDir(SESSION_DATE);

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const { dataSourceId } = notionConfig();
const notes = fs.readFileSync(path.join(SESSION_DIR, 'notes.md'), 'utf8');
const meta = readJson(path.join(SESSION_DIR, 'notes.meta.json'));

// ---- markdown -> Notion blocks ----
const MAX = 2000; // Notion rich_text char limit per object
// Notion has no markdown parser: inline emphasis must be expressed as rich_text
// annotations. Tokenize **bold**, *italic*, and `code` (bold matched before
// italic so ** wins over *); everything else is plain text.
function pushChunks(out, content, annotations) {
  for (let i = 0; i < content.length; i += MAX)
    out.push({ type: 'text', text: { content: content.slice(i, i + MAX) }, annotations });
}
function richText(str) {
  const out = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
  let last = 0, m;
  while ((m = re.exec(str))) {
    if (m.index > last) pushChunks(out, str.slice(last, m.index), {});
    if (m[1] !== undefined) pushChunks(out, m[1], { bold: true });
    else if (m[2] !== undefined) pushChunks(out, m[2], { italic: true });
    else pushChunks(out, m[3], { code: true });
    last = re.lastIndex;
  }
  if (last < str.length) pushChunks(out, str.slice(last), {});
  return out.length ? out : [{ type: 'text', text: { content: '' } }];
}
function mdToBlocks(md) {
  const blocks = [];
  for (const raw of md.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) continue;
    if (line === '---') { blocks.push({ object: 'block', type: 'divider', divider: {} }); continue; }
    let m;
    if ((m = line.match(/^#\s+(.*)/)))   { blocks.push({ object: 'block', type: 'heading_1', heading_1: { rich_text: richText(m[1]) } }); continue; }
    if ((m = line.match(/^##\s+(.*)/)))  { blocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: richText(m[1]) } }); continue; }
    if ((m = line.match(/^###\s+(.*)/))) { blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: richText(m[1]) } }); continue; }
    if ((m = line.match(/^[-*]\s+(.*)/))){ blocks.push({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: richText(m[1]) } }); continue; }
    blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(line) } });
  }
  return blocks;
}

const prettyDate = new Date(meta.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const locales = (meta.locales || []).map(n => n.replace(/,/g, '').trim().slice(0, 100)).filter(Boolean);
const title = locales.length ? `${prettyDate} · ${locales[0]}` : prettyDate;

// Machine owns Date + Summary + body every run. Name + Locale are proposed once at
// create time, then human-owned — updates never overwrite them.
const machineProps = {
  Date: { date: { start: meta.date } },
  Summary: { rich_text: richText((meta.summary || '').slice(0, MAX)) },
};
const createProps = {
  ...machineProps,
  Name: { title: [{ text: { content: title.slice(0, 2000) } }] },
  Locale: { multi_select: locales.map(name => ({ name })) },
};

const blocks = mdToBlocks(notes);

const existing = await notion.dataSources.query({ data_source_id: dataSourceId, filter: { property: 'Date', date: { equals: meta.date } } });
let pageId, action;
if (existing.results.length) {
  pageId = existing.results[0].id;
  action = 'updated';
  await notion.pages.update({ page_id: pageId, properties: machineProps });
  let cursor;
  do {
    const kids = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 });
    for (const k of kids.results) await notion.blocks.delete({ block_id: k.id });
    cursor = kids.has_more ? kids.next_cursor : undefined;
  } while (cursor);
} else {
  action = 'created';
  const page = await notion.pages.create({ parent: { type: 'data_source_id', data_source_id: dataSourceId }, properties: createProps, children: blocks.slice(0, 100) });
  pageId = page.id;
}
const start = action === 'created' ? 100 : 0;
for (let i = start; i < blocks.length; i += 100) {
  await notion.blocks.children.append({ block_id: pageId, children: blocks.slice(i, i + 100) });
}

const page = await notion.pages.retrieve({ page_id: pageId });
console.log(`${action} page: "${title}"  (${blocks.length} blocks, locales ${JSON.stringify(locales)})`);
console.log(`  ${page.url}`);
