# NPC Sync: Notion → Supabase Pipeline

Automated extraction of NPCs from DM session notes into the Wildsea app.

## Overview

A weekly batch process reads Notion pages under the Wildsea root, extracts NPC data using Claude, and upserts records into Supabase. The app reads from Supabase directly — Notion is write-once, read-only from the script's perspective.

```
Notion pages → batch script → Claude API → Supabase → Wildsea app
```

Runs every Wednesday at midnight EST via GitHub Actions.

---

## Notion Setup (complete)

- Internal integration: **Wildsea NPC Sync**
- Token: stored as GitHub Actions secret `NOTION_TOKEN`
- Access granted to Wildsea root page (all child pages inherited)
- Read content only — no write access needed

---

## Supabase Schema

### Migration: `npcs` table

```sql
CREATE TABLE npcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  description text,
  status text DEFAULT 'unknown',     -- alive | dead | missing | unknown
  faction text,
  first_seen text,                   -- date string of earliest session appearance
  last_seen text,                    -- date string of most recent session appearance
  revealed boolean DEFAULT false,    -- controls player visibility
  source_page_ids text[],            -- notion page IDs this NPC was extracted from
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Migration: `notion_sync_log` table

Tracks which pages have been processed and when, so the script only re-processes changed pages.

```sql
CREATE TABLE notion_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL UNIQUE,
  page_title text,
  notion_last_edited timestamptz,
  processed_at timestamptz DEFAULT now(),
  npcs_extracted int DEFAULT 0,
  status text,                       -- success | error
  error_message text
);
```

---

## Batch Script

**Location**: `scripts/npc-sync.js`

**Dependencies**: `@notionhq/client`, `@anthropic-ai/sdk`, `@supabase/supabase-js`

### Process

1. Fetch all pages under the Wildsea root recursively via Notion API
2. For each page, compare `last_edited_time` against `notion_sync_log`
3. Skip pages that haven't changed since last run
4. For changed/new pages, fetch full block content
5. Filter out unchecked checklist items (`[ ] item`) — these are unplayed planning notes and may contain spoilers
6. Send cleaned content + page title to Claude for NPC extraction
7. Claude returns structured JSON array of NPCs
8. Upsert each NPC into Supabase, matching on `name` (case-insensitive)
9. Update `notion_sync_log` with result

### Spoiler filter

Notion checklist blocks have a clear done/not-done state accessible via the API — no need to parse markdown. Unchecked blocks are dropped before content reaches Claude.

Date headings (`# March 15` etc.) mark session note sections and are always included.

### Claude extraction prompt (approximate)

```
You are extracting NPC data from tabletop RPG session notes.
Page title (location): {pageTitle}

Rules:
- Only extract NPCs who have actually appeared or been mentioned in play
- Use the page title as the default location unless the text suggests otherwise
- Infer first_seen and last_seen from the nearest date heading above each mention
- Status: alive | dead | missing | unknown
- Return a JSON array, one object per unique NPC

Fields: name, location, description (one sentence), status, faction, first_seen, last_seen
```

### Deduplication

NPCs are matched by name (case-insensitive) on upsert. Name variations (nickname vs full name) may occasionally create duplicates — these can be merged manually via the DM screen. `source_page_ids` is always appended, never replaced, so provenance is preserved.

---

## GitHub Actions Workflow

**File**: `.github/workflows/npc-sync.yml`

**Schedule**: Wednesday midnight EST = `0 5 * * 3` (UTC)

**Secrets required**:
| Secret | Description |
|--------|-------------|
| `NOTION_TOKEN` | Internal integration secret |
| `NOTION_ROOT_PAGE_ID` | Page ID of the Wildsea root page |
| `ANTHROPIC_API_KEY` | For Claude extraction |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS for server-side writes |

Manual trigger (`workflow_dispatch`) also included for testing.

---

## App Integration

### DM screen NPC panel

- Full NPC list, visible to DM role only in its editable form
- Sortable by: name, location, status, faction, first_seen
- Searchable by name, location, faction
- `revealed` toggle per NPC (controls player visibility)
- Inline edit for description, status, faction (for DM corrections)

### Player view

- Read-only panel showing only `revealed = true` NPCs
- Fields visible: name, location, description
- Status and faction shown if present
- No editing controls

### New component

`js/components/npc-panel.js` — role-aware, renders full DM view or filtered player view based on `userRole`

---

## Implementation Order

1. **Supabase migrations** — create `npcs` and `notion_sync_log` tables
2. **Batch script** — `scripts/npc-sync.js` with manual run capability
3. **Test run** — run manually against real Notion data, verify extraction quality
4. **Refine Claude prompt** — based on test output
5. **GitHub Actions workflow** — wire up schedule and secrets
6. **App: DM screen panel** — full NPC list with sort/search/reveal toggle
7. **App: Player panel** — revealed-only read-only view

---

## Known Limitations

- Name matching for deduplication is naive — variations will create duplicate records
- Date parsing from headings is best-effort (formats vary)
- Semi-structured notes mean occasional misattributions (NPC mentioned in planning context may slip through)
- No automatic removal of NPCs if source notes are deleted or edited

---

## Future Ideas

- Location index / grouping view
- Faction relationship map
- "Introduce NPC" button that sets revealed + optionally pushes a notification
- Manual NPC creation from the DM screen (not sourced from Notion)
