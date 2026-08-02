/**
 * Player↔character mapping state (DM screen phase 2)
 *
 * Associates a player's login email with a default character so the DM screen can
 * pin online players' characters to the top. Backed by the `player_characters`
 * table (DM-only RLS — see migration 022); all calls no-op for non-DMs via RLS.
 */

import { supabase } from '../supabaseClient.js';

/**
 * Load all player↔character rows.
 * @returns {Promise<Array>} rows: { id, email, character_id, created_at, updated_at }
 */
export async function loadPlayers() {
  const { data, error } = await supabase
    .from('player_characters')
    .select('*')
    .order('email');
  if (error) {
    console.error('[PLAYERS] loadPlayers failed:', error);
    return [];
  }
  return data || [];
}

/**
 * Add a player by email (character unassigned).
 * @param {string} email
 * @returns {Promise<{data: Object|null, error: Object|null}>}
 */
export async function addPlayer(email) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return { data: null, error: { message: 'Email required' } };
  const { data, error } = await supabase
    .from('player_characters')
    .insert({ email: normalized, character_id: null })
    .select()
    .single();
  if (error) console.error('[PLAYERS] addPlayer failed:', error);
  return { data, error };
}

/**
 * Assign (or clear) the character for a player row.
 * @param {string} id - player_characters row id
 * @param {string|null} characterId - character id, or null to clear
 * @returns {Promise<{error: Object|null}>}
 */
export async function updatePlayerCharacter(id, characterId) {
  const { error } = await supabase
    .from('player_characters')
    .update({ character_id: characterId || null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('[PLAYERS] updatePlayerCharacter failed:', error);
  return { error };
}

/**
 * Remove a player row.
 * @param {string} id - player_characters row id
 * @returns {Promise<{error: Object|null}>}
 */
export async function removePlayer(id) {
  const { error } = await supabase
    .from('player_characters')
    .delete()
    .eq('id', id);
  if (error) console.error('[PLAYERS] removePlayer failed:', error);
  return { error };
}
