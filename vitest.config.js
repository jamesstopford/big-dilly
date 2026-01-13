import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run each test file in isolation
    isolate: true,
    // Pool mode for better isolation
    pool: 'forks',
    // Increase timeout for tests
    testTimeout: 10000,
    // Setup files if needed
    globals: true
  }
});
