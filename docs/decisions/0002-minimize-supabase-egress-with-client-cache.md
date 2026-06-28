# 0002. Minimize Supabase egress with a timestamp-gated client cache

- **Status:** Accepted
- **Date:** 2026-06-28

## Context

The app runs against the Supabase free tier, where **egress (bytes read) is the
binding constraint**, not compute or storage. Character and ship records are large
JSONB documents (aspects, damage states, resources, etc.). Naively re-fetching them
on every render or every poll tick would blow the egress budget and add latency to
every interaction.

We need reads to be cheap and frequent without repeatedly transferring full records
that haven't changed.

## Decision

All record reads go through a **timestamp-gated, write-through client cache**
(`js/cache/supabase-cache.js`), and multi-record reads are **batched**.

- `loadCharacterCached` / `loadShipCached` / `loadSessionCached`:
  1. If the cached copy is younger than the freshness window (`CACHE_FRESHNESS_MS`,
     3s), return it with **no query at all**.
  2. Otherwise issue a tiny `select('updated_at')` HEAD query and compare. Return
     the cached copy if the server timestamp hasn't advanced.
  3. Only fetch the full record on a genuine miss/stale.
- Writes are **write-through**: every save calls `invalidateCharacterCache` /
  `invalidateShipCache` / `invalidateSessionCache` with the new in-memory object,
  so the cache never serves a value older than our own last write.
- When N records are needed at once, use a **single batched query** rather than a
  loop of cached single-record reads. The nav crew roster (`refreshCrewRoster` in
  `js/main.js`) fetches all crew names/roles in one `.in('id', ids)` query; this
  replaced a loop that did up to `2N+2` per-character timestamp queries on every
  render (see [0004](./0004-synchronous-render-path-no-db-io.md), issues #53/#58).

## Consequences

- **Reads collapse to near-zero on hot paths.** Repeated reads within 3s are free;
  beyond that they cost only a small timestamp query unless data actually changed.
- **Timestamp queries still cost round-trips.** They're tiny but not free, which is
  exactly why batching (one `.in()` vs N singles) matters and why the freshness
  window exists.
- **Correctness depends on disciplined write-through.** A save path that mutates the
  DB without invalidating the cache will serve stale data for up to the freshness
  window — this is the main failure mode to guard against.
- **Bounded staleness window (3s)** is acceptable because cross-client freshness is
  already governed by polling ([0001](./0001-polling-based-multiplayer-sync.md)).

## Auditing a diff against this

- [ ] Reject new `supabase.from(...).select('*')` of characters/ships/sessions on a
      render or per-interaction path that bypasses the cache layer.
- [ ] Reject per-item loops of cached single reads where one batched `.in(...)`
      query would do (this was the #58 bug).
- [ ] Every code path that writes a record must invalidate/update its cache entry in
      the same path (write-through).
- [ ] New large-record read APIs should follow the timestamp-gated pattern (cheap
      check, full fetch only on change), not fetch full rows unconditionally.
- [ ] Be suspicious of lowering `CACHE_FRESHNESS_MS` to 0 — it turns every cached
      read back into a network round-trip.
