<script>
  import { onMount, onDestroy } from 'svelte';
  import { trackersStore, trackerCount, isMaxTrackers, MAX_TRACKERS, TRACKER_ICONS, getIconById } from '../stores/trackers.js';
  import TrackerItem from './TrackerItem.svelte';

  let newTrackerName = '';
  let selectedIcon = TRACKER_ICONS[0].id;
  let inputElement;
  let addError = '';
  let showIconPicker = false;

  // Load trackers on mount
  onMount(async () => {
    await trackersStore.load();
  });

  async function addTracker() {
    addError = '';

    if (!newTrackerName.trim()) {
      addError = 'Please enter a tracker name';
      return;
    }

    if ($isMaxTrackers) {
      addError = `Maximum of ${MAX_TRACKERS} trackers reached`;
      return;
    }

    const result = await trackersStore.create(newTrackerName, selectedIcon);

    if (result.success) {
      newTrackerName = '';
      selectedIcon = TRACKER_ICONS[0].id;
      showIconPicker = false;
      inputElement?.focus();
    } else {
      addError = result.error;
    }
  }

  function handleInputKeydown(event) {
    if (event.key === 'Enter') {
      addTracker();
    }
  }

  function selectIcon(iconId) {
    selectedIcon = iconId;
    showIconPicker = false;
    inputElement?.focus();
  }

  function toggleIconPicker() {
    showIconPicker = !showIconPicker;
  }

  async function handleUpdate(event) {
    const { id, updates } = event.detail;
    const result = await trackersStore.update(id, updates);
    if (!result.success) {
      console.error('Update failed:', result.error);
    }
  }

  async function handleReset(event) {
    const { id } = event.detail;
    const result = await trackersStore.resetTracker(id);
    if (!result.success) {
      console.error('Reset failed:', result.error);
    }
  }

  async function handleDelete(event) {
    const { id } = event.detail;
    const result = await trackersStore.delete(id);
    if (!result.success) {
      console.error('Delete failed:', result.error);
    }
  }

  // Get the selected icon data for display
  $: selectedIconData = getIconById(selectedIcon);
</script>

<div class="tracker-panel">
  <div class="panel-header">
    <h2>TimeSince</h2>
    <span class="count">{$trackerCount}/{MAX_TRACKERS}</span>
  </div>

  {#if $trackersStore.error}
    <div class="alert alert-error">
      {$trackersStore.error}
      <button class="alert-dismiss" on:click={() => trackersStore.clearError()} type="button">
        &times;
      </button>
    </div>
  {/if}

  <div class="add-tracker">
    <div class="add-tracker-row">
      <div class="icon-selector">
        <button
          type="button"
          class="icon-button"
          on:click={toggleIconPicker}
          disabled={$isMaxTrackers || $trackersStore.loading}
          aria-label="Select icon"
        >
          {selectedIconData.emoji}
        </button>

        {#if showIconPicker}
          <div class="icon-picker">
            {#each TRACKER_ICONS as icon}
              <button
                type="button"
                class="icon-option"
                class:selected={selectedIcon === icon.id}
                on:click={() => selectIcon(icon.id)}
                title={icon.label}
                aria-label={icon.label}
              >
                {icon.emoji}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <input
        bind:this={inputElement}
        bind:value={newTrackerName}
        type="text"
        class="form-input add-input"
        placeholder={$isMaxTrackers ? 'Maximum trackers reached' : 'Add a new tracker...'}
        disabled={$isMaxTrackers || $trackersStore.loading}
        on:keydown={handleInputKeydown}
        maxlength="100"
        aria-label="Add new tracker"
      />

      <button
        class="btn btn-primary add-btn"
        on:click={addTracker}
        disabled={$isMaxTrackers || $trackersStore.loading || !newTrackerName.trim()}
        type="button"
        aria-label="Add tracker"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 4a.5.5 0 01.5.5v3h3a.5.5 0 010 1h-3v3a.5.5 0 01-1 0v-3h-3a.5.5 0 010-1h3v-3A.5.5 0 018 4z"/>
        </svg>
      </button>
    </div>
  </div>

  {#if addError}
    <p class="add-error">{addError}</p>
  {/if}

  <div class="tracker-content">
    {#if $trackersStore.loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading trackers...</p>
      </div>
    {:else if $trackersStore.items.length === 0}
      <div class="empty-state">
        <p>No trackers yet. Add one above!</p>
        <p class="empty-hint">Track time since your last workout, meditation, or any habit.</p>
      </div>
    {:else}
      <ul class="tracker-list">
        {#each $trackersStore.items as tracker (tracker.id)}
          <TrackerItem
            {tracker}
            on:update={handleUpdate}
            on:reset={handleReset}
            on:delete={handleDelete}
          />
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .tracker-panel {
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
    padding: 0.5rem;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: -0.5rem;
    margin-left: 0;
  }

  .add-tracker {
    margin-bottom: 0.5rem;
  }

  .add-tracker-row {
    display: flex;
    gap: 0.5rem;
    position: relative;
  }

  .icon-selector {
    position: relative;
  }

  .icon-button {
    font-size: 1.25rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 0.5rem;
    cursor: pointer;
    transition: border-color 0.2s ease;
    min-width: 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-button:hover:not(:disabled) {
    border-color: var(--accent);
  }

  .icon-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

  .add-input {
    flex: 1;
  }

  .add-btn {
    padding: 0.75rem;
    min-width: 44px;
    min-height: 44px;
    flex-shrink: 0;
  }

  .add-error {
    font-size: 0.875rem;
    color: var(--danger);
    margin: 0 0 0.5rem 0;
  }

  .tracker-content {
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
    text-align: center;
  }

  .empty-hint {
    font-size: 0.875rem;
    opacity: 0.8;
  }

  .tracker-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>
