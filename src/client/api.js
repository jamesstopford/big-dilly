/**
 * API client for making requests to the backend
 * Includes network error detection and retry logic with exponential backoff
 */

import { networkStore } from './stores/network.js';

const API_BASE = '/api';

/**
 * Network error types that should trigger retry
 */
const RETRYABLE_ERRORS = ['NetworkError', 'TypeError', 'AbortError'];

/**
 * HTTP status codes that should trigger retry
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2
};

/**
 * Calculate delay for exponential backoff
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt, config = DEFAULT_RETRY_CONFIG) {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} Whether the error is retryable
 */
function isRetryableError(error) {
  // Network errors (fetch failed)
  if (error.name && RETRYABLE_ERRORS.includes(error.name)) {
    return true;
  }

  // Check for "failed to fetch" type errors
  if (error.message && (
    error.message.toLowerCase().includes('failed to fetch') ||
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('connection')
  )) {
    return true;
  }

  // HTTP status codes
  if (error.status && RETRYABLE_STATUS_CODES.includes(error.status)) {
    return true;
  }

  return false;
}

/**
 * Check if the browser appears to be offline
 * @returns {boolean} Whether the browser is offline
 */
function isBrowserOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

/**
 * Wait for a specified duration
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make an API request with retry logic
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {Object} options - Fetch options
 * @param {Object} retryConfig - Retry configuration (optional)
 * @returns {Promise<any>} Response data
 */
async function request(endpoint, options = {}, retryConfig = DEFAULT_RETRY_CONFIG) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'same-origin',
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  // Determine if this request should be retried
  const shouldRetry = options.retry !== false;
  const maxRetries = shouldRetry ? retryConfig.maxRetries : 0;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if browser is offline before making request
      if (isBrowserOffline()) {
        networkStore.markOffline();
        const offlineError = new Error('No internet connection');
        offlineError.isNetworkError = true;
        throw offlineError;
      }

      // If retrying, update network state and wait
      if (attempt > 0) {
        networkStore.setReconnecting();
        networkStore.incrementRetry();
        const delay = calculateBackoffDelay(attempt - 1, retryConfig);
        await sleep(delay);
      }

      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          const error = new Error(`HTTP error ${response.status}`);
          error.status = response.status;
          throw error;
        }
        // Successful request - mark online
        networkStore.markOnline();
        networkStore.resetRetries();
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error || `HTTP error ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      // Successful request - mark online and reset retry count
      networkStore.markOnline();
      networkStore.resetRetries();
      return data;

    } catch (error) {
      lastError = error;

      // Mark error as network error if it's a fetch failure
      if (error.message && error.message.toLowerCase().includes('failed to fetch')) {
        error.isNetworkError = true;
        networkStore.markOffline();
      }

      // Check if we should retry
      const canRetry = attempt < maxRetries && isRetryableError(error);

      if (!canRetry) {
        // Not retryable or out of retries
        if (error.isNetworkError) {
          networkStore.markOffline();
        }
        throw error;
      }

      // Log retry attempt (for debugging)
      console.warn(`Request to ${endpoint} failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
    }
  }

  // Should not reach here, but throw last error just in case
  throw lastError;
}

/**
 * Make a request without retry (for operations that shouldn't be repeated)
 */
function requestNoRetry(endpoint, options = {}) {
  return request(endpoint, { ...options, retry: false });
}

// Auth API
export const auth = {
  /**
   * Register a new user
   */
  register: (email, password) =>
    requestNoRetry('/auth/register', {
      method: 'POST',
      body: { email, password }
    }),

  /**
   * Log in with email and password
   */
  login: (email, password) =>
    requestNoRetry('/auth/login', {
      method: 'POST',
      body: { email, password }
    }),

  /**
   * Log out current user
   */
  logout: () =>
    requestNoRetry('/auth/logout', {
      method: 'POST'
    }),

  /**
   * Get current user info
   */
  me: () => request('/auth/me'),

  /**
   * Request password reset
   */
  forgotPassword: (email) =>
    requestNoRetry('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    }),

  /**
   * Reset password with token
   */
  resetPassword: (token, password) =>
    requestNoRetry('/auth/reset-password', {
      method: 'POST',
      body: { token, password }
    })
};

// User API
export const user = {
  /**
   * Update user theme preference
   */
  updateTheme: (theme) =>
    request('/user/theme', {
      method: 'PUT',
      body: { theme }
    })
};

// Todos API
export const todos = {
  /**
   * Get all todos for current user
   */
  getAll: () => request('/todos'),

  /**
   * Create a new todo
   */
  create: (text) =>
    request('/todos', {
      method: 'POST',
      body: { text }
    }),

  /**
   * Update a todo (text and/or completed)
   */
  update: (id, data) =>
    request(`/todos/${id}`, {
      method: 'PUT',
      body: data
    }),

  /**
   * Delete a todo
   */
  delete: (id) =>
    request(`/todos/${id}`, {
      method: 'DELETE'
    }),

  /**
   * Reorder todos
   */
  reorder: (todoIds) =>
    request('/todos/reorder', {
      method: 'PUT',
      body: { todoIds }
    })
};

// Template API
export const template = {
  /**
   * Get user's template items
   */
  get: () => request('/template'),

  /**
   * Save current todos as template
   */
  save: () =>
    request('/template/save', {
      method: 'POST'
    }),

  /**
   * Reset todos to template
   */
  reset: () =>
    request('/template/reset', {
      method: 'POST'
    })
};

// Trackers API
export const trackers = {
  /**
   * Get all trackers for current user
   */
  getAll: () => request('/trackers'),

  /**
   * Create a new tracker
   */
  create: (name, icon) =>
    request('/trackers', {
      method: 'POST',
      body: { name, icon }
    }),

  /**
   * Update a tracker (name and/or icon)
   */
  update: (id, data) =>
    request(`/trackers/${id}`, {
      method: 'PUT',
      body: data
    }),

  /**
   * Delete a tracker
   */
  delete: (id) =>
    request(`/trackers/${id}`, {
      method: 'DELETE'
    }),

  /**
   * Reset a tracker's last_reset to now
   */
  reset: (id) =>
    request(`/trackers/${id}/reset`, {
      method: 'POST'
    })
};

// Health check
export const health = () => request('/health');

export default {
  auth,
  user,
  todos,
  template,
  trackers,
  health
};
