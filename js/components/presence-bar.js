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
    return `<span style="margin-right: 12px;">${name}</span>`;
  }).join('');

  // Get current theme from localStorage or default to light
  const currentTheme = localStorage.getItem('theme') || 'light';
  const themeIcon = currentTheme === 'dark' ? '☀️' : '🌙';
  const themeLabel = currentTheme === 'dark' ? 'Light' : 'Dark';

  return `
    <div style="
      background-color: var(--presence-bg);
      border-bottom: 1px solid var(--presence-border);
      padding: 2px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      color: var(--presence-text);
      gap: 16px;
    ">
      <button
        data-action="toggleTheme"
        style="
          background-color: transparent;
          color: var(--presence-text);
          border: 1px solid var(--presence-button-border);
          padding: 2px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        "
        onmouseover="this.style.borderColor='var(--presence-button-hover)';"
        onmouseout="this.style.borderColor='var(--presence-button-border)';"
        title="Toggle ${themeLabel} Mode"
      >
        <span>${themeIcon}</span>
        <span>${themeLabel}</span>
      </button>
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--presence-muted); font-weight: 500;">ONLINE:</span>
          ${userList || '<span style="color: #666;">No users</span>'}
        </div>
        <button
          data-action="signOut"
          style="
            background-color: transparent;
            color: var(--presence-text);
            border: 1px solid var(--presence-button-border);
            padding: 2px 6px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-family: inherit;
            transition: all 0.2s;
          "
          onmouseover="this.style.borderColor='var(--presence-button-hover)'; this.style.color='var(--presence-button-hover)';"
          onmouseout="this.style.borderColor='var(--presence-button-border)'; this.style.color='var(--presence-text)';"
        >
          Sign Out
        </button>
      </div>
    </div>
  `;
}
