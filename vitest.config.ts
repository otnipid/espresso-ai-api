// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Use Vitest globals (describe, it, etc.)
    setupFiles: ['src/__tests__/setup.integration.ts'], // Use our new setup file
    environment: 'node', // Specify Node environment
    // Increase timeout for container startup, snapshotting etc.
    testTimeout: 120000, // 120 seconds for container operations
    hookTimeout: 120000, // 120 seconds for hooks too
  },
});