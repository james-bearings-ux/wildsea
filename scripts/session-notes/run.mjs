/**
 * One-command runner for the session-notes pipeline: transcribe -> structure -> publish.
 *
 *   node scripts/session-notes/run.mjs <YYYY-MM-DD>            # all three stages
 *   node scripts/session-notes/run.mjs <YYYY-MM-DD> --from 3  # skip transcription (re-structure + publish)
 *
 * Expects the session's Craig .aac tracks already in <DATA_ROOT>/<YYYY-MM-DD>/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { HERE, DATA_ROOT, sessionDir, requireDate } from './_lib.mjs';

const DATE = requireDate(process.argv, 'scripts/session-notes/run.mjs');
const fromIdx = process.argv.indexOf('--from');
const from = fromIdx > -1 ? Number(process.argv[fromIdx + 1]) : 2;

const SESSION_DIR = sessionDir(DATE);
if (!fs.existsSync(SESSION_DIR)) {
  console.error(`Session folder not found: ${SESSION_DIR}\nCreate it and drop the Craig .aac tracks in first.`);
  process.exit(1);
}

// Locate the pipeline's Python venv (created per the setup guide).
const venvPy = [
  path.join(DATA_ROOT, '.venv', 'Scripts', 'python.exe'), // Windows
  path.join(DATA_ROOT, '.venv', 'bin', 'python'),         // POSIX
].find(fs.existsSync);

function stage(label, cmd, args) {
  console.log(`\n=== ${label} ===`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: HERE });
  if (r.status !== 0) {
    console.error(`\n${label} failed (exit ${r.status}). Stopping.`);
    process.exit(r.status || 1);
  }
}

if (from <= 2) {
  if (!venvPy) {
    console.error(`Python venv not found under ${path.join(DATA_ROOT, '.venv')}. See docs/guides/session-notes-pipeline.md for setup.`);
    process.exit(1);
  }
  stage('Stage 2 — transcribe', venvPy, [path.join(HERE, '2_transcribe.py'), DATE]);
}
if (from <= 3) stage('Stage 3 — structure', process.execPath, [path.join(HERE, '3_structure.mjs'), DATE]);
if (from <= 4) stage('Stage 4 — publish', process.execPath, [path.join(HERE, '4_publish.mjs'), DATE]);

console.log(`\nDone. Session ${DATE} is in the Notion Session Log.`);
