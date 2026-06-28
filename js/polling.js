/**
 * Polling-based sync for multiplayer
 * Alternative to Supabase realtime when realtime infrastructure has issues
 */

import { supabase } from './supabaseClient.js';

// Debug flag - only log in development mode
const DEBUG = import.meta.env.DEV;

let pollingIntervals = [];

/**
 * Poll for session changes
 */
async function pollSession(sessionId, lastChecked, onUpdate) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('updated_at')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('[POLLING] Error checking session:', error);
      return lastChecked;
    }

    const updatedAt = new Date(data.updated_at).getTime();

    if (updatedAt > lastChecked) {
      if (DEBUG) console.log('[POLLING] Session changed - triggering update');
      onUpdate();
      return updatedAt;
    }

    return lastChecked;
  } catch (error) {
    console.error('[POLLING] Exception checking session:', error);
    return lastChecked;
  }
}

/**
 * Poll for character changes
 */
async function pollCharacters(sessionId, lastChecked, onUpdate) {
  try {
    const { data, error } = await supabase
      .from('characters')
      .select('updated_at')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[POLLING] Error checking characters:', error);
      return lastChecked;
    }

    if (data && data.length > 0) {
      const updatedAt = new Date(data[0].updated_at).getTime();

      if (updatedAt > lastChecked) {
        if (DEBUG) console.log('[POLLING] Character changed - triggering update');
        onUpdate();
        return updatedAt;
      }
    }

    return lastChecked;
  } catch (error) {
    console.error('[POLLING] Exception checking characters:', error);
    return lastChecked;
  }
}

/**
 * Poll for ship changes
 */
async function pollShips(sessionId, lastChecked, onUpdate) {
  try {
    const { data, error } = await supabase
      .from('ships')
      .select('updated_at')
      .eq('session_id', sessionId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[POLLING] Error checking ships:', error);
      return lastChecked;
    }

    if (data && data.length > 0) {
      const updatedAt = new Date(data[0].updated_at).getTime();

      if (updatedAt > lastChecked) {
        if (DEBUG) console.log('[POLLING] Ship changed - triggering update');
        onUpdate();
        return updatedAt;
      }
    }

    return lastChecked;
  } catch (error) {
    console.error('[POLLING] Exception checking ships:', error);
    return lastChecked;
  }
}

/**
 * Poll for session_characters changes
 */
async function pollSessionCharacters(sessionId, lastChecked, onUpdate) {
  try {
    // Check if count changed (character added/removed)
    const { count, error } = await supabase
      .from('session_characters')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (error) {
      console.error('[POLLING] Error checking session_characters:', error);
      return { lastChecked, lastCount: lastChecked.lastCount };
    }

    // Use count as the check since this table might not have updated_at
    if (lastChecked.lastCount !== undefined && count !== lastChecked.lastCount) {
      if (DEBUG) console.log('[POLLING] Session characters changed - triggering update');
      onUpdate();
    }

    return { lastChecked: Date.now(), lastCount: count };
  } catch (error) {
    console.error('[POLLING] Exception checking session_characters:', error);
    return lastChecked;
  }
}

/**
 * Start polling for changes
 * All four checks fire concurrently in a single interval via Promise.all.
 * @param {string} sessionId - The session ID to watch
 * @param {Function} onUpdate - Callback when changes detected
 * @param {number} interval - Polling interval in milliseconds (default 10000ms)
 */
export function startPolling(sessionId, onUpdate, interval = 10000) {
  if (DEBUG) console.log('[POLLING] Starting polling for session:', sessionId);

  const now = Date.now();
  let lastChecks = {
    session: now,
    characters: now,
    ships: now,
    sessionCharacters: { lastChecked: now, lastCount: undefined }
  };

  // Single interval — all four polls fire concurrently each tick.
  // Change detections are coalesced: each poller flags `changed` instead of
  // triggering onUpdate directly, so a tick fires at most ONE onUpdate (one
  // full render + cache revalidation) even when several tables changed at once.
  const combinedInterval = setInterval(async () => {
    let changed = false;
    const markChanged = () => { changed = true; };

    const [newSession, newCharacters, newShips, newSessionChars] = await Promise.all([
      pollSession(sessionId, lastChecks.session, markChanged),
      pollCharacters(sessionId, lastChecks.characters, markChanged),
      pollShips(sessionId, lastChecks.ships, markChanged),
      pollSessionCharacters(sessionId, lastChecks.sessionCharacters, markChanged)
    ]);

    lastChecks.session = newSession;
    lastChecks.characters = newCharacters;
    lastChecks.ships = newShips;
    lastChecks.sessionCharacters = newSessionChars;

    if (changed) onUpdate();
  }, interval);

  pollingIntervals.push(combinedInterval);

  if (DEBUG) console.log('[POLLING] Polling started - checking every', interval, 'ms');
}

/**
 * Stop all polling
 */
export function stopPolling() {
  if (DEBUG) console.log('[POLLING] Stopping all polling intervals...');

  pollingIntervals.forEach(interval => clearInterval(interval));
  pollingIntervals = [];

  if (DEBUG) console.log('[POLLING] All polling stopped');
}
