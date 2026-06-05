import { defineConfig } from 'vitest/config';

// https://cn.vitest.dev/guide/
export default defineConfig({
  test: {
    include: ['tests/**/*.{spec,test}.{js,ts}'],
    globals: true,
    coverage: {
      provider: 'istanbul',
      include: ['index.js', 'lib/**/*.js'],
    },
  },
});
