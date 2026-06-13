import * as path from 'node:path';

export default () => {
  const presetsDir = path.dirname(import.meta.filename ?? __filename);
  return {
    plugins: [
      path.join(presetsDir, 'hooks', 'build.js'),
      path.join(presetsDir, 'files', 'write-file-to-dist.js'),
      path.join(presetsDir, 'files', 'generate-project-config.js'),
      path.join(presetsDir, 'files', 'generate-framework-info.js'),
    ],
  };
};
