const path = require('node:path');

module.exports = {
  projectName: 'taro-lite-fixture',
  date: '2026-06-11',
  designWidth: 750,
  sourceRoot: 'src',
  outputRoot: 'dist',
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
  framework: 'react',
  compiler: 'vite',
  mini: {
    output: {
      clean: {
        keep: ['project.config.json'],
      },
      renderer: 'skyline',
      componentFramework: 'glass-easel',
    },
    postcss: {
      cssModules: {
        enable: true,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
};
