import { writable, get } from 'svelte/store';
import { auth } from './auth.js';
import { user as userApi } from '../api.js';

const THEME_KEY = 'big-dilly-theme';
const VALID_THEMES = ['light', 'dark', 'cyber-neon'];

/**
 * Create the theme store
 */
function createThemeStore() {
  // Get initial theme from localStorage or default to light
  const storedTheme = typeof localStorage !== 'undefined'
    ? localStorage.getItem(THEME_KEY)
    : null;
  const initialTheme = storedTheme && VALID_THEMES.includes(storedTheme)
    ? storedTheme
    : 'light';

  const { subscribe, set, update } = writable(initialTheme);

  // Apply theme to document
  function applyTheme(theme) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  // Apply initial theme
  applyTheme(initialTheme);

  return {
    subscribe,

    /**
     * Set theme and persist to localStorage and server
     */
    async setTheme(newTheme) {
      if (!VALID_THEMES.includes(newTheme)) {
        console.error(`Invalid theme: ${newTheme}`);
        return;
      }

      set(newTheme);
      applyTheme(newTheme);

      // Persist to localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_KEY, newTheme);
      }

      // Persist to server if logged in
      const authState = get(auth);
      if (authState.user) {
        try {
          await userApi.updateTheme(newTheme);
          auth.updateUser({ theme: newTheme });
        } catch (error) {
          console.error('Failed to save theme preference:', error);
        }
      }
    },

    /**
     * Initialize theme from user preferences
     */
    initFromUser(userTheme) {
      if (userTheme && VALID_THEMES.includes(userTheme)) {
        set(userTheme);
        applyTheme(userTheme);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(THEME_KEY, userTheme);
        }
      }
    },

    /**
     * Cycle to next theme
     */
    cycleTheme() {
      update(current => {
        const currentIndex = VALID_THEMES.indexOf(current);
        const nextIndex = (currentIndex + 1) % VALID_THEMES.length;
        const nextTheme = VALID_THEMES[nextIndex];
        this.setTheme(nextTheme);
        return nextTheme;
      });
    }
  };
}

export const theme = createThemeStore();

export const THEMES = VALID_THEMES;

export default theme;
