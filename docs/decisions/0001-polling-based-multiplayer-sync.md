# 0001. Polling-based multiplayer sync instead of Supabase Realtime

- **Status:** Accepted
- **Date:** 2026-06-28

## Context

The app is a shared multiplayer character sheet: multiple players and a DM view
the same session, characters, and ship, and need to see each other's changes
without manual refresh. Supabase offers a Realtime (websocket) channel for this,
which was the original approach.

Supabase Realtime proved unreliable in this deployment — see the disabled import
in `js/main.js` (`// Realtime has infrastructure issues - using polling instead`)
and the historical `js/realtime.js` implementation (removed as dead code during
cleanup — see issue #64). We needed a sync mechanism that works on
GitHub Pages hosting against the Supabase free tier, where **egress is the scarce
resource** and websocket reliability is not in our control.

## Decision

Sync by **polling timestamps**, not subscriptions, and gate polling aggressively
so it only runs when it can actually matter.

- `js/polling.js` runs a single interval (default 10s) that fires four checks
  concurrently via `Promise.all`: `sessions`, `characters`, `ships`, and
  `session_characters`. Each check is a tiny query (latest `updated_at` or a row
  count), not a full record fetch. A tick triggers at most one `onUpdate`
  (see [0004](./0004-synchronous-render-path-no-db-io.md) and the coalescing in
  `startPolling`).
- Polling is **presence-gated**: it only runs when more than one user is online.
  `managePollingBasedOnPresence` (`js/main.js`) checks `getOnlineUsers` every 30s
  and starts/stops polling accordingly. Solo play does zero polling.
- Polling **pauses on inactivity** (5 min, `checkInactivity`) and when the tab is
  hidden (`visibilitychange`), and resumes on user activity / tab focus.
- Presence itself is a 30s heartbeat upsert into `session_presence`
  (`js/presence.js`), with online status derived from a 90s window.

## Consequences

- **Bounded staleness:** remote changes appear within ~one poll interval (10s),
  not instantly. Acceptable for a turn-based tabletop tool.
- **Egress scales with active multiplayer time only.** Solo play, idle tabs, and
  backgrounded tabs cost nothing. This is the main win over an always-on socket.
- **No websocket reliability surface.** Polling degrades gracefully and works
  anywhere plain HTTPS works.
- **More moving parts in the client:** presence heartbeat, presence check
  interval, inactivity interval, and visibility handling all have to be torn down
  correctly on sign-out / unload (they are, in `signOut` and `beforeunload`).
- **Revisit if** Supabase Realtime becomes reliable for us *and* we want
  sub-second sync (e.g. live dice for a fast-moving table). At that point Realtime
  could replace polling for specific hot tables (see also the dice-roll egress
  problem in issues #56/#57).

## Auditing a diff against this

- [ ] Reject re-introduction of Supabase Realtime subscriptions without a new ADR
      superseding this one.
- [ ] New cross-client sync needs must extend the existing combined poll interval,
      not add a second independent `setInterval` polling loop.
- [ ] New pollers must use cheap existence/timestamp queries, never full-record
      fetches, and must coalesce into the single per-tick `onUpdate`.
- [ ] Any new background interval (heartbeat, poll, timer) must be cleared in the
      sign-out and `beforeunload` teardown paths.
- [ ] Background sync must remain gated: no polling during solo play, inactivity,
      or hidden tab.
