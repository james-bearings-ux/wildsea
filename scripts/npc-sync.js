/**
 * NPC Sync: Notion → Supabase
 *
 * Reads Wildsea session note pages from Notion, extracts NPCs using Claude,
 * and upserts records into Supabase. Only processes pages that have changed
 * since the last run.
 *
 * Run manually: node scripts/npc-sync.js
 * Scheduled: GitHub Actions, Wednesday midnight EST
 */

import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ROOT_PAGE_ID = process.env.NOTION_ROOT_PAGE_ID;

// ---------------------------------------------------------------------------
// Notion helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all child pages under a given page ID.
 * Returns array of { id, title } objects.
 */
async function getAllPages(pageId) {
  const pages = [];
  let cursor;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
    });

    for (const block of response.results) {
      if (block.type === 'child_page') {
        pages.push({ id: block.id, title: block.child_page.title });
        const children = await getAllPages(block.id);
        pages.push(...children);
      }
    }

    cursor = response.next_cursor;
  } while (cursor);

  return pages;
}

// Matches (NPC) or (NPCs), with smart or straight apostrophes in names.
// Allows lowercase connector words (the, of, de, etc.) between capitalised name parts,
// handling epithets like "Chito the Emerald" or "Zot the Wild".
const NPC_TAG_REGEX = /\b([A-Z][a-zA-Z\u2018\u2019'\-]+(?:\s+(?:[a-z]+\s+)?[A-Z][a-zA-Z\u2018\u2019'\-]+)*)\s*\(NPCs?\)/g;

/**
 * Recursively fetch all blocks, returning:
 * - filteredLines: text for Claude (unchecked to_do blocks excluded)
 * - revealedNPCNames: (NPC)-tagged names from checked items or regular text
 *   (confirmed in play → revealed: true)
 * - hiddenNPCNames: (NPC)-tagged names from unchecked items only
 *   (planned, not yet encountered → revealed: false)
 */
async function getPageContent(blockId, parentIsUnchecked = false) {
  const filteredLines = [];
  const revealedNPCNames = new Set();
  const hiddenNPCNames = new Set();
  let cursor;

  do {
    const response = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });

    for (const block of response.results) {
      const isUnchecked = block.type === 'to_do' && !block.to_do.checked;
      const isInPlayContext = !isUnchecked && !parentIsUnchecked;
      const rawText = getBlockRawText(block);

      // Scan for (NPC)/(NPCs) tags — checked/regular text → revealed, unchecked → hidden
      if (rawText) {
        NPC_TAG_REGEX.lastIndex = 0;
        let match;
        while ((match = NPC_TAG_REGEX.exec(rawText)) !== null) {
          const name = match[1].trim();
          if (isInPlayContext) {
            revealedNPCNames.add(name);
          } else {
            hiddenNPCNames.add(name);
          }
        }
      }

      // Always include block text in filteredLines (checked or unchecked) so
      // Claude can describe hidden NPCs. Revealed status is tracked separately.
      const line = blockToText(block);
      if (line !== null) filteredLines.push(line);

      if (block.has_children && block.type !== 'child_page') {
        const child = await getPageContent(block.id, parentIsUnchecked || isUnchecked);
        filteredLines.push(...child.filteredLines);
        child.revealedNPCNames.forEach(n => isUnchecked ? hiddenNPCNames.add(n) : revealedNPCNames.add(n));
        child.hiddenNPCNames.forEach(n => hiddenNPCNames.add(n));
      }
    }

    cursor = response.next_cursor;
  } while (cursor);

  return { filteredLines, revealedNPCNames, hiddenNPCNames };
}

/**
 * Extract the plain text content from a block regardless of type.
 * Used for (NPC) tag scanning before any filtering.
 */
function getBlockRawText(block) {
  switch (block.type) {
    case 'to_do':           return richTextToPlain(block.to_do.rich_text);
    case 'heading_1':       return richTextToPlain(block.heading_1.rich_text);
    case 'heading_2':       return richTextToPlain(block.heading_2.rich_text);
    case 'heading_3':       return richTextToPlain(block.heading_3.rich_text);
    case 'paragraph':       return richTextToPlain(block.paragraph.rich_text);
    case 'bulleted_list_item': return richTextToPlain(block.bulleted_list_item.rich_text);
    case 'numbered_list_item': return richTextToPlain(block.numbered_list_item.rich_text);
    case 'quote':           return richTextToPlain(block.quote.rich_text);
    default:                return null;
  }
}

/**
 * Convert a single Notion block to a plain text string.
 * Returns null for blocks that should be skipped.
 */
function blockToText(block) {
  switch (block.type) {
    case 'to_do':
      // Checked items only (unchecked filtered out before this point)
      return '✓ ' + richTextToPlain(block.to_do.rich_text);
    case 'heading_1':
      return '# ' + richTextToPlain(block.heading_1.rich_text);
    case 'heading_2':
      return '## ' + richTextToPlain(block.heading_2.rich_text);
    case 'heading_3':
      return '### ' + richTextToPlain(block.heading_3.rich_text);
    case 'paragraph':
      return richTextToPlain(block.paragraph.rich_text) || null;
    case 'bulleted_list_item':
      return '- ' + richTextToPlain(block.bulleted_list_item.rich_text);
    case 'numbered_list_item':
      return richTextToPlain(block.numbered_list_item.rich_text);
    case 'quote':
      return '> ' + richTextToPlain(block.quote.rich_text);
    default:
      return null;
  }
}

function richTextToPlain(richText) {
  if (!richText) return '';
  return richText.map(t => t.plain_text).join('');
}

// ---------------------------------------------------------------------------
// Claude extraction
// ---------------------------------------------------------------------------

async function extractNPCs(pageTitle, pageText) {
  if (!pageText.trim()) return [];

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are extracting NPC data from tabletop RPG session notes for the Wildsea TTRPG.

Page title (primary location): ${pageTitle}

Session notes:
${pageText}

NPCs appear in several ways in these notes:
- Lines starting with ✓ are confirmed encounters, often formatted as "✓ Name (NPC), description text"
- Names tagged with (NPC) or (NPCs) anywhere in the text
- Characters mentioned by name in narrative prose or dated session entries

For each NPC:
- Use the text immediately following their name on the same line as the basis for their description
- Summarise that into one punchy sentence
- Infer first_seen and last_seen from the nearest date heading (# heading) above their mention
- Default location to the page title unless the text suggests otherwise

Return ONLY a valid JSON array with these fields per NPC:
name, location, description, status (alive|dead|missing|unknown), faction (or null), first_seen, last_seen

If no NPCs are found, return [].`
    }]
  });

  const content = response.content[0].text.trim();

  // Tolerate any surrounding text by extracting the JSON array
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    return JSON.parse(match[0]);
  } catch (err) {
    console.error('  Failed to parse Claude response:', content.slice(0, 200));
    return [];
  }
}

// ---------------------------------------------------------------------------
// NPC merging
// ---------------------------------------------------------------------------

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeKey(name) {
  return name.toLowerCase().replace(/[\u2018\u2019]/g, "'");
}

function enrichNPC(existing, claude) {
  return {
    ...existing,
    description: claude.description || existing.description,
    status: claude.status || existing.status,
    faction: claude.faction || existing.faction,
    first_seen: claude.first_seen || existing.first_seen,
    last_seen: claude.last_seen || existing.last_seen,
    // Revealed is sticky — once true it stays true
    revealed: existing.revealed || claude.revealed || false,
  };
}

/**
 * Merge (NPC)-tagged stubs with Claude-extracted NPCs.
 * Tagged names are guaranteed entries; Claude enriches them with details
 * and may also contribute additional inferred NPCs.
 *
 * Partial name matching: if a tagged stub ("Emerald") appears as a whole word
 * inside a Claude name ("Chito the Emerald"), Claude's fuller name wins.
 */
function mergeNPCs(taggedNPCs, claudeNPCs) {
  const merged = new Map();

  for (const npc of taggedNPCs) {
    merged.set(normalizeKey(npc.name), npc);
  }

  for (const npc of claudeNPCs) {
    const claudeKey = normalizeKey(npc.name);

    // Exact match
    if (merged.has(claudeKey)) {
      merged.set(claudeKey, enrichNPC(merged.get(claudeKey), npc));
      continue;
    }

    // Partial match: one name contains the other as a whole word
    let partialKey = null;
    for (const taggedKey of merged.keys()) {
      const claudeContainsTagged = new RegExp(`\\b${escapeRegex(taggedKey)}\\b`, 'i').test(claudeKey);
      const taggedContainsClaude = new RegExp(`\\b${escapeRegex(claudeKey)}\\b`, 'i').test(taggedKey);
      if (claudeContainsTagged || taggedContainsClaude) {
        partialKey = taggedKey;
        break;
      }
    }

    if (partialKey) {
      // Promote to Claude's fuller name
      const stub = merged.get(partialKey);
      merged.delete(partialKey);
      merged.set(claudeKey, enrichNPC({ ...stub, name: npc.name }, npc));
      console.log(`    [name expanded] "${stub.name}" → "${npc.name}"`);
    } else {
      merged.set(claudeKey, npc);
    }
  }

  return [...merged.values()];
}

// ---------------------------------------------------------------------------
// Crew exclusion
// ---------------------------------------------------------------------------

/**
 * Fetch first names of all player characters from the characters table.
 * Used to exclude PCs from NPC extraction results.
 */
async function getCrewFirstNames() {
  const { data } = await supabase
    .from('characters')
    .select('name');
  if (!data) return [];
  const firstNames = data
    .map(c => c.name?.trim().split(' ')[0]?.toLowerCase())
    .filter(name => name && name !== 'unnamed');
  return [...new Set(firstNames)]; // deduplicate
}

function isCrewMember(npcName, crewFirstNames) {
  const firstName = npcName.trim().split(' ')[0].toLowerCase();
  return crewFirstNames.includes(firstName);
}

// ---------------------------------------------------------------------------
// Supabase upsert
// ---------------------------------------------------------------------------

async function upsertNPCs(npcs, pageId) {
  for (const npc of npcs) {
    if (!npc.name?.trim()) continue;

    // Case-insensitive name lookup — fetch all fields so we can preserve existing data
    const { data: existing } = await supabase
      .from('npcs')
      .select('id, source_page_ids, first_seen, location, description, status, faction, last_seen, revealed')
      .ilike('name', npc.name.trim())
      .maybeSingle();

    if (existing) {
      // Only fill fields that are currently null — never overwrite existing data
      const sourceIds = existing.source_page_ids || [];
      if (!sourceIds.includes(pageId)) sourceIds.push(pageId);

      const update = {
        location: existing.location || npc.location || null,
        description: existing.description || npc.description || null,
        status: existing.status || npc.status || 'unknown',
        faction: existing.faction || npc.faction || null,
        last_seen: existing.last_seen || npc.last_seen || null,
        source_page_ids: sourceIds,
      };

      // Auto-reveal if flagged as in-play — never auto-hide
      if (npc.revealed && !existing.revealed) update.revealed = true;

      await supabase.from('npcs').update(update).eq('id', existing.id);
    } else {
      await supabase.from('npcs').insert({
        name: npc.name.trim(),
        location: npc.location || null,
        description: npc.description || null,
        status: npc.status || 'unknown',
        faction: npc.faction || null,
        first_seen: npc.first_seen || null,
        last_seen: npc.last_seen || null,
        revealed: npc.revealed ?? false,
        source_page_ids: [pageId],
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Sync log
// ---------------------------------------------------------------------------

async function getSyncLog(pageId) {
  const { data } = await supabase
    .from('notion_sync_log')
    .select('notion_last_edited')
    .eq('page_id', pageId)
    .maybeSingle();
  return data;
}

async function updateSyncLog(pageId, pageTitle, lastEdited, npcsExtracted, status, errorMessage = null) {
  await supabase.from('notion_sync_log').upsert({
    page_id: pageId,
    page_title: pageTitle,
    notion_last_edited: lastEdited,
    processed_at: new Date().toISOString(),
    npcs_extracted: npcsExtracted,
    status,
    error_message: errorMessage,
  }, { onConflict: 'page_id' });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Starting NPC sync...\n');

  const crewFirstNames = await getCrewFirstNames();
  console.log(`Crew (excluded from NPCs): ${crewFirstNames.join(', ') || 'none'}\n`);

  const pages = await getAllPages(ROOT_PAGE_ID);
  console.log(`Found ${pages.length} pages under Wildsea root\n`);

  let processed = 0;
  let skipped = 0;
  let totalNPCs = 0;

  for (const page of pages) {
    try {
      const pageDetails = await notion.pages.retrieve({ page_id: page.id });
      const lastEdited = pageDetails.last_edited_time;

      const syncLog = await getSyncLog(page.id);
      const alreadyProcessed = syncLog?.notion_last_edited &&
        new Date(syncLog.notion_last_edited).getTime() === new Date(lastEdited).getTime();
      if (alreadyProcessed) {
        console.log(`  [skip] ${page.title}`);
        skipped++;
        continue;
      }

      console.log(`  [process] ${page.title}`);
      const { filteredLines, revealedNPCNames, hiddenNPCNames } = await getPageContent(page.id);
      const filteredText = filteredLines.join('\n');

      // Pass 1: explicitly (NPC)-tagged names — stubs with revealed flag from checkbox state
      const taggedNPCs = [
        ...[...revealedNPCNames].map(name => ({ name, revealed: true })),
        ...[...hiddenNPCNames].map(name => ({ name, revealed: false })),
      ].map(({ name, revealed }) => ({
        name,
        location: page.title,
        description: null,
        status: 'unknown',
        faction: null,
        first_seen: null,
        last_seen: null,
        revealed,
      }));

      // Pass 2: Claude inference from filtered text (no unchecked items)
      const claudeNPCs = filteredText.trim() ? await extractNPCs(page.title, filteredText) : [];

      // Merge and filter crew
      const merged = mergeNPCs(taggedNPCs, claudeNPCs);
      const npcs = merged.filter(npc => !isCrewMember(npc.name, crewFirstNames));
      const crewFiltered = merged.length - npcs.length;

      const allTagged = revealedNPCNames.size + hiddenNPCNames.size;
      if (allTagged > 0) {
        console.log(`    [NPC tags] ${revealedNPCNames.size} revealed, ${hiddenNPCNames.size} hidden`);
      }

      if (npcs.length > 0) {
        await upsertNPCs(npcs, page.id);
        totalNPCs += npcs.length;
        const crewNote = crewFiltered > 0 ? ` (${crewFiltered} crew filtered)` : '';
        console.log(`    → ${npcs.length} NPC(s): ${npcs.map(n => n.name).join(', ')}${crewNote}`);
      } else {
        console.log('    → No NPCs found');
      }

      await updateSyncLog(page.id, page.title, lastEdited, npcs.length, 'success');
      processed++;

    } catch (err) {
      console.error(`  [error] ${page.title}: ${err.message}`);
      await updateSyncLog(page.id, page.title, null, 0, 'error', err.message);
    }
  }

  console.log(`\nDone.`);
  console.log(`  Pages processed: ${processed}`);
  console.log(`  Pages skipped (unchanged): ${skipped}`);
  console.log(`  NPCs upserted: ${totalNPCs}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
