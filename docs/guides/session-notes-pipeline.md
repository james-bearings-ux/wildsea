# Guide: Local session-notes pipeline (design)

**Status:** Implemented and in use (first live session 2026-07-01).
**Last updated:** 2026-07-08

This guide captures the architecture behind turning a recorded game session into
structured campaign notes — the *why* and the seams. For the step-by-step run
instructions, see the runbook: [running-session-notes.md](./running-session-notes.md).

## Running it

Drop the Craig per-speaker `.aac` files into a dated folder and run one command:

```
audio-processing/2026-07-08/1-<handle>.aac ...
node scripts/session-notes/run.mjs 2026-07-08
```

That chains transcribe → structure → publish (Whisper locally, then Claude, then a
Notion upsert). Full flow, variations (`--from 3`), and setup live in the
[runbook](./running-session-notes.md) and
[scripts/session-notes/README.md](../../scripts/session-notes/README.md).

## Goal

Capture a remote game session's audio, transcribe it locally, structure it into session
notes, and publish those notes to Notion — where they feed the **existing** NPC sync loop
(`scripts/npc-sync.js`, which reads Notion notes and extracts NPCs). The result is a closed
loop: session audio → notes in Notion → NPC sync → app.

## Confirmed decisions

- **Capture:** games are remote over **Discord**, recorded with the **Craig bot**, which
  produces one audio track per speaker.
- **Hybrid compute:** ASR (speech-to-text) runs **locally** on an RTX 4090 (24 GB);
  the **structuring** step uses the **Claude API** (the `ANTHROPIC_API_KEY` already used by
  `npc-sync.js`). The structuring step can later be swapped for a local model.
- **Modular stages with file artifacts between them**, so any stage is independently
  swappable. The stable contract is `transcript.json` (see below).
- Implement as small per-stage scripts (mirroring `scripts/`), **not** as a ComfyUI graph —
  this is a linear file/prompt pipeline, which suits a CLI far better than a node graph.

## Why Craig matters

Per-speaker tracks eliminate the hardest, lossiest part of the pipeline — ML speaker
diarization. Each track is one player's audio (mostly silence). So:

1. Transcribe **each track independently** with a voice-activity (VAD) filter to skip silence
   (also prevents the model from hallucinating text into quiet stretches).
2. Tag every resulting segment with that track's known speaker.
3. Merge all segments and sort by start time → one speaker-accurate, chronological transcript.

No `pyannote`, no diarization tuning, no "who said that?" cleanup.

## Pipeline

```
Capture  →  ASR + VAD (per track)  →  speaker labeling  →  LLM structuring  →  publish
(Craig)     (faster-whisper)          (track → name)       (Claude API)        (Notion)
  │              │                         │                    │                 │
audio tracks  transcript.json          (uses speakers.json)   notes.json/.md   Notion page
                                                                                  → npc-sync
```

### Stable interface: `transcript.json`

This is the system's real API and the seam that makes stages swappable. Any ASR backend must
produce it; any structuring backend must consume it.

```json
[
  { "start": 123.4, "end": 127.1, "speaker": "Jules", "text": "We tack to port…" }
]
```

- `start` / `end`: seconds from session start (float)
- `speaker`: resolved display name (see speaker labeling)
- `text`: transcribed utterance

## Proposed layout

```
scripts/session-notes/
  speakers.json     # persistent: craig-track-filename → "Jules (Ravat navigator)"
  1_ingest.py       # unzip Craig export, normalize tracks → tracks/ + manifest
  2_transcribe.py   # faster-whisper + VAD, per track → transcript.json
  3_structure.js    # Claude API → notes.json + notes.md
  4_publish.js      # push notes to Notion (feeds npc-sync)
```

Language mix is intentional: stage 2 is Python (the Whisper ecosystem is Python); stages 3–4
are JS to reuse the existing Notion + Anthropic code. The file artifacts make the cross-language
boundary a non-issue.

## Stage details

### 1. Ingest
Unzip the Craig multi-track export, normalize tracks to a consistent format (e.g. 16 kHz mono
WAV), and emit a manifest mapping each track file to its speaker via `speakers.json`.

### 2. Transcribe (ASR) — local
- **faster-whisper** (CTranslate2 backend), model `large-v3` (or `large-v3-turbo` for speed).
  On a 4090 this runs many times faster than realtime; weights ~10 GB leave plenty of headroom.
- Enable the built-in **Silero VAD** filter to skip silence per track.
- Bias proper nouns with Whisper's `initial_prompt` (see "Feed it your own data").
- Output: per-track segments, merged and time-sorted into `transcript.json`.

### 3. Speaker labeling
With Craig, this is just the `speakers.json` map (track filename → player/character name),
applied during the merge in stage 2. No diarization step.

### 4. Structure (LLM) — Claude API
- A 3–4 hr session is ~40–60k tokens — comfortably one-shot in Claude's context, so **no
  map-reduce is needed** in hybrid mode (that complexity only returns with a smaller local model).
- Define an explicit notes **schema** and request it: session summary, chronological beats,
  **NPCs encountered (tagged)**, locations, resources gained/spent, decisions made, and
  unresolved threads / hooks.
- **Prompt-cache the transcript** when iterating on the structuring prompt against the same
  session, so re-runs are cheap and fast.
- Output: `notes.json` (structured) and `notes.md` (human / Notion-ready).

### 5. Publish
Push `notes.md` into Notion in the structure `npc-sync.js` already reads, closing the loop.

## Feed it your own data (the project-specific multiplier)

The campaign's proper nouns already exist in structured form (character names, the `npcs`
table, ship name, factions). Inject that vocabulary at both ends:

- **ASR:** pass the roster as Whisper's `initial_prompt` so it spells campaign terms correctly
  ("Ravat", "Wildsea", NPC names) instead of guessing.
- **Structuring:** give Claude the same roster and have it **emit `(NPC)` tags** when naming
  characters — these drop straight into `npc-sync.js`'s explicit-tag pass, making it the primary
  path and reducing reliance on inference.

So the pipeline both consumes app data (to transcribe better) and produces data back into it
(tagged notes → NPCs) — something a generic audio→notes tool could not do.

## Swappability seams

- **ASR backend:** anything that emits `transcript.json` (faster-whisper today; WhisperX,
  whisper.cpp, or a cloud ASR later).
- **Structuring backend:** `(transcript.json, roster) → notes`. Claude today; a local 32B model
  (e.g. Qwen2.5-32B-Instruct 4-bit via vLLM/Ollama) later. The local path would add chunked
  map-reduce *inside* this module to handle context limits; the interface is unchanged.
- Run ASR and any local LLM as **sequential stages**, not concurrently, so they don't compete
  for VRAM.

## First vertical slice

De-risk before automating: take **one existing Craig recording**, hand-write `speakers.json`,
and get stages 2→3 working to produce a `notes.md` worth pasting into Notion. Skip ingest
automation and Notion publishing until transcript→notes quality is proven. That answers
"is the output worth the pipeline?" in an afternoon.

## Consent

Get the table's explicit consent to record, once. Cheap to do, expensive to skip.
