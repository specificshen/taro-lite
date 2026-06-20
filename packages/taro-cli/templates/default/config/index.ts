import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type UserConfigExport } from '@spcsn/taro-cli';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig<'vite'>(
  () =>
    ({
      projectName: '{{ projectName }}',
      date: '{{ date }}',
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
              generateScopedName: '[name]__[local]___[hash:hex:8]',
            },
          },
        },
      },
    }) satisfies UserConfigExport<'vite'>,
);
