import { writable, derived } from 'svelte/store';

/**
 * Base path for subdirectory deployment
 * Detect from the module URL (works in ES modules unlike document.currentScript)
 */
const BASE_PATH = (() => {
  try {
    // import.meta.url gives us the URL of this module (e.g., https://example.com/big-dilly/bundle.js)
    const moduleUrl = new URL(import.meta.url);
    const pathParts = moduleUrl.pathname.split('/');
    // Remove the filename (bundle.js) to get the directory
    pathParts.pop();
    const basePath = pathParts.join('/');
    return basePath || '';
  } catch (e) {
    return '';
  }
})();

/**
 * Simple client-side router with base path support
 */
function createRouter() {
  // Get path relative to base
  const getPath = () => {
    if (typeof window !== 'undefined') {
      const fullPath = window.location.pathname;
      // Strip base path prefix if present
      if (BASE_PATH && fullPath.startsWith(BASE_PATH)) {
        const path = fullPath.slice(BASE_PATH.length);
        return path || '/';
      }
      return fullPath;
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
     * Navigate to a new path (automatically prepends base path)
     */
    navigate(path, replace = false) {
      if (typeof window !== 'undefined') {
        // Prepend base path for browser URL
        const fullPath = BASE_PATH + path;
        if (replace) {
          window.history.replaceState(null, '', fullPath);
        } else {
          window.history.pushState(null, '', fullPath);
        }
        // Store the path without base prefix for route matching
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
