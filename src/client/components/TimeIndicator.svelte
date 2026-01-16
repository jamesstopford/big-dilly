<script>
  /**
   * TimeIndicator - A modular pie-chart component for visualizing elapsed time
   *
   * FR-7: Visual Time Indicator
   * - Displays a circular progress/pie-chart showing elapsed time
   * - Color transitions at meaningful thresholds (minutes -> hours -> days -> weeks -> months)
   * - Configurable thresholds, colors, and size
   * - Standalone and easily removable/tweakable
   *
   * Props:
   * - lastReset: ISO date string of when the tracker was last reset
   * - size: Size of the indicator in pixels (default: 40)
   * - show: Boolean to toggle visibility (default: true)
   * - thresholds: Custom threshold configuration (optional)
   * - colors: Custom color configuration (optional)
   */

  import { onMount, onDestroy } from 'svelte';

  // Props
  export let lastReset = null;
  export let size = 40;
  export let show = true;

  /**
   * Default thresholds configuration
   * Each level defines the duration in milliseconds and how many "units" complete one full circle
   *
   * Example: minutes level fills up over 60 minutes, then transitions to hours
   */
  export let thresholds = null;

  /**
   * Default colors for each time unit
   * Suggested progression: Green (minutes) -> Blue (hours) -> Yellow (days) -> Orange (weeks) -> Red (months+)
   */
  export let colors = null;

  // Default threshold configuration (can be overridden via props)
  const DEFAULT_THRESHOLDS = {
    minutes: {
      maxMs: 60 * 60 * 1000, // 1 hour in ms (60 minutes fills the circle)
      unitsPerCircle: 60,    // 60 minutes per full circle
      unitMs: 60 * 1000      // 1 minute in ms
    },
    hours: {
      maxMs: 24 * 60 * 60 * 1000, // 24 hours in ms
      unitsPerCircle: 24,          // 24 hours per full circle
      unitMs: 60 * 60 * 1000       // 1 hour in ms
    },
    days: {
      maxMs: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      unitsPerCircle: 7,               // 7 days per full circle
      unitMs: 24 * 60 * 60 * 1000      // 1 day in ms
    },
    weeks: {
      maxMs: 30 * 24 * 60 * 60 * 1000, // ~1 month in ms (30 days / ~4 weeks)
      unitsPerCircle: 4,                // 4 weeks per full circle
      unitMs: 7 * 24 * 60 * 60 * 1000   // 1 week in ms
    },
    months: {
      maxMs: Infinity,                       // No upper limit
      unitsPerCircle: 12,                    // 12 months per full circle
      unitMs: 30 * 24 * 60 * 60 * 1000       // ~1 month in ms
    }
  };

  // Default color configuration (can be overridden via props)
  const DEFAULT_COLORS = {
    minutes: '#22c55e',  // Green - fresh/recent
    hours: '#3b82f6',    // Blue - still okay
    days: '#eab308',     // Yellow - getting longer
    weeks: '#f97316',    // Orange - notable duration
    months: '#ef4444'    // Red - long time elapsed
  };

  // Internal state
  let elapsedMs = 0;
  let updateInterval;

  // Merge custom config with defaults
  $: activeThresholds = thresholds || DEFAULT_THRESHOLDS;
  $: activeColors = colors || DEFAULT_COLORS;

  // Calculate elapsed time in milliseconds
  function calculateElapsedMs() {
    if (!lastReset) {
      elapsedMs = 0;
      return;
    }

    try {
      // Normalize date format to handle both SQLite ('2024-01-15 10:30:45')
      // and ISO ('2024-01-15T10:30:45') formats from server vs client
      let normalizedDate = lastReset;

      // Replace space with 'T' if needed (SQLite format)
      if (normalizedDate.includes(' ') && !normalizedDate.includes('T')) {
        normalizedDate = normalizedDate.replace(' ', 'T');
      }

      // Add 'Z' suffix if not present to ensure UTC parsing
      if (!normalizedDate.endsWith('Z')) {
        normalizedDate = normalizedDate + 'Z';
      }

      const resetDate = new Date(normalizedDate);

      // Validate the parsed date
      if (isNaN(resetDate.getTime())) {
        console.warn('[TimeIndicator] Invalid date format:', lastReset);
        elapsedMs = 0;
        return;
      }

      const now = new Date();
      const diff = now - resetDate;

      // Handle future dates (shouldn't happen but be safe)
      elapsedMs = Math.max(0, diff);
    } catch (error) {
      console.warn('[TimeIndicator] Error parsing date:', lastReset, error);
      elapsedMs = 0;
    }
  }

  // Determine which time unit level we're in
  function getTimeLevel(ms) {
    if (ms < activeThresholds.minutes.maxMs) return 'minutes';
    if (ms < activeThresholds.hours.maxMs) return 'hours';
    if (ms < activeThresholds.days.maxMs) return 'days';
    if (ms < activeThresholds.weeks.maxMs) return 'weeks';
    return 'months';
  }

  // Calculate fill percentage (0-100) for the current level
  function calculateFillPercentage(ms) {
    const level = getTimeLevel(ms);
    const config = activeThresholds[level];

    // Calculate how many units have elapsed at this level
    let unitsElapsed;

    if (level === 'minutes') {
      // For minutes: elapsed minutes within the current hour
      unitsElapsed = (ms / config.unitMs) % config.unitsPerCircle;
    } else if (level === 'hours') {
      // For hours: elapsed hours within the current day
      unitsElapsed = ((ms - activeThresholds.minutes.maxMs) / config.unitMs) % config.unitsPerCircle;
      // Add the time remaining in the transition
      unitsElapsed += (ms % activeThresholds.minutes.maxMs) / activeThresholds.minutes.maxMs;
    } else if (level === 'days') {
      // For days: elapsed days within the current week
      unitsElapsed = ((ms - activeThresholds.hours.maxMs) / config.unitMs) % config.unitsPerCircle;
    } else if (level === 'weeks') {
      // For weeks: elapsed weeks within the current month
      unitsElapsed = ((ms - activeThresholds.days.maxMs) / config.unitMs) % config.unitsPerCircle;
    } else {
      // For months: just show progress through 12 months
      unitsElapsed = ((ms - activeThresholds.weeks.maxMs) / config.unitMs) % config.unitsPerCircle;
    }

    // Convert to percentage
    return (unitsElapsed / config.unitsPerCircle) * 100;
  }

  // Get the current color based on time level
  function getCurrentColor(ms) {
    const level = getTimeLevel(ms);
    return activeColors[level];
  }

  // SVG path calculation for pie chart arc
  // Uses SVG arc commands to draw a filled sector
  function calculateArcPath(percentage, radius) {
    if (percentage <= 0) return '';
    if (percentage >= 100) {
      // Full circle
      return `M ${radius} 0 A ${radius} ${radius} 0 1 1 ${radius - 0.001} 0`;
    }

    const angle = (percentage / 100) * 360;
    const startAngle = -90; // Start from top (12 o'clock position)
    const endAngle = startAngle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = radius + radius * Math.cos(startRad);
    const y1 = radius + radius * Math.sin(startRad);
    const x2 = radius + radius * Math.cos(endRad);
    const y2 = radius + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    // Path: Move to center, line to start point, arc to end point, close path
    return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  }

  // Reactive calculations
  $: fillPercentage = calculateFillPercentage(elapsedMs);
  $: currentColor = getCurrentColor(elapsedMs);
  $: timeLevel = getTimeLevel(elapsedMs);
  $: radius = size / 2;
  $: arcPath = calculateArcPath(fillPercentage, radius);

  // Get label for accessibility
  $: levelLabel = {
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    weeks: 'weeks',
    months: 'months'
  }[timeLevel];

  // Set up update interval
  onMount(() => {
    calculateElapsedMs();
    // Update more frequently for smoother animation (every 10 seconds)
    // This provides smooth visual feedback while being resource-efficient
    updateInterval = setInterval(calculateElapsedMs, 10000);
  });

  onDestroy(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });

  // Recalculate when lastReset changes
  $: if (lastReset !== undefined) {
    calculateElapsedMs();
  }
</script>

{#if show && lastReset}
  <div
    class="time-indicator"
    style="width: {size}px; height: {size}px;"
    role="img"
    aria-label="Time elapsed: {Math.round(fillPercentage)}% of {levelLabel} cycle"
    title="{Math.round(fillPercentage)}% ({levelLabel})"
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 {size} {size}"
      class="time-indicator-svg"
    >
      <!-- Background circle -->
      <circle
        cx={radius}
        cy={radius}
        r={radius - 1}
        class="time-indicator-bg"
      />

      <!-- Filled arc (pie slice) -->
      {#if fillPercentage > 0}
        <path
          d={arcPath}
          fill={currentColor}
          class="time-indicator-fill"
        />
      {/if}

      <!-- Border circle -->
      <circle
        cx={radius}
        cy={radius}
        r={radius - 1}
        class="time-indicator-border"
        stroke={currentColor}
      />
    </svg>
  </div>
{/if}

<style>
  .time-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .time-indicator-svg {
    display: block;
  }

  .time-indicator-bg {
    fill: var(--bg-secondary, #f5f5f5);
  }

  .time-indicator-fill {
    /* Subtle animation for smooth fill transitions */
    transition: d 0.5s ease-out, fill 0.3s ease;
  }

  .time-indicator-border {
    fill: none;
    stroke-width: 1.5;
    opacity: 0.6;
  }

  /* Theme-specific adjustments */
  :global([data-theme="dark"]) .time-indicator-bg {
    fill: var(--bg-tertiary, #3a3a3a);
  }

  :global([data-theme="cyber-neon"]) .time-indicator-bg {
    fill: var(--bg-tertiary, #1a1a25);
  }

  :global([data-theme="cyber-neon"]) .time-indicator-fill {
    /* Add subtle glow effect for cyber-neon theme */
    filter: drop-shadow(0 0 2px currentColor);
  }

  :global([data-theme="cyber-neon"]) .time-indicator-border {
    opacity: 0.8;
  }
</style>
