<script>
  import { auth, currentUser } from '../stores/auth.js';
  import { theme, THEMES } from '../stores/theme.js';
  import Header from '../components/Header.svelte';
  import TodoList from '../components/TodoList.svelte';
  import TrackerList from '../components/TrackerList.svelte';
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
</div>

<style>
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
