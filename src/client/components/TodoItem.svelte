<script>
  import { createEventDispatcher } from 'svelte';

  export let todo;
  export let dragHandle = false;

  const dispatch = createEventDispatcher();

  let isEditing = false;
  let editText = '';
  let inputElement;

  function startEdit() {
    editText = todo.text;
    isEditing = true;
    // Focus the input after DOM update
    setTimeout(() => {
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
    }, 0);
  }

  function cancelEdit() {
    isEditing = false;
    editText = '';
  }

  function saveEdit() {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      dispatch('update', { id: todo.id, text: trimmed });
    }
    isEditing = false;
    editText = '';
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      saveEdit();
    } else if (event.key === 'Escape') {
      cancelEdit();
    }
  }

  function handleBlur() {
    saveEdit();
  }

  function toggleComplete() {
    dispatch('toggle', { id: todo.id });
  }

  function deleteTodo() {
    dispatch('delete', { id: todo.id });
  }
</script>

<li class="todo-item" class:completed={todo.completed} data-id={todo.id}>
  {#if dragHandle}
    <span class="drag-handle" aria-label="Drag to reorder">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="3" r="1.5" />
        <circle cx="11" cy="3" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
      </svg>
    </span>
  {/if}

  <label class="checkbox-wrapper">
    <input
      type="checkbox"
      checked={todo.completed}
      on:change={toggleComplete}
      aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
    />
    <span class="checkbox-custom"></span>
  </label>

  {#if isEditing}
    <input
      bind:this={inputElement}
      type="text"
      class="edit-input"
      bind:value={editText}
      on:keydown={handleKeydown}
      on:blur={handleBlur}
      maxlength="500"
      aria-label="Edit todo text"
    />
  {:else}
    <span
      class="todo-text"
      on:click={startEdit}
      on:keydown={(e) => e.key === 'Enter' && startEdit()}
      role="button"
      tabindex="0"
      aria-label="Click to edit"
    >
      {todo.text}
    </span>
  {/if}

  <button
    class="delete-btn"
    on:click={deleteTodo}
    aria-label="Delete todo"
    type="button"
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
      <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
  </button>
</li>

<style>
  .todo-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: var(--bg-primary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    transition: all 0.2s ease;
  }

  .todo-item:hover {
    border-color: var(--accent);
  }

  .todo-item.completed {
    opacity: 0.7;
  }

  .todo-item.completed .todo-text {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  .drag-handle {
    cursor: grab;
    color: var(--text-muted);
    padding: 0.25rem;
    display: flex;
    align-items: center;
    touch-action: none;
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .drag-handle:hover {
    color: var(--text-secondary);
  }

  .checkbox-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .checkbox-wrapper input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .checkbox-custom {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    background-color: var(--bg-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .checkbox-wrapper:hover .checkbox-custom {
    border-color: var(--accent);
  }

  .checkbox-wrapper input:checked + .checkbox-custom {
    background-color: var(--success);
    border-color: var(--success);
  }

  .checkbox-wrapper input:checked + .checkbox-custom::after {
    content: '';
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
    margin-bottom: 2px;
  }

  .checkbox-wrapper input:focus + .checkbox-custom {
    box-shadow: 0 0 0 3px var(--accent-light);
  }

  .todo-text {
    flex: 1;
    color: var(--text-primary);
    cursor: text;
    padding: 0.25rem;
    border-radius: var(--radius-sm);
    word-break: break-word;
    min-width: 0;
  }

  .todo-text:hover {
    background-color: var(--bg-secondary);
  }

  .todo-text:focus {
    outline: none;
    background-color: var(--bg-secondary);
    box-shadow: 0 0 0 2px var(--accent-light);
  }

  .edit-input {
    flex: 1;
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--accent);
    border-radius: var(--radius-sm);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-size: inherit;
    font-family: inherit;
    min-width: 0;
  }

  .edit-input:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--accent-light);
  }

  .delete-btn {
    opacity: 0;
    padding: 0.375rem;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .todo-item:hover .delete-btn,
  .todo-item:focus-within .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    color: var(--danger);
    background-color: var(--danger-light);
  }

  .delete-btn:focus {
    opacity: 1;
    outline: none;
    box-shadow: 0 0 0 2px var(--danger-light);
  }

  /* Ensure delete button is always visible on touch devices */
  @media (hover: none) {
    .delete-btn {
      opacity: 1;
    }
  }

  /* Drag state styling */
  :global(.todo-item.sortable-ghost) {
    opacity: 0.4;
    background-color: var(--accent-light);
  }

  :global(.todo-item.sortable-chosen) {
    background-color: var(--bg-secondary);
    box-shadow: var(--shadow-md);
  }

  :global(.todo-item.sortable-drag) {
    box-shadow: var(--shadow-lg);
  }
</style>
