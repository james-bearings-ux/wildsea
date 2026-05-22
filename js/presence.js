/**
 * Presence tracking for multiplayer sessions
 * Shows which users are currently active in the session
 */

import { supabase } from './supabaseClient.js';

let heartbeatInterval = null;

/**
 * Update user's presence in the session (heartbeat)
 * Caller must supply pre-resolved userId and userAlias to avoid extra auth/RPC calls per tick.
 * @param {string} sessionId
 * @param {string} userId - Supabase auth user ID
 * @param {string} userEmail
 * @param {string} userAlias
 */
export async function updatePresence(sessionId, userId, userEmail, userAlias) {
  try {
    const { error } = await supabase
      .from('session_presence')
      .upsert({
        user_id: userId,
        session_id: sessionId,
        user_email: userEmail,
        user_alias: userAlias,
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'user_id,session_id'
      });

    if (error) {
      console.error('[PRESENCE] Failed to update presence:', error);
    }
  } catch (error) {
    console.error('[PRESENCE] Exception updating presence:', error);
  }
}

/**
 * Get list of online users in the session
 * @param {string} sessionId - The session ID
 * @returns {Array} List of online users with aliases
 */
export async function getOnlineUsers(sessionId) {
  try {
    // 90-second window — 3× the 30s heartbeat interval so a single missed beat doesn't drop users
    const windowStart = new Date(Date.now() - 90000).toISOString();

    const { data, error } = await supabase
      .from('session_presence')
      .select('user_email, user_alias, last_seen')
      .eq('session_id', sessionId)
      .gte('last_seen', windowStart)
      .order('user_email');

    if (error) {
      console.error('[PRESENCE] Failed to fetch online users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[PRESENCE] Exception fetching online users:', error);
    return [];
  }
}

/**
 * Start sending presence heartbeats
 * @param {string} sessionId
 * @param {string} userId - Supabase auth user ID (pre-resolved at startup)
 * @param {string} userEmail
 * @param {string} userAlias - Display name (pre-resolved at startup)
 * @param {number} interval - Heartbeat interval in ms (default 30000ms = 30 seconds)
 */
export function startPresenceHeartbeat(sessionId, userId, userEmail, userAlias, interval = 30000) {
  console.log('[PRESENCE] Starting heartbeat for session:', sessionId);

  // Send initial heartbeat immediately
  updatePresence(sessionId, userId, userEmail, userAlias);

  // Start interval for periodic heartbeats
  heartbeatInterval = setInterval(() => {
    updatePresence(sessionId, userId, userEmail, userAlias);
  }, interval);
}

/**
 * Stop sending presence heartbeats
 */
export function stopPresenceHeartbeat() {
  if (heartbeatInterval) {
    console.log('[PRESENCE] Stopping heartbeat');
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Remove user from presence (on sign out or page unload)
 * @param {string} sessionId
 * @param {string} userId - Supabase auth user ID (pre-resolved at startup)
 */
export async function removePresence(sessionId, userId) {
  try {
    const { error } = await supabase
      .from('session_presence')
      .delete()
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (error) {
      console.error('[PRESENCE] Failed to remove presence:', error);
    }
  } catch (error) {
    console.error('[PRESENCE] Exception removing presence:', error);
  }
}
