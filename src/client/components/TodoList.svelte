<script>
  import { onMount, onDestroy } from 'svelte';
  import Sortable from 'sortablejs';
  import { todosStore, todoCount, isMaxTodos, MAX_TODOS } from '../stores/todos.js';
  import TodoItem from './TodoItem.svelte';

  let newTodoText = '';
  let inputElement;
  let listElement;
  let sortableInstance;
  let addError = '';

  // Load todos on mount
  onMount(async () => {
    await todosStore.load();
    initSortable();
  });

  // Cleanup on destroy
  onDestroy(() => {
    if (sortableInstance) {
      sortableInstance.destroy();
    }
  });

  // Reinitialize sortable when items change
  $: if (listElement && $todosStore.items) {
    initSortable();
  }

  function initSortable() {
    if (!listElement) return;

    // Destroy existing instance
    if (sortableInstance) {
      sortableInstance.destroy();
    }

    sortableInstance = new Sortable(listElement, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      handle: '.drag-handle',
      onEnd: handleDragEnd
    });
  }

  async function handleDragEnd(event) {
    const { oldIndex, newIndex } = event;

    if (oldIndex === newIndex) return;

    // Create new order array
    const items = [...$todosStore.items];
    const [movedItem] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, movedItem);

    // Update the store
    const result = await todosStore.reorder(items);

    if (!result.success) {
      console.error('Reorder failed:', result.error);
      // The store will revert to previous state on error
    }
  }

  async function addTodo() {
    addError = '';

    if (!newTodoText.trim()) {
      return;
    }

    if ($isMaxTodos) {
      addError = `Maximum of ${MAX_TODOS} todos reached`;
      return;
    }

    const result = await todosStore.create(newTodoText);

    if (result.success) {
      newTodoText = '';
      inputElement?.focus();
    } else {
      addError = result.error;
    }
  }

  function handleInputKeydown(event) {
    if (event.key === 'Enter') {
      addTodo();
    }
  }

  async function handleUpdate(event) {
    const { id, text } = event.detail;
    const result = await todosStore.updateText(id, text);
    if (!result.success) {
      console.error('Update failed:', result.error);
    }
  }

  async function handleToggle(event) {
    const { id } = event.detail;
    const result = await todosStore.toggleComplete(id);
    if (!result.success) {
      console.error('Toggle failed:', result.error);
    }
  }

  async function handleDelete(event) {
    const { id } = event.detail;
    const result = await todosStore.delete(id);
    if (!result.success) {
      console.error('Delete failed:', result.error);
    }
  }

  async function saveTemplate() {
    const result = await todosStore.saveTemplate();
    if (!result.success) {
      console.error('Save template failed:', result.error);
    }
  }

  async function resetToTemplate() {
    const result = await todosStore.resetToTemplate();
    if (!result.success) {
      console.error('Reset to template failed:', result.error);
    }
  }
</script>

<div class="todo-panel">
  <div class="panel-header">
    <h2>Todos</h2>
    <span class="count">{$todoCount}/{MAX_TODOS}</span>
  </div>

  {#if $todosStore.error}
    <div class="alert alert-error">
      {$todosStore.error}
      <button class="alert-dismiss" on:click={() => todosStore.clearError()} type="button">
        &times;
      </button>
    </div>
  {/if}

  <div class="add-todo">
    <input
      bind:this={inputElement}
      bind:value={newTodoText}
      type="text"
      class="form-input add-input"
      placeholder={$isMaxTodos ? 'Maximum todos reached' : 'Add a new todo...'}
      disabled={$isMaxTodos || $todosStore.loading}
      on:keydown={handleInputKeydown}
      maxlength="500"
      aria-label="Add new todo"
    />
    <button
      class="btn btn-primary add-btn"
      on:click={addTodo}
      disabled={$isMaxTodos || $todosStore.loading || !newTodoText.trim()}
      type="button"
      aria-label="Add todo"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
      </svg>
    </button>
  </div>

  {#if addError}
    <p class="add-error">{addError}</p>
  {/if}

  <div class="todo-content">
    {#if $todosStore.loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading todos...</p>
      </div>
    {:else if $todosStore.items.length === 0}
      <div class="empty-state">
        <p>No todos yet. Add one above!</p>
      </div>
    {:else}
      <ul class="todo-list" bind:this={listElement}>
        {#each $todosStore.items as todo (todo.id)}
          <TodoItem
            {todo}
            dragHandle={true}
            on:update={handleUpdate}
            on:toggle={handleToggle}
            on:delete={handleDelete}
          />
        {/each}
      </ul>
    {/if}
  </div>

  <div class="template-actions">
    <button
      class="btn btn-secondary template-btn"
      class:btn-success-feedback={$todosStore.templateFeedback === 'saved'}
      on:click={saveTemplate}
      disabled={$todosStore.templateSaving || $todosStore.items.length === 0}
      type="button"
    >
      {#if $todosStore.templateSaving}
        <span class="spinner small"></span>
        Saving...
      {:else if $todosStore.templateFeedback === 'saved'}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
        </svg>
        Saved!
      {:else}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 1a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1H9.5a1 1 0 00-1 1v7.293l2.646-2.647a.5.5 0 01.708.708l-3.5 3.5a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L7.5 9.293V2a2 2 0 012-2H14a2 2 0 012 2v12a2 2 0 01-2 2H2a2 2 0 01-2-2V2a2 2 0 012-2h2.5a.5.5 0 010 1H2z"/>
        </svg>
        Save Template
      {/if}
    </button>
    <button
      class="btn btn-secondary template-btn"
      class:btn-success-feedback={$todosStore.templateFeedback === 'reset'}
      on:click={resetToTemplate}
      disabled={$todosStore.templateResetting}
      type="button"
    >
      {#if $todosStore.templateResetting}
        <span class="spinner small"></span>
        Resetting...
      {:else if $todosStore.templateFeedback === 'reset'}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
        </svg>
        Reset!
      {:else}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fill-rule="evenodd" d="M8 3a5 5 0 11-4.546 2.914.5.5 0 00-.908-.417A6 6 0 108 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 00-.41-.192L5.23 2.308a.25.25 0 000 .384l2.36 1.966A.25.25 0 008 4.466z"/>
        </svg>
        Reset to Template
      {/if}
    </button>
  </div>
</div>

<style>
  .todo-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }

  .panel-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .count {
    font-size: 0.875rem;
    color: var(--text-secondary);
    background-color: var(--bg-tertiary);
    padding: 0.25rem 0.75rem;
    border-radius: var(--radius-md);
  }

  .alert {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .alert-dismiss {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: inherit;
    cursor: pointer;
    padding: 0 0.5rem;
  }

  .add-todo {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .add-input {
    flex: 1;
  }

  .add-btn {
    padding: 0.75rem;
    flex-shrink: 0;
  }

  .add-error {
    font-size: 0.875rem;
    color: var(--danger);
    margin: 0 0 0.5rem 0;
  }

  .todo-content {
    flex: 1;
    min-height: 200px;
    overflow-y: auto;
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 200px;
    color: var(--text-muted);
    gap: 0.5rem;
  }

  .todo-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .template-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border);
  }

  .template-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .template-btn svg {
    flex-shrink: 0;
  }

  .btn-success-feedback {
    background-color: var(--success-light);
    border-color: var(--success);
    color: var(--success);
  }

  .spinner.small {
    width: 1rem;
    height: 1rem;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .template-actions {
      flex-direction: column;
    }
  }
</style>
