/**
 * Login component
 * Renders magic link authentication UI
 */

/**
 * Render the login screen
 * @param {string} statusMessage - Optional status message to display
 * @param {string} email - Optional pre-filled email
 */
export function renderLoginScreen(statusMessage = '', email = '') {
  const messageClass = statusMessage.includes('sent') ? 'login-message-success' : 'login-message-error';

  return `
    <div class="login-screen">
      <div class="login-container">
        <div class="login-title">The Wildsea</div>
        <div class="login-subtitle">Character Sheet</div>

        <div class="login-card">
          <h2 class="login-heading">Sign In</h2>
          <p class="login-description">
            Enter your email to receive a magic link
          </p>

          ${statusMessage ? `
            <div class="login-message ${messageClass}">
              ${statusMessage}
            </div>
          ` : ''}

          <form id="login-form" class="login-form">
            <div class="login-form-group">
              <label for="email" class="login-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value="${email}"
                required
                autocomplete="email"
                class="login-input"
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              id="login-button"
              class="login-button"
            >
              Send Magic Link
            </button>
          </form>

          <div class="login-footer">
            <p class="login-footer-text">
              Access is restricted to authorized players
            </p>
          </div>
        </div>

        <div class="login-info">
          <p>Check your email for a magic link to sign in</p>
          <p style="margin-top: 4px;">No password required</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the "check your email" screen
 * @param {string} email - The email address where magic link was sent
 */
export function renderCheckEmailScreen(email) {
  return `
    <div class="login-screen">
      <div class="login-container">
        <div class="login-title">The Wildsea</div>
        <div class="login-subtitle">Character Sheet</div>

        <div class="login-card" style="text-align: center;">
          <div class="check-email-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>

          <h2 class="login-heading">Check Your Email</h2>
          <p class="login-description">
            We sent a magic link to:<br/>
            <span style="color: white; font-weight: 500;">${email}</span>
          </p>

          <div class="check-email-box">
            <p>
              Click the link in your email to sign in.<br/>
              The link will expire in 1 hour.
            </p>
          </div>

          <button
            data-action="backToLogin"
            class="back-button"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  `;
}
