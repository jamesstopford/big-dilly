import { writable, derived } from 'svelte/store';

/**
 * Network connection states
 */
export const NetworkState = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  RECONNECTING: 'reconnecting'
};

/**
 * Network status store - tracks online/offline state and manages connectivity events
 */
function createNetworkStore() {
  const { subscribe, set, update } = writable({
    state: typeof navigator !== 'undefined' && navigator.onLine ? NetworkState.ONLINE : NetworkState.OFFLINE,
    lastOnline: Date.now(),
    lastOffline: null,
    retryCount: 0,
    showBanner: false
  });

  let bannerTimeout = null;
  let reconnectingTimeout = null;

  /**
   * Show the banner and auto-hide after delay if online
   */
  function showBannerTemporarily(duration = 3000) {
    if (bannerTimeout) clearTimeout(bannerTimeout);

    update(state => ({ ...state, showBanner: true }));

    bannerTimeout = setTimeout(() => {
      update(state => {
        // Only auto-hide if we're online
        if (state.state === NetworkState.ONLINE) {
          return { ...state, showBanner: false };
        }
        return state;
      });
    }, duration);
  }

  /**
   * Handle browser going online
   */
  function handleOnline() {
    if (reconnectingTimeout) clearTimeout(reconnectingTimeout);

    update(state => ({
      ...state,
      state: NetworkState.ONLINE,
      lastOnline: Date.now(),
      retryCount: 0
    }));

    // Show "Connection restored" banner briefly
    showBannerTemporarily(3000);
  }

  /**
   * Handle browser going offline
   */
  function handleOffline() {
    update(state => ({
      ...state,
      state: NetworkState.OFFLINE,
      lastOffline: Date.now(),
      showBanner: true // Always show when offline
    }));
  }

  // Set up event listeners if in browser environment
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  return {
    subscribe,

    /**
     * Initialize the store (call on mount)
     */
    init() {
      // Check initial state
      if (typeof navigator !== 'undefined') {
        const isOnline = navigator.onLine;
        update(state => ({
          ...state,
          state: isOnline ? NetworkState.ONLINE : NetworkState.OFFLINE,
          showBanner: !isOnline
        }));
      }
    },

    /**
     * Set state to reconnecting (during retry attempts)
     */
    setReconnecting() {
      update(state => ({
        ...state,
        state: NetworkState.RECONNECTING,
        showBanner: true
      }));
    },

    /**
     * Increment retry count
     */
    incrementRetry() {
      update(state => ({
        ...state,
        retryCount: state.retryCount + 1
      }));
    },

    /**
     * Reset retry count (after successful request)
     */
    resetRetries() {
      update(state => ({
        ...state,
        retryCount: 0
      }));
    },

    /**
     * Mark as online (e.g., after successful API call)
     */
    markOnline() {
      update(state => {
        if (state.state !== NetworkState.ONLINE) {
          // Was offline, now online - show restoration message briefly
          showBannerTemporarily(3000);
          return {
            ...state,
            state: NetworkState.ONLINE,
            lastOnline: Date.now(),
            retryCount: 0
          };
        }
        return state;
      });
    },

    /**
     * Mark as offline (e.g., after failed API call)
     */
    markOffline() {
      update(state => ({
        ...state,
        state: NetworkState.OFFLINE,
        lastOffline: Date.now(),
        showBanner: true
      }));
    },

    /**
     * Dismiss the banner manually
     */
    dismissBanner() {
      if (bannerTimeout) clearTimeout(bannerTimeout);
      update(state => ({ ...state, showBanner: false }));
    },

    /**
     * Clean up event listeners (call on destroy)
     */
    destroy() {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      if (bannerTimeout) clearTimeout(bannerTimeout);
      if (reconnectingTimeout) clearTimeout(reconnectingTimeout);
    }
  };
}

export const networkStore = createNetworkStore();

// Derived stores for easy access
export const isOnline = derived(networkStore, $network => $network.state === NetworkState.ONLINE);
export const isOffline = derived(networkStore, $network => $network.state === NetworkState.OFFLINE);
export const isReconnecting = derived(networkStore, $network => $network.state === NetworkState.RECONNECTING);
export const showNetworkBanner = derived(networkStore, $network => $network.showBanner);

export default networkStore;
