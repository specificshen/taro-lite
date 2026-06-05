import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

// https://cn.vitest.dev/guide/
export default defineConfig({
  resolve: {
    alias: {
      '@spcsn/taro': resolve(__dirname, './src/index.ts'),
      '@spcsn/taro-api': resolve(__dirname, './src/index.ts'),
      '@spcsn/taro-shared': resolve(__dirname, '../shared/src/index.ts'),
      '@spcsn/taro-runtime': resolve(__dirname, '../taro-runtime/dist/runtime.esm.js'),
    },
  },
  test: {
    include: ['tests/**/*.{spec,test}.{ts,tsx}'],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
    },
  },
});
