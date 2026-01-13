<script>
  import { auth, currentUser } from '../stores/auth.js';
  import { theme, THEMES } from '../stores/theme.js';
  import Header from '../components/Header.svelte';

  // Placeholder content - will be replaced with Todo and TimeSince components in later phases
</script>

<div class="app-layout">
  <Header />

  <main class="main-content">
    <div class="container">
      <div class="panels">
        <!-- Todo Panel Placeholder -->
        <section class="panel">
          <div class="panel-header">
            <h2>Todos</h2>
            <span class="count">0/20</span>
          </div>
          <div class="panel-content">
            <p class="placeholder-text">Todo functionality coming in Phase 2</p>
          </div>
        </section>

        <!-- TimeSince Panel Placeholder -->
        <section class="panel">
          <div class="panel-header">
            <h2>TimeSince</h2>
            <span class="count">0/20</span>
          </div>
          <div class="panel-content">
            <p class="placeholder-text">TimeSince functionality coming in Phase 3</p>
          </div>
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

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }

  .panel-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .count {
    font-size: 0.875rem;
    color: var(--text-secondary);
    background-color: var(--bg-tertiary);
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-md);
  }

  .panel-content {
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .placeholder-text {
    color: var(--text-muted);
    font-style: italic;
  }
</style>
