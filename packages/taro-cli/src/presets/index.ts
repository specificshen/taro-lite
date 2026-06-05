import * as path from 'node:path';

export default () => {
  return {
    plugins: [
      // hooks
      path.resolve(__dirname, 'hooks', 'build.js'),
      path.resolve(__dirname, 'files', 'write-file-to-dist.js'),
      path.resolve(__dirname, 'files', 'generate-project-config.js'),
      path.resolve(__dirname, 'files', 'generate-framework-info.js'),
    ],
  };
};
