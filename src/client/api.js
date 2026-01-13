/**
 * API client for making requests to the backend
 */

const API_BASE = '/api';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (without /api prefix)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function request(endpoint, options = {}) {
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

  const response = await fetch(url, config);

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || `HTTP error ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Auth API
export const auth = {
  /**
   * Register a new user
   */
  register: (email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: { email, password }
    }),

  /**
   * Log in with email and password
   */
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: { email, password }
    }),

  /**
   * Log out current user
   */
  logout: () =>
    request('/auth/logout', {
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
    request('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    }),

  /**
   * Reset password with token
   */
  resetPassword: (token, password) =>
    request('/auth/reset-password', {
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

// Health check
export const health = () => request('/health');

export default {
  auth,
  user,
  todos,
  template,
  health
};
