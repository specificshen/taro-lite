import path from 'node:path';
import { defineConfig, type UserConfigExport } from '@spcsn/taro-cli';

export default defineConfig<'vite'>(
  () =>
    ({
      projectName: 'taro-lite-fixture',
      date: '2026-06-12',
      designWidth: 750,
      sourceRoot: 'src',
      outputRoot: 'dist',
      alias: {
        '@': path.resolve(__dirname, '..', 'src'),
      },
      framework: 'react',
      compiler: 'vite',
      ...(process.env.TARO_MINIFY === 'true' ? { jsMinimizer: 'oxc' as const } : {}),
      mini: {
        output: {
          clean: {
            keep: ['project.config.json'],
          },
          renderer: 'skyline',
          componentFramework: 'glass-easel',
        },
        postcss: {
          cssModules: {
            enable: true,
            config: {
              namingPattern: 'module',
              generateScopedName: '[name]__[local]___[hash:base64:5]',
            },
          },
        },
      },
    }) satisfies UserConfigExport<'vite'>,
);
