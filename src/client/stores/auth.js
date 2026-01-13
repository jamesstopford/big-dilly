import { writable, derived } from 'svelte/store';
import { auth as authApi } from '../api.js';

/**
 * Create the auth store
 */
function createAuthStore() {
  const { subscribe, set, update } = writable({
    user: null,
    loading: true,
    error: null
  });

  return {
    subscribe,

    /**
     * Initialize auth state by checking current session
     */
    async init() {
      try {
        const data = await authApi.me();
        set({ user: data.user, loading: false, error: null });
      } catch (error) {
        // Not logged in or session expired
        set({ user: null, loading: false, error: null });
      }
    },

    /**
     * Register a new user
     */
    async register(email, password) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const data = await authApi.register(email, password);
        set({ user: data.user, loading: false, error: null });
        return data;
      } catch (error) {
        update(s => ({ ...s, loading: false, error: error.message }));
        throw error;
      }
    },

    /**
     * Log in with email and password
     */
    async login(email, password) {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const data = await authApi.login(email, password);
        set({ user: data.user, loading: false, error: null });
        return data;
      } catch (error) {
        update(s => ({ ...s, loading: false, error: error.message }));
        throw error;
      }
    },

    /**
     * Log out current user
     */
    async logout() {
      try {
        await authApi.logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
      set({ user: null, loading: false, error: null });
    },

    /**
     * Clear any error state
     */
    clearError() {
      update(s => ({ ...s, error: null }));
    },

    /**
     * Update user data (e.g., after theme change)
     */
    updateUser(userData) {
      update(s => ({
        ...s,
        user: s.user ? { ...s.user, ...userData } : null
      }));
    }
  };
}

export const auth = createAuthStore();

// Derived store for checking if user is logged in
export const isAuthenticated = derived(auth, $auth => $auth.user !== null);

// Derived store for current user
export const currentUser = derived(auth, $auth => $auth.user);

export default auth;
