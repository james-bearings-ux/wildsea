/**
 * Shared helpers for the session-notes pipeline scripts.
 *
 * Code lives here (committed); data + live config live in the gitignored data root
 * (default: <repo>/audio-processing, override with $SESSION_NOTES_DIR):
 *   <DATA_ROOT>/speakers.json        - Craig handle -> speaker map      (gitignored: real names)
 *   <DATA_ROOT>/roster.json          - canonical names + aliases        (gitignored: real names)
 *   <DATA_ROOT>/notion-config.json   - { databaseId, dataSourceId }     (created by create-db.mjs)
 *   <DATA_ROOT>/<YYYY-MM-DD>/         - per-session working folder (Craig .aac, transcript.json, notes.md, ...)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(HERE, '..', '..');
export const DATA_ROOT = process.env.SESSION_NOTES_DIR
  ? path.resolve(process.env.SESSION_NOTES_DIR)
  : path.join(REPO, 'audio-processing');

/** Load repo-root .env into process.env (npc-sync relies on ambient env; no dotenv dependency). */
export function loadEnv() {
  const envPath = path.join(REPO, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
export const sessionDir = date => path.join(DATA_ROOT, date);
export const configPath = name => path.join(DATA_ROOT, name);
export const notionConfig = () => readJson(configPath('notion-config.json'));

/** Read a YYYY-MM-DD session date from argv[2] or exit with usage. */
export function requireDate(argv, script) {
  const date = argv[2];
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error(`Usage: node ${script} <YYYY-MM-DD>`);
    process.exit(1);
  }
  return date;
}
