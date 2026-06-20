import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type UserConfigExport } from '@spcsn/taro-cli';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
        postcss: {
          cssModules: {
            enable: true,
          },
        },
      },
    }) satisfies UserConfigExport<'vite'>,
);
