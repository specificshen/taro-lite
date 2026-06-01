import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

// https://cn.vitest.dev/guide/
export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts?(x)'],
    setupFiles: [resolve(__dirname, './tests/setup.js')],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
    },
  },
});
