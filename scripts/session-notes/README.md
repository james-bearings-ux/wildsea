# Session Notes pipeline

Turns a recorded game session into structured notes in the Notion **Session Log**
database. Local ASR + Claude structuring (hybrid). Design and rationale:
[docs/guides/session-notes-pipeline.md](../../docs/guides/session-notes-pipeline.md).

```
Craig audio → 2_transcribe.py → transcript.json → 3_structure.mjs → notes.md → 4_publish.mjs → Notion
   (per-speaker .aac)   (faster-whisper, local)      (Claude Sonnet)              (upsert by date)
```

## Layout: code here, data + secrets elsewhere

Code is committed here. **Data and live config live in the gitignored data root**
(default `<repo>/audio-processing`, override with `SESSION_NOTES_DIR`):

```
<DATA_ROOT>/
  .venv/                     # Python venv for faster-whisper (see setup)
  speakers.json              # Craig handle -> speaker      (gitignored: real names/handles)
  roster.json                # canonical names, aliases, ship/things (gitignored: real names)
  notion-config.json         # { databaseId, dataSourceId } (written by create-db.mjs)
  <YYYY-MM-DD>/              # one folder per session
    1-<handle>.aac ...       # Craig per-speaker tracks (you drop these in)
    transcript.json          # stage 2 output
    notes.md, notes.meta.json# stage 3 output
```

`speakers.json` / `roster.json` are gitignored because they contain real names and
Discord handles. Copy the `*.example.json` templates here to `<DATA_ROOT>/` and fill them in.

## One-time setup

1. **Env:** repo-root `.env` needs `ANTHROPIC_API_KEY`, `NOTION_TOKEN`, `NOTION_ROOT_PAGE_ID`.
2. **Python venv** (ASR needs Python 3.12; system 3.14 lacks ML wheels). CUDA build for the 4090:
   ```
   py -3.12 -m venv <DATA_ROOT>/.venv
   <DATA_ROOT>/.venv/Scripts/python -m pip install faster-whisper nvidia-cublas-cu12 nvidia-cudnn-cu12
   ```
   (ffmpeg optional — PyAV bundles its own.)
3. **Config:** copy `speakers.example.json` + `roster.example.json` to `<DATA_ROOT>/` (drop the `.example`) and fill in.
4. **Notion DB (once):** `node scripts/session-notes/create-db.mjs`

## Per session

1. Download the Craig **multi-track** export; put the `.aac` tracks in `<DATA_ROOT>/<YYYY-MM-DD>/`.
2. Run the pipeline:
   ```
   node scripts/session-notes/run.mjs 2026-07-08
   ```
3. Open the new page in the Notion Session Log; retitle / adjust `Locale` if you like
   (re-runs preserve your Name + Locale — they only refresh Summary + body).

Re-run just structuring + publish (no re-transcribe): `run.mjs <date> --from 3`.
Individual stages also run standalone: `node scripts/session-notes/{2_transcribe.py|3_structure.mjs|4_publish.mjs} <date>`.

## Legacy import

`migrate-legacy.mjs` is a one-time tool that ports dated session sections out of a
hand-written Notion "Locale" prep page into the Session Log (verbatim body + summary +
📜 banner, `Source = "Legacy import"`). Non-destructive; dry-run by default:

```
node scripts/session-notes/migrate-legacy.mjs "Page Name"           # dry run
node scripts/session-notes/migrate-legacy.mjs "Page Name" --write   # publish
```
It never overwrites a page whose `Source` isn't "Legacy import" (protects audio-sourced sessions).
