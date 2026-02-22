/**
 * Presence bar component
 * Shows online users and sign out button
 */

/**
 * Render the presence bar
 * @param {Array} onlineUsers - List of online users
 * @returns {string} HTML for presence bar
 */
export function renderPresenceBar(onlineUsers) {
  const userList = onlineUsers.map(u => {
    // Use alias from whitelist notes, or fall back to username
    const name = u.user_alias || u.user_email.split('@')[0];
    return `<span class="presence-user">${name}</span>`;
  }).join('');

  // Get current theme from localStorage or default to light
  const currentTheme = localStorage.getItem('theme') || 'light';
  const themeIcon = currentTheme === 'dark' ? '☀️' : '🌙';
  const themeLabel = currentTheme === 'dark' ? 'Light' : 'Dark';

  return `
    <div class="presence-bar">
      <button
        class="presence-bar-btn"
        data-action="toggleTheme"
        title="Toggle ${themeLabel} Mode"
      >
        <span>${themeIcon}</span>
        <span>${themeLabel}</span>
      </button>
      <div class="presence-right">
        <div class="presence-online">
          <span class="presence-online-label">ONLINE:</span>
          ${userList || '<span class="presence-empty">No users</span>'}
        </div>
        <button
          class="presence-bar-btn presence-bar-btn-signout"
          data-action="signOut"
        >
          Sign Out
        </button>
      </div>
    </div>
  `;
}
