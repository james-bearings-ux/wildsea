/**
 * One-time setup: create the "Session Log" Notion database under the master page
 * and write { databaseId, dataSourceId } to <DATA_ROOT>/notion-config.json.
 * Uses the data-source model (Notion API 2025+). Refuses to run twice.
 *
 * Run once:  node scripts/session-notes/create-db.mjs
 */
import fs from 'node:fs';
import { Client } from '@notionhq/client';
import { loadEnv, configPath } from './_lib.mjs';

loadEnv();
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const ROOT = process.env.NOTION_ROOT_PAGE_ID;
if (!ROOT) { console.error('NOTION_ROOT_PAGE_ID missing from .env'); process.exit(1); }

const cfgPath = configPath('notion-config.json');
if (fs.existsSync(cfgPath)) {
  console.log('notion-config.json already exists — refusing to create a second database:');
  console.log(fs.readFileSync(cfgPath, 'utf8'));
  process.exit(0);
}

const db = await notion.databases.create({
  parent: { type: 'page_id', page_id: ROOT },
  title: [{ type: 'text', text: { content: 'Session Log' } }],
  description: [{ type: 'text', text: { content: 'Automated per-session notes. Do not hand-edit the body; safe to share with players.' } }],
  initial_data_source: {
    properties: {
      Name: { title: {} },
      Date: { date: {} },
      Locale: { multi_select: {} },
      Summary: { rich_text: {} },
      Source: { select: {} },
    },
  },
});

const dataSourceId = db.data_sources?.[0]?.id || null;
fs.writeFileSync(cfgPath, JSON.stringify({ databaseId: db.id, dataSourceId, url: db.url }, null, 2) + '\n', 'utf8');
console.log('Created Session Log database:');
console.log('  database id:   ', db.id);
console.log('  data source id:', dataSourceId);
console.log('  url:           ', db.url);
console.log('Wrote', cfgPath);
