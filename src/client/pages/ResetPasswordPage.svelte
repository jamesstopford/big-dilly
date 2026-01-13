<script>
  import { auth as authApi } from '../api.js';
  import { router, queryParams } from '../stores/router.js';

  let password = '';
  let confirmPassword = '';
  let error = '';
  let success = '';
  let loading = false;

  // Get token from query params
  $: token = $queryParams.token || '';

  async function handleSubmit(e) {
    e.preventDefault();
    error = '';
    success = '';

    // Validate passwords match
    if (password !== confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    // Validate password length
    if (password.length < 8) {
      error = 'Password must be at least 8 characters';
      return;
    }

    if (!token) {
      error = 'Invalid reset token. Please request a new password reset.';
      return;
    }

    loading = true;

    try {
      const result = await authApi.resetPassword(token, password);
      success = result.message || 'Password reset successfully!';
      // Redirect to login after short delay
      setTimeout(() => {
        router.navigate('/login');
      }, 2000);
    } catch (err) {
      error = err.message || 'Failed to reset password';
    } finally {
      loading = false;
    }
  }

  function goToLogin() {
    router.navigate('/login');
  }

  function goToForgotPassword() {
    router.navigate('/forgot-password');
  }
</script>

<div class="auth-page">
  <div class="auth-container">
    <div class="auth-header">
      <h1 class="logo">Big-Dilly</h1>
      <p class="tagline">Your productivity companion</p>
    </div>

    <div class="card auth-card">
      <h2>Set new password</h2>

      {#if !token}
        <div class="alert alert-error">
          Invalid or missing reset token.
          <button type="button" class="link-button" on:click={goToForgotPassword}>
            Request a new one
          </button>
        </div>
      {:else}
        {#if error}
          <div class="alert alert-error">{error}</div>
        {/if}

        {#if success}
          <div class="alert alert-success">
            {success}
            <br />
            <small>Redirecting to login...</small>
          </div>
        {:else}
          <form on:submit={handleSubmit}>
            <div class="form-group">
              <label class="form-label" for="password">New Password</label>
              <input
                type="password"
                id="password"
                class="form-input"
                bind:value={password}
                placeholder="At least 8 characters"
                required
                minlength="8"
                disabled={loading}
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                class="form-input"
                bind:value={confirmPassword}
                placeholder="Confirm your new password"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" class="btn btn-primary btn-full" disabled={loading}>
              {#if loading}
                <span class="spinner"></span>
              {:else}
                Reset Password
              {/if}
            </button>
          </form>
        {/if}
      {/if}
    </div>

    <div class="auth-footer">
      <p>
        Remember your password?
        <button type="button" class="link-button" on:click={goToLogin}>
          Log in
        </button>
      </p>
    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background-color: var(--bg-primary);
  }

  .auth-container {
    width: 100%;
    max-width: 400px;
  }

  .auth-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .logo {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 0.5rem;
  }

  .tagline {
    color: var(--text-secondary);
  }

  .auth-card {
    padding: 2rem;
  }

  .auth-card h2 {
    margin-bottom: 1.5rem;
    text-align: center;
    color: var(--text-primary);
  }

  .link-button {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    font-size: inherit;
    padding: 0.5rem;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .link-button:hover {
    text-decoration: underline;
    color: var(--accent-hover);
  }

  .auth-footer {
    margin-top: 1.5rem;
    text-align: center;
    color: var(--text-secondary);
  }

  .btn .spinner {
    width: 1rem;
    height: 1rem;
    border-width: 2px;
    border-top-color: white;
  }
</style>
