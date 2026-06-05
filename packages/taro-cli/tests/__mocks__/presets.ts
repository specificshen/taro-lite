import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default () => {
  return {
    plugins: [
      // hooks
      path.resolve(__dirname, '../../src/presets', 'hooks', 'build.ts'),

      // 兼容其他平台小程序插件
      path.resolve(__dirname, '../../src/presets', 'files', 'write-file-to-dist.ts'),
      path.resolve(__dirname, '../../src/presets', 'files', 'generate-project-config.ts'),
      path.resolve(__dirname, '../../src/presets', 'files', 'generate-framework-info.ts'),
    ],
  };
};
