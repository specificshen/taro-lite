import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default () => {
  const presetsDir = __dirname;
  return {
    plugins: [
      path.join(presetsDir, 'hooks', 'build.js'),
      path.join(presetsDir, 'files', 'write-file-to-dist.js'),
      path.join(presetsDir, 'files', 'generate-project-config.js'),
      path.join(presetsDir, 'files', 'generate-framework-info.js'),
    ],
  };
};
