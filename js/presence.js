/**
 * Presence tracking for multiplayer sessions
 * Shows which users are currently active in the session
 */

import { supabase } from './supabaseClient.js';

let heartbeatInterval = null;

/**
 * Update user's presence in the session (heartbeat)
 * @param {string} sessionId - The session ID
 * @param {string} userEmail - User's email
 */
export async function updatePresence(sessionId, userEmail) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // Get user alias from whitelist
    const { data: aliasData, error: aliasError } = await supabase
      .rpc('get_user_alias', { user_email_param: userEmail });

    if (aliasError) {
      console.error('[PRESENCE] Failed to get user alias:', aliasError);
    }

    const userAlias = aliasData || userEmail.split('@')[0];

    // Upsert presence record (insert or update last_seen and alias)
    const { error } = await supabase
      .from('session_presence')
      .upsert({
        user_id: user.id,
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
    // Get users active in the last 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();

    const { data, error } = await supabase
      .from('session_presence')
      .select('user_email, user_alias, last_seen')
      .eq('session_id', sessionId)
      .gte('last_seen', thirtySecondsAgo)
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
 * @param {string} sessionId - The session ID
 * @param {string} userEmail - User's email
 * @param {number} interval - Heartbeat interval in ms (default 10000ms = 10 seconds)
 */
export function startPresenceHeartbeat(sessionId, userEmail, interval = 10000) {
  console.log('[PRESENCE] Starting heartbeat for session:', sessionId);

  // Send initial heartbeat immediately
  updatePresence(sessionId, userEmail);

  // Start interval for periodic heartbeats
  heartbeatInterval = setInterval(() => {
    updatePresence(sessionId, userEmail);
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
 * @param {string} sessionId - The session ID
 */
export async function removePresence(sessionId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from('session_presence')
      .delete()
      .eq('user_id', user.id)
      .eq('session_id', sessionId);

    if (error) {
      console.error('[PRESENCE] Failed to remove presence:', error);
    }
  } catch (error) {
    console.error('[PRESENCE] Exception removing presence:', error);
  }
}
