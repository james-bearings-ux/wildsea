"""
Stage 2 (ASR): transcribe every Craig per-speaker track for a session and merge
them into a single time-ordered transcript.json: [{start, end, speaker, text}].

faster-whisper (large-v3 + VAD), primed with a glossary built from the app's own
game data (bloodlines, skills) + the character roster to bias proper-noun recognition.
Residual name errors are fixed downstream in stage 3 (Claude, against roster.json).

Run:  <data_root>/.venv/Scripts/python.exe scripts/session-notes/2_transcribe.py <YYYY-MM-DD>
(usually invoked via run.mjs). Requires the venv from docs/guides/session-notes-pipeline.md.
"""
import os, sys, json, time
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # Windows console defaults to cp1252

if len(sys.argv) < 2:
    print("Usage: python 2_transcribe.py <YYYY-MM-DD>", file=sys.stderr)
    sys.exit(1)
DATE = sys.argv[1]

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
DATA_ROOT = Path(os.environ.get("SESSION_NOTES_DIR", REPO / "audio-processing"))
SESSION = DATA_ROOT / DATE
OUT = SESSION / "transcript.json"
if not SESSION.is_dir():
    print(f"Session folder not found: {SESSION}", file=sys.stderr)
    sys.exit(1)

# --- make the cu12 runtime DLLs (namespace package) loadable by CTranslate2 ---
try:
    import nvidia
    for root in nvidia.__path__:
        for binp in Path(root).glob("*/bin"):
            if binp.is_dir():
                os.add_dll_directory(str(binp))
                os.environ["PATH"] = str(binp) + os.pathsep + os.environ.get("PATH", "")
except Exception as e:
    print("nvidia DLL path setup failed:", e, flush=True)

from faster_whisper import WhisperModel

with open(DATA_ROOT / "speakers.json", encoding="utf-8") as f:
    speakers = json.load(f)["speakers"]

def speaker_for(path):
    handle = Path(path).stem.split("-", 1)[1] if "-" in Path(path).stem else Path(path).stem
    info = speakers.get(handle)
    return info["display"] if info else handle

def build_glossary():
    gc_path = REPO / "public" / "data" / "game-constants.json"
    bloodlines, skills = [], []
    try:
        gc = json.loads(gc_path.read_text(encoding="utf-8"))
        bloodlines = gc.get("bloodlines", [])
        skills = gc.get("skills", [])
    except Exception as e:
        print("could not load game-constants:", e, flush=True)
    def names(items):
        return [i if isinstance(i, str) else i.get("name", "") for i in items]
    bloodlines, skills = names(bloodlines), names(skills)
    characters = [s["character"] for s in speakers.values() if s.get("character")]
    parts = ["Wildsea tabletop RPG session."]
    if characters:
        parts.append("Player characters: " + ", ".join(characters) + ".")
    if bloodlines:
        parts.append("Bloodlines: " + ", ".join(bloodlines) + ".")
    if skills:
        parts.append("Skills: " + ", ".join(c for c in skills if c) + ".")
    parts.append("Terms: the Wildsea, aspects, mires, drives, spark, salvage, whispers, charts.")
    # Campaign proper nouns from the roster: the crew's ship plus named ships,
    # places and gear. Biases ASR toward the right spelling so stage 3 has less
    # to correct.
    try:
        roster = json.loads((DATA_ROOT / "roster.json").read_text(encoding="utf-8"))
        named = [t["name"] for t in roster.get("things", []) if t.get("name")]
        if roster.get("ship") and roster["ship"] not in named:
            named.insert(0, roster["ship"])
        if named:
            parts.append("Ships, places and gear: " + ", ".join(named) + ".")
    except Exception as e:
        print("could not load roster for glossary:", e, flush=True)
    return " ".join(parts)

GLOSSARY = build_glossary()
print("Glossary:", GLOSSARY, "\n", flush=True)

tracks = sorted(SESSION.glob("*.aac"))
if not tracks:
    print(f"No .aac tracks in {SESSION}", file=sys.stderr)
    sys.exit(1)
print(f"Found {len(tracks)} tracks: {[t.name for t in tracks]}\n", flush=True)

print("Loading large-v3 on CUDA...", flush=True)
model = WhisperModel("large-v3", device="cuda", compute_type="float16")

all_segments = []
grand_t0 = time.time()
for track in tracks:
    spk = speaker_for(track)
    print(f"-> {track.name}  (speaker: {spk})", flush=True)
    t0 = time.time()
    segments, info = model.transcribe(
        str(track),
        language="en",
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        initial_prompt=GLOSSARY,
        beam_size=5,
        condition_on_previous_text=False,  # reduces Whisper repetition-loop hallucinations
    )
    n = 0
    for seg in segments:
        text = seg.text.strip()
        if not text:
            continue
        all_segments.append({"start": round(seg.start, 2), "end": round(seg.end, 2),
                             "speaker": spk, "text": text})
        n += 1
    print(f"   {n} segments, {info.duration:.0f}s audio in {time.time()-t0:.0f}s", flush=True)

all_segments.sort(key=lambda s: (s["start"], s["end"]))
OUT.write_text(json.dumps(all_segments, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\nDONE: {len(all_segments)} merged segments from {len(tracks)} tracks "
      f"in {time.time()-grand_t0:.0f}s. Wrote {OUT.relative_to(REPO)}", flush=True)
