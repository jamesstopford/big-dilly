<script>
  import { auth, currentUser } from '../stores/auth.js';
  import { theme, THEMES } from '../stores/theme.js';
  import { syncStore } from '../stores/sync.js';
  import ThemeToggle from './ThemeToggle.svelte';
  import SyncIndicator from './SyncIndicator.svelte';

  async function handleLogout() {
    // Reset sync store before logout to stop polling
    syncStore.reset();
    await auth.logout();
  }
</script>

<header class="header">
  <div class="container header-content">
    <div class="header-left">
      <h1 class="logo">Big-Dilly</h1>
    </div>

    <div class="header-right">
      <SyncIndicator />

      <div class="header-divider"></div>

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
    padding: 0.625rem 1rem;
    min-height: 44px;
  }

  .header-divider {
    width: 1px;
    height: 24px;
    background-color: var(--border);
  }
</style>
