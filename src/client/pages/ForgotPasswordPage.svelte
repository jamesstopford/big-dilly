<script>
  import { auth as authApi } from '../api.js';
  import { router } from '../stores/router.js';

  let email = '';
  let error = '';
  let success = '';
  let loading = false;

  async function handleSubmit(e) {
    e.preventDefault();
    error = '';
    success = '';
    loading = true;

    try {
      const result = await authApi.forgotPassword(email);
      success = result.message || 'If an account exists with that email, a reset link has been sent.';
      email = '';
    } catch (err) {
      error = err.message || 'Failed to process request';
    } finally {
      loading = false;
    }
  }

  function goToLogin() {
    router.navigate('/login');
  }
</script>

<div class="auth-page">
  <div class="auth-container">
    <div class="auth-header">
      <h1 class="logo">Big-Dilly</h1>
      <p class="tagline">Your productivity companion</p>
    </div>

    <div class="card auth-card">
      <h2>Reset your password</h2>
      <p class="description">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {#if error}
        <div class="alert alert-error">{error}</div>
      {/if}

      {#if success}
        <div class="alert alert-success">{success}</div>
      {/if}

      <form on:submit={handleSubmit}>
        <div class="form-group">
          <label class="form-label" for="email">Email</label>
          <input
            type="email"
            id="email"
            class="form-input"
            bind:value={email}
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" class="btn btn-primary btn-full" disabled={loading}>
          {#if loading}
            <span class="spinner"></span>
          {:else}
            Send Reset Link
          {/if}
        </button>
      </form>
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
    margin-bottom: 0.5rem;
    text-align: center;
    color: var(--text-primary);
  }

  .description {
    text-align: center;
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .link-button {
    background: none;
    border: none;
    color: var(--accent);
    cursor: pointer;
    font-size: inherit;
    padding: 0;
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
