import { writable, derived } from 'svelte/store';
import { trackers as trackersApi } from '../api.js';

/**
 * Maximum number of trackers allowed per user
 */
export const MAX_TRACKERS = 20;

/**
 * Available icons for trackers
 * Organized by category as specified in specs
 */
export const TRACKER_ICONS = [
  // Fitness
  { id: 'running', emoji: '🏃', category: 'Fitness', label: 'Running' },
  { id: 'dumbbell', emoji: '🏋️', category: 'Fitness', label: 'Workout' },
  { id: 'yoga', emoji: '🧘', category: 'Fitness', label: 'Yoga' },
  { id: 'cycling', emoji: '🚴', category: 'Fitness', label: 'Cycling' },
  // Health
  { id: 'water', emoji: '💧', category: 'Health', label: 'Water' },
  { id: 'medicine', emoji: '💊', category: 'Health', label: 'Medicine' },
  { id: 'sleep', emoji: '😴', category: 'Health', label: 'Sleep' },
  { id: 'meditation', emoji: '🧠', category: 'Health', label: 'Meditation' },
  // Productivity
  { id: 'book', emoji: '📚', category: 'Productivity', label: 'Reading' },
  { id: 'code', emoji: '💻', category: 'Productivity', label: 'Coding' },
  { id: 'write', emoji: '✍️', category: 'Productivity', label: 'Writing' },
  { id: 'study', emoji: '📖', category: 'Productivity', label: 'Study' },
  // Self-care
  { id: 'shower', emoji: '🚿', category: 'Self-care', label: 'Shower' },
  { id: 'haircut', emoji: '💇', category: 'Self-care', label: 'Haircut' },
  { id: 'dentist', emoji: '🦷', category: 'Self-care', label: 'Dentist' },
  // Social
  { id: 'call', emoji: '📞', category: 'Social', label: 'Call' },
  { id: 'meetup', emoji: '🤝', category: 'Social', label: 'Meetup' },
  { id: 'date', emoji: '❤️', category: 'Social', label: 'Date' },
  // Misc
  { id: 'laundry', emoji: '👕', category: 'Misc', label: 'Laundry' },
  { id: 'clean', emoji: '🧹', category: 'Misc', label: 'Cleaning' },
  { id: 'plant', emoji: '🌱', category: 'Misc', label: 'Plants' },
  { id: 'pet', emoji: '🐾', category: 'Misc', label: 'Pet care' }
];

/**
 * Get icon object by id
 */
export function getIconById(id) {
  return TRACKER_ICONS.find(icon => icon.id === id) || TRACKER_ICONS[0];
}

/**
 * Format elapsed time from a date string
 * Returns format like "X days, Y hours" or special cases for edge values
 */
export function formatElapsedTime(lastReset) {
  if (!lastReset) return 'Never';

  const resetDate = new Date(lastReset + 'Z'); // Ensure UTC parsing
  const now = new Date();
  const diffMs = now - resetDate;

  // Handle future dates (shouldn't happen but be safe)
  if (diffMs < 0) return 'Just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  // Edge cases
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;

  // Less than 1 day: show hours and minutes
  if (days < 1) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    return `${hours} hour${hours === 1 ? '' : 's'}, ${remainingMinutes} min`;
  }

  // More than 1 year: show years and days
  if (years >= 1) {
    const remainingDays = days % 365;
    if (remainingDays === 0) {
      return `${years} year${years === 1 ? '' : 's'}`;
    }
    return `${years} year${years === 1 ? '' : 's'}, ${remainingDays} day${remainingDays === 1 ? '' : 's'}`;
  }

  // Standard case: days and hours
  const remainingHours = hours % 24;
  if (remainingHours === 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  return `${days} day${days === 1 ? '' : 's'}, ${remainingHours} hour${remainingHours === 1 ? '' : 's'}`;
}

/**
 * Create the trackers store with all CRUD operations
 */
function createTrackersStore() {
  const { subscribe, set, update } = writable({
    items: [],
    loading: false,
    error: null
  });

  return {
    subscribe,

    /**
     * Load all trackers from the server
     */
    async load() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const data = await trackersApi.getAll();
        update(state => ({
          ...state,
          items: data.trackers,
          loading: false
        }));
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error.message || 'Failed to load trackers'
        }));
      }
    },

    /**
     * Create a new tracker
     */
    async create(name, icon) {
      const trimmedName = name.trim();
      if (!trimmedName) return { success: false, error: 'Tracker name is required' };
      if (!icon) return { success: false, error: 'Tracker icon is required' };

      try {
        const data = await trackersApi.create(trimmedName, icon);
        update(state => ({
          ...state,
          items: [...state.items, data.tracker]
        }));
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || 'Failed to create tracker' };
      }
    },

    /**
     * Update a tracker's name and/or icon
     */
    async update(id, updates) {
      const { name, icon } = updates;

      // Optimistic update
      update(state => ({
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, ...updates } : item
        )
      }));

      try {
        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (icon !== undefined) updateData.icon = icon;

        await trackersApi.update(id, updateData);
        return { success: true };
      } catch (error) {
        // Revert on error - reload from server
        this.load();
        return { success: false, error: error.message || 'Failed to update tracker' };
      }
    },

    /**
     * Delete a tracker
     */
    async delete(id) {
      let deletedItem;
      let deletedIndex;

      // Optimistic update
      update(state => {
        deletedIndex = state.items.findIndex(item => item.id === id);
        deletedItem = state.items[deletedIndex];
        return {
          ...state,
          items: state.items.filter(item => item.id !== id)
        };
      });

      try {
        await trackersApi.delete(id);
        return { success: true };
      } catch (error) {
        // Revert on error
        update(state => {
          const items = [...state.items];
          items.splice(deletedIndex, 0, deletedItem);
          return { ...state, items };
        });
        return { success: false, error: error.message || 'Failed to delete tracker' };
      }
    },

    /**
     * Reset a tracker's last_reset to now
     */
    async reset(id) {
      // Optimistic update - set to current time
      const now = new Date().toISOString().replace('Z', '').split('.')[0];
      update(state => ({
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, last_reset: now } : item
        )
      }));

      try {
        const data = await trackersApi.reset(id);
        // Update with server response to ensure consistency
        update(state => ({
          ...state,
          items: state.items.map(item =>
            item.id === id ? data.tracker : item
          )
        }));
        return { success: true };
      } catch (error) {
        // Reload on error to get correct state
        this.load();
        return { success: false, error: error.message || 'Failed to reset tracker' };
      }
    },

    /**
     * Clear error state
     */
    clearError() {
      update(state => ({ ...state, error: null }));
    },

    /**
     * Reset store (e.g., on logout)
     */
    reset() {
      set({
        items: [],
        loading: false,
        error: null
      });
    }
  };
}

export const trackersStore = createTrackersStore();

// Derived store for tracker count
export const trackerCount = derived(trackersStore, $trackers => $trackers.items.length);

// Derived store to check if max trackers reached
export const isMaxTrackers = derived(trackerCount, $count => $count >= MAX_TRACKERS);

export default trackersStore;
