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
      copy: {
        patterns: [
          // 目录拷贝：src/assets 内容 → dist/assets
          { from: 'src/assets', to: 'assets' },
          // 文件拷贝 + 重命名：验证 dest 带扩展名的分支
          { from: 'src/assets/logo.txt', to: 'assets/brand.txt' },
        ],
      },
      mini: {
        postcss: {
          cssModules: {
            enable: true,
          },
        },
      },
    }) satisfies UserConfigExport<'vite'>,
);
