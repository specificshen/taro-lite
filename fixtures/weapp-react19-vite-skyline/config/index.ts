import path from 'node:path';
import { defineConfig, type UserConfigExport } from '@spcsn/taro-cli';

export default defineConfig<'vite'>(
  () =>
    ({
      projectName: 'weapp-react19-vite-skyline-fixture',
      alias: {
        '@': path.resolve(__dirname, '..', 'src'),
      },
      framework: 'react',
      compiler: 'vite',
      ...(process.env.TARO_MINIFY === 'true' ? { jsMinimizer: 'oxc' as const } : {}),
      mini: {
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
