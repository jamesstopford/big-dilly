<script>
  import { theme, THEMES } from '../stores/theme.js';

  const themeIcons = {
    'light': '&#9728;', // Sun
    'dark': '&#9790;', // Moon
    'cyber-neon': '&#9889;' // Lightning
  };

  const themeLabels = {
    'light': 'Light',
    'dark': 'Dark',
    'cyber-neon': 'Cyber-Neon'
  };

  let showDropdown = false;

  function toggleDropdown() {
    showDropdown = !showDropdown;
  }

  function selectTheme(newTheme) {
    theme.setTheme(newTheme);
    showDropdown = false;
  }

  function handleClickOutside(event) {
    if (showDropdown) {
      showDropdown = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="theme-toggle">
  <button
    class="theme-button"
    on:click={toggleDropdown}
    aria-label="Change theme"
    aria-expanded={showDropdown}
  >
    <span class="theme-icon">{@html themeIcons[$theme]}</span>
    <span class="theme-label hide-mobile">{themeLabels[$theme]}</span>
    <span class="dropdown-arrow">{showDropdown ? '&#9650;' : '&#9660;'}</span>
  </button>

  {#if showDropdown}
    <div class="dropdown">
      {#each THEMES as themeOption}
        <button
          class="dropdown-item"
          class:active={$theme === themeOption}
          on:click={() => selectTheme(themeOption)}
        >
          <span class="theme-icon">{@html themeIcons[themeOption]}</span>
          <span>{themeLabels[themeOption]}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .theme-toggle {
    position: relative;
  }

  .theme-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0.75rem;
    min-height: 44px;
    background-color: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-button:hover {
    background-color: var(--bg-primary);
    border-color: var(--accent);
  }

  .theme-icon {
    font-size: 1.1rem;
  }

  .theme-label {
    font-size: 0.875rem;
  }

  .dropdown-arrow {
    font-size: 0.6rem;
    color: var(--text-secondary);
  }

  .dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    min-width: 150px;
    z-index: 1000;
    overflow: hidden;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    min-height: 44px;
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s ease;
  }

  .dropdown-item:hover {
    background-color: var(--bg-tertiary);
  }

  .dropdown-item.active {
    background-color: var(--accent-light);
    color: var(--accent);
  }

  @media (max-width: 768px) {
    .hide-mobile {
      display: none;
    }
  }
</style>
