# Architecture Decision Records

This directory records the **why** behind non-obvious architectural and performance
decisions in this codebase. CLAUDE.md and GAME-RULES.md describe how things work
*today*; ADRs explain *why they are that way* and what would have to change to revisit them.

## When to write one

Write an ADR when a decision:
- constrains future code (a rule a later diff could unknowingly violate), or
- would otherwise be re-litigated or reverse-engineered by a future contributor, or
- trades something off deliberately (cost, latency, complexity, correctness).

Don't write one for things obvious from the code, or for how-to documentation
(that belongs in CLAUDE.md).

## Format

Each ADR follows [`template.md`](./template.md): Status, Context, Decision,
Consequences, and an **Auditing a diff against this** checklist. That last section
is the point — it turns each decision into a concrete set of "reject if you see…"
rules to check new diffs against.

## Numbering & status

- Files are `NNNN-kebab-title.md`, numbered sequentially, never reused.
- Status is one of `Proposed`, `Accepted`, `Superseded by NNNN`, `Deprecated`.
- ADRs are immutable once Accepted. To change a decision, write a new ADR and mark
  the old one `Superseded by NNNN` (don't edit the old decision away — the history
  is the value).

## Index

| # | Title | Status |
|---|-------|--------|
| [0001](./0001-polling-based-multiplayer-sync.md) | Polling-based multiplayer sync instead of Supabase Realtime | Accepted |
| [0002](./0002-minimize-supabase-egress-with-client-cache.md) | Minimize Supabase egress with a timestamp-gated client cache | Accepted |
| [0003](./0003-optimistic-local-first-with-debounced-persistence.md) | Optimistic local-first state with debounced persistence | Accepted |
| [0004](./0004-synchronous-render-path-no-db-io.md) | Render path is synchronous and free of DB I/O | Accepted |
