# 0003. Optimistic local-first state with debounced persistence

- **Status:** Accepted
- **Date:** 2026-06-28

## Context

Editing a character is interaction-dense: cycling damage boxes, adjusting skills,
typing names and notes. If each mutation awaited a database write before updating
the UI, every click and keystroke would carry a network round-trip of latency, and
text fields would generate a write per character typed — punishing both the user and
the egress/write budget (see [0002](./0002-minimize-supabase-egress-with-client-cache.md)).

## Decision

Treat in-memory state as the source of truth for the active session and persist it
**optimistically and on a debounce**.

- **Mutations are synchronous and local.** Functions in `js/state/character.js` /
  `js/state/ship.js` mutate the in-memory object and return. They accept a
  `renderCallback`, but `js/main.js` passes `noopRender` — rendering is decoupled
  from mutation (see [0004](./0004-synchronous-render-path-no-db-io.md)).
- **UI updates immediately**, batched via `scheduleRender` (50ms) so a burst of
  clicks coalesces into one paint.
- **Persistence is debounced and write-through.** `scheduleSave` / `scheduleShipSave`
  save 1s after the last change and then update the cache. Text inputs debounce
  per-field (~400–600ms) so typing produces one write, not one per keystroke.
- **Externally-visible optimistic actions** (dice rolls) update local state, render,
  then save in the background and **roll back on error** (`rollDice` /
  `dismissAllRolls` in `js/main.js`).
- **Reconciliation guards against clobbering.** A poll-driven `render(true)` is
  skipped while a local save is pending or a text field is mid-edit
  (`hasPendingCharacterSave`, `hasPendingShipSave`, `hasActiveTextInputEdits`), so a
  remote refresh never overwrites unsaved local input.

## Consequences

- **Instant-feeling UI** and far fewer writes than a save-on-every-change model.
- **A close/crash within the debounce window can lose the last edit.** There is no
  flush-on-`beforeunload` for pending saves today; the 1s window makes this rare but
  not impossible. Acceptable for now; revisit if users report lost edits.
- **Last-write-wins across clients.** Two users editing the same record concurrently
  can overwrite each other; the pending-save guard only protects the *local* editor,
  not cross-client merges. Acceptable because players normally edit their own
  characters.
- **Every mutation path carries an obligation:** schedule a save and keep the cache
  write-through. Forgetting the save means silent data loss; forgetting the cache
  update means stale reads.

## Auditing a diff against this

- [ ] Reject mutation handlers that `await` a DB write before updating the UI on
      interaction-dense paths.
- [ ] Every state mutation triggered by the user must schedule a debounced save
      (`scheduleSave` / `scheduleShipSave` or a per-field `debounce`), not save
      synchronously per event.
- [ ] Text inputs must debounce per field; reject save-on-every-`change` for free
      text.
- [ ] Optimistic actions that hit an external service must render immediately, save
      in the background, and roll back local state on failure.
- [ ] New `render(true)` / remote-refresh paths must respect the pending-save /
      active-edit guards before overwriting in-memory state.
