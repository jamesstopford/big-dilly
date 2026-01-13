import { writable, derived } from 'svelte/store';

/**
 * Simple client-side router
 */
function createRouter() {
  // Get initial path from browser
  const getPath = () => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  };

  // Get query params
  const getQuery = () => {
    if (typeof window !== 'undefined') {
      return Object.fromEntries(new URLSearchParams(window.location.search));
    }
    return {};
  };

  const { subscribe, set } = writable({
    path: getPath(),
    query: getQuery()
  });

  // Listen for browser navigation
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
      set({ path: getPath(), query: getQuery() });
    });
  }

  return {
    subscribe,

    /**
     * Navigate to a new path
     */
    navigate(path, replace = false) {
      if (typeof window !== 'undefined') {
        if (replace) {
          window.history.replaceState(null, '', path);
        } else {
          window.history.pushState(null, '', path);
        }
        set({ path, query: getQuery() });
      }
    },

    /**
     * Navigate and replace current history entry
     */
    replace(path) {
      this.navigate(path, true);
    }
  };
}

export const router = createRouter();

// Derived store for just the path
export const currentPath = derived(router, $router => $router.path);

// Derived store for query params
export const queryParams = derived(router, $router => $router.query);

export default router;
