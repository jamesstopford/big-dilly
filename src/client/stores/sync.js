import { writable, derived, get } from 'svelte/store';
import { todosStore } from './todos.js';
import { trackersStore } from './trackers.js';
import { isOnline } from './network.js';

/**
 * Check if we're in a browser environment
 */
function isBrowser() {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

/**
 * Check if the browser is online
 * Returns true if not in a browser (for SSR/testing compatibility)
 */
function checkOnline() {
  if (!isBrowser()) return true;
  // Use the network store's isOnline derived store
  return get(isOnline);
}

/**
 * Sync states for visual feedback
 */
export const SyncState = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  ERROR: 'error'
};

/**
 * Default sync configuration
 * FR-6.3: Polling interval should be configurable (default: 30 seconds)
 */
const DEFAULT_SYNC_CONFIG = {
  pollingInterval: 30000, // 30 seconds default
  minPollingInterval: 5000, // Minimum 5 seconds
  maxPollingInterval: 300000, // Maximum 5 minutes
  syncedFeedbackDuration: 2000 // How long to show "synced" indicator
};

/**
 * Create the sync store for managing cross-device data synchronization
 *
 * FR-6.1: Changes made on one device should appear on other devices without manual refresh
 * FR-6.2: Implement automatic polling mechanism to check for server-side updates
 * FR-6.4: Visual indicator when data is being synced or when new data is detected [P2]
 * FR-6.5: Manual refresh button available for users who want immediate sync
 * FR-6.6: Graceful handling of sync conflicts (last-write-wins acceptable for P1)
 */
function createSyncStore() {
  const { subscribe, set, update } = writable({
    state: SyncState.IDLE,
    lastSyncTime: null,
    lastTodosHash: null,
    lastTrackersHash: null,
    error: null,
    pollingInterval: DEFAULT_SYNC_CONFIG.pollingInterval,
    isPollingActive: false,
    syncCount: 0 // Track number of syncs for debugging
  });

  let pollingTimeoutId = null;
  let syncedFeedbackTimeoutId = null;
  let isDestroyed = false;

  /**
   * Generate a simple hash of data for change detection
   * This helps minimize unnecessary re-renders (per spec implementation notes)
   * Using JSON stringify as a simple comparison mechanism
   */
  function hashData(data) {
    if (!data || !Array.isArray(data)) return null;
    // Create a deterministic string representation
    return JSON.stringify(data.map(item => ({
      id: item.id,
      // For todos: include text, completed, sort_order
      // For trackers: include name, icon, last_reset
      ...(item.text !== undefined && { text: item.text }),
      ...(item.completed !== undefined && { completed: item.completed }),
      ...(item.sort_order !== undefined && { sort_order: item.sort_order }),
      ...(item.name !== undefined && { name: item.name }),
      ...(item.icon !== undefined && { icon: item.icon }),
      ...(item.last_reset !== undefined && { last_reset: item.last_reset })
    })));
  }

  /**
   * Clear synced feedback after a delay
   */
  function clearSyncedFeedback() {
    if (syncedFeedbackTimeoutId) {
      clearTimeout(syncedFeedbackTimeoutId);
    }
    syncedFeedbackTimeoutId = setTimeout(() => {
      update(state => {
        if (state.state === SyncState.SYNCED) {
          return { ...state, state: SyncState.IDLE };
        }
        return state;
      });
    }, DEFAULT_SYNC_CONFIG.syncedFeedbackDuration);
  }

  /**
   * Perform a sync operation - fetches latest data from server
   * FR-6.6: Last-write-wins conflict handling - server data always wins on refresh
   * This is acceptable for P1 as the most recent write to the server is preserved
   */
  async function performSync(options = {}) {
    const { silent = false, force = false } = options;

    // Don't sync if offline (skip this check in non-browser environments for testing)
    if (!checkOnline()) {
      console.log('[Sync] Skipping sync - offline');
      return { success: false, reason: 'offline' };
    }

    // Update state to syncing (unless silent)
    if (!silent) {
      update(state => ({ ...state, state: SyncState.SYNCING, error: null }));
    }

    try {
      // Fetch both todos and trackers in parallel for efficiency
      const [todosResult, trackersResult] = await Promise.all([
        todosStore.load(),
        trackersStore.load()
      ]);

      if (!todosResult.success || !trackersResult.success) {
        const errorMsg = todosResult.error || trackersResult.error || 'Sync failed';
        update(state => ({
          ...state,
          state: SyncState.ERROR,
          error: errorMsg
        }));
        return { success: false, error: errorMsg };
      }

      // Get current store values to compute hashes
      const todosState = get(todosStore);
      const trackersState = get(trackersStore);

      const newTodosHash = hashData(todosState.items);
      const newTrackersHash = hashData(trackersState.items);

      // Check if data actually changed (for logging/debugging purposes)
      const currentState = get({ subscribe });
      const todosChanged = currentState.lastTodosHash !== newTodosHash;
      const trackersChanged = currentState.lastTrackersHash !== newTrackersHash;

      if (todosChanged || trackersChanged) {
        console.log('[Sync] Data changed:', { todosChanged, trackersChanged });
      }

      // Update state with new hashes and sync time
      update(state => ({
        ...state,
        state: silent ? state.state : SyncState.SYNCED,
        lastSyncTime: new Date().toISOString(),
        lastTodosHash: newTodosHash,
        lastTrackersHash: newTrackersHash,
        error: null,
        syncCount: state.syncCount + 1
      }));

      // Clear synced feedback after delay (unless silent)
      if (!silent) {
        clearSyncedFeedback();
      }

      return { success: true, todosChanged, trackersChanged };

    } catch (error) {
      console.error('[Sync] Error during sync:', error);
      update(state => ({
        ...state,
        state: SyncState.ERROR,
        error: error.message || 'Sync failed'
      }));
      return { success: false, error: error.message };
    }
  }

  /**
   * Start the polling interval for automatic sync
   * FR-6.2: Implement automatic polling mechanism
   */
  function startPolling() {
    if (isDestroyed) return;

    update(state => ({ ...state, isPollingActive: true }));

    const scheduleNextPoll = () => {
      if (isDestroyed) return;

      const currentState = get({ subscribe });
      if (!currentState.isPollingActive) return;

      pollingTimeoutId = setTimeout(async () => {
        if (isDestroyed || !get({ subscribe }).isPollingActive) return;

        // Perform silent sync (don't show syncing indicator for background polls)
        await performSync({ silent: true });

        // Schedule next poll
        scheduleNextPoll();
      }, currentState.pollingInterval);
    };

    scheduleNextPoll();
    console.log('[Sync] Polling started with interval:', get({ subscribe }).pollingInterval);
  }

  /**
   * Stop the polling interval
   */
  function stopPolling() {
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId);
      pollingTimeoutId = null;
    }
    update(state => ({ ...state, isPollingActive: false }));
    console.log('[Sync] Polling stopped');
  }

  /**
   * Handle visibility change - sync when tab becomes active
   * Per spec: "When app regains focus (tab becomes active), trigger an immediate sync"
   */
  function handleVisibilityChange() {
    if (isDestroyed) return;

    if (document.visibilityState === 'visible') {
      console.log('[Sync] Tab became visible - triggering immediate sync');
      // Perform silent sync to avoid UI flickering on tab switches
      performSync({ silent: true });
    }
  }

  /**
   * Handle window focus - additional focus detection
   */
  function handleWindowFocus() {
    if (isDestroyed) return;

    console.log('[Sync] Window gained focus - triggering sync');
    // Perform silent sync to avoid UI flickering on window focus
    performSync({ silent: true });
  }

  // Set up visibility and focus listeners
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleWindowFocus);
  }

  return {
    subscribe,

    /**
     * Initialize sync - should be called when user is authenticated
     * Performs initial sync and starts polling
     */
    async init() {
      console.log('[Sync] Initializing...');
      isDestroyed = false;

      // Perform initial sync
      await performSync();

      // Start polling
      startPolling();
    },

    /**
     * Manual refresh - FR-6.5: Manual refresh button available
     * Always shows syncing indicator
     */
    async refresh() {
      console.log('[Sync] Manual refresh triggered');
      return performSync({ silent: false, force: true });
    },

    /**
     * Set polling interval - FR-6.3: Polling interval should be configurable
     */
    setPollingInterval(intervalMs) {
      const clampedInterval = Math.max(
        DEFAULT_SYNC_CONFIG.minPollingInterval,
        Math.min(DEFAULT_SYNC_CONFIG.maxPollingInterval, intervalMs)
      );

      update(state => ({ ...state, pollingInterval: clampedInterval }));

      // Restart polling with new interval if currently active
      const currentState = get({ subscribe });
      if (currentState.isPollingActive) {
        stopPolling();
        startPolling();
      }

      console.log('[Sync] Polling interval set to:', clampedInterval);
    },

    /**
     * Pause polling (e.g., when user is actively editing)
     */
    pausePolling() {
      stopPolling();
    },

    /**
     * Resume polling
     */
    resumePolling() {
      const currentState = get({ subscribe });
      if (!currentState.isPollingActive) {
        startPolling();
      }
    },

    /**
     * Clear any error state
     */
    clearError() {
      update(state => ({ ...state, error: null, state: SyncState.IDLE }));
    },

    /**
     * Reset the sync store - call on logout
     */
    reset() {
      stopPolling();
      if (syncedFeedbackTimeoutId) {
        clearTimeout(syncedFeedbackTimeoutId);
        syncedFeedbackTimeoutId = null;
      }
      set({
        state: SyncState.IDLE,
        lastSyncTime: null,
        lastTodosHash: null,
        lastTrackersHash: null,
        error: null,
        pollingInterval: DEFAULT_SYNC_CONFIG.pollingInterval,
        isPollingActive: false,
        syncCount: 0
      });
      console.log('[Sync] Store reset');
    },

    /**
     * Cleanup - call when component/app is destroyed
     */
    destroy() {
      isDestroyed = true;
      stopPolling();
      if (syncedFeedbackTimeoutId) {
        clearTimeout(syncedFeedbackTimeoutId);
        syncedFeedbackTimeoutId = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleWindowFocus);
      }
      console.log('[Sync] Store destroyed');
    }
  };
}

export const syncStore = createSyncStore();

// Derived stores for easy access in components
export const isSyncing = derived(syncStore, $sync => $sync.state === SyncState.SYNCING);
export const isSynced = derived(syncStore, $sync => $sync.state === SyncState.SYNCED);
export const syncError = derived(syncStore, $sync => $sync.error);
export const lastSyncTime = derived(syncStore, $sync => $sync.lastSyncTime);
export const isPollingActive = derived(syncStore, $sync => $sync.isPollingActive);

/**
 * Format the last sync time for display
 */
export function formatLastSyncTime(isoString) {
  if (!isoString) return 'Never';

  const syncDate = new Date(isoString);
  const now = new Date();
  const diffMs = now - syncDate;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 5) return 'Just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return syncDate.toLocaleDateString();
}

export default syncStore;
