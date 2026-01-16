<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { formatElapsedTime, getIconById, TRACKER_ICONS } from '../stores/trackers.js';
  import TimeIndicator from './TimeIndicator.svelte';

  export let tracker;

  // Time indicator configuration - easily adjustable
  // Set to false to hide the visual indicator entirely
  export let showTimeIndicator = true;
  export let timeIndicatorSize = 36;

  const dispatch = createEventDispatcher();

  let isEditing = false;
  let editName = '';
  let editIcon = '';
  let nameInputElement;
  let showIconPicker = false;
  let elapsedTime = '';
  let updateInterval;

  // Update elapsed time display
  function updateElapsedTime() {
    elapsedTime = formatElapsedTime(tracker.last_reset);
  }

  // Set up interval for real-time updates
  onMount(() => {
    updateElapsedTime();
    // Update every minute
    updateInterval = setInterval(updateElapsedTime, 60000);
  });

  // Clean up interval on destroy
  onDestroy(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });

  // Update elapsed time when tracker changes
  $: if (tracker.last_reset) {
    updateElapsedTime();
  }

  function startEdit() {
    editName = tracker.name;
    editIcon = tracker.icon;
    isEditing = true;
    showIconPicker = false;
    // Focus the input after DOM update
    setTimeout(() => {
      if (nameInputElement) {
        nameInputElement.focus();
        nameInputElement.select();
      }
    }, 0);
  }

  function cancelEdit() {
    isEditing = false;
    editName = '';
    editIcon = '';
    showIconPicker = false;
  }

  function saveEdit() {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      cancelEdit();
      return;
    }

    const hasNameChange = trimmedName !== tracker.name;
    const hasIconChange = editIcon !== tracker.icon;

    if (hasNameChange || hasIconChange) {
      const updates = {};
      if (hasNameChange) updates.name = trimmedName;
      if (hasIconChange) updates.icon = editIcon;
      dispatch('update', { id: tracker.id, updates });
    }

    isEditing = false;
    editName = '';
    editIcon = '';
    showIconPicker = false;
  }

  function handleKeydown(event) {
    if (event.key === 'Enter') {
      saveEdit();
    } else if (event.key === 'Escape') {
      cancelEdit();
    }
  }

  function handleBlur(event) {
    // Don't save if clicking on icon picker
    if (showIconPicker) return;
    // Small delay to allow icon selection
    setTimeout(() => {
      if (!showIconPicker) {
        saveEdit();
      }
    }, 100);
  }

  function selectIcon(iconId) {
    editIcon = iconId;
    showIconPicker = false;
    // Focus back to name input
    if (nameInputElement) {
      nameInputElement.focus();
    }
  }

  function resetTracker() {
    dispatch('reset', { id: tracker.id });
  }

  function deleteTracker() {
    dispatch('delete', { id: tracker.id });
  }

  function toggleIconPicker() {
    showIconPicker = !showIconPicker;
  }

  // Get the icon object for display
  $: iconData = getIconById(tracker.icon);
  $: editIconData = editIcon ? getIconById(editIcon) : iconData;
</script>

<li class="tracker-item">
  {#if isEditing}
    <div class="edit-mode">
      <button
        type="button"
        class="icon-button edit-icon-btn"
        on:click={toggleIconPicker}
        aria-label="Change icon"
      >
        {editIconData.emoji}
      </button>

      {#if showIconPicker}
        <div class="icon-picker">
          {#each TRACKER_ICONS as icon}
            <button
              type="button"
              class="icon-option"
              class:selected={editIcon === icon.id}
              on:click={() => selectIcon(icon.id)}
              title={icon.label}
              aria-label={icon.label}
            >
              {icon.emoji}
            </button>
          {/each}
        </div>
      {/if}

      <input
        bind:this={nameInputElement}
        type="text"
        class="edit-input"
        bind:value={editName}
        on:keydown={handleKeydown}
        on:blur={handleBlur}
        maxlength="100"
        aria-label="Edit tracker name"
      />

      <button
        type="button"
        class="btn-icon save-btn"
        on:click={saveEdit}
        aria-label="Save changes"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
        </svg>
      </button>

      <button
        type="button"
        class="btn-icon cancel-btn"
        on:click={cancelEdit}
        aria-label="Cancel edit"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
        </svg>
      </button>
    </div>
  {:else}
    <span class="tracker-icon" aria-hidden="true">{iconData.emoji}</span>

    <!-- Visual time indicator (FR-7) - modular and easily removable -->
    {#if showTimeIndicator}
      <TimeIndicator
        lastReset={tracker.last_reset}
        size={timeIndicatorSize}
        show={showTimeIndicator}
      />
    {/if}

    <div class="tracker-info">
      <span
        class="tracker-name"
        on:click={startEdit}
        on:keydown={(e) => e.key === 'Enter' && startEdit()}
        role="button"
        tabindex="0"
        aria-label="Click to edit"
      >
        {tracker.name}
      </span>
      <span class="tracker-elapsed">{elapsedTime}</span>
    </div>

    <div class="tracker-actions">
      <button
        type="button"
        class="btn btn-small btn-reset"
        on:click={resetTracker}
        aria-label="Reset tracker"
      >
        Reset
      </button>

      <button
        type="button"
        class="btn-icon edit-btn"
        on:click={startEdit}
        aria-label="Edit tracker"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.854.146a.5.5 0 00-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 000-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 016 13.5V13h-.5a.5.5 0 01-.5-.5V12h-.5a.5.5 0 01-.5-.5V11h-.5a.5.5 0 01-.5-.5V10h-.5a.499.499 0 01-.175-.032l-.179.178a.5.5 0 00-.11.168l-2 5a.5.5 0 00.65.65l5-2a.5.5 0 00.168-.11l.178-.178z"/>
        </svg>
      </button>

      <button
        type="button"
        class="btn-icon delete-btn"
        on:click={deleteTracker}
        aria-label="Delete tracker"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
        </svg>
      </button>
    </div>
  {/if}
</li>

<style>
  .tracker-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: var(--bg-primary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    transition: all 0.2s ease;
    position: relative;
  }

  .tracker-item:hover {
    border-color: var(--accent);
  }

  .tracker-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
    width: 2rem;
    text-align: center;
  }

  .tracker-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .tracker-name {
    font-weight: 500;
    color: var(--text-primary);
    cursor: text;
    padding: 0.5rem 0.25rem;
    min-height: 44px;
    border-radius: var(--radius-sm);
    word-break: break-word;
    display: flex;
    align-items: center;
  }

  .tracker-name:hover {
    background-color: var(--bg-secondary);
  }

  .tracker-name:focus {
    outline: none;
    background-color: var(--bg-secondary);
    box-shadow: 0 0 0 2px var(--accent-light);
  }

  .tracker-elapsed {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .tracker-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .btn-small {
    padding: 0.5rem 0.75rem;
    min-height: 44px;
    font-size: 0.875rem;
  }

  .btn-reset {
    background-color: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn-reset:hover {
    background-color: var(--accent-hover);
  }

  .btn-reset:focus {
    outline: none;
    box-shadow: 0 0 0 3px var(--accent-light);
  }

  :global([data-theme="cyber-neon"]) .btn-reset {
    color: #000000;
  }

  .btn-icon {
    padding: 0.75rem;
    min-width: 44px;
    min-height: 44px;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .edit-btn,
  .delete-btn {
    opacity: 0;
  }

  .tracker-item:hover .edit-btn,
  .tracker-item:hover .delete-btn,
  .tracker-item:focus-within .edit-btn,
  .tracker-item:focus-within .delete-btn {
    opacity: 1;
  }

  .edit-btn:hover {
    color: var(--accent);
    background-color: var(--accent-light);
  }

  .delete-btn:hover {
    color: var(--danger);
    background-color: var(--danger-light);
  }

  .btn-icon:focus {
    opacity: 1;
    outline: none;
    box-shadow: 0 0 0 2px var(--accent-light);
  }

  /* Ensure buttons visible on touch devices */
  @media (hover: none) {
    .edit-btn,
    .delete-btn {
      opacity: 1;
    }
  }

  /* Edit mode styles */
  .edit-mode {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    position: relative;
  }

  .icon-button {
    font-size: 1.5rem;
    background: none;
    border: 2px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.25rem;
    cursor: pointer;
    transition: border-color 0.2s ease;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-button:hover {
    border-color: var(--accent);
  }

  .icon-picker {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 100;
    background-color: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: 0.5rem;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.25rem;
    margin-top: 0.25rem;
    max-width: 280px;
  }

  .icon-option {
    font-size: 1.25rem;
    background: none;
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    padding: 0.5rem;
    min-width: 44px;
    min-height: 44px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-option:hover {
    background-color: var(--bg-secondary);
    border-color: var(--accent-light);
  }

  .icon-option.selected {
    border-color: var(--accent);
    background-color: var(--accent-light);
  }

  .edit-input {
    flex: 1;
    padding: 0.625rem 0.5rem;
    min-height: 44px;
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

  .save-btn {
    color: var(--success);
  }

  .save-btn:hover {
    background-color: var(--success-light);
  }

  .cancel-btn {
    color: var(--text-muted);
  }

  .cancel-btn:hover {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .tracker-item {
      flex-wrap: wrap;
    }

    .tracker-info {
      flex: 1 1 calc(100% - 4rem);
    }

    .tracker-actions {
      width: 100%;
      justify-content: flex-end;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border);
    }

    .icon-picker {
      left: 50%;
      transform: translateX(-50%);
    }
  }
</style>
