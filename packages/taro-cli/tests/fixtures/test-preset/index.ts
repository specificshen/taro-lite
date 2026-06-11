import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, '../../..');

export default () => {
  return {
    plugins: [
      path.join(cliRoot, 'src/presets/hooks/build.ts'),
      path.join(cliRoot, 'src/presets/files/write-file-to-dist.ts'),
      path.join(cliRoot, 'src/presets/files/generate-project-config.ts'),
      path.join(cliRoot, 'src/presets/files/generate-framework-info.ts'),
    ],
  };
};
