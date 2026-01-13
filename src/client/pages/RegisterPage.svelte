<script>
  import { auth } from '../stores/auth.js';
  import { router } from '../stores/router.js';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let loading = false;

  async function handleSubmit(e) {
    e.preventDefault();
    error = '';

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

    loading = true;

    try {
      await auth.register(email, password);
      router.navigate('/');
    } catch (err) {
      error = err.message || 'Failed to create account';
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
      <h2>Create your account</h2>

      {#if error}
        <div class="alert alert-error">{error}</div>
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

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
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
            placeholder="Confirm your password"
            required
            disabled={loading}
          />
        </div>

        <button type="submit" class="btn btn-primary btn-full" disabled={loading}>
          {#if loading}
            <span class="spinner"></span>
          {:else}
            Create Account
          {/if}
        </button>
      </form>
    </div>

    <div class="auth-footer">
      <p>
        Already have an account?
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
