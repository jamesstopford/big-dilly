import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';

/**
 * Tests for Data Synchronization (FR-6)
 *
 * FR-6.1: Changes made on one device should appear on other devices without manual refresh
 * FR-6.2: Implement automatic polling mechanism to check for server-side updates
 * FR-6.3: Polling interval should be configurable (default: 30 seconds)
 * FR-6.4: Visual indicator when data is being synced or when new data is detected
 * FR-6.5: Manual refresh button available for users who want immediate sync
 * FR-6.6: Graceful handling of sync conflicts (last-write-wins acceptable for P1)
 */

// Import the sync store and related items
import {
  syncStore,
  SyncState,
  isSyncing,
  isSynced,
  syncError,
  lastSyncTime,
  isPollingActive,
  formatLastSyncTime
} from '../src/client/stores/sync.js';
import { todosStore } from '../src/client/stores/todos.js';
import { trackersStore } from '../src/client/stores/trackers.js';

describe('Sync Store - FR-6: Data Synchronization', () => {
  beforeEach(() => {
    // Reset the sync store before each test
    syncStore.reset();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    syncStore.destroy();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = get(syncStore);

      expect(state.state).toBe(SyncState.IDLE);
      expect(state.lastSyncTime).toBeNull();
      expect(state.error).toBeNull();
      expect(state.pollingInterval).toBe(30000); // Default 30 seconds
      expect(state.isPollingActive).toBe(false);
      expect(state.syncCount).toBe(0);
    });

    it('should have correct derived stores initial values', () => {
      expect(get(isSyncing)).toBe(false);
      expect(get(isSynced)).toBe(false);
      expect(get(syncError)).toBeNull();
      expect(get(lastSyncTime)).toBeNull();
      expect(get(isPollingActive)).toBe(false);
    });
  });

  describe('FR-6.2: Automatic Polling Mechanism', () => {
    it('should start polling when initialized', async () => {
      // Mock the store load functions
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.init();

      const state = get(syncStore);
      expect(state.isPollingActive).toBe(true);
    });

    it('should call load on both stores when syncing', async () => {
      const todosLoadSpy = vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      const trackersLoadSpy = vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.init();

      expect(todosLoadSpy).toHaveBeenCalled();
      expect(trackersLoadSpy).toHaveBeenCalled();
    });

    it('should update lastSyncTime after successful sync', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.init();

      const state = get(syncStore);
      expect(state.lastSyncTime).not.toBeNull();
    });

    it('should increment syncCount on each sync', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.init();
      const stateAfterInit = get(syncStore);
      expect(stateAfterInit.syncCount).toBe(1);

      await syncStore.refresh();
      const stateAfterRefresh = get(syncStore);
      expect(stateAfterRefresh.syncCount).toBe(2);
    });
  });

  describe('FR-6.3: Configurable Polling Interval', () => {
    it('should have default polling interval of 30 seconds', () => {
      const state = get(syncStore);
      expect(state.pollingInterval).toBe(30000);
    });

    it('should allow setting custom polling interval', () => {
      syncStore.setPollingInterval(60000);

      const state = get(syncStore);
      expect(state.pollingInterval).toBe(60000);
    });

    it('should clamp polling interval to minimum of 5 seconds', () => {
      syncStore.setPollingInterval(1000); // Try to set 1 second

      const state = get(syncStore);
      expect(state.pollingInterval).toBe(5000); // Should be clamped to 5 seconds
    });

    it('should clamp polling interval to maximum of 5 minutes', () => {
      syncStore.setPollingInterval(600000); // Try to set 10 minutes

      const state = get(syncStore);
      expect(state.pollingInterval).toBe(300000); // Should be clamped to 5 minutes
    });
  });

  describe('FR-6.4: Visual Indicator for Sync State', () => {
    it('should set state to SYNCING during sync operation', async () => {
      let resolveTodos;
      const todosPromise = new Promise(resolve => { resolveTodos = resolve; });
      vi.spyOn(todosStore, 'load').mockReturnValue(todosPromise);
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      const syncPromise = syncStore.refresh();

      // Check state is SYNCING while in progress
      const stateWhileSyncing = get(syncStore);
      expect(stateWhileSyncing.state).toBe(SyncState.SYNCING);
      expect(get(isSyncing)).toBe(true);

      // Resolve and complete
      resolveTodos({ success: true });
      await syncPromise;
    });

    it('should set state to SYNCED after successful sync', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.refresh();

      const state = get(syncStore);
      expect(state.state).toBe(SyncState.SYNCED);
      expect(get(isSynced)).toBe(true);
    });

    it('should set state to ERROR on sync failure', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: false, error: 'Network error' });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.refresh();

      const state = get(syncStore);
      expect(state.state).toBe(SyncState.ERROR);
      expect(state.error).toBe('Network error');
      expect(get(syncError)).toBe('Network error');
    });

    it('should return to IDLE state after synced feedback duration', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.refresh();

      expect(get(syncStore).state).toBe(SyncState.SYNCED);

      // Fast forward past the feedback duration (2 seconds)
      vi.advanceTimersByTime(2500);

      expect(get(syncStore).state).toBe(SyncState.IDLE);
    });
  });

  describe('FR-6.5: Manual Refresh', () => {
    it('should provide a refresh method for manual sync', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      const result = await syncStore.refresh();

      expect(result.success).toBe(true);
    });

    it('should show syncing indicator during manual refresh', async () => {
      let resolveTodos;
      const todosPromise = new Promise(resolve => { resolveTodos = resolve; });
      vi.spyOn(todosStore, 'load').mockReturnValue(todosPromise);
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      const refreshPromise = syncStore.refresh();

      // Should show syncing during manual refresh
      expect(get(isSyncing)).toBe(true);

      resolveTodos({ success: true });
      await refreshPromise;
    });

    it('should return success status from refresh', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      const result = await syncStore.refresh();

      expect(result).toHaveProperty('success', true);
    });
  });

  describe('FR-6.6: Sync Conflict Handling (Last-Write-Wins)', () => {
    it('should fetch latest server data on sync (implementing last-write-wins)', async () => {
      const todosLoadSpy = vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      const trackersLoadSpy = vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.refresh();

      // The sync fetches server data, which represents "last-write-wins"
      // because the server has the authoritative state from all devices
      expect(todosLoadSpy).toHaveBeenCalled();
      expect(trackersLoadSpy).toHaveBeenCalled();
    });

    it('should handle errors gracefully without crashing', async () => {
      vi.spyOn(todosStore, 'load').mockRejectedValue(new Error('Network failure'));
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      // Should not throw
      const result = await syncStore.refresh();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network failure');
      expect(get(syncStore).state).toBe(SyncState.ERROR);
    });
  });

  describe('Polling Control', () => {
    it('should be able to pause polling', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.init();
      expect(get(isPollingActive)).toBe(true);

      syncStore.pausePolling();
      expect(get(isPollingActive)).toBe(false);
    });

    it('should be able to resume polling', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.init();
      syncStore.pausePolling();
      expect(get(isPollingActive)).toBe(false);

      syncStore.resumePolling();
      expect(get(isPollingActive)).toBe(true);
    });
  });

  describe('Reset', () => {
    it('should reset all state on reset()', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: true });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.init();

      // Should have some state set
      expect(get(syncStore).isPollingActive).toBe(true);
      expect(get(syncStore).syncCount).toBeGreaterThan(0);

      syncStore.reset();

      const state = get(syncStore);
      expect(state.state).toBe(SyncState.IDLE);
      expect(state.lastSyncTime).toBeNull();
      expect(state.isPollingActive).toBe(false);
      expect(state.syncCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should provide clearError method', async () => {
      vi.spyOn(todosStore, 'load').mockResolvedValue({ success: false, error: 'Test error' });
      vi.spyOn(trackersStore, 'load').mockResolvedValue({ success: true });

      await syncStore.refresh();

      expect(get(syncStore).error).toBe('Test error');

      syncStore.clearError();

      expect(get(syncStore).error).toBeNull();
      expect(get(syncStore).state).toBe(SyncState.IDLE);
    });
  });
});

describe('formatLastSyncTime utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "Never" for null input', () => {
    expect(formatLastSyncTime(null)).toBe('Never');
  });

  it('should return "Never" for undefined input', () => {
    expect(formatLastSyncTime(undefined)).toBe('Never');
  });

  it('should return "Just now" for times less than 5 seconds ago', () => {
    const threeSecondsAgo = new Date(Date.now() - 3000).toISOString();
    expect(formatLastSyncTime(threeSecondsAgo)).toBe('Just now');
  });

  it('should return seconds ago for times less than 1 minute ago', () => {
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    expect(formatLastSyncTime(thirtySecondsAgo)).toBe('30s ago');
  });

  it('should return minutes ago for times less than 1 hour ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatLastSyncTime(fiveMinutesAgo)).toBe('5m ago');
  });

  it('should return hours ago for times less than 1 day ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatLastSyncTime(twoHoursAgo)).toBe('2h ago');
  });

  it('should return formatted date for times more than 1 day ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatLastSyncTime(twoDaysAgo);
    // Should be a date string, not a relative time
    expect(result).not.toContain('ago');
  });
});
