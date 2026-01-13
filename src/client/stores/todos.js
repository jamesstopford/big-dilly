import { writable, derived } from 'svelte/store';
import { todos as todosApi, template as templateApi } from '../api.js';

/**
 * Maximum number of todos allowed per user
 */
export const MAX_TODOS = 20;

/**
 * Create the todos store with all CRUD operations
 */
function createTodosStore() {
  const { subscribe, set, update } = writable({
    items: [],
    loading: false,
    error: null,
    templateSaving: false,
    templateResetting: false,
    templateFeedback: null // 'saved' | 'reset' | null
  });

  // Clear template feedback after a delay
  let feedbackTimeout = null;
  function setTemplateFeedback(type) {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    update(state => ({ ...state, templateFeedback: type }));
    feedbackTimeout = setTimeout(() => {
      update(state => ({ ...state, templateFeedback: null }));
    }, 2000);
  }

  return {
    subscribe,

    /**
     * Load all todos from the server
     */
    async load() {
      update(state => ({ ...state, loading: true, error: null }));
      try {
        const data = await todosApi.getAll();
        update(state => ({
          ...state,
          items: data?.todos || [],
          loading: false
        }));
        return { success: true };
      } catch (error) {
        update(state => ({
          ...state,
          loading: false,
          error: error.message || 'Failed to load todos'
        }));
        return { success: false, error: error.message };
      }
    },

    /**
     * Create a new todo
     */
    async create(text) {
      const trimmedText = text?.trim();
      if (!trimmedText) return { success: false, error: 'Todo text is required' };

      try {
        const data = await todosApi.create(trimmedText);
        if (data?.todo) {
          update(state => ({
            ...state,
            items: [...state.items, data.todo]
          }));
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message || 'Failed to create todo' };
      }
    },

    /**
     * Update a todo's text
     */
    async updateText(id, text) {
      const trimmedText = text.trim();
      if (!trimmedText) return { success: false, error: 'Todo text is required' };

      // Optimistic update
      update(state => ({
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, text: trimmedText } : item
        )
      }));

      try {
        await todosApi.update(id, { text: trimmedText });
        return { success: true };
      } catch (error) {
        // Revert on error - reload from server
        this.load();
        return { success: false, error: error.message || 'Failed to update todo' };
      }
    },

    /**
     * Toggle a todo's completed status
     */
    async toggleComplete(id) {
      let previousCompleted;

      // Optimistic update
      update(state => ({
        ...state,
        items: state.items.map(item => {
          if (item.id === id) {
            previousCompleted = item.completed;
            return { ...item, completed: item.completed ? 0 : 1 };
          }
          return item;
        })
      }));

      try {
        await todosApi.update(id, { completed: previousCompleted ? false : true });
        return { success: true };
      } catch (error) {
        // Revert on error
        update(state => ({
          ...state,
          items: state.items.map(item =>
            item.id === id ? { ...item, completed: previousCompleted } : item
          )
        }));
        return { success: false, error: error.message || 'Failed to update todo' };
      }
    },

    /**
     * Delete a todo
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
        await todosApi.delete(id);
        return { success: true };
      } catch (error) {
        // Revert on error
        update(state => {
          const items = [...state.items];
          items.splice(deletedIndex, 0, deletedItem);
          return { ...state, items };
        });
        return { success: false, error: error.message || 'Failed to delete todo' };
      }
    },

    /**
     * Reorder todos
     */
    async reorder(newItems) {
      const previousItems = [];

      // Optimistic update
      update(state => {
        previousItems.push(...state.items);
        return {
          ...state,
          items: newItems.map((item, index) => ({ ...item, sort_order: index }))
        };
      });

      try {
        const todoIds = newItems.map(item => item.id);
        await todosApi.reorder(todoIds);
        return { success: true };
      } catch (error) {
        // Revert on error
        update(state => ({ ...state, items: previousItems }));
        return { success: false, error: error.message || 'Failed to reorder todos' };
      }
    },

    /**
     * Save current todos as template
     */
    async saveTemplate() {
      update(state => ({ ...state, templateSaving: true }));
      try {
        await templateApi.save();
        update(state => ({ ...state, templateSaving: false }));
        setTemplateFeedback('saved');
        return { success: true };
      } catch (error) {
        update(state => ({ ...state, templateSaving: false }));
        return { success: false, error: error.message || 'Failed to save template' };
      }
    },

    /**
     * Reset todos to template
     */
    async resetToTemplate() {
      update(state => ({ ...state, templateResetting: true }));
      try {
        const data = await templateApi.reset();
        update(state => ({
          ...state,
          items: data.todos,
          templateResetting: false
        }));
        setTemplateFeedback('reset');
        return { success: true };
      } catch (error) {
        update(state => ({ ...state, templateResetting: false }));
        return { success: false, error: error.message || 'Failed to reset to template' };
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
        error: null,
        templateSaving: false,
        templateResetting: false,
        templateFeedback: null
      });
    }
  };
}

export const todosStore = createTodosStore();

// Derived store for todo count
export const todoCount = derived(todosStore, $todos => $todos.items.length);

// Derived store for completed count
export const completedCount = derived(todosStore, $todos =>
  $todos.items.filter(item => item.completed).length
);

// Derived store to check if max todos reached
export const isMaxTodos = derived(todoCount, $count => $count >= MAX_TODOS);

export default todosStore;
