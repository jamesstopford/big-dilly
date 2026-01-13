<script>
  import { onMount, onDestroy } from 'svelte';
  import { networkStore, NetworkState, showNetworkBanner } from '../stores/network.js';

  // Subscribe to store for reactive updates
  let state;
  let retryCount;
  let showBanner;

  const unsubscribe = networkStore.subscribe(value => {
    state = value.state;
    retryCount = value.retryCount;
    showBanner = value.showBanner;
  });

  // Initialize network detection on mount
  onMount(() => {
    networkStore.init();
  });

  // Cleanup on destroy
  onDestroy(() => {
    unsubscribe();
  });

  // Get the appropriate message based on state
  $: message = getStatusMessage(state, retryCount);
  $: isOfflineState = state === NetworkState.OFFLINE;
  $: isReconnectingState = state === NetworkState.RECONNECTING;
  $: isOnlineState = state === NetworkState.ONLINE;

  function getStatusMessage(currentState, currentRetryCount) {
    switch (currentState) {
      case NetworkState.OFFLINE:
        return 'Connection lost. Check your internet connection.';
      case NetworkState.RECONNECTING:
        return currentRetryCount > 0
          ? `Reconnecting... (attempt ${currentRetryCount})`
          : 'Reconnecting...';
      case NetworkState.ONLINE:
        return 'Connection restored!';
      default:
        return '';
    }
  }

  function handleDismiss() {
    networkStore.dismissBanner();
  }
</script>

{#if showBanner}
  <div
    class="network-status-banner"
    class:offline={isOfflineState}
    class:reconnecting={isReconnectingState}
    class:online={isOnlineState}
    role="alert"
    aria-live="polite"
  >
    <div class="network-status-content">
      <span class="network-status-icon">
        {#if isOfflineState}
          <!-- Offline icon -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
          </svg>
        {:else if isReconnectingState}
          <!-- Reconnecting spinner -->
          <svg class="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
        {:else}
          <!-- Online checkmark -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        {/if}
      </span>
      <span class="network-status-message">{message}</span>
    </div>

    {#if isOnlineState}
      <button
        type="button"
        class="network-status-dismiss"
        on:click={handleDismiss}
        aria-label="Dismiss notification"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    {/if}
  </div>
{/if}

<style>
  .network-status-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    animation: slideDown 0.3s ease-out;
    box-shadow: var(--shadow-md);
  }

  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .network-status-banner.offline {
    background-color: var(--danger);
    color: white;
  }

  .network-status-banner.reconnecting {
    background-color: var(--warning);
    color: #1a1a1a;
  }

  .network-status-banner.online {
    background-color: var(--success);
    color: white;
  }

  .network-status-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .network-status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .network-status-icon svg {
    display: block;
  }

  .spinner-icon {
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

  .network-status-message {
    flex: 1;
  }

  .network-status-dismiss {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 0.25rem;
    margin: -0.25rem;
    margin-left: 0.5rem;
    cursor: pointer;
    color: inherit;
    opacity: 0.8;
    transition: opacity 0.2s ease;
    min-width: 44px;
    min-height: 44px;
  }

  .network-status-dismiss:hover {
    opacity: 1;
  }

  .network-status-dismiss:focus {
    outline: 2px solid currentColor;
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* Ensure the banner doesn't interfere with mobile viewport */
  @media (max-width: 480px) {
    .network-status-banner {
      padding: 0.625rem 0.75rem;
      font-size: 0.8125rem;
    }
  }

  /* Cyber-neon theme specific styles */
  :global([data-theme="cyber-neon"]) .network-status-banner.offline {
    box-shadow: var(--glow-danger);
  }

  :global([data-theme="cyber-neon"]) .network-status-banner.online {
    box-shadow: var(--glow-success);
  }

  :global([data-theme="cyber-neon"]) .network-status-banner.reconnecting {
    box-shadow: 0 0 10px var(--warning), 0 0 20px rgba(255, 170, 0, 0.3);
  }
</style>
