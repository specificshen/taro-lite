const packagesManagement = {
  yarn: {
    command: 'yarn install',
    globalCommand: 'yarn global add @spcsn/taro-cli',
  },
  pnpm: {
    command: 'pnpm install',
    globalCommand: 'pnpm add -g @spcsn/taro-cli',
  },
  cnpm: {
    command: 'cnpm install',
    globalCommand: 'cnpm i -g @spcsn/taro-cli',
  },
  npm: {
    command: 'npm install',
    globalCommand: 'npm i -g @spcsn/taro-cli',
  },
};

export default packagesManagement;
