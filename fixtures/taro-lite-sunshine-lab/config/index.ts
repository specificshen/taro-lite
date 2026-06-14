import path from 'node:path';
import { defineConfig, type UserConfigExport } from '@spcsn/taro-cli';

export default defineConfig<'vite'>(
  () =>
    ({
      projectName: 'taro-lite-sunshine-lab',
      alias: {
        '@': path.resolve(__dirname, '..', 'src'),
      },
      framework: 'react',
      compiler: 'vite',
      ...(process.env.TARO_MINIFY === 'true' ? { jsMinimizer: 'oxc' as const } : {}),
      mini: {
        baseLevel: 10,
        postcss: {
          cssModules: {
            enable: true,
          },
        },
      },
    }) satisfies UserConfigExport<'vite'>,
);
