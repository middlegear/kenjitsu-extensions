import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'kenjitsu-extensions',
    isolate: true,
    environment: 'node',
    testTimeout: 20000,
  },
});
