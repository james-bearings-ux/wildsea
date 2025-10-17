/**
 * Real-time subscription management for Supabase
 * Handles live updates when data changes in the database
 */

import { supabase } from './supabaseClient.js';

let subscriptions = [];

/**
 * Subscribe to session changes
 * @param {string} sessionId - The session ID to watch
 * @param {Function} onUpdate - Callback when session data changes
 */
export function subscribeToSession(sessionId, onUpdate) {
  console.log('[SUBSCRIBE] Subscribing to session:', sessionId);

  const subscription = supabase
    .channel(`session-${sessionId}`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`
      },
      (payload) => {
        console.log('[REALTIME] Session changed at', new Date().toISOString(), payload);
        onUpdate(payload);
      }
    )
    .subscribe((status, err) => {
      console.log('[SUBSCRIBE] Session subscription status:', status, 'Error:', err);
      if (status === 'SUBSCRIBED') {
        console.log('[SUBSCRIBE] ✓ Session subscription is ACTIVE');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[SUBSCRIBE] ✗ Session subscription ERROR:', err);
      } else if (status === 'TIMED_OUT') {
        console.error('[SUBSCRIBE] ✗ Session subscription TIMED OUT');
      } else if (status === 'CLOSED') {
        console.warn('[SUBSCRIBE] ⚠ Session subscription CLOSED - Check Supabase Dashboard for realtime status');
        console.warn('[SUBSCRIBE] ⚠ Verify Database > Replication has these tables enabled');
      }
    });

  subscriptions.push(subscription);
  return subscription;
}

/**
 * Subscribe to character changes for a session
 * @param {string} sessionId - The session ID whose characters to watch
 * @param {Function} onUpdate - Callback when character data changes
 */
export function subscribeToCharacters(sessionId, onUpdate) {
  console.log('[SUBSCRIBE] Subscribing to characters for session:', sessionId);

  const subscription = supabase
    .channel(`characters-${sessionId}`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'characters',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        console.log('[REALTIME] Character changed at', new Date().toISOString(), payload);
        onUpdate(payload);
      }
    )
    .subscribe((status, err) => {
      console.log('[SUBSCRIBE] Characters subscription status:', status, err || '');
      if (status === 'SUBSCRIBED') {
        console.log('[SUBSCRIBE] ✓ Characters subscription is ACTIVE');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[SUBSCRIBE] ✗ Characters subscription ERROR:', err);
      }
    });

  subscriptions.push(subscription);
  return subscription;
}

/**
 * Subscribe to ship changes for a session
 * @param {string} sessionId - The session ID whose ships to watch
 * @param {Function} onUpdate - Callback when ship data changes
 */
export function subscribeToShips(sessionId, onUpdate) {
  console.log('[SUBSCRIBE] Subscribing to ships for session:', sessionId);

  const subscription = supabase
    .channel(`ships-${sessionId}`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ships',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        console.log('[REALTIME] Ship changed at', new Date().toISOString(), payload);
        onUpdate(payload);
      }
    )
    .subscribe((status, err) => {
      console.log('[SUBSCRIBE] Ships subscription status:', status, err || '');
      if (status === 'SUBSCRIBED') {
        console.log('[SUBSCRIBE] ✓ Ships subscription is ACTIVE');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[SUBSCRIBE] ✗ Ships subscription ERROR:', err);
      }
    });

  subscriptions.push(subscription);
  return subscription;
}

/**
 * Subscribe to session_characters junction table changes
 * @param {string} sessionId - The session ID to watch
 * @param {Function} onUpdate - Callback when session-character relationships change
 */
export function subscribeToSessionCharacters(sessionId, onUpdate) {
  console.log('[SUBSCRIBE] Subscribing to session_characters for session:', sessionId);

  const subscription = supabase
    .channel(`session-characters-${sessionId}`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_characters',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        console.log('[REALTIME] Session-character relationship changed at', new Date().toISOString(), payload);
        onUpdate(payload);
      }
    )
    .subscribe((status, err) => {
      console.log('[SUBSCRIBE] Session-characters subscription status:', status, err || '');
      if (status === 'SUBSCRIBED') {
        console.log('[SUBSCRIBE] ✓ Session-characters subscription is ACTIVE');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[SUBSCRIBE] ✗ Session-characters subscription ERROR:', err);
      }
    });

  subscriptions.push(subscription);
  return subscription;
}

/**
 * Unsubscribe from all active subscriptions
 */
export async function unsubscribeAll() {
  console.log('Unsubscribing from all channels...');

  for (const subscription of subscriptions) {
    await supabase.removeChannel(subscription);
  }

  subscriptions = [];
  console.log('All subscriptions removed');
}

/**
 * Setup all subscriptions for a session
 * @param {string} sessionId - The session ID to watch
 * @param {Function} renderCallback - Callback to re-render the UI
 */
export async function setupSubscriptions(sessionId, renderCallback) {
  console.log('Setting up all subscriptions for session:', sessionId);

  // CRITICAL: Set auth token for realtime connection
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    console.log('[REALTIME] Setting access token for realtime connection');
    await supabase.realtime.setAuth(session.access_token);
  } else {
    console.error('[REALTIME] No access token found - subscriptions may fail!');
  }

  // Subscribe to session changes (name, active character, active ship, etc.)
  subscribeToSession(sessionId, (payload) => {
    console.log('[REALTIME] Session changed - Event:', payload.eventType, 'New data:', payload.new);
    // Session data changed, trigger re-render with session reload
    renderCallback(true);
  });

  // Subscribe to character changes (any character in this session)
  subscribeToCharacters(sessionId, (payload) => {
    console.log('[REALTIME] Character changed - Event:', payload.eventType, 'Character ID:', payload.new?.id, 'Name:', payload.new?.name);
    // Character data changed, trigger re-render with session reload
    renderCallback(true);
  });

  // Subscribe to ship changes (any ship in this session)
  subscribeToShips(sessionId, (payload) => {
    console.log('[REALTIME] Ship changed - Event:', payload.eventType, 'Ship ID:', payload.new?.id, 'Name:', payload.new?.name);
    // Ship data changed, trigger re-render with session reload
    renderCallback(true);
  });

  // Subscribe to session-character relationship changes (characters added/removed)
  subscribeToSessionCharacters(sessionId, (payload) => {
    console.log('[REALTIME] Session-character link changed - Event:', payload.eventType, 'Character ID:', payload.new?.character_id);
    // Character added or removed from session, trigger re-render with session reload
    renderCallback(true);
  });

  console.log('All subscriptions setup complete');
}
