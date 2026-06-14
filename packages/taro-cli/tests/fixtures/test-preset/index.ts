import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(__dirname, '../../..');

export default () => {
  return {
    plugins: [
      path.join(cliRoot, 'dist/presets/hooks/build.js'),
      path.join(cliRoot, 'dist/presets/files/write-file-to-dist.js'),
      path.join(cliRoot, 'dist/presets/files/generate-project-config.js'),
      path.join(cliRoot, 'dist/presets/files/generate-framework-info.js'),
    ],
  };
};
