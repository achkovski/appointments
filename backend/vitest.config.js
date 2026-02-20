import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Run each test file in its own isolated context so module mocks don't bleed between files
    isolate: true,
  },
});
