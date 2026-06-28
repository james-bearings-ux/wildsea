# 0004. Render path is synchronous and free of DB I/O

- **Status:** Accepted
- **Date:** 2026-06-28

## Context

The app has no framework — UI is produced by functions that return HTML strings,
assembled and written to `#app.innerHTML`. `render()` sits on the critical path of
every interaction.

The danger of this model is putting slow work *inside* render. The nav bar did
exactly that: `renderNavigation` was `async` and called `loadCharacterCached` for
every crew member (twice — inline tabs and dropdown), so each render awaited up to
`2N+2` Supabase timestamp queries (see [0002](./0002-minimize-supabase-egress-with-client-cache.md),
issues #53/#58). Every click paid for it, even clicks that didn't touch the nav.

## Decision

The render path is **synchronous with respect to data**: everything needed to render
is prepared in memory *before* `render()` runs, and rendering touches only the DOM.

- **Components are pure string builders.** They take already-loaded data and return
  HTML. They must not be `async` and must not call `supabase` or `loadX` functions.
- **Data is staged before render.** Where a view needs records that aren't the active
  character/ship, the caller prepares an in-memory snapshot first. The nav reads from
  a `crewRoster` Map (+ `shipSummary`) refreshed by `refreshCrewRoster` only on
  events that can change it (app load, crew add/remove/import, poll reload); the
  active character/ship are overlaid from memory via `syncActiveIntoRoster` so local
  edits show with zero queries.
- **Prefer partial updates over full re-render.** Two mechanisms exist:
  1. **Section system** — `js/rendering/sections.js`: handlers mark dirty sections
     (`markDirtyByAction` → `ACTION_TO_SECTIONS*`), and `smartRender` replaces only
     those `[data-section]` nodes, falling back to a full render if a section isn't
     in the DOM.
  2. **Targeted node swap** — for self-contained widgets, replace just that node.
     `updateDiceRollerInPlace` swaps `.dice-roller-panel` instead of rebuilding the
     document on every roll (#54).
- **Full render is reserved** for layout/mode/view changes, not routine edits.

## Consequences

- **Interactions stay fast** and cost no egress beyond what was already staged.
- **A staging obligation exists.** In-memory snapshots (e.g. the roster) must be
  refreshed at the right moments or the UI shows stale data. This trades "automatic
  but slow" (load-in-render) for "fast but must-be-invalidated."
- **Partial rendering needs DOM/renderer parity.** A new section requires a
  `data-section` marker, a `SECTION_RENDERERS` entry, and an `ACTION_TO_SECTIONS`
  mapping; mismatches silently fall back to full render.
- **Ship play mode is not yet sectioned** — its actions still full-render (tracked in
  issue #61). This ADR is the standard that work should meet.

## Auditing a diff against this

- [ ] Reject `async` render/component functions, or any component that calls
      `supabase` / `loadCharacter` / `loadShip` / `loadSession` (cached or not)
      during rendering.
- [ ] Data a view needs must be staged in memory before `render()`; reject
      "load it inside the render" patterns (this was the #53 nav regression).
- [ ] A frequent interaction handler that calls full `render()` where a section
      update or in-place node swap would do should be reworked or justified.
- [ ] A new partial-render section must add all three: `data-section` marker in the
      template, a `SECTION_RENDERERS` entry, and an `ACTION_TO_SECTIONS*` mapping.
- [ ] In-memory snapshots used by render (e.g. `crewRoster`, `shipSummary`) must be
      refreshed on every event that can change them (membership change, poll reload).
