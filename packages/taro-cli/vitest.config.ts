import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

// https://cn.vitest.dev/guide/
export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts?(x)'],
    testTimeout: 60000,
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
    },
  },
});
