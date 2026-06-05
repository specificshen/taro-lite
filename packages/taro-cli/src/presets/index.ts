import * as path from 'node:path';

export default () => {
  return {
    plugins: [
      // hooks
      path.resolve(__dirname, 'hooks', 'build.js'),
      path.resolve(__dirname, 'files', 'writeFileToDist.js'),
      path.resolve(__dirname, 'files', 'generateProjectConfig.js'),
      path.resolve(__dirname, 'files', 'generateFrameworkInfo.js'),
    ],
  };
};
