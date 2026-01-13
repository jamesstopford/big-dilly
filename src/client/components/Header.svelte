<script>
  import { auth, currentUser } from '../stores/auth.js';
  import { theme, THEMES } from '../stores/theme.js';
  import ThemeToggle from './ThemeToggle.svelte';

  async function handleLogout() {
    await auth.logout();
  }
</script>

<header class="header">
  <div class="container header-content">
    <div class="header-left">
      <h1 class="logo">Big-Dilly</h1>
    </div>

    <div class="header-right">
      <ThemeToggle />

      <div class="user-info">
        <span class="user-email">{$currentUser?.email || 'User'}</span>
      </div>

      <button class="btn btn-ghost logout-btn" on:click={handleLogout}>
        Logout
      </button>
    </div>
  </div>
</header>

<style>
  .header {
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    padding: 0.75rem 0;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .header-left {
    display: flex;
    align-items: center;
  }

  .logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--accent);
    margin: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-info {
    display: none;
  }

  @media (min-width: 768px) {
    .user-info {
      display: flex;
      align-items: center;
    }
  }

  .user-email {
    color: var(--text-secondary);
    font-size: 0.875rem;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .logout-btn {
    padding: 0.5rem 1rem;
  }
</style>
