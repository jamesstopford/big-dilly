<script>
  /**
   * SyncIndicator Component
   *
   * FR-6.4: Visual indicator when data is being synced or when new data is detected
   * FR-6.5: Manual refresh button available for users who want immediate sync
   *
   * Displays:
   * - Current sync state (syncing spinner, synced checkmark, or error)
   * - Last sync time
   * - Manual refresh button
   */

  import { onDestroy } from 'svelte';
  import {
    syncStore,
    SyncState,
    isSyncing,
    isSynced,
    syncError,
    lastSyncTime,
    formatLastSyncTime
  } from '../stores/sync.js';

  // Update formatted time periodically
  let formattedTime = 'Never';
  let timeUpdateInterval;

  // Subscribe to lastSyncTime and update formatted string
  const unsubscribe = lastSyncTime.subscribe(time => {
    formattedTime = formatLastSyncTime(time);
  });

  // Update formatted time every 10 seconds for "Xs ago" display
  if (typeof window !== 'undefined') {
    timeUpdateInterval = setInterval(() => {
      let currentTime;
      const unsub = lastSyncTime.subscribe(t => currentTime = t);
      unsub();
      formattedTime = formatLastSyncTime(currentTime);
    }, 10000);
  }

  onDestroy(() => {
    unsubscribe();
    if (timeUpdateInterval) {
      clearInterval(timeUpdateInterval);
    }
  });

  /**
   * Handle manual refresh click
   */
  async function handleRefresh() {
    await syncStore.refresh();
  }

  // Reactive state from store
  $: currentState = $syncStore.state;
  $: showSyncing = currentState === SyncState.SYNCING;
  $: showSynced = currentState === SyncState.SYNCED;
  $: showError = currentState === SyncState.ERROR;
</script>

<div class="sync-indicator" class:syncing={showSyncing} class:synced={showSynced} class:error={showError}>
  <!-- Manual Refresh Button -->
  <button
    class="refresh-btn"
    on:click={handleRefresh}
    disabled={showSyncing}
    title="Refresh data from server"
    aria-label="Refresh data"
  >
    <svg
      class="refresh-icon"
      class:spinning={showSyncing}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M23 4v6h-6"></path>
      <path d="M1 20v-6h6"></path>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  </button>

  <!-- Status indicator -->
  <div class="sync-status">
    {#if showSyncing}
      <span class="status-text syncing-text">Syncing...</span>
    {:else if showSynced}
      <span class="status-text synced-text">
        <svg class="check-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Synced
      </span>
    {:else if showError}
      <span class="status-text error-text" title={$syncError}>Sync failed</span>
    {:else}
      <span class="status-text idle-text">{formattedTime}</span>
    {/if}
  </div>
</div>

<style>
  .sync-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    min-height: 36px;
    padding: 0;
    border: none;
    border-radius: var(--radius-md, 6px);
    background-color: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .refresh-btn:hover:not(:disabled) {
    background-color: var(--bg-primary);
    color: var(--accent);
  }

  .refresh-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .refresh-btn:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--accent);
  }

  .refresh-icon {
    transition: transform 0.3s ease;
  }

  .refresh-icon.spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .sync-status {
    display: flex;
    align-items: center;
  }

  .status-text {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .idle-text {
    color: var(--text-secondary);
  }

  .syncing-text {
    color: var(--accent);
  }

  .synced-text {
    color: var(--success);
  }

  .error-text {
    color: var(--danger);
    cursor: help;
  }

  .check-icon {
    color: var(--success);
  }

  /* Synced state fade animation */
  .synced .synced-text {
    animation: fadeInOut 2s ease;
  }

  @keyframes fadeInOut {
    0% {
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 0.7;
    }
  }

  /* Responsive: hide status text on very small screens */
  @media (max-width: 400px) {
    .status-text {
      display: none;
    }
  }
</style>
