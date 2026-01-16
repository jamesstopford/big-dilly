<script>
  import { onMount, onDestroy } from 'svelte';
  import { auth, currentUser } from '../stores/auth.js';
  import { theme, THEMES } from '../stores/theme.js';
  import { syncStore } from '../stores/sync.js';
  import Header from '../components/Header.svelte';
  import TodoList from '../components/TodoList.svelte';
  import TrackerList from '../components/TrackerList.svelte';

  /**
   * Initialize sync when the main app mounts
   * FR-6.1, FR-6.2: Automatic polling for cross-device sync
   */
  onMount(() => {
    // Initialize sync store - this starts polling and performs initial sync
    syncStore.init();
  });

  /**
   * Clean up sync store when app unmounts
   */
  onDestroy(() => {
    syncStore.destroy();
  });
</script>

<div class="app-layout">
  <Header />

  <main class="main-content">
    <div class="container">
      <div class="panels">
        <!-- Todo Panel -->
        <section class="panel">
          <TodoList />
        </section>

        <!-- TimeSince Panel -->
        <section class="panel">
          <TrackerList />
        </section>
      </div>
    </div>
  </main>

  <footer class="app-footer">
    <p>Deployed via GitHub Actions CI/CD Pipeline</p>
  </footer>
</div>

<style>
  .app-footer {
    text-align: center;
    padding: 1rem;
    color: var(--text-secondary);
    font-size: 0.75rem;
    border-top: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
  }
  .app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--bg-primary);
  }

  .main-content {
    flex: 1;
    padding: 1.5rem 0;
  }

  .panels {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 768px) {
    .panels {
      grid-template-columns: 1fr 1fr;
    }
  }

  .panel {
    background-color: var(--bg-secondary);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    box-shadow: var(--shadow-md);
  }
</style>
