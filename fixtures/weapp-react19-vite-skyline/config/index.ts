import path from 'node:path';
import { defineConfig, type UserConfigExport } from '@spcsn/taro-cli';

export default defineConfig<'vite'>(() => {
  const config: UserConfigExport<'vite'> = {
    projectName: 'weapp-react19-vite-skyline-fixture',
    designWidth: 750,
    deviceRatio: {
      640: 1.17,
      750: 1,
      375: 2,
      828: 0.905,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    plugins: [
      '@spcsn/taro-plugin-generator',
      [
        '@spcsn/taro-plugin-platform-weapp',
        {
          useExtendedLib: {
            skyline: true,
          },
        },
      ],
    ],
    framework: 'react',
    ...(process.env.TARO_MINIFY === 'true' ? { jsMinimizer: 'oxc' as const } : {}),
    compiler: 'vite',
    mini: {
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

  return config;
});
