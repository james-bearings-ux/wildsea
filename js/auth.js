/**
 * Authentication module
 * Handles user authentication with magic links and whitelist checking
 */

import { supabase } from './supabaseClient.js';

/**
 * Check if an email is whitelisted
 * @param {string} email - Email to check
 * @returns {Promise<boolean>}
 */
export async function isEmailWhitelisted(email) {
  try {
    const { data, error } = await supabase.rpc('is_email_whitelisted', {
      check_email: email.trim().toLowerCase()
    });

    if (error) {
      console.error('Error checking whitelist:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error checking whitelist:', error);
    return false;
  }
}

/**
 * Send magic link to user's email (only if whitelisted)
 * @param {string} email - User's email address
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendMagicLink(email) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check whitelist first
  const whitelisted = await isEmailWhitelisted(normalizedEmail);

  if (!whitelisted) {
    return {
      success: false,
      error: 'Access denied. Please contact the administrator.'
    };
  }

  // Send magic link
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  if (error) {
    console.error('Error sending magic link:', error);
    return {
      success: false,
      error: 'Failed to send magic link. Please try again.'
    };
  }

  return { success: true };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get the current user session
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

/**
 * Listen for auth state changes
 * @param {Function} callback - Called with user object when auth state changes
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}
