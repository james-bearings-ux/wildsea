# Running the session-notes pipeline

Turn a recorded game session into a structured page in the Notion **Session Log** —
one command per session.

For the *why* (architecture and design decisions), see
[session-notes-pipeline.md](./session-notes-pipeline.md). For full script/config
reference, see [scripts/session-notes/README.md](../../scripts/session-notes/README.md).

## Each session (the usual flow)

1. Download the Craig **multi-track** export and put the per-speaker `.aac` files in a
   dated folder:

   ```
   audio-processing/2026-07-08/1-<handle>.aac ...
   ```

2. Run the pipeline:

   ```
   node scripts/session-notes/run.mjs 2026-07-08
   ```

   This chains **transcribe → structure → publish** (~5 min — local Whisper does the
   heavy lifting, then Claude structures the notes, then it upserts to Notion).

3. Open the new page in the Session Log. Retitle or adjust the **Locale** if you like —
   re-runs preserve your **Name** and **Locale**, refreshing only the Summary + body.

That's the whole per-session flow.

## Handy variations

- **Re-run structuring + publish without re-transcribing** (e.g. after tweaking the prompt
  or roster): `node scripts/session-notes/run.mjs <date> --from 3`
- **Run one stage:** `node scripts/session-notes/3_structure.mjs <date>` (or `2_transcribe.py`
  / `4_publish.mjs`). Stage 2 needs the venv Python; `run.mjs` locates it for you.

## Keeping proper nouns right

Names come out clean because `audio-processing/roster.json` maps canonical spellings and
aliases (first name / last name / nickname → one entity). When a new recurring NPC or place
shows up mangled or inconsistent, add it there and re-run `--from 3` — that roster is the
lever that fixes ASR name errors.

## One-time setup (new machine / starting fresh)

Full detail in [scripts/session-notes/README.md](../../scripts/session-notes/README.md). In brief:

1. `.env` (repo root): `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_ROOT_PAGE_ID`.
2. Python **3.12** venv at `audio-processing/.venv` with
   `faster-whisper nvidia-cublas-cu12 nvidia-cudnn-cu12`.
3. Copy `scripts/session-notes/{speakers,roster}.example.json` into `audio-processing/`
   (drop the `.example`) and fill them in.
4. Create the Notion database once: `node scripts/session-notes/create-db.mjs`.

## Troubleshooting

- **"Python venv not found"** — you're missing `audio-processing/.venv`; see setup.
- **A name is wrong or inconsistent** — add it (with aliases) to `roster.json`, re-run `--from 3`.
- **Re-running is safe** — publish upserts by Date: it never duplicates a page, and never
  overwrites your curated title/locale.
- **Nothing shows in git** — audio, transcripts, and `speakers.json`/`roster.json` live in the
  gitignored `audio-processing/` by design (real names and large files stay local).
