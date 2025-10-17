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

  return `
    <div style="
      background-color: #151515;
      border-bottom: 1px solid #333;
      padding: 2px 20px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      color: white;
      gap: 16px;
    ">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="color: #888; font-weight: 500;">ONLINE:</span>
        ${userList || '<span style="color: #666;">No users</span>'}
      </div>
      <button
        data-action="signOut"
        style="
          background-color: transparent;
          color: white;
          border: 1px solid #666;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.2s;
        "
        onmouseover="this.style.borderColor='#A91D3A'; this.style.color='#A91D3A';"
        onmouseout="this.style.borderColor='#666'; this.style.color='white';"
      >
        Sign Out
      </button>
    </div>
  `;
}
