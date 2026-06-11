import path from 'node:path';
import { defineConfig{{#if typescript }}, type UserConfigExport{{/if}} } from '@spcsn/taro-cli';

export default defineConfig{{#if typescript }}<'vite'>{{/if}}(
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
      mini: {
        output: {
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
    }){{#if typescript }} satisfies UserConfigExport<'vite'>{{/if}},
);
