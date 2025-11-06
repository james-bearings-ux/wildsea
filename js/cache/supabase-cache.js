/**
 * Local caching layer for Supabase data
 * Reduces egress by caching character/ship data and only fetching when changed
 */

import { supabase } from '../supabaseClient.js';

// In-memory caches
const characterCache = new Map(); // characterId -> { data, updated_at, cached_at }
const shipCache = new Map();      // shipId -> { data, updated_at, cached_at }
const sessionCache = new Map();   // sessionId -> { data, updated_at, cached_at }

// Debug flag
const DEBUG = import.meta.env.DEV;

// Cache freshness threshold - don't check timestamp if cached within this time
const CACHE_FRESHNESS_MS = 3000; // 3 seconds

/**
 * Load a character with caching
 * Only fetches full record if timestamp changed
 * @param {string} characterId - Character ID to load
 * @param {Function} loadCharacterFn - Function to load full character data
 * @returns {Promise<Object|null>} Character data or null if not found
 */
export async function loadCharacterCached(characterId, loadCharacterFn) {
  try {
    const cached = characterCache.get(characterId);
    const now = Date.now();

    // If cache is fresh (less than 3 seconds old), return immediately without timestamp check
    if (cached && cached.cached_at && (now - cached.cached_at < CACHE_FRESHNESS_MS)) {
      if (DEBUG) console.log('[CACHE] ⚡ Character cache fresh:', characterId);
      return cached.data;
    }

    // Check timestamp (tiny query)
    const { data: meta, error: metaError } = await supabase
      .from('characters')
      .select('updated_at')
      .eq('id', characterId)
      .single();

    if (metaError) {
      if (DEBUG) console.log('[CACHE] Character not found:', characterId);
      return null;
    }

    const serverUpdatedAt = new Date(meta.updated_at).getTime();

    // Return cached if timestamps match
    if (cached && cached.updated_at >= serverUpdatedAt) {
      if (DEBUG) console.log('[CACHE] ✅ Character cache hit:', characterId);
      // Update cached_at to refresh staleness timer
      cached.cached_at = now;
      return cached.data;
    }

    // Cache miss or stale - fetch full record
    if (DEBUG) {
      if (cached) {
        console.log('[CACHE] ⚠️  Character cache stale, fetching:', characterId);
      } else {
        console.log('[CACHE] ❌ Character cache miss, fetching:', characterId);
      }
    }

    const character = await loadCharacterFn(characterId);

    if (character) {
      // Update cache
      characterCache.set(characterId, {
        data: character,
        updated_at: serverUpdatedAt,
        cached_at: now
      });
    }

    return character;
  } catch (error) {
    console.error('[CACHE] Error loading character:', error);
    return null;
  }
}

/**
 * Load a ship with caching
 * Only fetches full record if timestamp changed
 * @param {string} shipId - Ship ID to load
 * @param {Function} loadShipFn - Function to load full ship data
 * @returns {Promise<Object|null>} Ship data or null if not found
 */
export async function loadShipCached(shipId, loadShipFn) {
  try {
    const cached = shipCache.get(shipId);
    const now = Date.now();

    // If cache is fresh (less than 3 seconds old), return immediately without timestamp check
    if (cached && cached.cached_at && (now - cached.cached_at < CACHE_FRESHNESS_MS)) {
      if (DEBUG) console.log('[CACHE] ⚡ Ship cache fresh:', shipId);
      return cached.data;
    }

    // Check timestamp (tiny query)
    const { data: meta, error: metaError } = await supabase
      .from('ships')
      .select('updated_at')
      .eq('id', shipId)
      .single();

    if (metaError) {
      if (DEBUG) console.log('[CACHE] Ship not found:', shipId);
      return null;
    }

    const serverUpdatedAt = new Date(meta.updated_at).getTime();

    // Return cached if timestamps match
    if (cached && cached.updated_at >= serverUpdatedAt) {
      if (DEBUG) console.log('[CACHE] ✅ Ship cache hit:', shipId);
      // Update cached_at to refresh staleness timer
      cached.cached_at = now;
      return cached.data;
    }

    // Cache miss or stale - fetch full record
    if (DEBUG) {
      if (cached) {
        console.log('[CACHE] ⚠️  Ship cache stale, fetching:', shipId);
      } else {
        console.log('[CACHE] ❌ Ship cache miss, fetching:', shipId);
      }
    }

    const ship = await loadShipFn(shipId);

    if (ship) {
      // Update cache
      shipCache.set(shipId, {
        data: ship,
        updated_at: serverUpdatedAt,
        cached_at: now
      });
    }

    return ship;
  } catch (error) {
    console.error('[CACHE] Error loading ship:', error);
    return null;
  }
}

/**
 * Load a session with caching
 * Only fetches full record if timestamp changed
 * @param {string} sessionId - Session ID to load
 * @param {Function} loadSessionFn - Function to load full session data
 * @returns {Promise<Object|null>} Session data or null if not found
 */
export async function loadSessionCached(sessionId, loadSessionFn) {
  try {
    const cached = sessionCache.get(sessionId);
    const now = Date.now();

    // If cache is fresh (less than 3 seconds old), return immediately without timestamp check
    if (cached && cached.cached_at && (now - cached.cached_at < CACHE_FRESHNESS_MS)) {
      if (DEBUG) console.log('[CACHE] ⚡ Session cache fresh:', sessionId);
      return cached.data;
    }

    // Check timestamp (tiny query)
    const { data: meta, error: metaError } = await supabase
      .from('sessions')
      .select('updated_at')
      .eq('id', sessionId)
      .single();

    if (metaError) {
      if (DEBUG) console.log('[CACHE] Session not found:', sessionId);
      return null;
    }

    const serverUpdatedAt = new Date(meta.updated_at).getTime();

    // Return cached if timestamps match
    if (cached && cached.updated_at >= serverUpdatedAt) {
      if (DEBUG) console.log('[CACHE] ✅ Session cache hit:', sessionId);
      // Update cached_at to refresh staleness timer
      cached.cached_at = now;
      return cached.data;
    }

    // Cache miss or stale - fetch full record
    if (DEBUG) {
      if (cached) {
        console.log('[CACHE] ⚠️  Session cache stale, fetching:', sessionId);
      } else {
        console.log('[CACHE] ❌ Session cache miss, fetching:', sessionId);
      }
    }

    const session = await loadSessionFn(sessionId);

    if (session) {
      // Update cache
      sessionCache.set(sessionId, {
        data: session,
        updated_at: serverUpdatedAt,
        cached_at: now
      });
    }

    return session;
  } catch (error) {
    console.error('[CACHE] Error loading session:', error);
    return null;
  }
}

/**
 * Invalidate character cache entry
 * Call this after saving a character to update the cache
 * @param {string} characterId - Character ID to invalidate
 * @param {Object} character - New character data
 */
export function invalidateCharacterCache(characterId, character) {
  const now = Date.now();
  if (character) {
    characterCache.set(characterId, {
      data: character,
      updated_at: now,
      cached_at: now
    });
    if (DEBUG) console.log('[CACHE] Character cache updated:', characterId);
  } else {
    characterCache.delete(characterId);
    if (DEBUG) console.log('[CACHE] Character cache cleared:', characterId);
  }
}

/**
 * Invalidate ship cache entry
 * Call this after saving a ship to update the cache
 * @param {string} shipId - Ship ID to invalidate
 * @param {Object} ship - New ship data
 */
export function invalidateShipCache(shipId, ship) {
  const now = Date.now();
  if (ship) {
    shipCache.set(shipId, {
      data: ship,
      updated_at: now,
      cached_at: now
    });
    if (DEBUG) console.log('[CACHE] Ship cache updated:', shipId);
  } else {
    shipCache.delete(shipId);
    if (DEBUG) console.log('[CACHE] Ship cache cleared:', shipId);
  }
}

/**
 * Invalidate session cache entry
 * Call this after updating a session to update the cache
 * @param {string} sessionId - Session ID to invalidate
 * @param {Object} session - New session data
 */
export function invalidateSessionCache(sessionId, session) {
  const now = Date.now();
  if (session) {
    sessionCache.set(sessionId, {
      data: session,
      updated_at: now,
      cached_at: now
    });
    if (DEBUG) console.log('[CACHE] Session cache updated:', sessionId);
  } else {
    sessionCache.delete(sessionId);
    if (DEBUG) console.log('[CACHE] Session cache cleared:', sessionId);
  }
}

/**
 * Clear all caches
 * Useful when user signs out or switches sessions
 */
export function clearAllCaches() {
  characterCache.clear();
  shipCache.clear();
  sessionCache.clear();
  if (DEBUG) console.log('[CACHE] All caches cleared');
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  return {
    characters: characterCache.size,
    ships: shipCache.size,
    sessions: sessionCache.size
  };
}
